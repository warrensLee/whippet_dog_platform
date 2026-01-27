from database import fetch_one, fetch_all, execute
from datetime import datetime
from mysql.connector import Error

class News:
    def __init__(
        self,
        news_id,
        title,
        content,
        created_at,
        updated_at,
        author_id,
        author_name=None,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.news_id = news_id
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
        def pick(*keys, default=None):
            for k in keys:
                if k in data and data[k] is not None:
                    return data[k]
            return default

        return cls(
            news_id=None,
            title=str(pick("Title", "title", default="")).strip(),
            content=str(pick("Content", "content", default="")).strip(),
            created_at=None,
            updated_at=None,
            author_id=str(pick("AuthorID", "authorId", default=None)) if pick("AuthorID", "authorId", default=None) else None,
            author_name=None,
            last_edited_by=None,
            last_edited_at=None,
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            news_id=row.get("NewsID"),
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
                n.NewsID,
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
            WHERE n.NewsID = %s
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
                n.NewsID,
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
        if len(self.title) > 100:
            errors.append("Title must be 100 characters or less")
        return errors

    def save(self):
        if not self.author_id:
            raise ValueError("AuthorID is required before saving News")

        now = datetime.now()
        created_at = self.created_at or now
        updated_at = self.updated_at or now
        last_edited_at = self.last_edited_at or now

        execute(
            """
            INSERT INTO News (Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                self.title,
                self.content,
                created_at,
                updated_at,
                self.author_id,
                self.last_edited_by,
                last_edited_at,
            ),
        )
        return True

    def to_dict(self):
        return {
            "newsId": self.news_id,
            "title": self.title,
            "content": self.content,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "authorId": self.author_id,
            "authorName": self.author_name, 
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }
