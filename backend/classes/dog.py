'''
Docstring for dog

TODO:
Need a way to dynamically add and remove titles and check them
Finish check_trp_title
    Add meet_appearences attribute?
Finish check_dpc_title
    Add akc_championships attribute?
    Add ckc_championships attribute?
Add physical attributes and check qualifications method?
'''

from werkzeug.security import generate_password_hash, check_password_hash
from database import fetch_all, fetch_one, execute
from mysql.connector import Error

class Dog:

    # Age thresholds in months 
    PUPPY_AGE_MONTHS = 8
    ADULT_AGE_MONTHS = 14
    VETERAN_AGE_MONTHS = 84

    VALID_STATUSES = {"Active", "Inactive"}
    VALID_GRADES = {"FTE", "D", "C", "B", "A"}

    def __init__(self, cwa_number, akc_number, ckc_number, foreign_number, foreign_type, call_name,
                 registered_name, birthdate, pedigree_link, status, average, current_grade, meet_points, arx_points,
                 narx_points, show_points, dpc_legs, meet_wins, notes, last_edited_by=None, last_edited_at=None):
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
        self.notes = notes
        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at
    
    @classmethod
    def check_grade(self):
        '''Check grade of dog based on point average and status.'''
        pass
        # if is_puppy() or number of meets == 0:
            # return "FTE"
        # average = get point average
        # if average >= 15.0:
            # if self.status == "Inactive":
                # return "B"
            # return "A"
        # if average >= 10.0:
            # if self.status == "Inactive":
                # return "C"
            # return "B"
        # if average >= 5.0:
            # if self.status == "Inactive":
                # return "D"
            # return "C"
        # return "D"

    @classmethod
    def get_point_average(selfs):
        '''Calculate point average from last three meets.'''
        pass
        # get last three meet points
        # return average points from last three meets
    
    @classmethod
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

    @classmethod
    def check_arx_title(self):
        '''Check if dog is eligible for Title of Racing Excellence (ARX).'''
        if self.arx_points >= 15:
            return "ARX"
        return None
    
    @classmethod
    def check_trp_title(self):
        '''Check if dog is eligible for Title of Racing Proficiency (TRP).'''
        pass
        # if race meets >= 10:
            # return "TRP"
        # return none

    @classmethod
    def check_pr_title(self):
        '''Check if dog is eligible for Performance (PR) titles.'''
        if self.meet_points >= 450:
            return "PRX"
        if self.meet_points >= 350:
            return "PR4"
        if self.meet_points >= 250:
            return "PR3"
        if self.meet_points >= 150:
            return "PR2"
        if self.meet_points >= 50:
            return "PR"
        return None

    @classmethod
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
    
    @classmethod
    def check_dpc_title(self):
        '''Check if dog is eligible for Dual Purpose Championship (DPC) titles.'''
        pass
        # if self.check_trp_title() == "TRP" and 
        # ((has AKC or CKC championship) or (self.dpc_legs >= 5)):
            # if self.check_arx_title() == "ARX":
                # return "DPCX"
            # return "DPC"
        # return None
    
    @classmethod
    def check_hc_title(self):
        '''Check if dog is eligible for High Combined (HC) titles.'''
        pass
        # if is_adult():
            # if high combined wins >= 10:
                # return "HCX"
            # if high combined wins >= 5:
                # return "HC"
        # return None
    
    @classmethod
    def is_puppy(self):
        '''Check if dog is a puppy (under PUPPY_AGE_MONTHS).'''
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
        return age_in_months < self.PUPPY_AGE_MONTHS
    
    @classmethod
    def is_adult(self):
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
        return age_in_months >= self.ADULT_AGE_MONTHS
    
    @classmethod
    def is_veteran(self):
        from datetime import datetime
        if not self.birthdate:
            return False
        birth_date = datetime.strptime(self.birthdate, "%Y-%m-%d")
        today = datetime.today()
        age_in_months = ((today.year - birth_date.year) * 12) + (today.month - birth_date.month)
        
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
                    DPCLegs, MeetWins, Notes,
                    LastEditedBy, LastEditedAt
            FROM Dog
            WHERE CWANumber = %s
            LIMIT 1
            """,
            (identifier,),
        )
        return cls.from_db_row(row)

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
        """Validate required fields. Returns list of errors (empty if valid)."""
        errors = []
        if not self.cwa_number:
            errors.append("CWA Number is required")
        if not self.registered_name:
            errors.append("Registered Name is required")
        if not self.status:
            errors.append("Status is required")
        if not self.current_grade:
            errors.append("Current Grade is required")
        if self.status not in self.VALID_STATUSES:
            errors.append("Status must be 'Active' or 'Inactive'")
        if self.current_grade not in self.VALID_GRADES:
            errors.append("Current Grade must be one of 'FTE', 'D', 'C', 'B', or 'A'")
        if len(self.cwa_number) > 10:
            errors.append("CWA Number must be 10 characters or less")
        if len(self.registered_name) > 100:
            errors.append("Registered Name must be 100 characters or less")
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
                    DPCLegs, MeetWins, Notes,
                    LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                    self.notes or None
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
                    self.notes or None,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.cwa_number
                ),
            )
            return True
        except Error as e:
            raise e
        
    def delete(self, cwa_number):
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
    
    def list_all_dogs(self):
        """List all dogs from database. Returns list of Dog instances."""
        rows = fetch_all(
            """
            SELECT CWANumber, AKCNumber, CKCNumber, ForeignNumber, ForeignType,
                    CallName, RegisteredName, Birthdate, PedigreeLink,
                    Status, Average, CurrentGrade,
                    MeetPoints, ARXPoints, NARXPoints, ShowPoints,
                    DPCLegs, MeetWins, Notes,
                    LastEditedBy, LastEditedAt
            FROM Dog
            ORDER BY RegisteredName
            """,
        )
        dogs = [Dog.from_db_row(row) for row in rows]
        return dogs

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
            "notes": self.notes,
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None
        }
        return data
