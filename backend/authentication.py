from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import Error
from database import fetch_one, execute

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}

    person_id = (data.get("personId") or "").strip()
    first_name = (data.get("firstName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    address1 = (data.get("addressLineOne") or "").strip() or None
    address2 = (data.get("addressLineTwo") or "").strip() or None
    city = (data.get("city") or "").strip() or None
    state = (data.get("stateProvince") or "").strip() or None
    zipcode = (data.get("zipCode") or "").strip() or None
    country = (data.get("country") or "").strip() or None
    phone1 = (data.get("primaryPhone") or "").strip() or None
    phone2 = (data.get("secondaryPhone") or "").strip() or None
    notes = (data.get("notes") or "").strip() or None

    if not person_id or not first_name or not last_name or not email or not password:
        return jsonify({"ok": False, "error": "All fields are required"}), 400

    if len(person_id) > 20:
        return jsonify({"ok": False, "error": "PersonID must be 20 chars or less"}), 400

    existing = fetch_one(
        """
        SELECT PersonID
        FROM Person
        WHERE PersonID = %s OR EmailAddress = %s
        LIMIT 1
        """,
        (person_id, email),
    )
    if existing:
        return jsonify({"ok": False, "error": "PersonID or Email already exists"}), 409

    pw_hash = generate_password_hash(password)

    try:
        rows = execute(
            """
            INSERT INTO Person (
                PersonID,
                FirstName,
                LastName,
                EmailAddress,
                AddressLineOne,
                AddressLineTwo,
                City,
                StateProvince,
                ZipCode,
                Country,
                PrimaryPhone,
                SecondaryPhone,
                SystemRole,
                PasswordHash,
                Notes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                person_id,
                first_name,
                last_name,
                email,
                address1,
                address2,
                city,
                state,
                zipcode,
                country,
                phone1,
                phone2,
                "Public",
                pw_hash,
                notes,
            ),
        )
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or "").strip()  
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"ok": False, "error": "Missing username or password"}), 400

    user = fetch_one(
        """
        SELECT PersonID, FirstName, LastName, EmailAddress, SystemRole, PasswordHash
        FROM Person
        WHERE EmailAddress = %s OR PersonID = %s
        LIMIT 1
        """,
        (identifier, identifier),
    )

    if not user or not user.get("PasswordHash"):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    if not check_password_hash(user["PasswordHash"], password):
        return jsonify({"ok": False, "error": "Invalid credentials"}), 401

    session["user"] = {
        "PersonID": user["PersonID"],
        "FirstName": user.get("FirstName") or "",
        "LastName": user.get("LastName") or "",
        "EmailAddress": user.get("EmailAddress"),
        "SystemRole": user.get("SystemRole") or "",
    }

    return jsonify({"ok": True, "user": session["user"]}), 200


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True}), 200

@auth_bp.get("/me")
def me():
    return jsonify({"ok": True, "user": session.get("user")}), 200