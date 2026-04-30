'''
Docstring for race_result

TODO:
'''

from database import fetch_all, fetch_one, execute
from mysql.connector import Error
import math
from database import fetch_one, fetch_all
from datetime import datetime, timezone

def _text(value):
    if value is None:
        return ""
    return str(value).strip()

def _get_dog_class():
    """Helper to avoid circular imports."""
    from classes.dog import Dog
    return Dog

class RaceResult:

    def __init__(self, meet_number, cwa_number, program, race_number, entry_type, box,
                 placement, meet_points, aom_earned, dpc_points, incident, last_edited_by, last_edited_at):
        self.meet_number = meet_number
        self.cwa_number = cwa_number
        self.program = program
        self.race_number = race_number
        self.entry_type = entry_type
        self.box = box
        self.placement = placement
        self.meet_points = meet_points
        self.aom_earned = aom_earned
        self.dpc_points = dpc_points
        self.incident = incident
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        """Create a RaceResult instance from request JSON data."""
        return cls(
            meet_number=(data.get("meetNumber") or "").strip(),
            cwa_number=(data.get("cwaNumber") or "").strip(),
            program=(data.get("program") or "").strip(),
            race_number=(data.get("raceNumber") or "").strip(),
            entry_type=(data.get("entryType") or "").strip(),
            box=_text(data.get("box")),
            placement=_text(data.get("placement")),
            aom_earned=(data.get("aomEarned") or "").strip() or "0.00",
            dpc_points=(data.get("dpcPoints") or "").strip() or "0.00",
            meet_points=(data.get("meetPoints") or "").strip() or "0.00",
            incident=(data.get("incident") or "").strip(),
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a RaceResult instance from a database row."""
        if not row:
            return None
        return cls(
            meet_number=row.get("MeetNumber"),
            cwa_number=row.get("CWANumber"),
            program=row.get("Program"),
            race_number=row.get("RaceNumber"),
            entry_type=row.get("EntryType"),
            box=row.get("Box"),
            placement=row.get("Placement"),
            meet_points=row.get("MeetPoints"),
            aom_earned=row.get("AOMEarned"),
            dpc_points=row.get("DPCPoints"),
            incident=row.get("Incident"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, meet_number, cwa_number, program, race_number):
        """Find a race result by meet_number, cwa_number, program, and race number."""
        row = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                   Placement, MeetPoints, AOMEarned, DPCPoints, Incident,
                   LastEditedBy, LastEditedAt
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number, program, race_number),
        )
        return cls.from_db_row(row)

    @classmethod
    def exists(cls, meet_number, cwa_number, program, race_number):
        """Check if a race result with given ID already exists."""
        existing = fetch_one(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
            LIMIT 1
            """,
            (meet_number, cwa_number, program, race_number),
        )
        return existing is not None

    def validate(self):
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.meet_number:
            errors.append("Meet number is required")
        if not self.cwa_number:
            errors.append("CWA number is required")
        if not self.program:
            errors.append("Program is required")
        if not self.race_number:
            errors.append("Race number is required")
        if not self.meet_points:
            errors.append("Meet points is required")
        if len(self.meet_number) > 20:
            errors.append("Meet number must be 20 characters or less")
        if len(self.cwa_number) > 10:
            errors.append("CWA number must be 10 characters or less")
        if len(self.program) > 1:
            errors.append("Program must be 1 characters or less")
        if len(self.race_number) > 10:
            errors.append("Race number must be 10 characters or less")
        return errors

    def save(self):
        """Save race result to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO RaceResults (
                    MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                    Placement, MeetPoints, AOMEarned, DPCPoints, Incident,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    self.meet_number,
                    self.cwa_number,
                    self.program,
                    self.race_number,
                    self.entry_type,
                    self.box,
                    self.placement,
                    self.meet_points,
                    self.aom_earned,
                    self.dpc_points,
                    self.incident,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        """Update race result in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE RaceResults
                SET EntryType = %s,
                    Box = %s,
                    Placement = %s,
                    MeetPoints = %s,
                    AOMEarned = %s,
                    DPCPoints = %s,
                    Incident = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
                """,
                (
                    self.entry_type, self.box, self.placement, self.meet_points, self.aom_earned, self.dpc_points,
                    self.incident, self.last_edited_by, self.last_edited_at,
                    self.meet_number, self.cwa_number, self.program , self.race_number
                ),      
            )
            return True
        except Error as e:
            raise e
    
    def delete(self, meet_number, cwa_number, program, race_number):
        """Delete race result from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM RaceResults
                WHERE MeetNumber = %s AND CWANumber = %s AND Program = %s AND RaceNumber = %s
                """,
                (meet_number, cwa_number, program, race_number),
            )
            return True
        except Error as e:
            raise e

    def list_all_race_results():
        """Retrieve all race results from the database."""
        rows = fetch_all(
            """
            SELECT MeetNumber, CWANumber, Program, RaceNumber, EntryType, Box,
                   Placement, MeetPoints, AOMEarned, DPCPoints, Incident,
                   LastEditedBy, LastEditedAt
            FROM RaceResults
            """
        )
        return [RaceResult.from_db_row(row) for row in rows]
    
    @classmethod
    def list_results_for_owner(cls, person_id):
        """Get all race results for dogs owned by a specific person."""
        query = """
            SELECT rr.* 
            FROM RaceResults rr
            JOIN DogOwner do ON rr.CWANumber = do.CWAID
            WHERE do.PersonID = %s
        """
        rows = fetch_all(query, (person_id,))
        return [cls.from_db_row(row) for row in rows]
    
    @classmethod
    def list_race_results_for_dog(cls, cwa_number):
        query = """
            SELECT *
            FROM RaceResults
            WHERE CWANumber = %s
        """
        rows = fetch_all(query, (cwa_number,))
        return [cls.from_db_row(row) for row in rows]


    @classmethod
    def delete_all_for_dog(cls, cwa_number):
        query = """
            DELETE FROM RaceResults
            WHERE CWANumber = %s
        """
        execute(query, (cwa_number,))

    def count_num_adult_whippets(self, cwa_numbers):
        """Calculate the number of adult whippets in the race based on CWA numbers."""
        Dog = _get_dog_class()
        count_adults = 0
        for cwa in cwa_numbers:
            dog = Dog.find_by_identifier(cwa)
            if dog and dog.is_adult():
                count_adults += 1
    
        return count_adults
    
    def get_dpc_point_distribution(self, count_adults):
        """Determine point distribution based on number of adult whippets."""
        if count_adults >= 70:
            return [8, 6, 4, 2]
        elif count_adults >= 60:
            return [7, 5, 3, 1]
        elif count_adults >= 50:
            return [6, 4, 2, 1]
        elif count_adults >= 40:
            return [6, 4, 2]
        elif count_adults >= 30:
            return [5, 3, 1]
        elif count_adults >= 20:
            return [4, 2]
        elif count_adults >= 10:
            return [3, 1]
        return []

    def get_placement_points(self, placement):
        '''Add points for a single placement'''
        if self.incident:
            return 0

        if placement == "1":
            return 5
        elif placement == "2":
            return 3
        elif placement == "3":
            return 2
        elif placement == "4":
            return 1
        elif placement == "AOM":
            return 0.5
        return 0

    def completed_all_4_programs_for_arx(self):
        """Dog must complete all 4 programs with no incident in this meet."""
        rows = fetch_all("""
            SELECT Program, Incident
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s
        """, (self.meet_number, self.cwa_number)) or []

        programs = set()
        for row in rows:
            program = str(row.get("Program") or "").strip()
            incident = str(row.get("Incident") or "").strip()
            if incident:
                return False
            if program:
                programs.add(program)
        return len(programs) == 4

    def _get_arx_narx_eligibility(self, meet_placement):
        Dog = _get_dog_class()
        """Shared eligibility check for ARX/NARX. Returns (eligible, meet_placement) tuple."""
        dog = Dog.find_by_identifier(self.cwa_number)
        if not dog or not dog.is_adult():
            return False, 0

        if not self.completed_all_4_programs_for_arx():
            return False, 0

        rows = fetch_all("""
            SELECT DISTINCT CWANumber FROM RaceResults WHERE MeetNumber = %s
        """, (self.meet_number,)) or []

        cwa_numbers = [r["CWANumber"] for r in rows if r.get("CWANumber")]
        adult_starts = self.count_num_adult_whippets(cwa_numbers)
        if adult_starts <= 0:
            return False, 0

        cutoff = math.ceil(adult_starts / 2)

        try:
            meet_placement = int(meet_placement or 0)
        except (TypeError, ValueError):
            return False, 0

        in_top_half = meet_placement > 0 and meet_placement <= cutoff
        return in_top_half, meet_placement

    def calculate_arx_earned(self, meet_placement):
        Dog = _get_dog_class()
        dog = Dog.find_by_identifier(self.cwa_number)
        if not dog or not dog.is_adult():
            return 0

        if "ARX" in dog.check_arx_titles():
            return 0

        eligible, _ = self._get_arx_narx_eligibility(meet_placement)
        return 1 if eligible else 0

    def calculate_narx_earned(self, meet_placement):
        """NARX earned same as ARX but always passes even if dog already has NARX titles."""
        eligible, _ = self._get_arx_narx_eligibility(meet_placement)
        return 1 if eligible else 0

    @classmethod
    def calculate_dpc_leg_for_meet(cls, meet_number):
        Dog = _get_dog_class()
        rows = fetch_all("""
            SELECT *
            FROM MeetResults
            WHERE MeetNumber = %s
        """, (meet_number,)) or []

        from classes.meet_result import MeetResult
        results = [MeetResult.from_db_row(r) for r in rows]

        shown_results = [
            r for r in results
            if str(r.conformation_placement).strip().isdigit()
        ]

        total_shown = len(shown_results)

        winner_cwa = None
        if total_shown >= 2:
            shown_results.sort(key=lambda r: int(r.conformation_placement))

            for r in shown_results:
                dog = Dog.find_by_identifier(r.cwa_number)
                if not dog:
                    continue

                placement = int(r.conformation_placement)
                if placement >= total_shown:
                    continue

                titles = set(dog.check_titles() or [])

                is_champion = bool(
                    getattr(dog, "akc_champion", False) or
                    getattr(dog, "ckc_champion", False) or
                    getattr(dog, "is_akc_champion", False) or
                    getattr(dog, "is_ckc_champion", False)
                )

                if is_champion or "DPC" in titles or "DPCX" in titles:
                    continue

                winner_cwa = r.cwa_number
                break

        for r in results:
            r.dpc_leg = 1 if r.cwa_number == winner_cwa else 0
            r.update()

    def calculate_hc_score(self):
        """
        HC score = sum of numeric race placements for this dog in this meet.
        Dog must be adult, complete all 4 programs, and have no incident.
        Lower HC score is better.
        """
        Dog = _get_dog_class()
        dog = Dog.find_by_identifier(self.cwa_number)
        if not dog or not dog.is_adult():
            return 0

        if not self.completed_all_4_programs_for_arx():
            return 0

        rows = fetch_all("""
            SELECT Placement
            FROM RaceResults
            WHERE MeetNumber = %s AND CWANumber = %s
        """, (self.meet_number, self.cwa_number)) or []

        score = 0
        count = 0

        for row in rows:
            placement = str(row.get("Placement") or "").strip().upper()

            if placement.isdigit():
                score += int(placement)
                count += 1
            else:
                return 0

        return score if count == 4 else 0
    
    def calculate_hc_score(self, meet_placement, show_placement):
        meet_placement = int(meet_placement or 0)
        show_placement = int(show_placement or 0)

        if meet_placement > 0 and show_placement > 0:
            return meet_placement + show_placement

        return 0

    @classmethod
    def calculate_hc_leg_for_meet(cls, meet_number):
        """
        Set HCScore and HCLegEarned in MeetResults for all dogs in a meet.
        Lowest eligible HC score gets the HC leg, tiebreaker is lowest meet_placement.
        """
        Dog = _get_dog_class()
        meet_rows = fetch_all("""
            SELECT *
            FROM MeetResults
            WHERE MeetNumber = %s
        """, (meet_number,)) or []

        if not meet_rows:
            return

        from classes.meet_result import MeetResult
        meet_results = [MeetResult.from_db_row(row) for row in meet_rows]

        for mr in meet_results:
            rr = cls(
                meet_number=mr.meet_number,
                cwa_number=mr.cwa_number,
                program=None, race_number=None, entry_type=None,
                box=None, placement=None, meet_points=None,
                aom_earned=None, dpc_points=None, incident=None,
                last_edited_by=None, last_edited_at=None,
            )
            mr.hc_score = rr.calculate_hc_score(mr.meet_placement, mr.show_placement)
            mr.hc_leg_earned = 0

        eligible = [mr for mr in meet_results if mr.hc_score and mr.hc_score > 0]

        winner_cwa = None
        if eligible:
            best_score = min(mr.hc_score for mr in eligible)
            tied = [mr for mr in eligible if mr.hc_score == best_score]
            if len(tied) == 1:
                winner_cwa = tied[0].cwa_number
            else:
                tied.sort(key=lambda mr: int(mr.meet_placement or 999))
                winner_cwa = tied[0].cwa_number

        for mr in meet_results:
            mr.hc_leg_earned = 1 if mr.cwa_number == winner_cwa else 0
            mr.update()

        if winner_cwa:
            dog = Dog.find_by_identifier(winner_cwa)
            if dog:
                dog.update_from_meet_results()

    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "MeetNumber": self.meet_number,
            "CWA_Number": self.cwa_number,
            "Program": self.program,
            "RaceNumber": self.race_number,
        }

    def to_dict(self):
        """Convert to dictionary for JSON responses."""
        data = {
            "meetNumber": self.meet_number,
            "cwaNumber": self.cwa_number,
            "program": self.program,
            "raceNumber": self.race_number,
            "entryType": self.entry_type,
            "box": self.box,
            "placement": self.placement,
            "meetPoints": self.meet_points,
            "dpcPoints": self.dpc_points,
            "incident": self.incident,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data