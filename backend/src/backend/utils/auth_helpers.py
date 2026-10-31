from typing_extensions import Callable
from functools import wraps
from flask import jsonify, session
from backend.classes.user_role import UserRole
from backend.classes.person import Person
from flask import g
from typing import cast, Any 
from dataclasses import dataclass

@dataclass
class Session:
    id: int
    person_id:str 
    first_name: str
    last_name: str
    email: str
    system_role: str

    @classmethod
    def from_json(cls, data: dict[str, Any]):
        if "ID" not in data or "PersonID" not in data or "FirstName" not in data or "LastName" not in data or "EmailAddress" not in data or "SystemRole" not in data:
            raise Exception
        return cls(
            id=int(data["ID"]),
            person_id=str(data["PersonID"]),
            first_name=str(data["FirstName"]),
            last_name=str(data["LastName"]),
            email=str(data["EmailAddress"]),
            system_role=str(data["SystemRole"])
        )

def current_user() -> Session | None:
    """Return Session or None if not signed in."""
    if hasattr(g, "user"):
        return cast(Session,g.user)
    user = session.get("user") or {}
    person_id = user.get("ID")  
    person = Person.find_by_id(person_id)

    if not person or person.locked:
        session.clear()
        return None
    try:
        g.user = Session.from_json(user)
    except Exception:
        g.user = None
        session.clear()
        return None
    return cast(Session,g.user)

def current_editor_id():
    """Return the current user's internal Person table ID."""
    u = current_user()
    if u:
        return u.id 
    return None

def current_role():
    """Lookup UserRole from session user."""
    if hasattr(g, "role"): 
        return cast(UserRole, g.role)
    u = current_user()
    if not u:
        return None
    pid = u.person_id
    title = u.system_role
    g.role = UserRole.find_by_title(title.strip().upper())
    return cast(UserRole, g.role)

def require_logged_in(f: Callable):
    """Return 401 response if not signed in, else None."""
    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_role():
            return jsonify({"ok": False, "error": "Not signed in"}), 401
        return f(*args, **kwargs)
    return decorated_function

def require_scope(scope: str, action: str):
    def decorator(f: Callable):
        @wraps(f)
        @require_logged_in
        def decorated_function(*args: Any, **kwargs: Any):
            role = current_role()
            if not role or (getattr(role, scope) != UserRole.ALL and getattr(role, scope) != UserRole.SELF):
                return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_admin(f: Callable) :
    @wraps(f)
    @require_logged_in
    def decorated_function(*args: Any, **kwargs: Any):
        role = current_role()
        if not role or role.title != "ADMIN":
            return jsonify({"ok": False, "error": "You must be an admin to perform this action"}), 403
        return f(*args, **kwargs)
    return decorated_function
