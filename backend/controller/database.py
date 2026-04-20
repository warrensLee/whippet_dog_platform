from flask import Blueprint, jsonify, request, Response
import io
from datetime import datetime
import os
import tempfile
from utils.auth_helpers import check_login_and_scope_strict
from utils.error_handler import handle_error
from database import fetch_all, fetch_one, get_conn
from classes.dog import Dog
from classes.person import Person 
from classes.meet import Meet
from compression import zstd

database_bp = Blueprint("database", __name__, url_prefix="/api/database")


def escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    return "'" + str(val).replace("'", "''") + "'"


def get_tables():
    db_name = os.getenv("DB_NAME", "cwa_db")
    key = f"Tables_in_{db_name}"
    tables = fetch_all("SHOW TABLES")
    return [row[key] for row in tables]


def restore_from_file(path):
    conn = get_conn()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        with open(path, "r", encoding="utf-8") as file:
            sql = file.read()

        statements = sql.split(';')
        for statement in statements:
            statement = statement.strip()
            if statement:  
                cur.execute(statement)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        cur.close()


def generate_sql():
        yield "SET FOREIGN_KEY_CHECKS=0;\n\n"

        for table_name in get_tables():
            yield f"DROP TABLE IF EXISTS `{table_name}`;\n"
            create_stmt = fetch_one(f"SHOW CREATE TABLE `{table_name}`")
            yield create_stmt["Create Table"] + ";\n\n"
            rows = fetch_all(f"SELECT * FROM `{table_name}`")
            for row in rows:
                columns = ", ".join(f"`{col}`" for col in row.keys())
                values = ", ".join(escape(val) for val in row.values())
                yield f"INSERT INTO `{table_name}` ({columns}) VALUES ({values});\n"
            
            yield "\n"

        yield "SET FOREIGN_KEY_CHECKS=1;\n"

def zstd_wrapper(text_stream):
    compressor = zstd.ZstdCompressor(level=9)
    for x in text_stream:
        yield compressor.compress(x.encode(encoding="utf-8"))
    yield compressor.flush()


@database_bp.get("/dump")
def dump_database():
    try:
        deny = check_login_and_scope_strict('database', action="restore the database")
        if deny:
            return deny

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return Response(
            zstd_wrapper(generate_sql()),
            mimetype="application/zstd",
            headers={"Content-disposition": f"attachment; filename={timestamp}-db-dump.sql.zst"}
        )
    except Exception as e:
        return handle_error(e, "Server error")


def zstd_decompression_wrapper(compressed_stream):
    """
    Takes an iterator of ZSTD compressed chunks and return UTF-8 string chunks
    """
    decompressor = zstd.ZstdDecompressor()
    for x in compressed_stream:
        yield decompressor.decompress(x).decode("utf-8")


def iter_commands(chunks):
    """
    Take an iterator of string chunks and yield complete sql commands.
    """
    buffer = ""
    for chunk in chunks:
        buffer += chunk
        while ";" in buffer:
            line, buffer = buffer.split(";", 1)
            yield line


def restore_from_commands(statements):
    """
    Takes an iterator of SQL commands and applys them to the DB
    """
    
    conn = get_conn()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        for statement in statements:
            statement = statement.strip()
            if statement:  
                cur.execute(statement)

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        cur.close()

@database_bp.post("/restore")
def restore_database():
    
    def chunked_reader():
        chunk_size = 4096
        while True:
            chunk = request.stream.read(chunk_size)
            if not chunk:
                break
            yield chunk
    try:
        deny = check_login_and_scope_strict('database', action="restore the database")
        if deny:
            return deny
        restore_from_commands(iter_commands(zstd_decompression_wrapper(chunked_reader())))
        return jsonify({"ok": True}), 200 
    except Exception as e:
        return handle_error(e, "Server error")


@database_bp.get("/counts")
def counts():
    return jsonify({"dogs":Dog.count(), "people": Person.count(), "meets": Meet.count()}), 200
