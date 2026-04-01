from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class TitleType:

    def __init__(self, id, title, title_description, last_edited_by=None, last_edited_at=None, last_edited_by_name = None):
        self.id = id
        self.title = title
        self.title_description = title_description
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at
        self.last_edited_by_name = last_edited_by_name

    @classmethod
    def check_eligibility(cls):
        pass

    @classmethod
    def award_title():
        pass

    @classmethod
    def from_request_data(cls, data):
        return cls(
            id=data.get("id"),
            title=(data.get("title") or "").strip(),
            title_description=(data.get("titleDescription") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            id=row.get("Id"),
            title=row.get("Title"),
            title_description=row.get("TitleDescription"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
            last_edited_by_name=row.get("LastEditedByName")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        row = fetch_one(
            """
            SELECT Id, Title, TitleDescription, LastEditedBy, LastEditedAt
            FROM TitleType
            WHERE Title = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, title):
        existing = fetch_one(
            """
            SELECT Title
            FROM TitleType
            WHERE Title = %s
            LIMIT 1
            """,
            (title,),
        )
        return existing is not None

    def validate(self):
        errors = []
        if not self.title:
            errors.append("Title is required")
        if not self.title_description:
            errors.append("Title description is required")
        if len(self.title) > 10:
            errors.append("Title must be 10 characters or less")
        if len(self.title_description) > 200:
            errors.append("Title description must be 200 characters or less")
        return errors

    def save(self):
        try:
            execute(
                """
                INSERT INTO TitleType (
                    Title, TitleDescription, LastEditedBy, LastEditedAt
                ) VALUES (%s, %s, %s, %s)
                """,
                (
                    self.title, self.title_description, self.last_edited_by, self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        try:
            execute(
                """
                UPDATE TitleType
                SET Title = %s,
                    TitleDescription = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE Id = %s
                """,
                (
                    self.title,
                    self.title_description,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.id
                ),
            )
            return True
        except Error as e:
            raise e
        
    def delete(self):
        try:
            execute(
                """
                DELETE FROM TitleType
                WHERE Id = %s
                """,
                (self.id,),
            )
            return True
        except Error as e:
            raise e

    @classmethod
    def list_all_title_types(cls):
        rows = fetch_all(
            """
            SELECT 
                tt.Id, 
                tt.Title, 
                tt.TitleDescription, 
                tt.LastEditedBy, 
                tt.LastEditedAt,
                CONCAT(p.FirstName, ' ', p.LastName) AS LastEditedByName
            FROM TitleType tt
            LEFT JOIN Person p 
                ON tt.LastEditedBy = p.ID
            """
        )
        return [cls.from_db_row(row) for row in rows]

    def to_session_dict(self):
        return {
            "Title": self.title,
            "TitleDescription": self.title_description,
        }

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "titleDescription": self.title_description,
            "lastEditedBy": self.last_edited_by,
            "lastEditedByName": self.last_edited_by_name,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }