from database import fetch_one, fetch_all, execute
from mysql.connector import Error

class OfficerRole:
    def __init__(
        self,
        role_id,
        role_name,
        person_id,
        display_order,
        active=True,
        last_edited_by=None,
        last_edited_at=None,
    ):
        self.role_id = (role_id) if role_id not in (None, "", 0) else None
        self.role_name = (role_name or "").strip()
        self.person_id = (person_id or "").strip()
        self.display_order = (display_order) if display_order not in (None, "", 0) else None
        self.active = True if active in (True, 1, "1", "true", "True", "yes", "YES") else False

        self.last_edited_by = last_edited_by
        self.last_edited_at = last_edited_at

    @classmethod
    def from_request_data(cls, data):
        return cls(
            role_id=data.get("id") or data.get("ID") or None,
            role_name=(data.get("roleName") or data.get("RoleName") or "").strip(),
            person_id=(data.get("personId") or data.get("PersonID") or "").strip(),
            display_order=data.get("displayOrder") or data.get("DisplayOrder") or None,
            active=data.get("active") if "active" in data else data.get("Active", True),
            last_edited_by=data.get("lastEditedBy") or data.get("LastEditedBy"),
            last_edited_at=data.get("lastEditedAt") or data.get("LastEditedAt"),
        )

    @classmethod
    def from_db_row(cls, row):
        if not row:
            return None
        return cls(
            role_id=row.get("ID"),
            role_name=row.get("RoleName"),
            person_id=row.get("PersonID"),
            display_order=row.get("DisplayOrder"),
            active=row.get("Active"),
            last_edited_by=row.get("LastEditedBy"),
            last_edited_at=row.get("LastEditedAt"),
        )

    @classmethod
    def find_by_identifier(cls, officer_role_id):
        row = fetch_one(
            """
            SELECT
                ID, RoleName, PersonID, DisplayOrder, Active, LastEditedBy, LastEditedAt
            FROM OfficerRole
            WHERE ID = %s
            LIMIT 1
            """,
            (officer_role_id,),
        )
        return cls.from_db_row(row)
    
    @classmethod
    def find_by_role_name(cls, role_name):
        row = fetch_one(
            """
            SELECT
                ID, RoleName, PersonID, DisplayOrder, Active, LastEditedBy, LastEditedAt
            FROM OfficerRole
            WHERE RoleName = %s
            LIMIT 1
            """,
            ((role_name or "").strip(),),
        )
        return cls.from_db_row(row)


    @classmethod
    def exists_by_id(cls, officer_role_id):
        row = fetch_one(
            "SELECT ID FROM OfficerRole WHERE ID=%s LIMIT 1",
            (officer_role_id,),
        )
        return row is not None

    @classmethod
    def exists_by_name(cls, role_name):
        row = fetch_one(
            "SELECT ID FROM OfficerRole WHERE RoleName=%s LIMIT 1",
            ((role_name or "").strip(),),
        )
        return row is not None

    def validate(self):
        errors = []
        if not self.role_name:
            errors.append("RoleName is required")
        if len(self.role_name) > 50:
            errors.append("RoleName must be 50 characters or less")

        if not self.person_id:
            errors.append("PersonID is required")
        if len(self.person_id) > 20:
            errors.append("PersonID must be 20 characters or less")

        if self.display_order is None:
            errors.append("DisplayOrder is required")

        return errors

    def save(self):
        try:
            execute(
                """
                INSERT INTO OfficerRole (
                    RoleName, PersonID, DisplayOrder, Active, LastEditedBy, LastEditedAt
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    self.role_name,
                    self.person_id,
                    self.display_order,
                    1 if self.active else 0,
                    self.last_edited_by,
                    self.last_edited_at,
                ),
            )
            return True
        except Error as e:
            raise e

    def update(self):
        if not self.role_id:
            raise ValueError("Cannot update OfficerRole without an ID.")
        try:
            execute(
                """
                UPDATE OfficerRole
                SET RoleName = %s,
                    PersonID = %s,
                    DisplayOrder = %s,
                    Active = %s,
                    LastEditedBy = %s,
                    LastEditedAt = %s
                WHERE ID = %s
                """,
                (
                    self.role_name,
                    self.person_id,
                    self.display_order,
                    1 if self.active else 0,
                    self.last_edited_by,
                    self.last_edited_at,
                    self.role_id,
                ),
            )
            return True
        except Error as e:
            raise e

    @staticmethod
    def delete(officer_role_id):
        try:
            execute(
                "DELETE FROM OfficerRole WHERE ID=%s",
                (officer_role_id,),
            )
            return True
        except Error as e:
            raise e
        
    @staticmethod
    def delete_by_role_name(role_name):
        try:
            execute(
                """
                DELETE FROM OfficerRole
                WHERE RoleName = %s
                """,
                (role_name,),
            )
            return True
        except Error as e:
            raise e


    @staticmethod
    def list_all():
        rows = fetch_all(
            """
            SELECT
                ID, RoleName, PersonID, DisplayOrder, Active, LastEditedBy, LastEditedAt
            FROM OfficerRole
            ORDER BY DisplayOrder ASC, RoleName ASC
            """
        )
        return [OfficerRole.from_db_row(r) for r in rows]

    @staticmethod
    def list_for_person(person_id):
        rows = fetch_all(
            """
            SELECT
                ID, RoleName, PersonID, DisplayOrder, Active, LastEditedBy, LastEditedAt
            FROM OfficerRole
            WHERE PersonID = %s
            ORDER BY DisplayOrder ASC, RoleName ASC
            """,
            (person_id,),
        )
        return [OfficerRole.from_db_row(r) for r in rows]

    def to_dict(self):
        officer_info = self.get_officer_name() 
        return {
            "id": self.role_id,
            "roleName": self.role_name,
            "personId": self.person_id,
            "email": officer_info["email"],  
            "displayOrder": self.display_order,
            "active": bool(self.active),
            "lastEditedBy": self.last_edited_by,
            "lastEditedAt": self.last_edited_at.isoformat() if self.last_edited_at else None,
            "officerName": officer_info["name"],  
        }


    def get_officer_name(self):
        row = fetch_one(
            """
            SELECT FirstName, LastName, EmailAddress
            FROM Person 
            WHERE PersonID = %s 
            LIMIT 1
            """,
            (self.person_id,)
        )
        
        if row:
            return {
                "name": f"{row['FirstName']} {row['LastName']}",
                "email": row["EmailAddress"]
            }
        
        return {"name": "Unknown", "email": "N/A"}
