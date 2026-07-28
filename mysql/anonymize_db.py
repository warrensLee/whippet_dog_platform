'''
This script exists to remove PII from the production DB so that it can be used for testing and development.
It removes all PII from the Users and sets all passwords to test.
It also adds an admin user.
This script requires that the env variables, DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME be set to run

'''
import os
import sys
import uuid
import mysql.connector

ADMIN_EMAIL = "test@test.com"
ADMIN_PERSON_ID = "test_admin"
#the password for all anonymized accounts and the admin account is "test"
PASSWORD_HASH = (
    "scrypt:32768:8:1$NRVl5PLfLGP6BJNH$"
    "362799f7d056dfacbe8407ea385b339e9e57d8a331493cdec355976864c6a7130e7f75cb21e736794035ce66239158b2c3a516c5bf32642f204e0aa03b2135ab"
)


def get_connection(host, user, password, database):
    return mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        autocommit=True,
    )


def create_admin_account(conn, cursor):
    cursor.execute(
        """
        INSERT INTO Person (
            PersonID, FirstName, LastName, EmailAddress,
            AddressLineOne, AddressLineTwo, City, StateProvince,
            ZipCode, Country, PrimaryPhone, SecondaryPhone,
            SystemRole, PasswordHash, Notes, PublicNotes, Locked,
            LastEditedBy, LastEditedAt
        ) VALUES (%s, %s, %s, %s, NULL, NULL, NULL, NULL, NULL, NULL,
                  NULL, NULL, 'ADMIN', %s, %s, NULL, 0, NULL, UTC_TIMESTAMP())
        """,
        (ADMIN_PERSON_ID, "Test", "Admin", ADMIN_EMAIL, PASSWORD_HASH, "Created by anonymize_users script"),
    )
    admin_id = cursor.lastrowid
    print(f"Created admin account.\n Username: {ADMIN_PERSON_ID} / Email: {ADMIN_EMAIL} / Password: test / ID: {admin_id}")
    return admin_id


def anonymize_users(conn, cursor):
    cursor.execute(
        "SELECT ID FROM Person WHERE EmailAddress != %s",
        (ADMIN_EMAIL,),
    )
    users = cursor.fetchall()

    total = len(users)
    if total == 0:
        print("No users to anonymize.")
        return

    for user in users:
        user_id = user["ID"]
        random_handle = "anonymized_" + uuid.uuid4().hex[:5].lower()
        cursor.execute(
            """
            UPDATE Person SET
                PersonID = %s,
                FirstName = 'Anonymized',
                LastName = 'User',
                EmailAddress = NULL,
                AddressLineOne = NULL,
                AddressLineTwo = NULL,
                City = NULL,
                StateProvince = NULL,
                ZipCode = NULL,
                Country = NULL,
                PrimaryPhone = NULL,
                SecondaryPhone = NULL,
                Notes = NULL,
                PublicNotes = NULL
            WHERE ID = %s
            """,
            (random_handle, user_id),
        )


def reset_all_passwords(conn, cursor):
    cursor.execute("UPDATE Person SET PasswordHash = %s", (PASSWORD_HASH,))


def main():

    db_host = os.getenv("MYSQL_HOST")
    db_user = os.getenv("MYSQL_USER")
    db_password = os.getenv("MYSQL_PASSWORD")
    db_name = os.getenv("MYSQL_DATABASE")

    if not db_host:
        print("ERROR: Missing MYSQL_HOST environment variable")
        sys.exit(1)

    if not db_user:
        print("ERROR: Missing MYSQL_USER environment variable")
        sys.exit(1)

    if not db_password:
        print("ERROR: Missing MYSQL_PASSWORD environment variable")
        sys.exit(1)

    if not db_name:
        print("ERROR: Missing MYSQL_DATABASE environment variable")
        sys.exit(1)
    conn = get_connection(db_host, db_user,db_password, db_name)
    cursor = conn.cursor(dictionary=True)

    print(f"Connected to database: {db_name} @ {db_host}")
    try:
        create_admin_account(conn, cursor)
        anonymize_users(conn, cursor)
        reset_all_passwords(conn, cursor)
        print("=== Done ===")
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
