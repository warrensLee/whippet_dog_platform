import csv
import io
from datetime import datetime, timezone

from classes.dog import Dog
from classes.meet import Meet
from classes.meet_result import MeetResult
from classes.race_result import RaceResult
from classes.change_log import ChangeLog
from utils.auth_helpers import current_editor_id


class CsvImporter:
    DOG_HEADER_ALIASES = {
        "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA No.", "CWA #"),
        "registeredName": ("registeredName", "RegisteredName", "REGISTERED NAME", "Registered Name"),
        "callName": ("callName", "CallName", "CALL NAME", "Call Name", "NAME"),
        "birthdate": ("birthdate", "Birthdate", "BIRTHDATE", "Birth Date"),
        "status": ("status", "Status"),
        "currentGrade": ("currentGrade", "CurrentGrade", "CURRENT GRADE", "Grade"),
    }

    MEET_HEADER_ALIASES = {
        "meetNumber": ("meetNumber", "MeetNumber", "MEET NUMBER", "Meet #"),
        "clubAbbreviation": ("clubAbbreviation", "ClubAbbreviation", "club", "Club", "CLUB"),
        "meetDate": ("meetDate", "MeetDate", "MEET DATE", "Date"),
        "raceSecretary": ("raceSecretary", "RaceSecretary", "RACE SECRETARY"),
        "judge": ("judge", "Judge"),
        "location": ("location", "Location", "LOCATION"),
        "yards": ("yards", "Yards", "YARD", "YARDS"),
    }

    MEET_RESULT_HEADER_ALIASES = {
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
    }


    RACE_RESULT_HEADER_ALIASES = {
        "meetNumber": ("meetNumber", "MeetNumber", "MEET NUMBER", "Meet #"),
        "cwaNumber": ("cwaNumber", "CWANumber", "CWA NO", "CWA No", "CWA #"),
        "program": ("program", "Program", "PROGRAM"),
        "raceNumber": ("raceNumber", "RaceNumber", "RACE", "Race #", "Race No", "Race No."),
        "entryType": ("entryType", "EntryType", "ENTRY TYPE", "Entry"),
        "box": ("box", "Box", "BOX"),
        "placement": ("placement", "Placement", "PLACE", "Place"),
        "meetPoints": ("meetPoints", "MeetPoints", "MEET POINTS", "Points"),
        "incident": ("incident", "Incident", "INCIDENT"),
    }

    DOG_PASSTHROUGH = [
        "akcNumber", "ckcNumber", "foreignNumber", "foreignType", "pedigreeLink",
        "average", "meetPoints", "arxPoints", "narxPoints", "showPoints",
        "dpcLegs", "meetWins", "meetAppearences", "highCombinedWins", "notes"
    ]

    MEET_PASSTHROUGH = []
    MEET_RESULT_PASSTHROUGH = []
    RACE_RESULT_PASSTHROUGH = []

    # -----------------------------
    # Utilities
    # -----------------------------

    def truthy(self, v):
        return (v or "").strip().lower() in ("1", "true", "yes", "y", "on")

    def detect_type(self, filename):
        name = (filename or "").lower()
        if "dog" in name:
            return "dogs"
        if "meet_result" in name or "meetresult" in name or "meet result" in name:
            return "meet_results"
        if "race_result" in name or "raceresult" in name or "race result" in name:
            return "race_results"
        if "meet" in name:
            return "meets"
            return "top_ten"
        raise ValueError("Cannot determine import type from filename")

    def get_field(self, row, *names):
        for n in names:
            if n in row and row[n] is not None and str(row[n]).strip():
                return str(row[n]).strip()
        return None

    # -----------------------------
    # Row -> payload mappers
    # -----------------------------

    def row_to_dog_payload(self, row):
        payload = {}
        a = self.DOG_HEADER_ALIASES

        payload["cwaNumber"] = self.get_field(row, *a["cwaNumber"])
        payload["registeredName"] = self.get_field(row, *a["registeredName"])
        payload["callName"] = self.get_field(row, *a["callName"])
        payload["birthdate"] = self.get_field(row, *a["birthdate"])
        payload["status"] = self.get_field(row, *a["status"])
        payload["currentGrade"] = self.get_field(row, *a["currentGrade"])

        for k in self.DOG_PASSTHROUGH:
            if k in row and row[k] is not None and str(row[k]).strip():
                payload[k] = str(row[k]).strip()

        return payload

    def row_to_meet_payload(self, row):
        payload = {}
        a = self.MEET_HEADER_ALIASES

        payload["meetNumber"] = self.get_field(row, *a["meetNumber"])
        payload["clubAbbreviation"] = self.get_field(row, *a["clubAbbreviation"])
        payload["meetDate"] = self.get_field(row, *a["meetDate"])
        payload["raceSecretary"] = self.get_field(row, *a["raceSecretary"])
        payload["judge"] = self.get_field(row, *a["judge"])
        payload["location"] = self.get_field(row, *a["location"])
        payload["yards"] = self.get_field(row, *a["yards"])

        return payload


    def row_to_meet_result_payload(self, row):
        payload = {}
        a = self.MEET_RESULT_HEADER_ALIASES

        payload["meetNumber"] = self.get_field(row, *a["meetNumber"])
        payload["cwaNumber"] = self.get_field(row, *a["cwaNumber"])
        payload["average"] = self.get_field(row, *a["average"])
        payload["grade"] = self.get_field(row, *a["grade"])
        payload["meetPlacement"] = self.get_field(row, *a["meetPlacement"])
        payload["meetPoints"] = self.get_field(row, *a["meetPoints"])
        payload["arxEarned"] = self.get_field(row, *a["arxEarned"])
        payload["narxEarned"] = self.get_field(row, *a["narxEarned"])
        payload["shown"] = self.get_field(row, *a["shown"])
        payload["showPlacement"] = self.get_field(row, *a["showPlacement"])
        payload["showPoints"] = self.get_field(row, *a["showPoints"])
        payload["dpcLeg"] = self.get_field(row, *a["dpcLeg"])
        payload["hcScore"] = self.get_field(row, *a["hcScore"])
        payload["hcLegEarned"] = self.get_field(row, *a["hcLegEarned"])

        def yn(v):
            return "1" if (v or "").strip().upper() in ("1", "YES", "Y", "TRUE") else "0"

        payload["arxEarned"] = yn(payload["arxEarned"])
        payload["narxEarned"] = yn(payload["narxEarned"])
        payload["shown"] = yn(payload["shown"])
        payload["dpcLeg"] = yn(payload["dpcLeg"])
        payload["hcLegEarned"] = yn(payload["hcLegEarned"])

        if payload["shown"] == "0":
            payload["showPlacement"] = payload["showPlacement"] or "0"
            payload["showPoints"] = payload["showPoints"] or "0"

        return payload



    def row_to_race_result_payload(self, row):
        payload = {}
        a = self.RACE_RESULT_HEADER_ALIASES

        payload["meetNumber"] = self.get_field(row, *a["meetNumber"])
        payload["cwaNumber"] = self.get_field(row, *a["cwaNumber"])
        payload["program"] = self.get_field(row, *a["program"])
        payload["raceNumber"] = self.get_field(row, *a["raceNumber"])
        payload["entryType"] = self.get_field(row, *a["entryType"])
        payload["box"] = self.get_field(row, *a["box"])
        payload["placement"] = self.get_field(row, *a["placement"])
        payload["meetPoints"] = self.get_field(row, *a["meetPoints"])
        payload["incident"] = self.get_field(row, *a["incident"])

        for k in self.RACE_RESULT_PASSTHROUGH:
            if k in row and row[k] is not None and str(row[k]).strip():
                payload[k] = str(row[k]).strip()

        return payload

    # -----------------------------
    # Generic upsert engine
    # -----------------------------

    def _pk_string(self, pk: dict) -> str:
        parts = [f"{k}={pk[k]}" for k in sorted(pk.keys())]
        return "|".join(parts)

    def _row_is_blank(self, r: dict) -> bool:
        return not any(str(v).strip() for v in (r or {}).values() if v is not None)

    def _import_entity(
        self,
        rows: list[dict],
        *,
        mode: str,
        entity_name: str,
        model_cls,
        row_to_payload_fn,
        required_pk_fields: list[str],
        exists_fn,
        find_fn,
        update_fn_name: str = "update",
        save_fn_name: str = "save",
    ) -> dict:
        inserted = updated = skipped = failed = 0
        row_errors = []

        editor_id = current_editor_id()
        now = datetime.now(timezone.utc)

        seen = set()  

        for idx, r in enumerate(rows, start=2):
            if self._row_is_blank(r):
                continue

            payload = row_to_payload_fn(r)

            pk = {}
            missing = []
            for f in required_pk_fields:
                v = (payload.get(f) or "").strip()
                if not v:
                    missing.append(f)
                else:
                    pk[f] = v

            if missing:
                failed += 1
                row_errors.append({"row": idx, "error": f"Missing required field(s): {', '.join(missing)}"})
                continue

            pk_key = tuple((k, pk[k]) for k in sorted(pk.keys()))
            if pk_key in seen:
                failed += 1
                row_errors.append({"row": idx, "error": f"Duplicate PK in CSV: {self._pk_string(pk)}"})
                continue
            seen.add(pk_key)

            obj = model_cls.from_request_data(payload)
            if hasattr(obj, "last_edited_by"):
                obj.last_edited_by = editor_id
            if hasattr(obj, "last_edited_at"):
                obj.last_edited_at = now

            errors = obj.validate() if hasattr(obj, "validate") else []
            if errors:
                failed += 1
                row_errors.append({"row": idx, "error": ", ".join(errors), "pk": self._pk_string(pk)})
                continue

            exists = exists_fn(pk)
            if mode == "insert" and exists:
                skipped += 1
                continue

            before_snapshot = None
            operation = "INSERT"

            if exists:
                operation = "UPDATE"
                existing = find_fn(pk)
                before_snapshot = existing.to_dict() if existing and hasattr(existing, "to_dict") else None

                getattr(obj, update_fn_name)()
                updated += 1
            else:
                getattr(obj, save_fn_name)()
                inserted += 1

            refreshed = find_fn(pk)
            after_snapshot = (
                refreshed.to_dict()
                if refreshed and hasattr(refreshed, "to_dict")
                else (obj.to_dict() if hasattr(obj, "to_dict") else None)
            )

            ChangeLog.log(
                changed_table=entity_name,
                record_pk=self._pk_string(pk),
                operation=operation,
                changed_by=editor_id,
                source="api/import POST",
                before_obj=before_snapshot,
                after_obj=after_snapshot,
            )

        return {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "failed": failed,
            "rowErrors": row_errors,
        }

    # -----------------------------
    # Import dispatcher
    # -----------------------------

    def import_rows(self, import_type, filename, rows, *, mode):
        report = {
            "file": filename,
            "type": import_type,
            "rows": len(rows),
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
            "mode": mode,
            "rowErrors": [],
        }

        if import_type == "dogs":
            result = self.import_dogs(rows, mode=mode)
        elif import_type == "meets":
            result = self.import_meets(rows, mode=mode)
        elif import_type == "meet_results":
            result = self.import_meet_results(rows, mode=mode)
        elif import_type == "race_results":
            result = self.import_race_results(rows, mode=mode)
        else:
            raise ValueError("Unknown CSV type")

        report.update(result)
        return report

    # -----------------------------
    # DOG IMPORT (uses your old logic)
    # -----------------------------

    def import_dogs(self, rows, *, mode):
        # you can keep your exact dog logic,
        # or convert to _import_entity like the others.
        inserted = updated = skipped = failed = 0
        row_errors = []

        editor_id = current_editor_id()
        now = datetime.now(timezone.utc)
        seen = set()

        for idx, r in enumerate(rows, start=2):
            if self._row_is_blank(r):
                continue

            payload = self.row_to_dog_payload(r)
            cwa = (payload.get("cwaNumber") or "").strip()

            if not cwa:
                failed += 1
                row_errors.append({"row": idx, "error": "cwaNumber is required"})
                continue

            if cwa in seen:
                failed += 1
                row_errors.append({"row": idx, "cwaNumber": cwa, "error": "Duplicate cwaNumber in CSV"})
                continue
            seen.add(cwa)

            dog = Dog.from_request_data(payload)
            dog.last_edited_by = editor_id
            dog.last_edited_at = now

            errors = dog.validate()
            if errors:
                failed += 1
                row_errors.append({"row": idx, "cwaNumber": cwa, "error": ", ".join(errors)})
                continue

            exists = Dog.exists(cwa)
            if mode == "insert" and exists:
                skipped += 1
                continue

            before_snapshot = None
            operation = "INSERT"

            if exists:
                operation = "UPDATE"
                existing = Dog.find_by_identifier(cwa)
                before_snapshot = existing.to_dict() if existing else None
                dog.update()
                updated += 1
            else:
                dog.save()
                inserted += 1

            refreshed = Dog.find_by_identifier(cwa)
            after_snapshot = refreshed.to_dict() if refreshed else dog.to_dict()

            ChangeLog.log(
                changed_table="Dog",
                record_pk=cwa,
                operation=operation,
                changed_by=editor_id,
                source="api/import POST",
                before_obj=before_snapshot,
                after_obj=after_snapshot,
            )

        return {
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "failed": failed,
            "rowErrors": row_errors,
        }

    # -----------------------------
    # MEET / MEET_RESULT / RACE_RESULT IMPORTS
    # -----------------------------

    def import_meets(self, rows, *, mode):
        def exists_fn(pk: dict) -> bool:
            return Meet.exists(pk["meetNumber"])

        def find_fn(pk: dict):
            return Meet.find_by_identifier(pk["meetNumber"])

        return self._import_entity(
            rows,
            mode=mode,
            entity_name="Meet",
            model_cls=Meet,
            row_to_payload_fn=self.row_to_meet_payload,
            required_pk_fields=["meetNumber"],
            exists_fn=exists_fn,
            find_fn=find_fn,
        )

    def import_meet_results(self, rows, *, mode):
        def exists_fn(pk: dict) -> bool:
            return MeetResult.exists(pk["meetNumber"], pk["cwaNumber"])

        def find_fn(pk: dict):
            return MeetResult.find_by_identifier(pk["meetNumber"], pk["cwaNumber"])

        return self._import_entity(
            rows,
            mode=mode,
            entity_name="MeetResult",
            model_cls=MeetResult,
            row_to_payload_fn=self.row_to_meet_result_payload,
            required_pk_fields=["meetNumber", "cwaNumber"],
            exists_fn=exists_fn,   
            find_fn=find_fn,       
        )


    def import_race_results(self, rows, *, mode):
        def exists_fn(pk: dict) -> bool:
            return RaceResult.exists(
                pk["meetNumber"],
                pk["cwaNumber"],
                pk["program"],
                pk["raceNumber"],
            )

        def find_fn(pk: dict):
            return RaceResult.find_by_identifier(
                pk["meetNumber"],
                pk["cwaNumber"],
                pk["program"],
                pk["raceNumber"],
            )

        return self._import_entity(
            rows,
            mode=mode,
            entity_name="RaceResult",
            model_cls=RaceResult,
            row_to_payload_fn=self.row_to_race_result_payload,
            required_pk_fields=["meetNumber", "cwaNumber", "program", "raceNumber"],
            exists_fn=exists_fn,
            find_fn=find_fn,
        )


    
    # -----------------------------
    # Entry point used by controller
    # -----------------------------

    def run(self, file_storage, *, import_type: str | None, mode: str) -> dict:
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

        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)

        return self.import_rows(
            import_type=import_type,
            filename=filename,
            rows=rows,
            mode=mode,
        )