'''
Docstring for meet

TODO:
'''

from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class Meet:

    def __init__(self, meet_number, club_abbreviation, meet_date, race_secretary, judge,
                 location, yards, public_notes, private_notes, last_edited_by, last_edited_at):
        self.meet_number = meet_number
        self.club_abbreviation = club_abbreviation
        self.meet_date = meet_date
        self.race_secretary = race_secretary
        self.judge = judge
        self.location = location
        self.yards = yards
        self.public_notes = public_notes
        self.private_notes = private_notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a Meet instance from request JSON data."""
        return cls(
            meet_number=(data.get("meetNumber") or "").strip(),
            club_abbreviation=(data.get("clubAbbreviation") or "").strip(),
            meet_date=data.get("meetDate"),
            race_secretary=(data.get("raceSecretary") or "").strip(),
            judge=(data.get("judge") or "").strip(),
            location=(data.get("location") or "").strip(),
            yards=(data.get("yards") or "").strip(),
            public_notes=(data.get("publicNotes") or "").strip() or None,
            private_notes=(data.get("privateNotes") or "").strip() or None,
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Meet instance from a database row."""
        if not row:
            return None
        return cls(
            meet_number=row.get("MeetNumber"),
            club_abbreviation=row.get("ClubAbbreviation"),
            meet_date=row.get("MeetDate"),
            race_secretary=row.get("RaceSecretary"),
            judge=row.get("Judge"),
            location=row.get("Location"),
            yards=row.get("Yards"),
            public_notes=row.get("PublicNotes"),
            private_notes=row.get("PrivateNotes"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a meet by meet_number."""
        row = fetch_one(
            """
            SELECT MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                   Location, Yards, PublicNotes, PrivateNotes, LastEditedBy, LastEditedAt
            FROM Meet
            WHERE MeetNumber = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, meet_number):
        """Check if a meet with given meet number already exists."""
        existing = fetch_one(
            """
            SELECT MeetNumber
            FROM Meet
            WHERE MeetNumber = %s
            LIMIT 1
            """,
            (meet_number,),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.meet_number:
            errors.append("Meet number is required")
        if not self.club_abbreviation:
            errors.append("Club abbreviation is required")
        if not self.meet_date:
            errors.append("Meet date is required")
        if not self.location:
            errors.append("Location is required")
        if not self.yards:
            errors.append("Yards are required")
        if len(self.meet_number) > 20:
            errors.append("Meet number must be 20 characters or less")
        if len(self.club_abbreviation) > 10:
            errors.append("Club abbreviation must be 10 characters or less")
        if len(self.location) > 20:
            errors.append("Location must be 20 characters or less")
        if self.judge and not fetch_one("SELECT PersonID FROM Person WHERE ID = %s", (self.judge,)):
            errors.append(f"Judge '{self.judge}' does not exist")
        if self.race_secretary and not fetch_one("SELECT PersonID FROM Person WHERE ID = %s", (self.race_secretary,)):
            errors.append(f"Race secretary '{self.race_secretary}' does not exist")
        if self.last_edited_by and not fetch_one("SELECT PersonID FROM Person WHERE ID = %s", (self.last_edited_by,)):
            errors.append("LastEditedBy must reference an existing Person")
        return errors

    def save(self):
        """Save meet to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO Meet (
                    MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                    Location, Yards, PublicNotes, PrivateNotes, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.club_abbreviation,
                    self.meet_date,
                    self.race_secretary,
                    self.judge,
                    self.location,
                    self.yards,
                    self.public_notes or None,
                    self.private_notes or None,
                    self.last_edited_by,
                    self.last_edited_at
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update meet in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE Meet
                SET ClubAbbreviation = %s,
                    MeetDate = %s,
                    RaceSecretary = %s,
                    Judge = %s,
                    Location = %s,
                    Yards = %s,
                    PublicNotes = %s,
                    PrivateNotes = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s
                """,
                (
                    self.club_abbreviation,
                    self.meet_date,
                    self.race_secretary,
                    self.judge,
                    self.location,
                    self.yards,
                    self.public_notes or None,
                    self.private_notes or None,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.meet_number
                ),
            )
            return True
        except Error as e:
            raise e
    
    def delete(self):
        """Delete meet from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM Meet
                WHERE MeetNumber = %s
                """,
                (self.meet_number,),
            )
            return True
        except Error as e:
            raise e

    def list_all_meets():
        """Retrieve all meets from the database."""
        rows = fetch_all(
            """
            SELECT MeetNumber, ClubAbbreviation, MeetDate, RaceSecretary, Judge,
                   Location, Yards, PublicNotes, PrivateNotes, LastEditedBy, LastEditedAt
            FROM Meet
            """
        )
        return [Meet.from_db_row(row) for row in rows]
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "meetNumber": self.meet_number,
            "clubAbbreviation": self.club_abbreviation,
            "meetDate": self.meet_date,
            "location": self.location,
        }

    def to_dict(self, include_private=True):
        """Convert to dictionary for JSON responses."""
        judge_name = self._get_full_name(self.judge) if self.judge else None
        race_secretary_name = self._get_full_name(self.race_secretary) if self.race_secretary else None
        
        data = {
            "meetNumber": self.meet_number,
            "clubAbbreviation": self.club_abbreviation,
            "meetDate": self.meet_date,
            "raceSecretary": self.race_secretary,
            "raceSecretaryName": race_secretary_name,
            "judge": self.judge,
            "judgeName": judge_name,
            "location": self.location,
            "yards": self.yards,
            "publicNotes": self.public_notes,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }

        if include_private:
            data["privateNotes"] = self.private_notes

        return data

    def _get_full_name(self, person_id):
        """Get full name for a person ID."""
        if not person_id:
            return None
        row = fetch_one(
            "SELECT FirstName, LastName FROM Person WHERE ID = %s",
            (person_id,)
        )
        if row:
            return f"{row.get('FirstName')} {row.get('LastName')}".strip()
        return None
        
    @staticmethod
    def count():
        stats = fetch_one("""
            SELECT 
                COUNT(*)
            FROM Meet 
        """)
        return stats["COUNT(*)"]

    @staticmethod
    def search(query):
        q = (query or "").strip()
        like = f"%{q}%"

        sql = """
            SELECT 
                m.MeetNumber, m.ClubAbbreviation, m.MeetDate, m.RaceSecretary,
                CONCAT(pf.FirstName, ' ', pf.LastName) AS RaceSecretaryName,
                m.Judge, CONCAT(jj.FirstName, ' ', jj.LastName) AS JudgeName,
                m.Location, m.Yards, m.PublicNotes, m.PrivateNotes, m.LastEditedBy, m.LastEditedAt
            FROM Meet m
            LEFT JOIN Person pf ON m.RaceSecretary = pf.ID
            LEFT JOIN Person jj ON m.Judge = jj.ID
            WHERE 
                m.MeetNumber LIKE %s
                OR m.ClubAbbreviation LIKE %s
                OR m.MeetDate LIKE %s
                OR m.RaceSecretary LIKE %s
                OR m.Judge LIKE %s
                OR m.Location LIKE %s
                OR m.Yards LIKE %s
                OR m.PublicNotes LIKE %s
                OR m.PrivateNotes LIKE %s
        ORDER BY m.MeetDate DESC, m.MeetNumber ASC
        """
        params = [like, like, like, like, like, like, like, like, like]


        rows = fetch_all(sql, params)
        return rows
    
    @classmethod
    def get_dogs_for_meet(cls, meet_number):
        rows = fetch_all("""
            SELECT d.*
            FROM Dog d
            JOIN MeetResults mr ON mr.CWANumber = d.CWANumber
            WHERE mr.MeetNumber = %s
        """, (meet_number,))
        return rows or []