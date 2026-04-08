import os
import time
import mysql.connector 
from mysql.connector import Error

connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "db"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "dogs"),
        database=os.getenv("DB_NAME", "cwa_db"),
        autocommit=True,
        connect_timeout=10,
        use_pure=True,
    )

def get_conn():
    return connection

def fetch_all(sql: str, params=()):
    start = time.time()
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        result = cur.fetchall()
        elapsed = time.time() - start
        if elapsed > 1.0:
            print(f"[SLOW QUERY] {elapsed:.2f}s - {sql[:100]}")
        return result
    finally:
        cur.close()

def fetch_one(sql: str, params=()):
    start = time.time()
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params)
        result = cur.fetchone()
        elapsed = time.time() - start
        if elapsed > 1.0:
            print(f"[SLOW QUERY] {elapsed:.2f}s - {sql[:100]}")
        return result
    finally:
        cur.close()


def execute(sql: str, params=(), *, return_lastrowid: bool = False):
    start = time.time()
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        elapsed = time.time() - start
        if elapsed > 1.0:
            print(f"[SLOW QUERY] {elapsed:.2f}s - {sql[:100]}")

        if return_lastrowid:
            return cur.lastrowid

        return cur.rowcount
    finally:
        cur.close()


def execute_many(sql: str, param_list):
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.executemany(sql, param_list)
        return cur.rowcount
    finally:
        cur.close()
