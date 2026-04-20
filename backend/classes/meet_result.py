from database import fetch_all, fetch_one, execute
from mysql.connector import Error
from classes.dog import Dog
from classes.race_result import RaceResult
from datetime import datetime, timezone


class MeetResult:
    
    def __init__(self, meet_number, cwa_number, average, grade, meet_placement, conformation_placement,
                 match_points, meet_points, arx_earned, narx_earned, shown, show_placement, show_points,
                 dpc_leg, hc_score, hc_leg_earned, aom_earned, dpc_points, last_edited_by=None, last_edited_at=None):
        self.meet_number = meet_number
        self.cwa_number = cwa_number
        self.average = average
        self.grade = grade
        self.meet_placement = meet_placement
        self.conformation_placement = conformation_placement
        self.match_points = match_points
        self.meet_points = meet_points
        self.arx_earned = arx_earned
        self.narx_earned = narx_earned
        self.shown = shown
        self.show_placement = show_placement
        self.show_points = show_points
        self.dpc_leg = dpc_leg
        self.hc_score = hc_score
        self.hc_leg_earned = hc_leg_earned
        self.aom_earned = aom_earned
        self.dpc_points = dpc_points
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a MeetResult instance from request JSON data."""
        return cls(
            meet_number=(data.get("meetNumber") or "").strip(),
            cwa_number=(data.get("cwaNumber") or "").strip(),
            average=(data.get("average") or "").strip(),
            grade=(data.get("grade") or "").strip(),
            meet_placement=(data.get("meetPlacement") or "").strip(),
            conformation_placement=(data.get("conformationPlacement") or "").strip(),
            match_points=(data.get("matchPoints") or "").strip(),
            meet_points=(data.get("meetPoints") or "").strip(),
            arx_earned=(data.get("arxEarned") or "").strip(),
            narx_earned=(data.get("narxEarned") or "").strip(),
            shown=(data.get("shown") or "").strip(),
            show_placement=(data.get("showPlacement") or "0").strip(),
            show_points=(data.get("showPoints") or "").strip(),
            dpc_leg=(data.get("dpcLeg") or "").strip(),
            hc_score=(data.get("hcScore") or "").strip(),
            hc_leg_earned=(data.get("hcLegEarned") or "").strip(),
            aom_earned=(data.get("aomEarned") or "").strip(),
            dpc_points=(data.get("dpcPoints") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a MeetResult instance from a database row."""
        if not row:
            return None
        return cls(
            meet_number=row.get("MeetNumber"),
            cwa_number=row.get("CWANumber"),
            average=row.get("Average"),
            grade=row.get("Grade"),
            meet_placement=row.get("MeetPlacement"),
            conformation_placement=row.get("ConformationPlacement"),
            match_points=row.get("MatchPoints"),
            meet_points=row.get("MeetPoints"),
            arx_earned=row.get("ARXEarned"),
            narx_earned=row.get("NARXEarned"),
            shown=row.get("Shown"),
            show_placement=row.get("ShowPlacement"),
            show_points=row.get("ShowPoints"),
            dpc_leg=row.get("DPCLeg"),
            hc_score=row.get("HCScore"),
            hc_leg_earned=row.get("HCLegEarned"),
            aom_earned=row.get("AOMEarned"),
            dpc_points=row.get("DPCPoints"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, meet_number, cwa_number):
        """Find a meet result by meet_number and cwanumber."""
        row = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Average, Grade, MeetPlacement, ConformationPlacement,
                    MatchPoints, MeetPoints, ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, AOMEarned, DPCPoints, LastEditedBy, LastEditedAt
            FROM MeetResults
            WHERE MeetNumber = %s AND CWANumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number,),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, meet_number, cwa_number):
        """Check if a meet result with given meet number and CWA number already exists."""
        existing = fetch_one(
            """
            SELECT MeetNumber, CWANumber
            FROM MeetResults
            WHERE MeetNumber = %s AND CWANumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.meet_number:
            errors.append("Meet number is required")
        if not self.cwa_number:
            errors.append("CWA number is required")
        if not self.average:
            errors.append("Average is required")
        if not self.grade:
            errors.append("Grade is required")
        if not self.meet_placement:
            errors.append("Meet placement is required")
        if not self.conformation_placement:
            errors.append("Conformation placement is required")
        if not self.match_points:
            errors.append("Match points is required")
        if not self.meet_points:
            errors.append("Meet points is required")
        if not self.arx_earned:
            errors.append("ARX earned is required")
        if not self.narx_earned:
            errors.append("NARX earned is required")
        if len(self.meet_number) > 20:
            errors.append("Meet number must be 20 characters or less")
        if len(self.cwa_number) > 10:
            errors.append("CWA number must be 10 characters or less")

        if self.meet_number:
            meet_exists = fetch_one(
                "SELECT MeetNumber FROM Meet WHERE MeetNumber = %s LIMIT 1",
                (self.meet_number,)
            )
            if not meet_exists:
                errors.append(f"Meet number '{self.meet_number}' does not exist")
    
        if self.cwa_number:
            dog_exists = fetch_one(
                "SELECT CWANumber FROM Dog WHERE CWANumber = %s LIMIT 1",
                (self.cwa_number,)
            )
            if not dog_exists:
                errors.append(f"CWA number '{self.cwa_number}' does not exist")
        
        if self.last_edited_by:
            person_exists = fetch_one(
                "SELECT PersonID FROM Person WHERE ID = %s LIMIT 1",
                (self.last_edited_by,)
            )
            if not person_exists:
                errors.append("LastEditedBy must reference an existing Person")
        return errors

    def save(self):
        """Save meet result to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO MeetResults (
                    MeetNumber, CWANumber, Average, Grade, MeetPlacement, ConformationPlacement,
                    MatchPoints, MeetPoints, ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, AOMEarned, DPCPoints, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.cwa_number,
                    self.average,
                    self.grade,
                    self.meet_placement,
                    self.conformation_placement,
                    self.match_points,
                    self.meet_points,
                    self.arx_earned,
                    self.narx_earned,
                    self.shown,
                    self.show_placement,
                    self.show_points,
                    self.dpc_leg,
                    self.hc_score,
                    self.hc_leg_earned,
                    self.aom_earned,
                    self.dpc_points,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update meet result in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE MeetResults
                SET Average = %s,
                    Grade = %s,
                    MeetPlacement = %s,
                    ConformationPlacement = %s,
                    MatchPoints = %s,
                    MeetPoints = %s,
                    ARXEarned = %s,
                    NARXEarned = %s,
                    Shown = %s,
                    ShowPlacement = %s,
                    ShowPoints = %s,
                    DPCLeg = %s,
                    HCScore = %s,
                    HCLegEarned = %s,
                    AOMEarned = %s,
                    DPCPoints = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s AND CWANumber = %s
                """,
                (
                    self.average,
                    self.grade,
                    self.meet_placement,
                    self.conformation_placement,
                    self.match_points,
                    self.meet_points,
                    self.arx_earned,
                    self.narx_earned,
                    self.shown,
                    self.show_placement,
                    self.show_points,
                    self.dpc_leg,
                    self.hc_score,
                    self.hc_leg_earned,
                    self.aom_earned,
                    self.dpc_points,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.meet_number,
                    self.cwa_number
                ),
            )
            return True
        except Error as e:
            raise e
    
    def delete(self, meet_number, cwa_number):
        """Delete meet result from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM MeetResults
                WHERE MeetNumber = %s AND CWANumber = %s
                """,
                (meet_number, cwa_number),
            )
            return True
        except Error as e:
            raise e

    def list_all_meet_results():
        """Retrieve all meet results from the database."""
        rows = fetch_all(
            """
            SELECT MeetNumber, CWANumber, Average, Grade, MeetPlacement, ConformationPlacement,
                    MatchPoints, MeetPoints, ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, AOMEarned, DPCPoints, LastEditedBy, LastEditedAt
            FROM MeetResults
            """
        )
        return [MeetResult.from_db_row(row) for row in rows]
    
    def update_from_race_results(self):
        """Recalculate meet result totals from RaceResults for this meet+dog."""
        if not self.meet_number or not self.cwa_number: 
            return

        race_rows = fetch_all("""
            SELECT Placement, MeetPoints, AOMEarned, DPCPoints
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s
        """, (self.meet_number, self.cwa_number)) or []

        placements = [str(r.get("Placement") or "").strip().upper() for r in race_rows]

        rr = RaceResult(
            meet_number=self.meet_number,
            cwa_number=self.cwa_number,
            program=None, race_number=None, entry_type=None,
            box=None, placement=None, meet_points=None,
            aom_earned=None, dpc_points=None, incident=None,
            last_edited_by=None, last_edited_at=None,
        )

        self.meet_points = sum(rr.get_placement_points(p) for p in placements)
        self.aom_earned = sum(float(r.get("AOMEarned") or 0) for r in race_rows)
        # self.dpc_points = sum(float(r.get("DPCPoints") or 0) for r in race_rows) use dpc distribution

        placement_row = fetch_one("""
            SELECT placement
            FROM (
                SELECT
                    CWANumber,
                    RANK() OVER (ORDER BY SUM(MeetPoints) DESC) AS placement
                FROM RaceResults
                WHERE MeetNumber = %s
                GROUP BY CWANumber
            ) ranked
            WHERE CWANumber = %s
        """, (self.meet_number, self.cwa_number)) or {}

        self.meet_placement = int(placement_row.get("placement") or 0)

        cwa_rows = fetch_all("""
            SELECT DISTINCT CWANumber
            FROM RaceResults
            WHERE MeetNumber = %s
        """, (self.meet_number,)) or []

        cwa_numbers = [r.get("CWANumber") for r in cwa_rows if r.get("CWANumber")]
        adult_count = rr.count_num_adult_whippets(cwa_numbers)
        dpc_distribution = rr.get_dpc_point_distribution(adult_count)

        dog = Dog.find_by_identifier(self.cwa_number)
        if dog and dog.is_adult() and self.meet_placement > 0:
            idx = self.meet_placement - 1
            self.dpc_points = dpc_distribution[idx] if 0 <= idx < len(dpc_distribution) else 0
        else:
            self.dpc_points = 0

        rr.meet_number = self.meet_number
        rr.cwa_number = self.cwa_number
        self.arx_earned = rr.calculate_arx_earned(self.meet_placement)
        self.narx_earned = rr.calculate_narx_earned(self.meet_placement)
        self.hc_score = rr.calculate_hc_score(self.meet_placement, self.conformation_placement)
        
        self.last_edited_at = datetime.now(timezone.utc)
        self.update()

        RaceResult.calculate_dpc_leg_for_meet(self.meet_number)
        RaceResult.calculate_hc_leg_for_meet(self.meet_number)

    @classmethod
    def list_meets_with_results_for_dog(cls, cwa_number):
        query = """
            SELECT *
            FROM MeetResults
            WHERE CWANumber = %s
        """
        rows = fetch_all(query, (cwa_number,))
        return [cls.from_db_row(row) for row in rows]

    @classmethod
    def delete_all_for_dog(cls, cwa_number):
        query = """
            DELETE FROM MeetResults
            WHERE CWANumber = %s
        """
        execute(query, (cwa_number,))
        
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "MeetNumber": self.meet_number,
            "CWANumber": self.cwa_number,
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "meetNumber": self.meet_number,
            "cwaNumber": self.cwa_number,
            "average": self.average,
            "grade": self.grade,
            "meetPlacement": self.meet_placement,
            "conformationPlacement": self.conformation_placement,
            "matchPoints": self.match_points,
            "meetPoints": self.meet_points,
            "arxEarned": self.arx_earned,
            "narxEarned": self.narx_earned,
            "shown": self.shown,
            "showPlacement": self.show_placement,
            "showPoints": self.show_points,
            "dpcLeg": self.dpc_leg,
            "hcScore": self.hc_score,
            "hcLegEarned": self.hc_leg_earned,
            "aomEarned": self.aom_earned,
            "dpcPoints": self.dpc_points,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data