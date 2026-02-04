from database import fetch_one, fetch_all, execute
from datetime import datetime

class News:
    def __init__(
        self,
        id,
        title,
        content,
        created_at,
        updated_at,
        author_id,
        author_name=None,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.id = id
        self.title = title
        self.content = content
        self.created_at = created_at
        self.updated_at = updated_at
        self.author_id = author_id
        self.author_name = author_name
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        return cls(
            id=None,
            title=(data.get("title") or "").strip(),
            content=(data.get("content") or "").strip(),
            created_at=None,
            updated_at=None,
            author_id=None,
            author_name=None,
            last_edited_by=None,
            last_edited_at=None,
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            id=row.get("ID"),
            title=row.get("Title"),
            content=row.get("Content"),
            created_at=row.get("CreatedAt"),
            updated_at=row.get("UpdatedAt"),
            author_id=row.get("AuthorID"),
            author_name=row.get("AuthorName"), 
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        row = fetch_one(
            """
            SELECT
                n.ID,
                n.Title,
                n.Content,
                n.CreatedAt,
                n.UpdatedAt,
                n.AuthorID,
                CONCAT(p.FirstName, ' ', p.LastName) AS AuthorName,
                n.LastEditedBy,
                n.LastEditedAt
            FROM News n
            LEFT JOIN Person p ON p.PersonID = n.AuthorID
            WHERE n.ID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def find_all(cls, limit=500):
        rows = fetch_all(
            """
            SELECT
                n.ID,
                n.Title,
                n.Content,
                n.CreatedAt,
                n.UpdatedAt,
                n.AuthorID,
                CONCAT(p.FirstName, ' ', p.LastName) AS AuthorName,
                n.LastEditedBy,
                n.LastEditedAt
            FROM News n
            LEFT JOIN Person p ON p.PersonID = n.AuthorID
            ORDER BY n.CreatedAt DESC
            LIMIT %s
            """,
            (limit,),
        )
        return [cls.from_db_row(r) for r in (rows or [])]

    def validate(self):
        errors = []
        if not self.title:
            errors.append("Title is required")
        if not self.content:
            errors.append("Content is required")
        if not self.author_id:
            errors.append("AuthorID is required")
        if len(self.title) > 100:
            errors.append("Title must be 100 characters or less")
        return errors

    def save(self):
        if not self.author_id:
            raise ValueError("AuthorID is required before saving News")

        now = datetime.now()

        new_id = execute(
        """
        INSERT INTO News (
            Title,
            Content,
            CreatedAt,
            UpdatedAt,
            AuthorID,
            LastEditedBy,
            LastEditedAt
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            self.title,
            self.content,
            self.created_at or now,
            self.updated_at or now,
            self.author_id,
            self.last_edited_by,
            self.last_edited_at or now,
        ),
        return_lastrowid=True, 
        )

        self.id = int(new_id)
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "authorId": self.author_id,
            "authorName": self.author_name,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat()
            if self.last_edited_at
            else None,
        }
