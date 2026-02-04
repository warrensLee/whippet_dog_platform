from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class UserRole:
    def __init__(
        self,
        title: str,
        role_id: int | None = None,
        can_edit_dog: bool = False,
        can_edit_person: bool = False,
        can_edit_dog_owner: bool = False,
        can_edit_officer_role: bool = False,
        can_edit_user_role: bool = False,
        can_edit_club: bool = False,
        can_edit_meet: bool = False,
        can_edit_meet_results: bool = False,
        can_edit_race_results: bool = False,
        can_edit_dog_titles: bool = False,
        can_edit_news: bool = False,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.role_id = role_id
        self.title = (title or "").strip().upper()
        self.can_edit_dog = bool(can_edit_dog)
        self.can_edit_person = bool(can_edit_person)
        self.can_edit_dog_owner = bool(can_edit_dog_owner)
        self.can_edit_officer_role = bool(can_edit_officer_role)
        self.can_edit_user_role = bool(can_edit_user_role)
        self.can_edit_club = bool(can_edit_club)
        self.can_edit_meet = bool(can_edit_meet)
        self.can_edit_meet_results = bool(can_edit_meet_results)
        self.can_edit_race_results = bool(can_edit_race_results)
        self.can_edit_dog_titles = bool(can_edit_dog_titles)
        self.can_edit_news = bool(can_edit_news)

        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data: dict):
        return cls(
            title=(data.get("title") or "").strip(),
            can_edit_dog=data.get("canEditDog", False),
            can_edit_person=data.get("canEditPerson", False),
            can_edit_dog_owner=data.get("canEditDogOwner", False),
            can_edit_officer_role=data.get("canEditOfficerRole", False),
            can_edit_user_role=data.get("canEditUserRole", False),
            can_edit_club=data.get("canEditClub", False),
            can_edit_meet=data.get("canEditMeet", False),
            can_edit_meet_results=data.get("canEditMeetResults", False),
            can_edit_race_results=data.get("canEditRaceResults", False),
            can_edit_dog_titles=data.get("canEditDogTitles", False),
            can_edit_news=data.get("canEditNews", False),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt"),
        )

    @classmethod
    def from_db_row(cls, row: dict):
        if not row:
            return None
        return cls(
            role_id=row.get("RoleID"),
            title=row.get("Title"),
            can_edit_dog=bool(row.get("CanEditDog")),
            can_edit_person=bool(row.get("CanEditPerson")),
            can_edit_dog_owner=bool(row.get("CanEditDogOwner")),
            can_edit_officer_role=bool(row.get("CanEditOfficerRole")),
            can_edit_user_role=bool(row.get("CanEditUserRole")),
            can_edit_club=bool(row.get("CanEditClub")),
            can_edit_meet=bool(row.get("CanEditMeet")),
            can_edit_meet_results=bool(row.get("CanEditMeetResults")),
            can_edit_race_results=bool(row.get("CanEditRaceResults")),
            can_edit_dog_titles=bool(row.get("CanEditDogTitles")),
            can_edit_news=bool(row.get("CanEditNews")),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        row = fetch_one(
            """
            SELECT RoleID, Title, CanEditDog, CanEditPerson, CanEditDogOwner,
                   CanEditOfficerRole, CanEditUserRole, CanEditClub, CanEditMeet,
                   CanEditMeetResults, CanEditRaceResults, CanEditDogTitles,
                   CanEditNews, LastEditedBy, LastEditedAt
            FROM UserRole
            WHERE RoleID = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, title: str) -> bool:
        title = (title or "").strip().upper()
        row = fetch_one("SELECT Title FROM UserRole WHERE Title = %s LIMIT 1", (title,))
        return row is not None

    def validate(self):
        errors = []
        if not self.title:
            errors.append("Title is required")
        if len(self.title) > 20:
            errors.append("Title must be 20 characters or less")
        return errors

    def save(self):
        try:
            execute(
                """
                INSERT INTO UserRole (
                    Title, CanEditDog, CanEditPerson, CanEditDogOwner,
                    CanEditOfficerRole, CanEditUserRole, CanEditClub, CanEditMeet,
                    CanEditMeetResults, CanEditRaceResults, CanEditDogTitles,
                    CanEditNews, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.title,
                    self.can_edit_dog,
                    self.can_edit_person,
                    self.can_edit_dog_owner,
                    self.can_edit_officer_role,
                    self.can_edit_user_role,
                    self.can_edit_club,
                    self.can_edit_meet,
                    self.can_edit_meet_results,
                    self.can_edit_race_results,
                    self.can_edit_dog_titles,
                    self.can_edit_news,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """
        Update permissions.
        """
        try:
            execute(
                """
                UPDATE UserRole
                SET CanEditDog = %s,
                    CanEditPerson = %s,
                    CanEditDogOwner = %s,
                    CanEditOfficerRole = %s,
                    CanEditUserRole = %s,
                    CanEditClub = %s,
                    CanEditMeet = %s,
                    CanEditMeetResults = %s,
                    CanEditRaceResults = %s,
                    CanEditDogTitles = %s,
                    CanEditNews = %s,
                    LastEditedBy = %s,
                    LastEditedAt = NOW()
                WHERE Title = %s
                """,
                (
                    self.can_edit_dog,
                    self.can_edit_person,
                    self.can_edit_dog_owner,
                    self.can_edit_officer_role,
                    self.can_edit_user_role,
                    self.can_edit_club,
                    self.can_edit_meet,
                    self.can_edit_meet_results,
                    self.can_edit_race_results,
                    self.can_edit_dog_titles,
                    self.can_edit_news,
                    self.last_edited_by,
                    self.title,
                ),
            )
            return True
        except Error as e:
            raise e

    @classmethod
    def delete(cls, title: str):
        title = (title or "").strip().upper()
        try:
            execute("DELETE FROM UserRole WHERE Title = %s", (title,))
            return True
        except Error as e:
            raise e

    @staticmethod
    def list_all_user_roles():
        rows = fetch_all(
            """
            SELECT RoleID, Title, CanEditDog, CanEditPerson, CanEditDogOwner,
                   CanEditOfficerRole, CanEditUserRole, CanEditClub, CanEditMeet,
                   CanEditMeetResults, CanEditRaceResults, CanEditDogTitles,
                   CanEditNews, LastEditedBy, LastEditedAt
            FROM UserRole
            ORDER BY Title
            """
        )
        return [UserRole.from_db_row(r) for r in rows]

    def to_session_dict(self):
        return {"SystemRole": self.title}

    def to_dict(self):
        return {
            "roleId": self.role_id,   
            "title": self.title,
            "canEditDog": self.can_edit_dog,
            "canEditPerson": self.can_edit_person,
            "canEditDogOwner": self.can_edit_dog_owner,
            "canEditOfficerRole": self.can_edit_officer_role,
            "canEditUserRole": self.can_edit_user_role,
            "canEditClub": self.can_edit_club,
            "canEditMeet": self.can_edit_meet,
            "canEditMeetResults": self.can_edit_meet_results,
            "canEditRaceResults": self.can_edit_race_results,
            "canEditDogTitles": self.can_edit_dog_titles,
            "canEditNews": self.can_edit_news,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
        }