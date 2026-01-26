import os
import time
import mysql.connector
from mysql.connector import pooling

_POOL = None

def _pool():
    global _POOL
    if _POOL is None:
        _POOL = pooling.MySQLConnectionPool(
            pool_name="cwa_pool",
            pool_size=int(os.getenv("DB_POOL_SIZE", "10")),
            pool_reset_session=True,
            host=os.getenv("DB_HOST", "db"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "dogs"),
            database=os.getenv("DB_NAME", "cwa_db"),
            autocommit=True,
            connect_timeout=10,
            use_pure=False,  
        )
    return _POOL

def get_conn():
    start = time.time()
    conn = _pool().get_connection()
    elapsed = time.time() - start
    if elapsed > 0.5:
        print(f"[WARNING] get_conn took {elapsed:.2f}s - pool might be exhausted")
    return conn

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
        conn.close()  # returns to pool

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
        conn.close()

def execute(sql: str, params=()):
    start = time.time()
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        result = cur.rowcount
        elapsed = time.time() - start
        if elapsed > 1.0:
            print(f"[SLOW QUERY] {elapsed:.2f}s - {sql[:100]}")
        return result
    finally:
        cur.close()
        conn.close()

# Add this helper for batch operations to avoid N+1 queries
def fetch_all_batch(sql: str, param_list):
    """Execute same query with multiple parameter sets efficiently"""
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    try:
        results = []
        for params in param_list:
            cur.execute(sql, params)
            results.extend(cur.fetchall())
        return results
    finally:
        cur.close()
        conn.close()
