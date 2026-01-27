'''
Docstring for person

TODO:
'''
from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class ChangeLog:
    def __init__(self, log_id, changed_table, record_pk, operation, changed_by, changed_at, sources, before_data, after_data):
        self.log_id = log_id
        self.changed_table = changed_table
        self.record_pk = record_pk
        self.operation = operation
        self.changed_by = changed_by
        self.changed_at = changed_at
        self.sources = sources
        self.before_data = before_data
        self.after_data = after_data

    @classmethod
    def from_request_data(cls, data):
        """Create a ChangeLog instance from request JSON data."""
        return cls(
            log_id=(data.get("logId") or "").strip(),
            changed_table=(data.get("changedTable") or "").strip(),
            record_pk=(data.get("recordPk") or "").strip(),
            operation=(data.get("operation") or "").strip(),
            changed_by=(data.get("changedBy") or "").strip(),
            changed_at=data.get("changedAt"),
            sources=data.get("sources"),
            before_data=data.get("beforeData"),
            after_data=data.get("afterData")
        )

    @classmethod
    def from_db_row(cls, row):
        """Create a ChangeLog instance from a database row."""
        if not row:
            return None
        return cls(
            log_id=row.get("LogID"),
            changed_table=row.get("ChangedTable"),
            record_pk=row.get("RecordPK"),
            operation=row.get("Operation"),
            changed_by=row.get("ChangedBy"),
            changed_at=row.get("ChangedAt"),
            sources=row.get("Sources"),
            before_data=row.get("BeforeData"),
            after_data=row.get("AfterData")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a change log by log id."""
        row = fetch_one(
            """
            SELECT LogID, ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                   Sources, BeforeData, AfterData
            FROM ChangeLog
            WHERE LogID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, log_id):
        """Check if a change log with given log ID already exists."""
        existing = fetch_one(
            """
            SELECT LogID
            FROM ChangeLog
            WHERE LogID = %s
            LIMIT 1
            """,
            (log_id,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.log_id:
            errors.append("Log ID is required")
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
        """Save change log to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO ChangeLog (
                    LogID, ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                    Sources, BeforeData, AfterData
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.log_id,
                    self.changed_table,
                    self.record_pk,
                    self.operation,
                    self.changed_by,
                    self.changed_at,
                    self.sources,
                    self.before_data,
                    self.after_data
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update change log in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE ChangeLog
                SET ChangedTable = %s,
                    RecordPK = %s,
                    Operation = %s,
                    ChangedBy = %s,
                    ChangedAt = %s,
                    Sources = %s,
                    BeforeData = %s,
                    AfterData = %s
                WHERE LogID = %s
                """,
                (
                    self.changed_table,
                    self.record_pk,
                    self.operation,
                    self.changed_by,
                    self.changed_at,
                    self.sources,
                    self.before_data,
                    self.after_data,
                    self.log_id
                ),
            )
            return True
        except Error as e:
            raise e
        
    def delete(self, log_id):
        """Delete change log from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM ChangeLog
                WHERE LogID = %s
                """,
                (log_id,),
            )
            return True
        except Error as e:
            raise e

    def list_all_change_logs():
        """Retrieve all change logs from the database."""
        rows = fetch_all(
            """
            SELECT LogID, ChangedTable, RecordPK, Operation, ChangedBy, ChangedAt,
                   Sources, BeforeData, AfterData
            FROM ChangeLog
            ORDER BY ChangedAt DESC
            """
        )
        return [ChangeLog.from_db_row(row) for row in rows]
            
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "LogID": self.log_id,
            "ChangedTable": self.changed_table,
            "RecordPK": self.record_pk,
            "Operation": self.operation,
            "ChangedBy": self.changed_by,
            "ChangedAt": self.changed_at,
            "Sources": self.sources,
            "BeforeData": self.before_data,
            "AfterData": self.after_data
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "logOd": self.log_id,
            "changedTable": self.changed_table,
            "recordPK": self.record_pk,
            "operation": self.operation,
            "changedBy": self.changed_by,
            "changedAt": self.changed_at,
            "sources": self.sources,
            "beforeData": self.before_data,
            "afterData": self.after_data
        }
        return data
