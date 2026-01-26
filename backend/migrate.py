import os
import time
from database import fetch_all, execute

HERE = os.path.dirname(os.path.abspath(__file__))
MIGRATIONS_DIR = os.path.join(HERE, "mysql", "migrations")

def run_migrations(max_retries=30, retry_delay=2):
    # Wait for database to be ready
    for attempt in range(max_retries):
        try:
            execute("""
                CREATE TABLE IF NOT EXISTS SchemaMigrations (
                  Version VARCHAR(50) PRIMARY KEY,
                  AppliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            break  # Success!
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"[migrations] Waiting for database... ({attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
            else:
                print(f"[migrations] Failed to connect to database after {max_retries} attempts")
                raise

    if not os.path.isdir(MIGRATIONS_DIR):
        print(f"[migrations] Skipping; folder not found: {MIGRATIONS_DIR}")
        return

    applied = {r["Version"] for r in fetch_all("SELECT Version FROM SchemaMigrations")}
    files = sorted(f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql"))

    for fname in files:
        version = fname.split("_")[0]
        if version in applied:
            continue

        with open(os.path.join(MIGRATIONS_DIR, fname), "r", encoding="utf-8") as f:
            sql = f.read().strip()

        if sql:
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            for statement in statements:
                execute(statement)

        execute("INSERT INTO SchemaMigrations (Version) VALUES (%s)", (version,))
        print(f"[migrations] Applied {fname}")