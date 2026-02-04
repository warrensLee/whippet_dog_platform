'''
Docstring for change_log

TODO:
'''

from database import fetch_all, fetch_one, execute
from mysql.connector import Error
import json
from datetime import datetime

class ChangeLog:
    def __init__(
        self,id=None,
        changed_table=None,
        record_pk=None,
        operation=None,
        changed_by=None,
        changed_at=None,
        source=None,
        before_data=None,
        after_data=None,
    ):
        self.id = id 
        self.changed_table = changed_table
        self.record_pk = record_pk
        self.operation = operation
        self.changed_by = changed_by
        self.changed_at = changed_at
        self.source = source
        self.before_data = before_data
        self.after_data = after_data

    @classmethod
    def from_request_data(cls, data: dict):
        """Create a Change instance from request JSON data."""
        data = data or {}
        return cls(
            changed_table=(data.get("changedTable") or "").strip(),
            record_pk=(data.get("recordPk") or "").strip(),
            operation=(data.get("operation") or "").strip(),
            changed_by=((data.get("changedBy") or "").strip() or None),
            changed_at=data.get("changedAt"),
            source=data.get("source"),
            before_data=data.get("beforeData"),
            after_data=data.get("afterData"),
        )

    @classmethod
    def from_db_row(cls, row: dict):
        """Create a Change instance from a database row."""
        if not row:
            return None
        return cls(
            id=row.get("ID"),
            changed_table=row.get("ChangedTable"),
            record_pk=row.get("RecordPK"),
            operation=row.get("Operation"),
            changed_by=row.get("ChangedBy"),
            changed_at=row.get("ChangedAt"),
            source=row.get("Source"),
            before_data=row.get("BeforeData"),
            after_data=row.get("AfterData"),
        )

    @classmethod
    def find_by_identifier(cls, id):
        """Find a Change instance from the database."""
        row = fetch_one(
            """
            SELECT ID, ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                   Source, BeforeData, AfterData
            FROM ChangeLog
            WHERE ID = %s
            LIMIT 1
            """,
            (id,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, id) -> bool:
        """Find a Change instance from the database."""
        row = fetch_one(
            "SELECT ID FROM ChangeLog WHERE ID = %s LIMIT 1",
            (id,),
        )
        return row is not None

    def validate(self):
        """List errors"""
        errors = []
        if not self.changed_table:
            errors.append("Changed table is required")
        if not self.record_pk:
            errors.append("Record PK is required")
        if not self.operation:
            errors.append("Operation is required")
        if not self.changed_at:
            errors.append("Changed at is required")
        return errors

    def save(self):
        """Insert Change instance into database"""
        try:
            execute(
                """
                INSERT INTO ChangeLog (
                    ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                    Source, BeforeData, AfterData
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.changed_table,
                    self.record_pk,
                    self.operation,
                    self.changed_by,
                    self.changed_at,
                    self.source,
                    self.before_data,
                    self.after_data,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update Change instance into database"""
        if not self.id:
            raise ValueError("id is required to update a change log")

        try:
            execute(
                """
                UPDATE ChangeLog
                SET ChangedTable = %s,
                    RecordPK = %s,
                    Operation = %s,
                    ChangedBy = %s,
                    ChangedAt = %s,
                    Source = %s,
                    BeforeData = %s,
                    AfterData = %s
                WHERE ID = %s
                """,
                (
                    self.changed_table,
                    self.record_pk,
                    self.operation,
                    self.changed_by,
                    self.changed_at,
                    self.source,
                    self.before_data,
                    self.after_data,
                    self.id,
                ),
            )
            return True
        except Error as e:
            raise e
        
    @classmethod
    def delete(cls, id):
        try:
            execute("DELETE FROM ChangeLog WHERE ID = %s", (id,))
            return True
        except Error as e:
            raise e

    @classmethod
    def list_all(cls):
        rows = fetch_all(
            """
            SELECT ID, ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                   Source, BeforeData, AfterData
            FROM ChangeLog
            ORDER BY ChangedAt DESC
            """
        )
        return [cls.from_db_row(r) for r in rows]

    def to_dict(self):
        return {
            "id": self.id,
            "changedTable": self.changed_table,
            "recordPk": self.record_pk,
            "operation": self.operation,
            "changedBy": self.changed_by,
            "changedAt": self.changed_at,
            "source": self.source,
            "beforeData": self.before_data,
            "afterData": self.after_data,
        }

    @staticmethod
    def _json_text(obj):
        if obj is None:
            return None
        try:
            return json.dumps(obj, default=str, ensure_ascii=False)
        except Exception:
            return None

    @classmethod
    def log(cls, *, changed_table: str, record_pk: str, operation: str,
            changed_by: str | None, source: str,
            before_obj=None, after_obj=None):
        """
        Centralized logger. Create + save ChangeLog row.
        Does not throw (so it won't break the caller).
        """
        try:
            entry = cls(
                changed_table=changed_table,
                record_pk=str(record_pk),
                operation=operation,
                changed_by=changed_by,
                changed_at=datetime.now(),
                source=source,
                before_data=cls._json_text(before_obj),
                after_data=cls._json_text(after_obj),
            )
            entry.save()
            return True
        except Exception as e:
            print(f"ChangeLog.log failed: {e}")
            return False