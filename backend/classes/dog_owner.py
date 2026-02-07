from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class DogOwner:
    def __init__(self, cwa_id, person_id, last_edited_by=None, last_edited_at=None):
        self.cwa_id = cwa_id
        self.person_id = person_id
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        return cls(
            cwa_id=(data.get("cwaId") or "").strip(),
            person_id=(data.get("personId") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt"),
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            cwa_id=row.get("CWAID"),
            person_id=row.get("PersonID"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_identifier(cls, cwa_id, person_id):
        row = fetch_one(
            """
            SELECT CWAID, PersonID, LastEditedBy, LastEditedAt
            FROM DogOwner
            WHERE CWAID = %s AND PersonID = %s
            LIMIT 1
            """,
            (cwa_id, person_id),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, cwa_id, person_id):
        existing = fetch_one(
            """
            SELECT 1
            FROM DogOwner
            WHERE CWAID = %s AND PersonID = %s
            LIMIT 1
            """,
            (cwa_id, person_id),
        )
        return existing is not None

    def validate(self):
        errors = []
        if not self.cwa_id:
            errors.append("CWA ID is required")
        if not self.person_id:
            errors.append("PersonID is required")
        if len(self.cwa_id) > 10:
            errors.append("CWA ID must be 10 characters or less")
        if len(self.person_id) > 20:
            errors.append("PersonID must be 20 characters or less")
        return errors

    def save(self):
        execute(
            """
            INSERT INTO DogOwner (CWAID, PersonID, LastEditedBy, LastEditedAt)
            VALUES (%s, %s, %s, %s)
            """,
            (self.cwa_id, self.person_id, self.last_edited_by, self.last_edited_at),
        )
        return True

    def update(self):
        execute(
            """
            UPDATE DogOwner
            SET LastEditedBy = %s,
                LastEditedAt = %s
            WHERE CWAID = %s AND PersonID = %s
            """,
            (self.last_edited_by, self.last_edited_at, self.cwa_id, self.person_id),
        )
        return True

    @staticmethod
    def delete_one(cwa_id, person_id):
        execute(
            """
            DELETE FROM DogOwner
            WHERE CWAID = %s AND PersonID = %s
            """,
            (cwa_id, person_id),
        )
        return True
    
    @staticmethod
    def list_for_dog(cwa_id):
        rows = fetch_all(
            """
            SELECT CWAID, PersonID, LastEditedBy, LastEditedAt
            FROM DogOwner
            WHERE CWAID = %s
            ORDER BY PersonID
            """,
            (cwa_id,),
        )
        return [DogOwner.from_db_row(r) for r in rows]


    @staticmethod
    def list_for_person(person_id):
        rows = fetch_all(
            """
            SELECT CWAID, PersonID, LastEditedBy, LastEditedAt
            FROM DogOwner
            WHERE PersonID = %s
            ORDER BY CWAID
            """,
            (person_id,),
        )
        return [DogOwner.from_db_row(r) for r in rows]

    @staticmethod
    def delete_all_for_dog(cwa_id):
        execute(
            """
            DELETE FROM DogOwner
            WHERE CWAID = %s
            """,
            (cwa_id,),
        )
        return True

    def to_session_dict(self):
        return {"CWAID": self.cwa_id, "PersonID": self.person_id}

    def to_dict(self):
        return {
            "cwaId": self.cwa_id,
            "personId": self.person_id,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }

def list_owner_people_for_dog(cwa_id):
    rows = fetch_all(
        """
        SELECT
            do.CWAID,
            do.PersonID,
            p.FirstName,
            p.LastName,
            p.EmailAddress,
            do.LastEditedBy,
            do.LastEditedAt
        FROM DogOwner do
        LEFT JOIN Person p ON p.PersonID = do.PersonID
        WHERE do.CWAID = %s
        ORDER BY p.LastName, p.FirstName, do.PersonID
        """,
        (cwa_id,),
    )
    return rows