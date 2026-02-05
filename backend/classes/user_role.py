from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class UserRole:
    NONE = 0
    SELF = 1
    ALL = 2

    def __init__(
        self,
        title: str,
        id: int | None = None,

        view_dog_scope: int = 0,
        edit_dog_scope: int = 0,

        view_person_scope: int = 0,
        edit_person_scope: int = 0,

        view_dog_owner_scope: int = 0,
        edit_dog_owner_scope: int = 0,

        view_officer_role_scope: int = 0,
        edit_officer_role_scope: int = 0,

        view_user_role_scope: int = 0,
        edit_user_role_scope: int = 0,

        view_club_scope: int = 0,
        edit_club_scope: int = 0,

        view_meet_scope: int = 0,
        edit_meet_scope: int = 0,

        view_meet_results_scope: int = 0,
        edit_meet_results_scope: int = 0,

        view_race_results_scope: int = 0,
        edit_race_results_scope: int = 0,

        view_dog_titles_scope: int = 0,
        edit_dog_titles_scope: int = 0,

        view_news_scope: int = 0,
        edit_news_scope: int = 0,

        last_edited_by=None,
        last_edited_at=None,
    ):
        self.id = id
        self.title = (title or "").strip().upper()

        # store as ints 0/1/2
        self.view_dog_scope = int(view_dog_scope or 0)
        self.edit_dog_scope = int(edit_dog_scope or 0)

        self.view_person_scope = int(view_person_scope or 0)
        self.edit_person_scope = int(edit_person_scope or 0)

        self.view_dog_owner_scope = int(view_dog_owner_scope or 0)
        self.edit_dog_owner_scope = int(edit_dog_owner_scope or 0)

        self.view_officer_role_scope = int(view_officer_role_scope or 0)
        self.edit_officer_role_scope = int(edit_officer_role_scope or 0)

        self.view_user_role_scope = int(view_user_role_scope or 0)
        self.edit_user_role_scope = int(edit_user_role_scope or 0)

        self.view_club_scope = int(view_club_scope or 0)
        self.edit_club_scope = int(edit_club_scope or 0)

        self.view_meet_scope = int(view_meet_scope or 0)
        self.edit_meet_scope = int(edit_meet_scope or 0)

        self.view_meet_results_scope = int(view_meet_results_scope or 0)
        self.edit_meet_results_scope = int(edit_meet_results_scope or 0)

        self.view_race_results_scope = int(view_race_results_scope or 0)
        self.edit_race_results_scope = int(edit_race_results_scope or 0)

        self.view_dog_titles_scope = int(view_dog_titles_scope or 0)
        self.edit_dog_titles_scope = int(edit_dog_titles_scope or 0)

        self.view_news_scope = int(view_news_scope or 0)
        self.edit_news_scope = int(edit_news_scope or 0)

        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data: dict):
        return cls(
            id=data.get("id") or data.get("roleId"),
            title=(data.get("title") or "").strip(),

            view_dog_scope=data.get("viewDogScope", 0),
            edit_dog_scope=data.get("editDogScope", 0),

            view_person_scope=data.get("viewPersonScope", 0),
            edit_person_scope=data.get("editPersonScope", 0),

            view_dog_owner_scope=data.get("viewDogOwnerScope", 0),
            edit_dog_owner_scope=data.get("editDogOwnerScope", 0),

            view_officer_role_scope=data.get("viewOfficerRoleScope", 0),
            edit_officer_role_scope=data.get("editOfficerRoleScope", 0),

            view_user_role_scope=data.get("viewUserRoleScope", 0),
            edit_user_role_scope=data.get("editUserRoleScope", 0),

            view_club_scope=data.get("viewClubScope", 0),
            edit_club_scope=data.get("editClubScope", 0),

            view_meet_scope=data.get("viewMeetScope", 0),
            edit_meet_scope=data.get("editMeetScope", 0),

            view_meet_results_scope=data.get("viewMeetResultsScope", 0),
            edit_meet_results_scope=data.get("editMeetResultsScope", 0),

            view_race_results_scope=data.get("viewRaceResultsScope", 0),
            edit_race_results_scope=data.get("editRaceResultsScope", 0),

            view_dog_titles_scope=data.get("viewDogTitlesScope", 0),
            edit_dog_titles_scope=data.get("editDogTitlesScope", 0),

            view_news_scope=data.get("viewNewsScope", 0),
            edit_news_scope=data.get("editNewsScope", 0),

            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt"),
        )

    @classmethod
    def from_db_row(cls, row: dict):
        if not row:
            return None
        return cls(
            id=row.get("ID"),
            title=row.get("Title"),

            view_dog_scope=row.get("ViewDogScope"),
            edit_dog_scope=row.get("EditDogScope"),

            view_person_scope=row.get("ViewPersonScope"),
            edit_person_scope=row.get("EditPersonScope"),

            view_dog_owner_scope=row.get("ViewDogOwnerScope"),
            edit_dog_owner_scope=row.get("EditDogOwnerScope"),

            view_officer_role_scope=row.get("ViewOfficerRoleScope"),
            edit_officer_role_scope=row.get("EditOfficerRoleScope"),

            view_user_role_scope=row.get("ViewUserRoleScope"),
            edit_user_role_scope=row.get("EditUserRoleScope"),

            view_club_scope=row.get("ViewClubScope"),
            edit_club_scope=row.get("EditClubScope"),

            view_meet_scope=row.get("ViewMeetScope"),
            edit_meet_scope=row.get("EditMeetScope"),

            view_meet_results_scope=row.get("ViewMeetResultsScope"),
            edit_meet_results_scope=row.get("EditMeetResultsScope"),

            view_race_results_scope=row.get("ViewRaceResultsScope"),
            edit_race_results_scope=row.get("EditRaceResultsScope"),

            view_dog_titles_scope=row.get("ViewDogTitlesScope"),
            edit_dog_titles_scope=row.get("EditDogTitlesScope"),

            view_news_scope=row.get("ViewNewsScope"),
            edit_news_scope=row.get("EditNewsScope"),

            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_id(cls, role_id: int):
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
    def find_by_title(cls, title: str):
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
    def exists(cls, title: str) -> bool:
        t = (title or "").strip().upper()
        row = fetch_one("SELECT 1 FROM UserRole WHERE Title = %s LIMIT 1", (t,))
        return row is not None

    def validate(self):
        errors = []
        if not self.title:
            errors.append("Title is required")
        if len(self.title) > 20:
            errors.append("Title must be 20 characters or less")

        for field in [
            self.view_dog_scope, self.edit_dog_scope,
            self.view_person_scope, self.edit_person_scope,
            self.view_dog_owner_scope, self.edit_dog_owner_scope,
            self.view_officer_role_scope, self.edit_officer_role_scope,
            self.view_user_role_scope, self.edit_user_role_scope,
            self.view_club_scope, self.edit_club_scope,
            self.view_meet_scope, self.edit_meet_scope,
            self.view_meet_results_scope, self.edit_meet_results_scope,
            self.view_race_results_scope, self.edit_race_results_scope,
            self.view_dog_titles_scope, self.edit_dog_titles_scope,
            self.view_news_scope, self.edit_news_scope,
        ]:
            if field not in (0, 1, 2):
                errors.append("Permission scopes must be 0 (none), 1 (self), or 2 (all).")
                break

        if self.edit_dog_scope > self.view_dog_scope:
            errors.append("Dog edit scope cannot exceed dog view scope.")
        if self.edit_club_scope > self.view_club_scope:
            errors.append("Club edit scope cannot exceed club view scope.")

        return errors

    def save(self):
        execute(
            """
            INSERT INTO UserRole (
                Title,
                ViewDogScope, EditDogScope,
                ViewPersonScope, EditPersonScope,
                ViewDogOwnerScope, EditDogOwnerScope,
                ViewOfficerRoleScope, EditOfficerRoleScope,
                ViewUserRoleScope, EditUserRoleScope,
                ViewClubScope, EditClubScope,
                ViewMeetScope, EditMeetScope,
                ViewMeetResultsScope, EditMeetResultsScope,
                ViewRaceResultsScope, EditRaceResultsScope,
                ViewDogTitlesScope, EditDogTitlesScope,
                ViewNewsScope, EditNewsScope,
                LastEditedBy, LastEditedAt
            ) VALUES (
                %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, %s,
                %s, NOW()
            )
            """,
            (
                self.title,
                self.view_dog_scope, self.edit_dog_scope,
                self.view_person_scope, self.edit_person_scope,
                self.view_dog_owner_scope, self.edit_dog_owner_scope,
                self.view_officer_role_scope, self.edit_officer_role_scope,
                self.view_user_role_scope, self.edit_user_role_scope,
                self.view_club_scope, self.edit_club_scope,
                self.view_meet_scope, self.edit_meet_scope,
                self.view_meet_results_scope, self.edit_meet_results_scope,
                self.view_race_results_scope, self.edit_race_results_scope,
                self.view_dog_titles_scope, self.edit_dog_titles_scope,
                self.view_news_scope, self.edit_news_scope,
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
                ViewDogScope = %s, EditDogScope = %s,
                ViewPersonScope = %s, EditPersonScope = %s,
                ViewDogOwnerScope = %s, EditDogOwnerScope = %s,
                ViewOfficerRoleScope = %s, EditOfficerRoleScope = %s,
                ViewUserRoleScope = %s, EditUserRoleScope = %s,
                ViewClubScope = %s, EditClubScope = %s,
                ViewMeetScope = %s, EditMeetScope = %s,
                ViewMeetResultsScope = %s, EditMeetResultsScope = %s,
                ViewRaceResultsScope = %s, EditRaceResultsScope = %s,
                ViewDogTitlesScope = %s, EditDogTitlesScope = %s,
                ViewNewsScope = %s, EditNewsScope = %s,
                LastEditedBy = %s,
                LastEditedAt = NOW()
            WHERE ID = %s
            """,
            (
                self.view_dog_scope, self.edit_dog_scope,
                self.view_person_scope, self.edit_person_scope,
                self.view_dog_owner_scope, self.edit_dog_owner_scope,
                self.view_officer_role_scope, self.edit_officer_role_scope,
                self.view_user_role_scope, self.edit_user_role_scope,
                self.view_club_scope, self.edit_club_scope,
                self.view_meet_scope, self.edit_meet_scope,
                self.view_meet_results_scope, self.edit_meet_results_scope,
                self.view_race_results_scope, self.edit_race_results_scope,
                self.view_dog_titles_scope, self.edit_dog_titles_scope,
                self.view_news_scope, self.edit_news_scope,
                self.last_edited_by,
                self.id,
            ),
        )
        return True

    @staticmethod
    def list_all_user_roles():
        rows = fetch_all("SELECT * FROM UserRole ORDER BY Title")
        return [UserRole.from_db_row(r) for r in rows]

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "viewDogScope": self.view_dog_scope,
            "editDogScope": self.edit_dog_scope,
            "viewClubScope": self.view_club_scope,
            "editClubScope": self.edit_club_scope,
            "viewPersonScope": self.view_person_scope,
            "editPersonScope": self.edit_person_scope,
            "viewDogOwnerScope": self.view_dog_owner_scope,
            "editDogOwnerScope": self.edit_dog_owner_scope,
            "viewOfficerRoleScope": self.view_officer_role_scope,
            "editOfficerRoleScope": self.edit_officer_role_scope,
            "viewUserRoleScope": self.view_user_role_scope,
            "editUserRoleScope": self.edit_user_role_scope,
            "viewMeetScope": self.view_meet_scope,
            "editMeetScope": self.edit_meet_scope,
            "viewMeetResultsScope": self.view_meet_results_scope,
            "editMeetResultsScope": self.edit_meet_results_scope,
            "viewRaceResultsScope": self.view_race_results_scope,
            "editRaceResultsScope": self.edit_race_results_scope,
            "viewDogTitlesScope": self.view_dog_titles_scope,
            "editDogTitlesScope": self.edit_dog_titles_scope,
            "viewNewsScope": self.view_news_scope,
            "editNewsScope": self.edit_news_scope,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }
