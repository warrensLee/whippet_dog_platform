from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class MeetResult:
    
    def __init__(self, meet_number, cwa_number, average, grade, meet_placement, meet_points, arx_earned,
                 narx_earned, shown, show_placement, show_points, dpc_leg, hc_score, hc_leg_earned, last_edited_by=None, last_edited_at=None):
        self.meet_number = meet_number
        self.cwa_number = cwa_number
        self.average = average
        self.grade = grade
        self.meet_placement = meet_placement
        self.meet_points = meet_points
        self.arx_earned = arx_earned
        self.narx_earned = narx_earned
        self.shown = shown
        self.show_placement = show_placement
        self.show_points = show_points
        self.dpc_leg = dpc_leg
        self.hc_score = hc_score
        self.hc_leg_earned = hc_leg_earned
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
            meet_points=(data.get("meetPoints") or "").strip(),
            arx_earned=(data.get("arxEarned") or "").strip(),
            narx_earned=(data.get("narxEarned") or "").strip(),
            shown=(data.get("shown") or "").strip(),
            show_placement=(data.get("showPlacement") or "").strip(),
            show_points=(data.get("showPoints") or "").strip(),
            dpc_leg=(data.get("dpcLeg") or "").strip(),
            hc_score=(data.get("hcScore") or "").strip(),
            hc_leg_earned=(data.get("hcLegEarned") or "").strip(),
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
            meet_points=row.get("MeetPoints"),
            arx_earned=row.get("ARXEarned"),
            narx_earned=row.get("NARXEarned"),
            shown=row.get("Shown"),
            show_placement=row.get("ShowPlacement"),
            show_points=row.get("ShowPoints"),
            dpc_leg=row.get("DPCLeg"),
            hc_score=row.get("HCScore"),
            hc_leg_earned=row.get("HCLegEarned"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, meet_number, cwa_number):
        """Find a meet result by meet_number and cwanumber."""
        row = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Average, Grade, MeetPlacement, MeetPoints,
                    ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, LastEditedBy, LastEditedAt
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
                "SELECT PersonID FROM Person WHERE PersonID = %s LIMIT 1",
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
                    MeetNumber, CWANumber, Average, Grade, MeetPlacement, MeetPoints,
                    ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.cwa_number,
                    self.average,
                    self.grade,
                    self.meet_placement,
                    self.meet_points,
                    self.arx_earned,
                    self.narx_earned,
                    self.shown,
                    self.show_placement,
                    self.show_points,
                    self.dpc_leg,
                    self.hc_score,
                    self.hc_leg_earned,
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
                    MeetPoints = %s,
                    ARXEarned = %s,
                    NARXEarned = %s,
                    Shown = %s,
                    ShowPlacement = %s,
                    ShowPoints = %s,
                    DPCLeg = %s,
                    HCScore = %s,
                    HCLegEarned = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s AND CWANumber = %s
                """,
                (
                    self.average,
                    self.grade,
                    self.meet_placement,
                    self.meet_points,
                    self.arx_earned,
                    self.narx_earned,
                    self.shown,
                    self.show_placement,
                    self.show_points,
                    self.dpc_leg,
                    self.hc_score,
                    self.hc_leg_earned,
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
            SELECT MeetNumber, CWANumber, Average, Grade, MeetPlacement, MeetPoints,
                    ARXEarned, NARXEarned, Shown, ShowPlacement, ShowPoints, DPCLeg,
                    HCScore, HCLegEarned, LastEditedBy, LastEditedAt
            FROM MeetResults
            """
        )
        return [MeetResult.from_db_row(row) for row in rows]
    
    def update_from_race_results(self):
        """
        Recalculate MeetResults fields from RaceResults for this meet+dog.

        Assumptions (adjust if your business rules differ):
        - meet_points = SUM(RaceResults.MeetPoints)
        - meet_placement = rank within the meet by total points (desc), tiebreaker by avg placement (asc), then CWANumber (asc)
        - average: RaceResults has no speed; keep existing if present else set to 0
        - arx_earned / narx_earned: 1 if meet_points >= 15 else 0 (matches your Dog title thresholds)
        - shown/show fields/hc fields: not derivable from RaceResults => default to 0 unless already set
        """
        if not self.meet_number or not self.cwa_number:
            return

        # 1) Aggregate for this dog+meet
        row = fetch_one(
            """
            SELECT
                COALESCE(SUM(rr.MeetPoints), 0) AS total_points,
                AVG(CASE WHEN rr.Placement > 0 THEN rr.Placement ELSE NULL END) AS avg_placement,
                COUNT(*) AS race_count
            FROM RaceResults rr
            WHERE rr.MeetNumber = %s AND rr.CWANumber = %s
            """,
            (self.meet_number, self.cwa_number),
        ) or {}

        total_points = float(row.get("total_points") or 0)
        avg_place = float(row.get("avg_placement") or 9999)  # if no placements, push tiebreaker worse
        race_count = int(row.get("race_count") or 0)

        # If there are no race results, you can either:
        # - set meet_points=0 and leave placement alone, or
        # - hard reset most fields.
        # Here we reset points and placement.
        if race_count == 0:
            self.meet_points = 0
            self.meet_placement = 0
            self.arx_earned = 0
            self.narx_earned = 0
            # don't destroy show fields; keep them if you ever set them elsewhere
            self.update()
            return

        # 2) Compute rank (meet placement) for this meet based on all dogs' totals
        #    Primary: total_points DESC
        #    Tie1: avg_placement ASC
        #    Tie2: CWANumber ASC
        ranked = fetch_all(
            """
            SELECT
                rr.CWANumber,
                COALESCE(SUM(rr.MeetPoints), 0) AS total_points,
                AVG(CASE WHEN rr.Placement > 0 THEN rr.Placement ELSE NULL END) AS avg_placement
            FROM RaceResults rr
            WHERE rr.MeetNumber = %s
            GROUP BY rr.CWANumber
            ORDER BY
                total_points DESC,
                (CASE WHEN avg_placement IS NULL THEN 9999 ELSE avg_placement END) ASC,
                rr.CWANumber ASC
            """,
            (self.meet_number,),
        ) or []

        placement = 0
        for i, r in enumerate(ranked, start=1):
            if (r.get("CWANumber") or "").strip() == self.cwa_number:
                placement = i
                break

        # 3) Write computed fields
        self.meet_points = total_points
        self.meet_placement = placement

        # average: keep existing if numeric-ish, else set to 0 (RaceResults doesn't provide speed)
        try:
            _ = float(self.average) if self.average not in (None, "") else 0.0
        except Exception:
            self.average = 0.0

        # earned flags (adjust to your rules if different)
        self.arx_earned = 1 if total_points >= 15 else 0
        self.narx_earned = 1 if total_points >= 15 else 0

        # defaults if blank (avoid DB nulls if your schema expects 0/1)
        if str(self.shown or "").strip() == "":
            self.shown = 0
        if str(self.show_placement or "").strip() == "":
            self.show_placement = 0
        if str(self.show_points or "").strip() == "":
            self.show_points = 0
        if str(self.dpc_leg or "").strip() == "":
            self.dpc_leg = 0
        if str(self.hc_score or "").strip() == "":
            self.hc_score = 0
        if str(self.hc_leg_earned or "").strip() == "":
            self.hc_leg_earned = 0

        self.update()

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
            "meetPoints": self.meet_points,
            "arxEarned": self.arx_earned,
            "narxEarned": self.narx_earned,
            "shown": self.shown,
            "showPlacement": self.show_placement,
            "showPoints": self.show_points,
            "dpcLeg": self.dpc_leg,
            "hcScore": self.hc_score,
            "hcLegEarned": self.hc_leg_earned,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
