import csv
import os
import mysql.connector
from datetime import datetime

DB_CONFIG = {
    "host": "db",
    "user": "root",
    "password": "dogs",
    "database": "cwa_db"
}

def import_file(path):
    report = {
        "file": os.path.basename(path),
        "rows": 0,
        "inserted": 0,
        "updated": 0,
        "errors": []
    }

    import_type = detect_type(path)

    with open(path, newline='', encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        report["rows"] = len(rows)

        # debug 
        # print("CSV HEADERS:", reader.fieldnames)

    conn = mysql.connector.connect(**DB_CONFIG)
    try:
        conn.start_transaction()

        if import_type == "titles":
            result = import_titles(conn, rows)
        elif import_type == "conformation":
            result = import_conformation(conn, rows)
        elif import_type == "top_ten":
            result = import_top_ten(conn, rows)
        else:
            raise ValueError("Unknown CSV type")

        report.update(result)
        conn.commit()
        return report

    except Exception as e:
        conn.rollback()
        report["errors"].append(str(e))
        return report

    finally:
        conn.close()


def detect_type(path):
    name = os.path.basename(path).lower()
    if "title" in name:
        return "titles"
    if "conformation" in name:
        return "conformation"
    if "top ten" in name:
        return "top_ten"
    raise ValueError("Cannot determine import type from filename")


# Helpers

def get_field(row, *names):
    for n in names:
        if n in row and row[n] and row[n].strip():
            return row[n].strip()
    return None



REQUIRED_SETS = {
    "cwa": ("CWA NO", "CWA No", "CWA No.", "CWA #", "CWANumber"),
    "name": ("CALL NAME", "Call Name", "NAME"),
    "owner": ("OWNER", "Owner")
}


# Handlers

def import_titles(conn, rows):
    cursor = conn.cursor()
    inserted = 0
    skipped = 0

    for r in rows:
        cwa = get_field(r, *REQUIRED_SETS["cwa"])
        name = get_field(r, *REQUIRED_SETS["name"])
        owner = get_field(r, *REQUIRED_SETS["owner"])

        # Skip empty / non dog rows instead of crashing
        if not cwa:
            skipped += 1
            continue

        if not name:
            raise ValueError(f"Missing Call Name for CWA {cwa}")
        if not owner:
            raise ValueError(f"Missing Owner for CWA {cwa}")

        cursor.execute(
            "INSERT IGNORE INTO Dog (CWANumber, CallName) VALUES (%s, %s)",
            (cwa, name)
        )
        inserted += 1

    return {
        "inserted": inserted,
        "updated": 0,
        "skipped": skipped
    }



def import_conformation(conn, rows):
    # Same identity logic as titles for now
    return import_titles(conn, rows)


def import_top_ten(conn, rows):
    cursor = conn.cursor()
    inserted = 0

    for _ in rows:
        cursor.execute(
            "INSERT INTO ChangeLog (TableName, Action, ChangedAt) VALUES (%s, %s, %s)",
            ("TopTen", "IMPORT", datetime.utcnow())
        )
        inserted += 1

    return {"inserted": inserted, "updated": 0}


if __name__ == "__main__":
    test_file = "CWA ARX Titles - 2025.csv"
    result = import_file(test_file)
    print("IMPORT RESULT:")
    for k, v in result.items():
        print(f"{k}: {v}")
