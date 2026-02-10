import csv
import io
from datetime import datetime, timezone

from classes.dog import Dog
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

    DOG_PASSTHROUGH = [
        "akcNumber", "ckcNumber", "foreignNumber", "foreignType", "pedigreeLink",
        "average", "meetPoints", "arxPoints", "narxPoints", "showPoints",
        "dpcLegs", "meetWins", "meetAppearences", "highCombinedWins", "notes"
    ]

    def truthy(self, v):
        return (v or "").strip().lower() in ("1", "true", "yes", "y", "on")

    def detect_type(self, filename):
        name = (filename or "").lower()
        if "dog" in name:
            return "dogs"
        if "title" in name:
            return "titles"
        if "conformation" in name:
            return "conformation"
        if "top ten" in name or "top_ten" in name:
            return "top_ten"
        raise ValueError("Cannot determine import type from filename")

    def get_field(self, row, *names):
        for n in names:
            if n in row and row[n] is not None and str(row[n]).strip():
                return str(row[n]).strip()
        return None

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
        elif import_type == "titles":
            result = self.import_titles(rows)
        elif import_type == "conformation":
            result = self.import_conformation(rows)
        elif import_type == "top_ten":
            result = self.import_top_ten(rows)
        else:
            raise ValueError("Unknown CSV type")

        report.update(result)
        return report

    # -----------------------------
    # DOG IMPORT
    # -----------------------------

    def import_dogs(self, rows, *, mode):
        inserted = updated = skipped = failed = 0
        row_errors = []

        editor_id = current_editor_id()
        now = datetime.now(timezone.utc)
        seen = set()

        for idx, r in enumerate(rows, start=2):
            if not any(str(v).strip() for v in (r or {}).values() if v is not None):
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
    # Stubs for future imports
    # -----------------------------

    def import_titles(self, rows: list[dict]) -> dict:
        return {"inserted": 0, "updated": 0, "skipped": 0, "failed": 0, "rowErrors": []}

    def import_conformation(self, rows: list[dict]) -> dict:
        return self.import_titles(rows)

    def import_top_ten(self, rows: list[dict]) -> dict:
        return {"inserted": 0, "updated": 0, "skipped": 0, "failed": 0, "rowErrors": []}

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
