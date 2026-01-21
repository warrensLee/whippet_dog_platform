import os
import mysql.connector
from mysql.connector import Error

def get_conn():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "db"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "dogs"),
        database=os.getenv("DB_NAME", "cwa_db"),
        autocommit=True
    )

def fetch_all(sql: str, params=()):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

def fetch_one(sql: str, params=()):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        return cur.fetchone()
    finally:
        cur.close()
        conn.close()

def execute(sql: str, params=()):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        return cur.rowcount
    finally:
        cur.close()
        conn.close()