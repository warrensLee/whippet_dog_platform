'''
Docstring for news

TODO:
'''

from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class News:

    def __init__(self, news_id, title, content, created_at, updated_at, author_id, last_edited_by=None, last_edited_at=None):
        self.news_id = news_id
        self.title = title
        self.content = content
        self.created_at = created_at
        self.updated_at = updated_at
        self.author_id = author_id
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a News instance from request JSON data."""
        return cls(
            news_id=(data.get("newsId") or "").strip(),
            title=(data.get("title") or "").strip(),
            content=(data.get("content") or "").strip(),
            created_at=data.get("createdAt"),
            updated_at=data.get("updatedAt"),
            author_id=(data.get("authorId") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a News instance from a database row."""
        if not row:
            return None
        return cls(
            news_id=row.get("NewsID"),
            title=row.get("Title"),
            content=row.get("Content"),
            created_at=row.get("CreatedAt"),
            updated_at=row.get("UpdatedAt"),
            author_id=row.get("AuthorID"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find news by news_id."""
        row = fetch_one(
            """
            SELECT NewsID, Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt
            FROM News
            WHERE NewsID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, news_id):
        """Check if a news item with given ID already exists."""
        existing = fetch_one(
            """
            SELECT NewsID
            FROM News
            WHERE NewsID = %s
            LIMIT 1
            """,
            (news_id,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.news_id:
            errors.append("NewsID is required")
        if not self.title:
            errors.append("Title is required")
        if not self.content:
            errors.append("Content is required")
        if not self.created_at:
            errors.append("CreatedAt is required")
        if len(self.title) > 100:
            errors.append("Title must be 100 characters or less")
        return errors

    def save(self):
        """Save news to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO News (
                    NewsID, Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.news_id,
                    self.title,
                    self.content,
                    self.created_at,
                    self.updated_at,
                    self.author_id,
                    self.last_edited_by,
                    self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update existing news in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE News
                SET Title = %s,
                    Content = %s,
                    UpdatedAt = %s,
                    AuthorID = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE NewsID = %s
                """,
                (
                    self.title,
                    self.content,
                    self.updated_at,
                    self.author_id,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.news_id
                ),
            )
            return True
        except Error as e:
            raise e

    def delete(self, news_id):   
        """Delete news from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM News
                WHERE NewsID = %s
                """,
                (news_id,),
            )
            return True
        except Error as e:
            raise e

    def list_all_news():
        """Retrieve all news from the database."""
        rows = fetch_all(
            """
            SELECT NewsID, Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt
            FROM News
            """
        )
        return [News.from_db_row(row) for row in rows]
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "NewsID": self.news_id,
            "Title": self.title,
            "CreatedAt": self.created_at,
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "newsId": self.news_id,
            "title": self.title,
            "content": self.content,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
            "authorId": self.author_id,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
