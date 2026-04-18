from datetime import timezone
from database import execute, fetch_one


class RegistrationInvite:
    def __init__(
        self,
        invite_id=None,
        email=None,
        token=None,
        expires_at=None,
        used=False,
        created_by=None,
        person_id=None,
    ):
        self.invite_id = invite_id
        self.email = email
        self.token = token
        self.expires_at = expires_at
        self.used = used
        self.created_by = created_by
        self.person_id = person_id

    @classmethod
    def create(cls, email, token, expires_at, created_by, person_id=None):
        invite_id = execute(
            """
            INSERT INTO RegistrationInvite (Email, Token, ExpiresAt, Used, CreatedBy, PersonID)
            VALUES (%s, %s, %s, 0, %s, %s)
            """,
            (email, token, expires_at, created_by, person_id),
            return_lastrowid=True
        )
        return cls(invite_id, email, token, expires_at, False, created_by, person_id)

    @classmethod
    def find_valid(cls, token):
        row = fetch_one(
            """
            SELECT InviteID, Email, Token, ExpiresAt, Used, CreatedBy, PersonID
            FROM RegistrationInvite
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
            invite_id=row["InviteID"],
            email=row["Email"],
            token=row["Token"],
            expires_at=row["ExpiresAt"].replace(tzinfo=timezone.utc) if row["ExpiresAt"] else None,
            used=bool(row["Used"]),
            created_by=row["CreatedBy"],
            person_id=row["PersonID"],
        )

    def mark_used(self):
        execute(
            """
            UPDATE RegistrationInvite
            SET Used = 1, UsedAt = UTC_TIMESTAMP()
            WHERE InviteID = %s
            """,
            (self.invite_id,)
        )
        self.used = True