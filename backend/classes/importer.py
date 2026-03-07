# still need to do a little work on this one 
import csv
import io
from datetime import datetime, timezone

from classes.club import Club
from classes.dog_owner import DogOwner
# from classes.news import News
# from classes.officer_role import OfficerRole
from classes.person import Person
from classes.title_type import TitleType
from classes.user_role import UserRole
from classes.dog import Dog
from classes.meet import Meet
from classes.meet_result import MeetResult
from classes.race_result import RaceResult
from classes.change_log import ChangeLog
from classes.dog_title import DogTitle
from utils.auth_helpers import current_editor_id
from database import fetch_one


class CsvImporter:
    ALIASES = {
        "dogs": {
            "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA No.", "CWA #"),
            "registeredName": ("registeredName", "RegisteredName", "REGISTERED NAME", "Registered Name"),
            "callName": ("callName", "CallName", "CALL NAME", "Call Name", "NAME"),
            "birthdate": ("birthdate", "Birthdate", "BIRTHDATE", "Birth Date"),
            "status": ("status", "Status"),
            "currentGrade": ("currentGrade", "CurrentGrade", "CURRENT GRADE", "Grade"),
        },
        "meets": {
            "meetNumber": ("meetNumber", "MeetNumber", "MEET NUMBER", "Meet #"),
            "clubAbbreviation": ("clubAbbreviation", "ClubAbbreviation", "club", "Club", "CLUB"),
            "meetDate": ("meetDate", "MeetDate", "MEET DATE", "Date"),
            "raceSecretary": ("raceSecretary", "RaceSecretary", "RACE SECRETARY"),
            "judge": ("judge", "Judge"),
            "location": ("location", "Location", "LOCATION"),
            "yards": ("yards", "Yards", "YARD", "YARDS"),
        },
        "meet_results": {
            "meetNumber": ("meetNumber", "MeetNumber", "MEET NUMBER", "Meet #"),
            "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA #"),
            "average": ("average", "Average", "AVG"),
            "grade": ("grade", "Grade"),
            "meetPlacement": ("meetPlacement", "MeetPlacement", "MEET PLACEMENT", "Meet Place", "Place"),
            "meetPoints": ("meetPoints", "MeetPoints", "MEET POINTS", "Points"),
            "arxEarned": ("arxEarned", "ARXEarned", "ARX EARNED"),
            "narxEarned": ("narxEarned", "NARXEarned", "NARX EARNED"),
            "shown": ("shown", "Shown"),
            "showPlacement": ("showPlacement", "ShowPlacement", "SHOW PLACEMENT"),
            "showPoints": ("showPoints", "ShowPoints", "SHOW POINTS"),
            "dpcLeg": ("dpcLeg", "DPCLeg", "DPC LEG"),
            "hcScore": ("hcScore", "HCScore", "HC SCORE"),
            "hcLegEarned": ("hcLegEarned", "HCLegEarned", "HC LEG EARNED"),
        },
        "race_results": {
            "meetNumber": ("meetNumber", "MeetNumber", "MEET NUMBER", "Meet #"),
            "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA #"),
            "program": ("program", "Program", "PROGRAM"),
            "raceNumber": ("raceNumber", "RaceNumber", "RACE", "Race #", "Race No", "Race No."),
            "entryType": ("entryType", "EntryType", "ENTRY TYPE", "Entry"),
            "box": ("box", "Box", "BOX"),
            "placement": ("placement", "Placement", "PLACE", "Place"),
            "meetPoints": ("meetPoints", "MeetPoints", "MEET POINTS", "Points"),
            "incident": ("incident", "Incident", "INCIDENT"),
        },
        "dog_owners": {
            "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA No.", "CWA #"),
            "personID": ("personID", "PersonID", "PERSON ID", "Person", "PERSON", "person"),
        },
        "dog_titles": {
            "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA No.", "CWA #"),
            "title": ("title", "Title", "TITLE"),
            "titleNumber": ("titleNumber", "TitleNumber", "TITLE NUMBER", "Title #"),
            "titleDate": ("titleDate", "TitleDate", "TITLE DATE", "Title Date"),
            "namePrefix": ("namePrefix", "NamePrefix", "NAME PREFIX", "Name Prefix"),
            "nameSuffix": ("nameSuffix", "NameSuffix", "NAME SUFFIX", "Name Suffix"),
        },
        # "news": {
        #     "id": ("id", "ID"),
        #     "title": ("title", "Title"),
        #     "content": ("content", "Content", "CONTENT"),
        #     "createdAt": ("createdAt", "CreatedAt", "CREATED AT", "Created At"),
        #     "updatedAt": ("updatedAt", "UpdatedAt", "UPDATED AT", "Updated At"),
        #     "authorId": ("authorId", "AuthorId", "AUTHOR ID", "Author", "AUTHOR"),
        #     "authorName": ("authorName", "AuthorName", "AUTHOR NAME", "Author Name"),
        # },
        # "officer_roles": {
        #     "roleId": ("Role ID", "ROLE ID", "RoleId", "roleId"),
        #     "roleName": ("Role Name", "ROLE NAME", "RoleName", "roleName"),
        #     "personId": ("Person ID", "PERSON ID", "PersonId", "personId"),
        #     "displayOrder": ("display_order", "Display Order", "DISPLAY ORDER", "DisplayOrder", "displayOrder"),
        #     "active": ("active", "Active", "ACTIVE"),
        # },
        "persons": {
            "personId": ("Person ID", "PERSON ID", "PersonId", "personId"),
            "firstName": ("First Name", "FIRST NAME", "FirstName", "firstName"),
            "lastName": ("Last Name", "LAST NAME", "LastName", "lastName"),
            "email": ("email", "Email", "EMAIL"),
            "address_line_one": ("Address Line One", "ADDRESS LINE ONE", "AddressLineOne", "addressLineOne", "addressLine1", "AddressLine1", "AddressOne", "Address1"),
            "address_line_two": ("Address Line Two", "ADDRESS LINE TWO", "AddressLineTwo", "addressLineTwo", "addressLine2", "AddressLine2", "AddressTwo", "Address2"),
            "city": ("City", "CITY"),
            "stateProvince": ("state", "State", "STATE", "stateProvince", "StateProvince", "state province", "State Province", "STATE PROVINCE"),
            "zipCode": ("Zip Code", "ZIP CODE", "ZipCode", "zipCode"),
            "country": ("Country", "COUNTRY", "country"),
            "primaryPhone": ("Primary Phone", "PRIMARY PHONE", "PrimaryPhone", "primaryPhone", "primary_phone"),
            "secondaryPhone": ("Secondary Phone", "SECONDARY PHONE", "SecondaryPhone", "secondaryPhone", "secondary_phone"),
            "systemRole": ("System Role", "SYSTEM ROLE", "SystemRole", "systemRole"),
            "passwordHash": ("Password Hash", "PASSWORD HASH", "PasswordHash", "passwordHash"),
        },
        "clubs": {
            "clubAbbreviation": ("clubAbbreviation", "ClubAbbreviation", "club abbreviation", "ClubAbbreviation"),
            "clubName": ("clubName", "ClubName", "club name", "ClubName"),
            "beginDate": ("beginDate", "BeginDate", "BEGIN DATE", "Begin Date"),
            "endDate": ("endDate", "EndDate", "END DATE", "End Date"),
            "boardMember1": ("boardMember1", "BoardMember1", "BOARD MEMBER 1", "Board Member 1"),
            "boardMember2": ("boardMember2", "BoardMember2", "BOARD MEMBER 2", "Board Member 2"),
            "defaultRaceSecretary": ("defaultRaceSecretary", "DefaultRaceSecretary", "DEFAULT RACE SECRETARY", "Default Race Secretary"),
        },
        "change_logs": {
            "id": ("id", "ID"),
            "changedTable": ("changedTable", "ChangedTable", "CHANGED TABLE", "Changed Table"),
            "recordPK": ("recordPK", "RecordPK", "RECORD PK", "Record PK"),
            "operation": ("operation", "Operation", "OPERATION"),
            "changedBy": ("changedBy", "ChangedBy", "CHANGED BY", "Changed By"),
            "changedAt": ("changedAt", "ChangedAt", "CHANGED AT", "Changed At"),
            "source": ("source", "Source", "SOURCE"),
            "beforeData": ("beforeData", "BeforeData", "BEFORE DATA", "Before Data"),
            "afterData": ("afterData", "AfterData", "AFTER DATA", "After Data"),
        },
        "title_types": {
            "title": ("title", "Title", "TITLE"),
            "titleDescription": ("titleDescription", "TitleDescription", "TITLE DESCRIPTION", "Title Description"),
        },
        "user_roles": {
            "title": ("title", "Title", "TITLE"),
            "id": ("id", "ID"),
        },  
    }

    PASSTHROUGH = {
        "dogs": ["akcNumber", "ckcNumber", "foreignNumber", "foreignType", "pedigreeLink",
                 "average", "meetPoints", "arxPoints", "narxPoints", "showPoints", "dpcLegs",
                 "meetWins", "meetAppearences", "highCombinedWins", "notes"],
        "meets": [],
        "meet_results": [],
        "race_results": [],
        "dog_owners": [],
        "dog_titles": [],
        # "news": [],
        # "officer_roles": [],
        "persons": [],
        "clubs": [],
        "change_logs": [],
        "title_types": [],
        "user_roles": [],
    }

    ENTITIES = {
        "dogs": {
            "model": Dog, "table_name": "Dog", "pk_fields": ["cwaNumber"],
            "exists": lambda pk: Dog.exists(pk["cwaNumber"]),
            "find": lambda pk: Dog.find_by_identifier(pk["cwaNumber"]),
        },
        "meets": {
            "model": Meet, "table_name": "Meet", "pk_fields": ["meetNumber"],
            "exists": lambda pk: Meet.exists(pk["meetNumber"]),
            "find": lambda pk: Meet.find_by_identifier(pk["meetNumber"]),
        },
        "meet_results": {
            "model": MeetResult, "table_name": "MeetResults", "pk_fields": ["meetNumber", "cwaNumber"],
            "exists": lambda pk: MeetResult.exists(pk["meetNumber"], pk["cwaNumber"]),
            "find": lambda pk: MeetResult.find_by_identifier(pk["meetNumber"], pk["cwaNumber"]),
        },
        "race_results": {
            "model": RaceResult, "table_name": "RaceResults",
            "pk_fields": ["meetNumber", "cwaNumber", "program", "raceNumber"],
            "exists": lambda pk: RaceResult.exists(pk["meetNumber"], pk["cwaNumber"], pk["program"], pk["raceNumber"]),
            "find": lambda pk: RaceResult.find_by_identifier(pk["meetNumber"], pk["cwaNumber"], pk["program"], pk["raceNumber"]),
        },
        "dog_owners": {
            "model": DogOwner, "table_name": "DogOwners",
            "pk_fields": ["cwaNumber", "personID"],
            "exists": lambda pk: DogOwner.exists(pk["cwaNumber"], pk["personID"]),
            "find": lambda pk: DogOwner.find_by_identifier(pk["cwaNumber"], pk["personID"]),
        },
        "dog_titles": {
            "model": DogTitle, "table_name": "DogTitles",
            "pk_fields": ["cwaNumber", "title"],
            "exists": lambda pk: DogTitle.exists(pk["cwaNumber"], pk["title"]),
            "find": lambda pk: DogTitle.find_by_identifier(pk["cwaNumber"], pk["title"]),
        },
        # "news": {
        #     "model": News, "table_name": "News",
        #     "pk_fields": ["id"],
        #     # No exists method
        #     "find": lambda pk: News.find_by_identifier(pk["id"]),
        # },
        # "officer_roles": {
        #     "model": OfficerRole, "table_name": "OfficerRoles",
        #     "pk_fields": ["roleId"],
        #     "exists": lambda pk: OfficerRole.exists_by_id(pk["roleId"]),
        #     "find": lambda pk: OfficerRole.find_by_identifier(pk["roleId"]),
        # },
        "persons": {
            "model": Person, "table_name": "Persons",
            "pk_fields": ["personId"],
            "exists": lambda pk: Person.exists_by_id(pk["personId"]),
            "find": lambda pk: Person.find_by_identifier(pk["personId"]),
        },
        "clubs": {
            "model": Club, "table_name": "Clubs", "pk_fields": ["clubAbbreviation"],
            "exists": lambda pk: Club.exists_by_abbreviation(pk["clubAbbreviation"]),
            "find": lambda pk: Club.find_by_identifier(pk["clubAbbreviation"]),
        },
        "change_logs": {
            "model": ChangeLog, "table_name": "ChangeLog", "pk_fields": ["id"],
            "exists": lambda pk: ChangeLog.exists(pk["id"]),
            "find": lambda pk: ChangeLog.find_by_identifier(pk["id"]),
        },
        "title_types": {
            "model": TitleType, "table_name": "TitleTypes", "pk_fields": ["title"],
            "exists": lambda pk: TitleType.exists(pk["title"]),
            "find": lambda pk: TitleType.find_by_identifier(pk["title"]),
        },
        "user_roles": {
            "model": UserRole, "table_name": "UserRoles", "pk_fields": ["id", "title"],
            "exists": lambda pk: UserRole.exists(pk["title"]),
            "find": lambda pk: UserRole.find_by_id(pk["id"]),
            # Find by title?
        },
    }

    POST_SAVE_HOOKS = {
        "dogs": lambda obj, editor_id, now: _sync_titles_from_dog(obj, editor_id, now),
        "meet_results": lambda obj, editor_id, now: _sync_from_meet_result(obj, editor_id, now),
        "race_results": lambda obj, editor_id, now: _sync_from_race_result(obj, editor_id, now),
    }

    def detect_type(self, filename):
        name = (filename or "").lower()
        type_map = {"dog": "dogs", "meet_result": "meet_results", "meetresult": "meet_results",
                    "race_result": "race_results", "raceresult": "race_results", "meet": "meets",
                    "dog_owner": "dog_owners", "dogowner": "dog_owners", "dog_title": "dog_titles", "dogtitle": "dog_titles",
                    "news": "news", "officer_role": "officer_roles", "officerrole": "officer_roles",
                    "person": "persons", "club": "clubs", "change_log": "change_logs", "changelog": "change_logs",
                    "title_type": "title_types", "titletype": "title_types", "user_role": "user_roles", "userrole": "user_roles"}
        for key, value in type_map.items():
            if key in name:
                return value
        raise ValueError("Cannot determine import type from filename")

    def get_field(self, row, *names):
        for n in names:
            if n in row and row[n] is not None and str(row[n]).strip():
                return str(row[n]).strip()
        return None

    def row_to_payload(self, row, import_type):
        payload = {key: self.get_field(row, *names) for key, names in self.ALIASES[import_type].items()}
        for key in self.PASSTHROUGH[import_type]:
            if key in row and row[key] is not None and str(row[key]).strip():
                payload[key] = str(row[key]).strip()

        if import_type == "meet_results":
            yn = lambda v: "1" if (v or "").strip().upper() in ("1", "YES", "Y", "TRUE") else "0"
            for field in ["arxEarned", "narxEarned", "shown", "dpcLeg", "hcLegEarned"]:
                payload[field] = yn(payload.get(field))
            if payload.get("shown") == "0":
                payload["showPlacement"] = payload.get("showPlacement") or "0"
                payload["showPoints"] = payload.get("showPoints") or "0"
        return payload

    def import_rows(self, import_type, filename, rows, *, mode):
        if import_type not in self.ENTITIES:
            raise ValueError(f"Unknown CSV type: {import_type}")
        result = self._import_entity(rows, mode=mode, import_type=import_type, **self.ENTITIES[import_type])
        return {"file": filename, "type": import_type, "rows": len(rows), "mode": mode, **result}

    def _import_entity(self, rows, *, mode, import_type, model, table_name, pk_fields, exists, find):
        inserted = updated = skipped = failed = 0
        row_errors = []
        editor_id = current_editor_id()
        now = datetime.now(timezone.utc)
        seen = set()
        hook = self.POST_SAVE_HOOKS.get(import_type)
        changed_deferred = set()

        for idx, row in enumerate(rows, start=2):
            if not any(str(v).strip() for v in (row or {}).values() if v is not None):
                continue

            payload = self.row_to_payload(row, import_type)
            pk = {}
            missing = []
            for field in pk_fields:
                value = (payload.get(field) or "").strip()
                if not value:
                    missing.append(field)
                else:
                    pk[field] = value

            if missing:
                failed += 1
                row_errors.append({"row": idx, "error": f"Missing required field(s): {', '.join(missing)}"})
                continue

            pk_key = tuple(sorted(pk.items()))
            if pk_key in seen:
                failed += 1
                row_errors.append({"row": idx, "error": f"Duplicate PK in CSV: {self._pk_string(pk)}"})
                continue
            seen.add(pk_key)

            obj = model.from_request_data(payload)
            if hasattr(obj, "last_edited_by"):
                obj.last_edited_by = editor_id
            if hasattr(obj, "last_edited_at"):
                obj.last_edited_at = now

            errors = obj.validate() if hasattr(obj, "validate") else []
            if errors:
                failed += 1
                row_errors.append({"row": idx, "error": ", ".join(errors), "pk": self._pk_string(pk)})
                continue

            record_exists = exists(pk)
            if mode == "insert" and record_exists:
                skipped += 1
                continue

            operation = "UPDATE" if record_exists else "INSERT"
            before_snapshot = None

            if record_exists:
                existing = find(pk)
                before_snapshot = existing.to_dict() if existing and hasattr(existing, "to_dict") else None
                obj.update()
                updated += 1
            else:
                obj.save()
                inserted += 1

            refreshed = find(pk)
            after_snapshot = refreshed.to_dict() if refreshed and hasattr(refreshed, "to_dict") else (
                obj.to_dict() if hasattr(obj, "to_dict") else None
            )

            ChangeLog.log(
                changed_table=table_name,
                record_pk=self._pk_string(pk),
                operation=operation,
                changed_by=editor_id,
                source="api/import POST",
                before_obj=before_snapshot,
                after_obj=after_snapshot,
            )

            changed = (operation == "INSERT") or (before_snapshot != after_snapshot)

            if not changed:
                continue

            if import_type == "meet_results":
                cwa = payload.get("cwaNumber")
                if cwa:
                    changed_deferred.add(cwa)

            elif import_type == "race_results":
                cwa = payload.get("cwaNumber")
                meet = payload.get("meetNumber")
                if cwa and meet:
                    changed_deferred.add((cwa, meet))

            elif hook:
                hook(refreshed or obj, editor_id, now)

        affected_dogs = set()
        for item in changed_deferred:
            if import_type == "race_results":
                cwa, meet = item

                dog = Dog.find_by_identifier(cwa)
                if not dog:
                    continue

                before_row = fetch_one(
                    "SELECT COALESCE(SUM(MeetPoints),0) AS total "
                    "FROM MeetResults WHERE CWANumber=%s",
                    (cwa,),
                ) or {}
                old_total = float(before_row.get("total") or 0)

                meet_result = MeetResult.find_by_identifier(meet, cwa)
                if meet_result:
                    before_snapshot = meet_result.to_dict() if hasattr(meet_result, "to_dict") else None
                    meet_result.update_from_race_results()
                    after = MeetResult.find_by_identifier(meet, cwa)
                    after_snapshot = after.to_dict() if after and hasattr(after, "to_dict") else None

                    ChangeLog.log(
                        changed_table="MeetResults",
                        record_pk=f"cwaNumber={cwa}|meetNumber={meet}",
                        operation="UPDATE",
                        changed_by=editor_id,
                        source="api/import POST",
                        before_obj=before_snapshot,
                        after_obj=after_snapshot,
                    )

                after_row = fetch_one(
                    "SELECT COALESCE(SUM(MeetPoints),0) AS total "
                    "FROM MeetResults WHERE CWANumber=%s",
                    (cwa,),
                ) or {}
                new_total = float(after_row.get("total") or 0)
                dog.meet_points = float(dog.meet_points or 0) - old_total + new_total
                dog.update()

                DogTitle.sync_titles_for_dog(dog, editor_id, now)

            else:
                affected_dogs.add(item)

        for cwa in affected_dogs:
            dog = Dog.find_by_identifier(cwa)
            if dog:
                dog.update_from_meet_results()
                DogTitle.sync_titles_for_dog(dog, editor_id, now)

        return {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "failed": failed,
            "rowErrors": row_errors,
        }
    
    def _pk_string(self, pk):
        return "|".join(f"{k}={pk[k]}" for k in sorted(pk.keys()))

    def run(self, file_storage, *, import_type=None, mode="upsert"):
        filename = getattr(file_storage, "filename", "") or "upload.csv"
        if not import_type:
            import_type = self.detect_type(filename)

        raw = file_storage.read()
        if not raw:
            raise ValueError("Uploaded file is empty")

        try:
            text = raw.decode("utf-8-sig")
        except Exception:
            text = raw.decode("utf-8", errors="replace")

        rows = list(csv.DictReader(io.StringIO(text)))
        return self.import_rows(import_type=import_type, filename=filename, rows=rows, mode=mode)


def _sync_titles_from_dog(dog_obj, editor_id, now):
    """Sync titles when dog is updated"""
    DogTitle.sync_titles_for_dog(dog_obj, editor_id, now)


def _sync_from_meet_result(meet_result_obj, editor_id, now):
    cwa_number = getattr(meet_result_obj, "cwa_number", None)
    if not cwa_number:
        return
    
    dog = Dog.find_by_identifier(cwa_number)
    if dog:
        dog.update_from_meet_results()
        DogTitle.sync_titles_for_dog(dog, editor_id, now)


def _sync_from_race_result(race_result_obj, editor_id, now):
    """Update meet result, dog stats, and titles when race result is saved"""
    meet_number = getattr(race_result_obj, "meet_number", None)
    cwa_number = getattr(race_result_obj, "cwa_number", None)
    
    if not meet_number or not cwa_number:
        return
    
    meet_result = MeetResult.find_by_identifier(meet_number, cwa_number)
    if meet_result:
        meet_result.update_from_race_results()
    
    dog = Dog.find_by_identifier(cwa_number)
    if dog:
        dog.update_from_meet_results()
        DogTitle.sync_titles_for_dog(dog, editor_id, now)