from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class UserRole:
    NONE = 0
    SELF = 1
    ALL = 2

    def __init__(
        self,
        title=None,
        id=None,
        edit_dog_scope=0,
        edit_meet_scope=0,
        edit_title_type_scope=0,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.id = id
        self.title = (title or "").strip().upper()
        self.edit_dog_scope = int(edit_dog_scope or 0)
        self.edit_meet_scope = int(edit_meet_scope or 0)
        self.edit_title_type_scope = int(edit_title_type_scope or 0)
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        return cls(
            id=data.get("id") or data.get("roleId"),
            title=(data.get("title") or "").strip(),
            edit_dog_scope=data.get("editDogScope", 0),
            edit_meet_scope=data.get("editMeetScope", 0),
            edit_title_type_scope=data.get("editTitleTypeScope", 0),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt"),
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            id=row.get("ID"),
            title=row.get("Title"),
            edit_dog_scope=row.get("EditDogScope"),
            edit_meet_scope=row.get("EditMeetScope"),
            edit_title_type_scope=row.get("EditTitleTypeScope"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_id(cls, role_id):
        row = fetch_one(
            """
            SELECT *
            FROM UserRole
            WHERE ID = %s
            LIMIT 1
            """,
            (role_id,),
        )
        return cls.from_db_row(row)

    @classmethod
    def find_by_title(cls, title):
        t = (title or "").strip().upper()
        row = fetch_one(
            """
            SELECT *
            FROM UserRole
            WHERE Title = %s
            LIMIT 1
            """,
            (t,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, title):
        t = (title or "").strip().upper()
        row = fetch_one("SELECT 1 FROM UserRole WHERE Title = %s LIMIT 1", (t,))
        return row is not None
    
    def delete_by_id(self):
        if self.id is None:
            raise ValueError("Cannot delete UserRole without an ID.")

        execute(
            """
            DELETE FROM UserRole
            WHERE ID = %s
            """,
            (self.id,)
        )
        return True

    def validate(self):
        errors = []
        if not self.title:
            errors.append("Title is required")
        if len(self.title) > 20:
            errors.append("Title must be 20 characters or less")

        for field in [
            self.edit_dog_scope,
            self.edit_meet_scope,
            self.edit_title_type_scope,
        ]:
            if field not in (0, 1, 2):
                errors.append("Permission scopes must be 0 (none), 1 (self), or 2 (all).")
                break

        return errors

    def save(self):
        execute(
            """
            INSERT INTO UserRole (
                Title,
                EditDogScope,
                EditMeetScope,
                EditTitleTypeScope,
                LastEditedBy,
                LastEditedAt
            ) VALUES (
                %s, %s, %s, %s, %s, NOW()
            )
            """,
            (
                self.title,
                self.edit_dog_scope,
                self.edit_meet_scope,
                self.edit_title_type_scope,
                self.last_edited_by,
            ),
        )
        return True

    def update_by_id(self):
        if self.id is None:
            raise ValueError("Cannot update a UserRole without an ID.")

        execute(
            """
            UPDATE UserRole
            SET
                EditDogScope = %s,
                EditMeetScope = %s,
                EditTitleTypeScope = %s,
                LastEditedBy = %s,
                LastEditedAt = NOW()
            WHERE ID = %s
            """,
            (
                self.edit_dog_scope,
                self.edit_meet_scope,
                self.edit_title_type_scope,
                self.last_edited_by,
                self.id,
            ),
        )
        return True

    @staticmethod
    def list_all_user_roles():
        rows = fetch_all("SELECT * FROM UserRole ORDER BY Title")
        return [UserRole.from_db_row(r) for r in rows]
    
    def scopes_dict(self):
        """Return just the permission scope fields (no id/title/timestamps)."""
        return {
            "edit_dog_scope": self.edit_dog_scope,
            "edit_meet_scope": self.edit_meet_scope,
            "edit_title_type_scope": self.edit_title_type_scope,
        }

    def matches_scopes(self, other):
        """True if all permission scopes match another role exactly."""
        if not other:
            return False
        return self.scopes_dict() == other.scopes_dict()

    def copy_scopes_from(self, other):
        """Copy all permission scopes from another role onto this one."""
        if not other:
            raise ValueError("copy_scopes_from: other role is required")

        self.edit_dog_scope = other.edit_dog_scope
        self.edit_meet_scope = other.edit_meet_scope
        self.edit_title_type_scope = other.edit_title_type_scope

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "editDogScope": self.edit_dog_scope,
            "editMeetScope": self.edit_meet_scope,
            "editTitleTypeScope": self.edit_title_type_scope,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }