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
        edit_person_scope=0,
        edit_dog_owner_scope=0,
        edit_officer_role_scope=0,
        edit_user_role_scope=0,
        edit_club_scope=0,
        edit_meet_scope=0,
        edit_meet_results_scope=0,
        edit_race_results_scope=0,
        edit_dog_titles_scope=0,
        edit_title_type_scope=0,
        edit_news_scope=0,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.id = id
        self.title = (title or "").strip().upper()
        self.edit_dog_scope = int(edit_dog_scope or 0)
        self.edit_person_scope = int(edit_person_scope or 0)
        self.edit_dog_owner_scope = int(edit_dog_owner_scope or 0)
        self.edit_officer_role_scope = int(edit_officer_role_scope or 0)
        self.edit_user_role_scope = int(edit_user_role_scope or 0)
        self.edit_club_scope = int(edit_club_scope or 0)
        self.edit_meet_scope = int(edit_meet_scope or 0)
        self.edit_meet_results_scope = int(edit_meet_results_scope or 0)
        self.edit_race_results_scope = int(edit_race_results_scope or 0)
        self.edit_dog_titles_scope = int(edit_dog_titles_scope or 0)
        self.edit_title_type_scope = int(edit_title_type_scope or 0)
        self.edit_news_scope = int(edit_news_scope or 0)
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        return cls(
            id=data.get("id") or data.get("roleId"),
            title=(data.get("title") or "").strip(),
            edit_dog_scope=data.get("editDogScope", 0),
            edit_person_scope=data.get("editPersonScope", 0),
            edit_dog_owner_scope=data.get("editDogOwnerScope", 0),
            edit_officer_role_scope=data.get("editOfficerRoleScope", 0),
            edit_user_role_scope=data.get("editUserRoleScope", 0),
            edit_club_scope=data.get("editClubScope", 0),
            edit_meet_scope=data.get("editMeetScope", 0),
            edit_meet_results_scope=data.get("editMeetResultsScope", 0),
            edit_race_results_scope=data.get("editRaceResultsScope", 0),
            edit_dog_titles_scope=data.get("editDogTitlesScope", 0),
            edit_title_type_scope=data.get("editTitleTypeScope", 0),
            edit_news_scope=data.get("editNewsScope", 0),
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
            edit_person_scope=row.get("EditPersonScope"),
            edit_dog_owner_scope=row.get("EditDogOwnerScope"),
            edit_officer_role_scope=row.get("EditOfficerRoleScope"),
            edit_user_role_scope=row.get("EditUserRoleScope"),
            edit_club_scope=row.get("EditClubScope"),
            edit_meet_scope=row.get("EditMeetScope"),
            edit_meet_results_scope=row.get("EditMeetResultsScope"),
            edit_race_results_scope=row.get("EditRaceResultsScope"),
            edit_dog_titles_scope=row.get("EditDogTitlesScope"),
            edit_title_type_scope=row.get("EditTitleTypeScope"),
            edit_news_scope=row.get("EditNewsScope"),
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
            self.edit_person_scope,
            self.edit_dog_owner_scope,
            self.edit_officer_role_scope,
            self.edit_user_role_scope,
            self.edit_club_scope,
            self.edit_meet_scope,
            self.edit_meet_results_scope,
            self.edit_race_results_scope,
            self.edit_dog_titles_scope,
            self.edit_title_type_scope,
            self.edit_news_scope,
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
                EditPersonScope,
                EditDogOwnerScope,
                EditOfficerRoleScope,
                EditUserRoleScope,
                EditClubScope,
                EditMeetScope,
                EditMeetResultsScope,
                EditRaceResultsScope,
                EditDogTitlesScope,
                EditTitleTypeScope,
                EditNewsScope,
                LastEditedBy,
                LastEditedAt
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
            )
            """,
            (
                self.title,
                self.edit_dog_scope,
                self.edit_person_scope,
                self.edit_dog_owner_scope,
                self.edit_officer_role_scope,
                self.edit_user_role_scope,
                self.edit_club_scope,
                self.edit_meet_scope,
                self.edit_meet_results_scope,
                self.edit_race_results_scope,
                self.edit_dog_titles_scope,
                self.edit_title_type_scope,
                self.edit_news_scope,
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
                EditPersonScope = %s,
                EditDogOwnerScope = %s,
                EditOfficerRoleScope = %s,
                EditUserRoleScope = %s,
                EditClubScope = %s,
                EditMeetScope = %s,
                EditMeetResultsScope = %s,
                EditRaceResultsScope = %s,
                EditDogTitlesScope = %s,
                EditTitleTypeScope = %s,
                EditNewsScope = %s,
                LastEditedBy = %s,
                LastEditedAt = NOW()
            WHERE ID = %s
            """,
            (
                self.edit_dog_scope,
                self.edit_person_scope,
                self.edit_dog_owner_scope,
                self.edit_officer_role_scope,
                self.edit_user_role_scope,
                self.edit_club_scope,
                self.edit_meet_scope,
                self.edit_meet_results_scope,
                self.edit_race_results_scope,
                self.edit_dog_titles_scope,
                self.edit_title_type_scope,
                self.edit_news_scope,
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
            "edit_person_scope": self.edit_person_scope,
            "edit_dog_owner_scope": self.edit_dog_owner_scope,
            "edit_officer_role_scope": self.edit_officer_role_scope,
            "edit_user_role_scope": self.edit_user_role_scope,
            "edit_club_scope": self.edit_club_scope,
            "edit_meet_scope": self.edit_meet_scope,
            "edit_meet_results_scope": self.edit_meet_results_scope,
            "edit_race_results_scope": self.edit_race_results_scope,
            "edit_dog_titles_scope": self.edit_dog_titles_scope,
            "edit_title_type_scope": self.edit_title_type_scope,
            "edit_news_scope": self.edit_news_scope,
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
        self.edit_person_scope = other.edit_person_scope
        self.edit_dog_owner_scope = other.edit_dog_owner_scope
        self.edit_officer_role_scope = other.edit_officer_role_scope
        self.edit_user_role_scope = other.edit_user_role_scope
        self.edit_club_scope = other.edit_club_scope
        self.edit_meet_scope = other.edit_meet_scope
        self.edit_meet_results_scope = other.edit_meet_results_scope
        self.edit_race_results_scope = other.edit_race_results_scope
        self.edit_dog_titles_scope = other.edit_dog_titles_scope
        self.edit_title_type_scope = other.edit_title_type_scope
        self.edit_news_scope = other.edit_news_scope

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "editDogScope": self.edit_dog_scope,
            "editPersonScope": self.edit_person_scope,
            "editDogOwnerScope": self.edit_dog_owner_scope,
            "editOfficerRoleScope": self.edit_officer_role_scope,
            "editUserRoleScope": self.edit_user_role_scope,
            "editClubScope": self.edit_club_scope,
            "editMeetScope": self.edit_meet_scope,
            "editMeetResultsScope": self.edit_meet_results_scope,
            "editRaceResultsScope": self.edit_race_results_scope,
            "editDogTitlesScope": self.edit_dog_titles_scope,
            "editTitleTypeScope": self.edit_title_type_scope,
            "editNewsScope": self.edit_news_scope,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }