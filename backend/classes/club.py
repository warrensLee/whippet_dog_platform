'''
Docstring for club

TODO:
'''

from database import fetch_one, execute, fetch_all
from mysql.connector import Error

class Club:
    def __init__(self, club_abbreviation, club_name, club_status, begin_date, end_date,
                 board_member1, board_member2, default_race_secretary, notes, last_edited_by, last_edited_at):
        self.club_abbreviation = club_abbreviation
        self.club_name = club_name
        self.club_status = club_status
        self.begin_date = begin_date
        self.end_date = end_date
        self.board_member1 = board_member1
        self.board_member2 = board_member2
        self.default_race_secretary = default_race_secretary
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a Club instance from request JSON data."""
        return cls(
            club_abbreviation=(data.get("clubAbbreviation") or "").strip(),
            club_name=(data.get("clubName") or "").strip(),
            club_status=(data.get("clubStatus") or "").strip(),
            begin_date=data.get("beginDate"),
            end_date=data.get("endDate"),
            board_member1=(data.get("boardMember1") or "").strip() or None,
            board_member2=(data.get("boardMember2") or "").strip() or None,
            default_race_secretary=(data.get("defaultRaceSecretary") or "").strip() or None,
            notes=(data.get("notes") or "").strip() or None,
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Person instance from a database row."""
        if not row:
            return None
        return cls(
            club_abbreviation=row.get("ClubAbbreviation"),
            club_name=row.get("ClubName"),
            club_status=row.get("ClubStatus"),
            begin_date=row.get("BeginDate"),
            end_date=row.get("EndDate"),
            board_member1=row.get("BoardMember1"),
            board_member2=row.get("BoardMember2"),
            default_race_secretary=row.get("DefaultRaceSecretary"),
            notes=row.get("Notes"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a club by club_abbreviation."""
        row = fetch_one(
            """
            SELECT ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
                   BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
                   LastEditedBy, LastEditedAt
            FROM Club
            WHERE ClubAbbreviation = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, club_abbreviation):
        """Check if a club with given abbreviation already exists."""
        existing = fetch_one(
            """
            SELECT ClubAbbreviation
            FROM Club
            WHERE ClubAbbreviation = %s
            LIMIT 1
            """,
            (club_abbreviation,),
        )
        return existing is not None
    
    @classmethod
    def list_board_roster(cls):
        """
        Flatten board members from Club.BoardMember1 and Club.BoardMember2 into a list.
        """
        return fetch_all(
        """
        SELECT
          c.ClubName              AS club,
          p.StateProvince         AS location,
          p.Country               AS country,
          CONCAT(p.FirstName, ' ', p.LastName) AS name,
          p.EmailAddress          AS email,
          'BoardMember1'          AS slot
        FROM Club c
        JOIN Person p ON p.PersonID = c.BoardMember1
        WHERE c.BoardMember1 IS NOT NULL

        UNION ALL

        SELECT
          c.ClubName              AS club,
          p.StateProvince         AS location,
          p.Country               AS country,
          CONCAT(p.FirstName, ' ', p.LastName) AS name,
          p.EmailAddress          AS email,
          'BoardMember2'          AS slot
        FROM Club c
        JOIN Person p ON p.PersonID = c.BoardMember2
        WHERE c.BoardMember2 IS NOT NULL

        ORDER BY club, slot
        """
        )

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.club_abbreviation:
            errors.append("Club abbreviation is required")
        if not self.club_name:
            errors.append("Club name is required")
        if not self.club_status:
            errors.append("Club status is required")
        if len(self.club_abbreviation) > 20:
            errors.append("Club abbreviation must be 20 characters or less")
        if len(self.club_name) > 50:
            errors.append("Club name must be 50 characters or less")
        return errors

    def save(self):
        """Save club to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO Club (
                    ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
                    BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.club_abbreviation,
                    self.club_name,
                    self.club_status,
                    self.begin_date,
                    self.end_date,
                    self.board_member1,
                    self.board_member2,
                    self.default_race_secretary,
                    self.notes,
                    self.last_edited_by,
                    self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update club in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE Club
                SET ClubName = %s,
                    ClubStatus = %s,
                    BeginDate = %s,
                    EndDate = %s,
                    BoardMember1 = %s,
                    BoardMember2 = %s,
                    DefaultRaceSecretary = %s,
                    Notes = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE ClubAbbreviation = %s
                """,
                (
                    self.club_name,
                    self.club_status,
                    self.begin_date,
                    self.end_date,
                    self.board_member1,
                    self.board_member2,
                    self.default_race_secretary,
                    self.notes,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.club_abbreviation
                ),
            )
            return True
        except Error as e:
            raise e

    def delete(self, club_abbreviation):
        """Delete club from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM Club
                WHERE ClubAbbreviation = %s
                """,
                (club_abbreviation,),
            )
            return True
        except Error as e:
            raise e

    @staticmethod
    def list_all_clubs():
        """List all clubs from database. Returns list of Club instances."""
        try:
            rows = fetch_all(
                """
                SELECT ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
                       BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
                       LastEditedBy, LastEditedAt
                FROM Club
                """
            )
            clubs = [Club.from_db_row(row) for row in rows]
            return clubs
        except Error as e:
            raise e
        
    @classmethod    
    def list_clubs_for_member(cls, person_id):
        """
        list clubs where person is BoardMember1 OR BoardMember2
        """
        rows = fetch_all(
            """
            SELECT ClubAbbreviation, ClubName, ClubStatus, BeginDate, EndDate,
                   BoardMember1, BoardMember2, DefaultRaceSecretary, Notes,
                   LastEditedBy, LastEditedAt
            FROM Club
            WHERE BoardMember1 = %s
                OR BoardMember2 = %s
                OR DefaultRaceSecretary = %s
            ORDER BY ClubAbbreviation ASC
            """,
            (person_id, person_id, person_id),
        )
        return [cls.from_db_row(r) for r in rows]
            
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "ClubAbbreviation": self.club_abbreviation,
            "ClubName": self.club_name,
            "ClubStatus": self.club_status
        }

    def to_dict(self):
        """Convert to dictionary for JSON responses."""
        data = {
            "clubAbbreviation": self.club_abbreviation,
            "clubName": self.club_name,
            "clubStatus": self.club_status,
            "beginDate": self.begin_date,
            "endDate": self.end_date,
            "boardMember1": self.board_member1,
            "boardMember2": self.board_member2,
            "defaultRaceSecretary": self.default_race_secretary,
            "notes": self.notes,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
        
