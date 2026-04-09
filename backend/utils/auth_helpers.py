from flask import jsonify, session
from classes.user_role import UserRole
from classes.person import Person

def current_user():
    """Return session user dict, or empty dict if not signed in."""
    user = session.get("user") or {}
    person_id = user.get("ID")  
    person = Person.find_by_id(person_id)

    if not person or person.locked:
        session.clear()
        return {}

    return user


def current_editor_id():
    """Return the current user's internal Person table ID."""
    u = current_user()
    return u.get("ID") or None

def current_editor_person_id():
    u = current_user()
    return u.get("PersonID") or None

def current_role():
    """Lookup UserRole from session user."""
    u = current_user()
    pid = u.get("PersonID")
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def require_scope(scope_value, action):
    """Return a Flask response tuple if denied, otherwise None."""
    if scope_value == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def require_signed_in():
    """Return 401 response if not signed in, else None."""
    if not current_role():
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    return None

def check_login_and_scope(scope, action="perform this action"):
    """Check login and permission scope."""
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    role_scope = getattr(role, f'edit_{scope}_scope', UserRole.NONE)

    if role_scope not in [UserRole.ALL, UserRole.SELF]: 
        return jsonify({"ok": False, "error": "Insufficient permissions to perform this action"}), 403
    
    return None  


def check_login_and_scope_strict(scope, action="perform this action"):
    """Check login and strict permission scope."""
    role = current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401
    
    role_scope = getattr(role, f'edit_{scope}_scope', UserRole.NONE)
    
    if role_scope != UserRole.ALL:    
        return jsonify({"ok": False, "error": "Insufficient permissions to perform this action"}), 403

    return None 