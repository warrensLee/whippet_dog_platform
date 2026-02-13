from flask import Blueprint, jsonify, request, Response
import io
from datetime import datetime
import os
import tempfile

from database import fetch_all, fetch_one, get_conn

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


def dump_to_file(path: str):
    with open(path, "w", encoding="utf-8") as file:
        file.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

        for table_name in get_tables():
            file.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")

            create = fetch_one(f"SHOW CREATE TABLE `{table_name}`")
            file.write(create["Create Table"] + ";\n\n")

            rows = fetch_all(f"SELECT * FROM `{table_name}`")

            for row in rows:
                columns = ", ".join(f"`{col}`" for col in row.keys())
                values = ", ".join(escape(val) for val in row.values())

                file.write(
                    f"INSERT INTO `{table_name}` ({columns}) VALUES ({values});\n"
                )

            file.write("\n")

        file.write("SET FOREIGN_KEY_CHECKS=1;\n")


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
        try:
            cur.close()
        finally:
            conn.close()


@database_bp.get("/dump")
def dump_database():
    try:
        output = io.StringIO()
        output.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

        for table_name in get_tables():
            output.write(f"DROP TABLE IF EXISTS `{table_name}`;\n")
            create_stmt = fetch_one(f"SHOW CREATE TABLE `{table_name}`")
            output.write(create_stmt["Create Table"] + ";\n\n")
            rows = fetch_all(f"SELECT * FROM `{table_name}`")
            for row in rows:
                columns = ", ".join(f"`{col}`" for col in row.keys())
                values = ", ".join(escape(val) for val in row.values())
                output.write(f"INSERT INTO `{table_name}` ({columns}) VALUES ({values});\n")
            
            output.write("\n")

        output.write("SET FOREIGN_KEY_CHECKS=1;\n")
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return Response(
            output.getvalue(),
            mimetype="application/sql",
            headers={"Content-disposition": f"attachment; filename=db_dump_{timestamp}.sql"}
        )
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500



@database_bp.post("/restore")
def restore_database():
    try:
        uploaded = request.files.get("file")

        if not uploaded:
            return jsonify({"ok": False, "error": "Missing file"}), 400

        if not uploaded.filename.lower().endswith(".sql"):
            return jsonify({"ok": False, "error": "Only .sql files allowed"}), 400

        fd, temp_path = tempfile.mkstemp(prefix="db_restore_", suffix=".sql")
        os.close(fd)

        uploaded.save(temp_path)

        try:
            restore_from_file(temp_path)
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass

        return jsonify({"ok": True})

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
