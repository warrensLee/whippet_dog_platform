from database import fetch_one, fetch_all, execute
from mysql.connector import Error
from datetime import datetime
from utils.validators import (s, require, int_field, float_field, fk_exists, enum_field, str_field)

class Dog:

    # Age thresholds in months 
    PUPPY_AGE_MONTHS = 8
    ADULT_AGE_MONTHS = 14
    VETERAN_AGE_MONTHS = 84

    VALID_STATUSES = {"Active", "Inactive"}
    VALID_GRADES = {"FTE", "D", "C", "B", "A"}

    def __init__(self, cwa_number, akc_number, ckc_number, foreign_number, foreign_type, call_name,
                 registered_name, birthdate, pedigree_link, status, average, current_grade, meet_points, arx_points,
                 narx_points, show_points, dpc_legs, meet_wins, meet_appearences, high_combined_wins, notes, last_edited_by=None, last_edited_at=None):
        self.cwa_number = cwa_number
        self.akc_number = akc_number
        self.ckc_number = ckc_number
        self.foreign_number = foreign_number
        self.foreign_type = foreign_type
        self.call_name = call_name
        self.registered_name = registered_name
        self.birthdate = birthdate
        self.pedigree_link = pedigree_link
        self.status = status
        self.average = average
        self.current_grade = current_grade
        self.meet_points = meet_points
        self.arx_points = arx_points
        self.narx_points = narx_points
        self.show_points = show_points
        self.dpc_legs = dpc_legs
        self.meet_wins = meet_wins
        self.meet_appearences = meet_appearences
        self.high_combined_wins = high_combined_wins
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

        self.meet_points = float(self.meet_points) if self.meet_points not in (None, "") else 0.0
        self.arx_points = float(self.arx_points) if self.arx_points not in (None, "") else 0.0
        self.narx_points = float(self.narx_points) if self.narx_points not in (None, "") else 0.0

        self.show_points = int(float(self.show_points)) if self.show_points not in (None, "") else 0
        self.dpc_legs = int(float(self.dpc_legs)) if self.dpc_legs not in (None, "") else 0
        self.meet_wins = float(self.meet_wins) if self.meet_wins not in (None, "") else 0.0
        self.meet_appearences = int(float(self.meet_appearences)) if self.meet_appearences not in (None, "") else 0
        self.high_combined_wins = int(float(self.high_combined_wins)) if self.high_combined_wins not in (None, "") else 0
    
    def check_grade(self):
        '''Check grade of dog based on point average and status.'''
        if self.is_puppy() or self.meet_appearences == 0:
            return "FTE"
        if self.average >= 15.0:
            if self.status == "Inactive":
                return "B"
            return "A"
        if self.average >= 10.0:
            if self.status == "Inactive":
                return "C"
            return "B"
        if self.average >= 5.0:
            if self.status == "Inactive":
                return "D"
            return "C"
        return "D"
    
    def check_titles(self):
        '''Check eligibility for all titles and return a list of earned titles.'''
        titles = []
        arx_title = self.check_arx_title()
        if arx_title:
            titles.append(arx_title)
        trp_title = self.check_trp_title()
        if trp_title:
            titles.append(trp_title)
        pr_title = self.check_pr_title()
        if pr_title:
            titles.append(pr_title)
        narx_title = self.check_narx_title()
        if narx_title:
            titles.append(narx_title)
        dpc_title = self.check_dpc_title()
        if dpc_title:
            titles.append(dpc_title)
        hc_title = self.check_hc_title()
        if hc_title:
            titles.append(hc_title)
        return titles

    def check_arx_title(self):
        '''Check if dog is eligible for Title of Racing Excellence (ARX).'''
        if self.arx_points >= 15:
            return "ARX"
        return None
    
    def check_trp_title(self):
        '''Check if dog is eligible for Title of Racing Proficiency (TRP).'''
        if self.meet_appearences >= 10:
            return "TRP"
        return None

    def check_pr_title(self):
        '''Check if dog is eligible for Performance (PR) titles.'''
        if self.meet_points >= 50:
            if self.meet_points < 150:
                return "PR"
            pr_level = int((self.meet_points - 50) / 100) + 1
            return f"PR{pr_level}"
        return None

    def check_narx_title(self):
        '''Check if dog is eligible for National Racing Excellence (NRX)
        and Superior Racing Award (SRA) titles.'''
        if self.narx_points >= 300:
            return "SRA4"
        if self.narx_points >= 225:
            return "SRA3"
        if self.narx_points >= 150:
            return "SRA2"
        if self.narx_points >= 75:
            return "SRA"
        if self.narx_points >= 60:
            return "NARX4"
        if self.narx_points >= 45:
            return "NARX3"
        if self.narx_points >= 30:
            return "NARX2"
        if self.narx_points >= 15:
            return "NARX"
        return None
    
    def check_dpc_title(self):
        '''Check if dog is eligible for Dual Purpose Championship (DPC) titles.'''
        has_akc = bool((self.akc_number or "").strip())
        has_ckc = bool((self.ckc_number or "").strip())
        has_registry = has_akc or has_ckc

        if self.check_trp_title() == "TRP" and (has_registry or self.dpc_legs >= 5):
            if self.check_arx_title() == "ARX":
                return "DPCX"
            return "DPC"
        return None
    
    def check_hc_title(self):
        '''Check if dog is eligible for High Combined (HC) titles.'''
        if self.is_adult():
            if self.high_combined_wins >= 10:
                return "HCX"
            if self.high_combined_wins >= 5:
                return "HC"
        return None
    
    def is_puppy(self):
        '''Check if dog is a puppy (under PUPPY_AGE_MONTHS).'''
        if not self.birthdate:
            return False
        if isinstance(self.birthdate, str):
            self.birthdate = datetime.strptime(self.birthdate, "%Y-%m-%d")

        today = datetime.today()
        age_in_months = ((today.year - self.birthdate.year) * 12) + (today.month - self.birthdate.month)
        
        return age_in_months < self.PUPPY_AGE_MONTHS
    
    def is_adult(self):
        if not self.birthdate:
            return False
        if isinstance(self.birthdate, str):
            self.birthdate = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - self.birthdate.year) * 12) + (today.month - self.birthdate.month)
        
        return age_in_months >= self.ADULT_AGE_MONTHS
    
    def is_veteran(self):
        if not self.birthdate:
            return False
        if isinstance(self.birthdate, str):
            self.birthdate = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - self.birthdate.year) * 12) + (today.month - self.birthdate.month)
        
        return age_in_months >= self.VETERAN_AGE_MONTHS

    @classmethod
    def from_request_data(cls, data):
        """Create a Dog instance from request JSON data."""
        return cls(
            cwa_number=(data.get("cwaNumber") or "").strip(),
            akc_number=(data.get("akcNumber") or "").strip() or None,
            ckc_number=(data.get("ckcNumber") or "").strip() or None,
            foreign_number=(data.get("foreignNumber") or "").strip() or None,
            foreign_type=(data.get("foreignType") or "").strip() or None,
            call_name=(data.get("callName") or "").strip(),
            registered_name=(data.get("registeredName") or "").strip(),
            birthdate=(data.get("birthdate") or "").strip() or None,
            pedigree_link=(data.get("pedigreeLink") or "").strip() or None,
            status=(data.get("status") or "").strip(),
            average=(data.get("average") or "").strip() or None,
            current_grade=(data.get("currentGrade") or "").strip() or None,
            meet_points=(data.get("meetPoints") or "").strip() or "0",
            arx_points=(data.get("arxPoints") or "").strip() or "0",
            narx_points=(data.get("narxPoints") or "").strip() or "0",
            show_points=(data.get("showPoints") or "").strip() or "0",
            dpc_legs=(data.get("dpcLegs") or "").strip() or "0",
            meet_wins=(data.get("meetWins") or "").strip() or "0",
            meet_appearences=(data.get("meetAppearences") or "").strip() or "0",
            high_combined_wins=(data.get("highCombinedWins") or "").strip() or "0",
            notes=(data.get("notes") or "").strip() or None,
            last_edited_by=data.get("lastEditedBy"),
            last_edited_at=data.get("lastEditedAt")
        )
    
    @classmethod
    def from_db_row(cls, row):
        """Create a Dog instance from a database row."""
        if not row:
            return None
        return cls(
            cwa_number=row.get("CWANumber"),
            akc_number=row.get("AKCNumber"),
            ckc_number=row.get("CKCNumber"),
            foreign_number=row.get("ForeignNumber"),
            foreign_type=row.get("ForeignType"),
            call_name=row.get("CallName"),
            registered_name=row.get("RegisteredName"),
            birthdate=row.get("Birthdate"),
            pedigree_link=row.get("PedigreeLink"),
            status=row.get("Status"),
            average=row.get("Average"),
            current_grade=row.get("CurrentGrade"),
            meet_points=row.get("MeetPoints"),
            arx_points=row.get("ARXPoints"),
            narx_points=row.get("NARXPoints"),
            show_points=row.get("ShowPoints"),
            dpc_legs=row.get("DPCLegs"),
            meet_wins=row.get("MeetWins"),
            meet_appearences=row.get("MeetAppearences"),
            high_combined_wins=row.get("HighCombinedWins"),
            notes=row.get("Notes"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt")
        )

    @classmethod
    def find_by_identifier(cls, identifier):
        """Find a dog by cwa_number."""
        row = fetch_one(
            """
            SELECT CWANumber, AKCNumber, CKCNumber, ForeignNumber, ForeignType,
                    CallName, RegisteredName, Birthdate, PedigreeLink,
                    Status, Average, CurrentGrade,
                    MeetPoints, ARXPoints, NARXPoints, ShowPoints,
                    DPCLegs, MeetWins, MeetAppearences, HighCombinedWins, Notes,
                    LastEditedBy, LastEditedAt
            FROM Dog
            WHERE CWANumber = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)
    
    @classmethod
    def search(cls, query, only_owner_person_id):
        q = (query or "").strip()
        like = f"%{q}%"

        sql = """
            SELECT DISTINCT
                d.*
            FROM Dog d
            LEFT JOIN DogOwner do ON do.CWAID = d.CWANumber
            LEFT JOIN Person p ON p.PersonID = do.PersonID
            WHERE (
                d.CWANumber LIKE %s
                OR d.RegisteredName LIKE %s
                OR d.CallName LIKE %s
                OR do.PersonID LIKE %s
                OR CONCAT(p.FirstName, ' ', p.LastName) LIKE %s
                OR p.EmailAddress LIKE %s
            )
        """
        params = [like, like, like, like, like, like]

        if only_owner_person_id:
            sql += " AND do.PersonID = %s"
            params.append(only_owner_person_id)

        sql += " ORDER BY d.RegisteredName ASC, d.CWANumber ASC LIMIT 100"

        rows = fetch_all(sql, params)
        return [cls.from_db_row(r) for r in rows]
    
    @classmethod
    def list_meets_with_results_for_dog(cls, cwa_number: str):
        cwa_number = (cwa_number or "").strip()
        if not cwa_number:
            return []

        meets = fetch_all(
            """
            SELECT DISTINCT
                m.MeetNumber,
                m.MeetDate,
                m.ClubAbbreviation,
                m.Location,
                m.RaceSecretary,
                m.Judge
            FROM Meet m
            LEFT JOIN MeetResults mr
            ON mr.MeetNumber = m.MeetNumber AND mr.CWANumber = %s
            LEFT JOIN RaceResults rr
            ON rr.MeetNumber = m.MeetNumber AND rr.CWANumber = %s
            WHERE mr.CWANumber IS NOT NULL OR rr.CWANumber IS NOT NULL
            ORDER BY m.MeetDate DESC, m.MeetNumber DESC
            """,
            (cwa_number, cwa_number),
        ) or []

        for m in meets:
            meet_no = m["MeetNumber"]

            m["meetResults"] = fetch_all(
                """
                SELECT *
                FROM MeetResults
                WHERE MeetNumber = %s AND CWANumber = %s
                ORDER BY MeetNumber DESC
                """,
                (meet_no, cwa_number),
            ) or []

            m["raceResults"] = fetch_all(
                """
                SELECT *
                FROM RaceResults
                WHERE MeetNumber = %s AND CWANumber = %s
                ORDER BY Program DESC, RaceNumber DESC
                """,
                (meet_no, cwa_number),
            ) or []

        return meets

    
    @classmethod
    def list_meet_results_for_dog(cls, cwa_number):
        return fetch_all(
            """
            SELECT *
            FROM MeetResult
            WHERE CWANumber = %s
            ORDER BY MeetNumber DESC
            """,
            (cwa_number,),
        )

    @classmethod
    def list_race_results_for_dog(cls, cwa_number):
        return fetch_all(
            """
            SELECT *
            FROM RaceResult
            WHERE CWANumber = %s
            ORDER BY MeetNumber DESC, Program DESC, RaceNumber DESC
            """,
            (cwa_number,),
        )
    
    @classmethod
    def get_meet_wins_and_dpc_wins_for_dog(cls, cwa_number):
        meet_win_row = fetch_one(
            """
            SELECT
                COUNT(*) AS meetWinCount,
                MAX(m.MeetDate) AS lastMeetWinDate
            FROM MeetResults mr
            JOIN Meet m ON m.MeetNumber = mr.MeetNumber
            WHERE mr.CWANumber = %s
              AND mr.MeetPlacement = 1
            """,
            (cwa_number,),
        ) or {}

        meet_win_dates = fetch_all(
            """
            SELECT
                mr.MeetNumber,
                m.MeetDate
            FROM MeetResults mr
            JOIN Meet m ON m.MeetNumber = mr.MeetNumber
            WHERE mr.CWANumber = %s
              AND mr.MeetPlacement = 1
            ORDER BY m.MeetDate DESC
            """,
            (cwa_number,),
        )

        dpc_row = fetch_one(
            """
            SELECT
                COUNT(*) AS dpcLegCount,
                MAX(m.MeetDate) AS lastDpcLegDate
            FROM MeetResults mr
            JOIN Meet m ON m.MeetNumber = mr.MeetNumber
            WHERE mr.CWANumber = %s
              AND mr.DPCLeg = 1
            """,
            (cwa_number,),
        ) or {}

        dpc_dates = fetch_all(
            """
            SELECT
                mr.MeetNumber,
                m.MeetDate
            FROM MeetResults mr
            JOIN Meet m ON m.MeetNumber = mr.MeetNumber
            WHERE mr.CWANumber = %s
              AND mr.DPCLeg = 1
            ORDER BY m.MeetDate DESC
            """,
            (cwa_number,),
        )

        return {
            "cwaNumber": cwa_number,
            "meetWinCount": (meet_win_row.get("meetWinCount")),
            "lastMeetWinDate": meet_win_row.get("lastMeetWinDate"),
            "meetWinDates": meet_win_dates,   
            "dpcLegCount": (dpc_row.get("dpcLegCount")),
            "lastDpcLegDate": dpc_row.get("lastDpcLegDate"),
            "dpcLegDates": dpc_dates,         
        }

    @classmethod
    def exists(cls, cwa_number):
        """Check if a dog with given CWA number already exists."""
        existing = fetch_one(
            """
            SELECT CWANumber
            FROM Dog
            WHERE CWANumber = %s
            LIMIT 1
            """,
            (cwa_number,),
        )
        return existing is not None

    def validate(self):
        errors = []
        
        str_field(errors, self.cwa_number, "CWA Number", max_length=10, required=True)
        str_field(errors, self.registered_name, "Registered Name", max_length=100, required=True)
        str_field(errors, self.call_name, "Call Name", max_length=50)
        str_field(errors, self.akc_number, "AKC Number", max_length=10)
        str_field(errors, self.ckc_number, "CKC Number", max_length=10)
        
        enum_field(errors, self.status, "Status", self.VALID_STATUSES, required=True)
        enum_field(errors, self.current_grade, "Current Grade", self.VALID_GRADES, required=True)
        
        if require(errors, self.birthdate, "Birthdate is required"):
            bd = s(self.birthdate)
            try:
                datetime.strptime(bd, "%Y-%m-%d")
            except ValueError:
                errors.append("Birthdate must be in YYYY-MM-DD format")
        
        float_field(errors, self.average, "Average", min_value=0, max_value=9999.99)
        float_field(errors, self.meet_points, "Meet Points", min_value=0, max_value=999.99)
        float_field(errors, self.arx_points, "ARX Points", min_value=0, max_value=999.99)
        float_field(errors, self.narx_points, "NARX Points", min_value=0, max_value=999.99)
        float_field(errors, self.meet_wins, "Meet Wins", min_value=0, max_value=999.99)
        
        int_field(errors, self.show_points, "Show Points", min_value=0, max_value=32767)
        int_field(errors, self.dpc_legs, "DPC Legs", min_value=0, max_value=32767)
        int_field(errors, self.meet_appearences, "Meet Appearances", min_value=0, max_value=32767)
        int_field(errors, self.high_combined_wins, "High Combined Wins", min_value=0, max_value=32767)
        
        fk_exists(errors, self.last_edited_by, "Last edited by", "Person", "PersonID")
        
        return errors

    def save(self):
        """Save dog to database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                INSERT INTO Dog (
                    CWANumber, AKCNumber, CKCNumber, ForeignNumber, ForeignType,
                    CallName, RegisteredName, Birthdate, PedigreeLink,
                    Status, Average, CurrentGrade,
                    MeetPoints, ARXPoints, NARXPoints, ShowPoints,
                    DPCLegs, MeetWins, MeetAppearences, HighCombinedWins, Notes,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s)
                """,
                (
                    self.cwa_number,
                    self.akc_number,
                    self.ckc_number,
                    self.foreign_number,
                    self.foreign_type,
                    self.call_name,
                    self.registered_name,
                    self.birthdate,
                    self.pedigree_link,
                    self.status,
                    self.average,
                    self.current_grade,
                    self.meet_points,
                    self.arx_points,
                    self.narx_points,
                    self.show_points,
                    self.dpc_legs,
                    self.meet_wins,
                    self.meet_appearences,
                    self.high_combined_wins,
                    self.notes or None,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e
        
    def update(self):
        """Update existing dog in database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                UPDATE Dog
                SET AKCNumber = %s,
                    CKCNumber = %s,
                    ForeignNumber = %s,
                    ForeignType = %s,
                    CallName = %s,
                    RegisteredName = %s,
                    Birthdate = %s,
                    PedigreeLink = %s,
                    Status = %s,
                    Average = %s,
                    CurrentGrade = %s,
                    MeetPoints = %s,
                    ARXPoints = %s,
                    NARXPoints = %s,
                    ShowPoints = %s,
                    DPCLegs = %s,
                    MeetWins = %s,
                    MeetAppearences = %s,
                    HighCombinedWins = %s,
                    Notes = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE CWANumber = %s
                """,
                (
                    self.akc_number,
                    self.ckc_number,
                    self.foreign_number,
                    self.foreign_type,
                    self.call_name,
                    self.registered_name,
                    self.birthdate,
                    self.pedigree_link,
                    self.status,
                    self.average,
                    self.current_grade,
                    self.meet_points,
                    self.arx_points,
                    self.narx_points,
                    self.show_points,
                    self.dpc_legs,
                    self.meet_wins,
                    self.meet_appearences,
                    self.high_combined_wins,
                    self.notes or None,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.cwa_number
                ),
            )
            return True
        except Error as e:
            raise e
    
    @staticmethod
    def delete(cwa_number):
        """Delete dog from database. Returns True on success, raises Error on failure."""
        try:
            execute(
                """
                DELETE FROM Dog
                WHERE CWANumber = %s
                """,
                (cwa_number,),
            )
            return True
        except Error as e:
            raise e
    
    @staticmethod
    def list_all_dogs():
        rows = fetch_all(
            """
            SELECT *
            FROM Dog
            ORDER BY CWANumber
            """
        )
        return [Dog.from_db_row(row) for row in rows]
    
    @staticmethod
    def list_dogs_for_owner(person_id):
        """
        Return all dogs owned by the given person_id.
        """
        rows = fetch_all(
            """
            SELECT d.*
            FROM Dog d
            JOIN DogOwner o ON o.CWAID = d.CWANumber
            WHERE o.PersonID = %s
            ORDER BY d.CWANumber
            """,
            (person_id,),
        )

        return [Dog.from_db_row(row) for row in rows]
    
    def compute_titles(self):
        return [t for t in self.check_titles() if t]
    
    def compute_last_three_meet_average(self):
        """Compute average MeetPoints from the last 3 meets the dog was entered in."""
        rows = fetch_all(
            """
            SELECT mr.MeetPoints
            FROM MeetResults mr
            JOIN Meet m ON m.MeetNumber = mr.MeetNumber
            WHERE mr.CWANumber = %s
            ORDER BY m.MeetDate DESC, mr.MeetNumber DESC
            LIMIT 3
            """,
            (self.cwa_number,),
        ) or []

        points = [
            float(r["MeetPoints"])
            for r in rows
            if r and r.get("MeetPoints") is not None
        ]

        if not points:
            return 0.0

        avg = sum(points) / len(points)
        return round(avg, 2)

    
    def update_from_meet_results(self):
        """Recalculate dog stats from all meet results"""
        if not self.cwa_number:
            return
        
        stats = fetch_one("""
            SELECT 
                SUM(MeetPoints) as total_meet_points,
                SUM(ARXEarned) as total_arx,
                SUM(NARXEarned) as total_narx,
                SUM(ShowPoints) as total_show_points,
                SUM(DPCLeg) as total_dpc_legs,
                SUM(CASE WHEN MeetPlacement = 1 THEN 1 ELSE 0 END) as meet_wins,
                COUNT(*) as meet_appearances
            FROM MeetResults
            WHERE CWANumber = %s
        """, (self.cwa_number,))
        
        if stats:
            self.average = self.compute_last_three_meet_average()
            self.meet_points = float(stats['total_meet_points'] or 0)
            self.arx_points = float(stats['total_arx'] or 0)
            self.narx_points = float(stats['total_narx'] or 0)
            self.show_points = int(stats['total_show_points'] or 0)
            self.dpc_legs = int(stats['total_dpc_legs'] or 0)
            self.meet_wins = float(stats['meet_wins'] or 0)
            self.meet_appearences = int(stats['meet_appearances'] or 0)
            
            show_wins = fetch_one("""
                SELECT COUNT(*) as show_wins
                FROM MeetResults
                WHERE CWANumber = %s AND ShowPlacement = 1
            """, (self.cwa_number,))
            
            if show_wins:
                self.high_combined_wins = int(self.meet_wins) + int(show_wins['show_wins'] or 0)
            
            self.current_grade = self.check_grade()
        
        self.update()


    
    def to_session_dict(self):
        """Convert to minimal dictionary for session storage."""
        return {
            "CWANumber": self.cwa_number,
            "RegisteredName": self.registered_name,
            "Status": self.status,
            "CurrentGrade": self.current_grade
        }

    def to_dict(self, include_sensitive=False):
        """Convert to dictionary for JSON responses."""
        data = {
            "cwaNumber": self.cwa_number,
            "akcNumber": self.akc_number,
            "ckcNumber": self.ckc_number,
            "foreignNumber": self.foreign_number,
            "foreignType": self.foreign_type,
            "callName": self.call_name,
            "registeredName": self.registered_name,
            "birthdate": self.birthdate,
            "pedigreeLink": self.pedigree_link,
            "status": self.status,
            "average": self.average,
            "currentGrade": self.current_grade,
            "meetPoints": self.meet_points,
            "arxPoints": self.arx_points,
            "narxPoints": self.narx_points,
            "showPoints": self.show_points,
            "dpcLegs": self.dpc_legs,
            "meetWins": self.meet_wins,
            "meetAppearences": self.meet_appearences,
            "highCombinedWins": self.high_combined_wins,
            "notes": self.notes,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
