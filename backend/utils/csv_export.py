import sqlite3
import pandas as pd
import os

def export_db_to_csv(db_path, query, csv_path):
    """
    Export data from a database to a CSV file.

    db_path: Path to the SQLite database file.
    query: SQL query to select data.
    csv_path: Path to save the CSV file.
    """
    try:
        # Validate database file existence
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Database file not found: {db_path}")

        # Connect to the database
        conn = sqlite3.connect(db_path)

        # Read data into a DataFrame
        df = pd.read_sql_query(query, conn)

        # Save DataFrame to CSV
        df.to_csv(csv_path, index=False)

    except Exception as e:
        raise RuntimeError(f"Error occurred while exporting data to CSV: {e}")
    finally:
        if 'conn' in locals():
            conn.close()