from datetime import datetime, timezone
from database import execute, fetch_one


class PasswordResetToken:

    def __init__(self, token_id=None, person_id=None, token=None, expires_at=None, used=False):
        self.token_id = token_id
        self.person_id = person_id
        self.token = token
        self.expires_at = expires_at
        self.used = used

    @classmethod
    def create(cls, person_id, token, expires_at):
        token_id = execute(
            """
            INSERT INTO PasswordResetToken (PersonID, Token, ExpiresAt, Used)
            VALUES (%s, %s, %s, 0)
            """,
            (person_id, token, expires_at),
            return_lastrowid=True
        )

        return cls(
            token_id=token_id,
            person_id=person_id,
            token=token,
            expires_at=expires_at,
            used=False
        )

    @classmethod
    def find_valid(cls, token):
        row = fetch_one(
            """
            SELECT TokenID, PersonID, Token, ExpiresAt, Used
            FROM PasswordResetToken
            WHERE Token = %s
              AND Used = 0
              AND ExpiresAt > UTC_TIMESTAMP()
            LIMIT 1
            """,
            (token,)
        )

        if not row:
            return None

        return cls(
            token_id=row["TokenID"],
            person_id=row["PersonID"],
            token=row["Token"],
            expires_at=row["ExpiresAt"].replace(tzinfo=timezone.utc) if row["ExpiresAt"] else None,
            used=bool(row["Used"]),
        )

    def mark_used(self):
        if not self.token_id:
            return

        execute(
            "UPDATE PasswordResetToken SET Used = 1 WHERE TokenID = %s",
            (self.token_id,)
        )

        self.used = True

    @classmethod
    def delete_expired(cls):
        execute(
            "DELETE FROM PasswordResetToken WHERE ExpiresAt <= UTC_TIMESTAMP()"
        )