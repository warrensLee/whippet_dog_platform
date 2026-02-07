"""
News API routes
"""
from flask import Blueprint, request, jsonify, session, current_app
from flask_mail import Message
from datetime import datetime, timezone
from mysql.connector import Error
from email_validator import validate_email, EmailNotValidError
from classes.news import News
from classes.change_log import ChangeLog
from classes.user_role import UserRole
from database import fetch_all, execute, fetch_one

news_bp = Blueprint("news", __name__, url_prefix="/api/news")

def _current_editor_id() -> str | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    return pid if pid else None


def _current_role() -> UserRole | None:
    u = session.get("user") or {}
    pid = u.get("PersonID")
    if not pid:
        return None

    title = u.get("SystemRole")
    if not title:
        return None

    return UserRole.find_by_title(title.strip().upper())


def _require_scope(scope_value: int, action: str):
    if int(scope_value or 0) == UserRole.NONE:
        return jsonify({"ok": False, "error": f"Not allowed to {action}"}), 403
    return None


def _is_news_owner(news_item: News) -> bool:
    person_id = _current_editor_id()
    if not person_id or not news_item:
        return False

    author_id = getattr(news_item, "author_id", None) or getattr(news_item, "authorId", None)
    return str(author_id) == str(person_id)


@news_bp.route("/get", methods=["GET"])
def get_all_news():
    role = _current_role()

    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_news_scope, "view news")
    if deny:
        return deny

    try:
        rows = fetch_all(
            """
            SELECT
                n.ID,
                n.Title,
                n.Content,
                n.CreatedAt,
                n.UpdatedAt,
                n.AuthorID,
                CONCAT(p.FirstName, ' ', p.LastName) AS AuthorName,
                n.LastEditedBy,
                n.LastEditedAt
            FROM News n
            LEFT JOIN Person p ON p.PersonID = n.AuthorID
            ORDER BY n.CreatedAt DESC
            """
        )

        news_list = []
        for row in rows:
            news_item = News.from_db_row(row)
            if not news_item:
                continue

            if role.view_news_scope == UserRole.SELF and not _is_news_owner(news_item):
                continue

            news_list.append(news_item.to_dict())

        return jsonify({"ok": True, "data": news_list}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/get/<news_id>", methods=["GET"])
def get_news_by_id(news_id):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_news_scope, "view news")
    if deny:
        return deny

    try:
        news_item = News.find_by_identifier(news_id)
        if not news_item:
            return jsonify({"ok": False, "error": "News item not found"}), 404

        if role.view_news_scope == UserRole.SELF and not _is_news_owner(news_item):
            return jsonify({"ok": False, "error": "Not allowed to view this news item"}), 403

        return jsonify({"ok": True, "data": news_item.to_dict()}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to fetch news"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/add", methods=["POST"])
def create_news():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_news_scope, "create news")
    if deny:
        return deny

    try:
        from main import mail

        user = session.get("user") or {}
        data = request.get_json(silent=True) or {}

        news_item = News.from_request_data(data)
        news_item.author_id = user.get("PersonID")
        news_item.last_edited_by = user.get("PersonID")

        errors = news_item.validate()
        if errors:
            return jsonify({"ok": False, "error": "Validation failed", "details": errors}), 400

        news_item.save()

        created_id = getattr(news_item, "news_id", None) or getattr(news_item, "id", None)
        ChangeLog.log(
            changed_table="News",
            record_pk=str(created_id) if created_id is not None else "UNKNOWN",
            operation="INSERT",
            changed_by=user.get("PersonID"),
            source="api/news/add POST",
            before_obj=None,
            after_obj=news_item.to_dict(),
        )

        newsletter_result = None
        try:
            rows = fetch_all(
                """
                SELECT EmailAddress
                FROM NewsletterSubscription
                WHERE IsActive = 1
                ORDER BY SubscribedAt DESC
                """
            )

            if rows:
                recipients = [row["EmailAddress"] for row in rows]
                sent_count = 0
                failed_count = 0

                for recipient in recipients:
                    try:
                        msg = Message(
                            subject=f"New Post: {news_item.title}",
                            recipients=[recipient],
                            sender=current_app.config["MAIL_DEFAULT_SENDER"],
                        )

                        content = (news_item.content or "").strip()
                        if content.startswith("<") and (
                            "</html>" in content or "</div>" in content or "</p>" in content
                        ):
                            msg.html = content
                        else:
                            msg.body = content

                        mail.send(msg)
                        sent_count += 1
                    except Exception as e:
                        print(f"Failed to send to {recipient}: {e}")
                        failed_count += 1

                newsletter_result = {"sent": sent_count, "failed": failed_count, "total": len(recipients)}
        except Exception as e:
            print(f"Newsletter sending error: {e}")
            newsletter_result = {"error": "Failed to send newsletter"}

        response_data = {"ok": True, "message": "News item created successfully", "data": news_item.to_dict()}
        if newsletter_result:
            response_data["newsletter"] = newsletter_result

        return jsonify(response_data), 201

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to create news item", "dbError": str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/edit/<news_id>", methods=["PUT"])
def update_news(news_id):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_news_scope, "edit news")
    if deny:
        return deny

    try:
        user = session.get("user") or {}
        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"ok": False, "error": "No data provided"}), 400

        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"ok": False, "error": "News item not found"}), 404

        if role.edit_news_scope == UserRole.SELF and not _is_news_owner(existing_news):
            return jsonify({"ok": False, "error": "Not allowed to edit this news item"}), 403

        before_snapshot = existing_news.to_dict()

        news_item = News.from_request_data(data)
        news_item.id = news_id
        news_item.updated_at = datetime.now(timezone.utc)
        news_item.last_edited_by = user.get("PersonID")
        if not getattr(news_item, "last_edited_at", None):
            news_item.last_edited_at = datetime.now(timezone.utc)

        news_item.author_id = getattr(existing_news, "author_id", None)

        errors = news_item.validate()
        if errors:
            return jsonify({"ok": False, "error": "Validation failed", "details": errors}), 400

        news_item.update()

        refreshed = News.find_by_identifier(news_id)
        after_snapshot = refreshed.to_dict() if refreshed else news_item.to_dict()

        ChangeLog.log(
            changed_table="News",
            record_pk=str(news_id),
            operation="UPDATE",
            changed_by=user.get("PersonID"),
            source=f"api/news/edit/{news_id} PUT",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"ok": True, "message": "News item updated successfully", "data": after_snapshot}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to update news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/delete/<news_id>", methods=["DELETE"])
def delete_news(news_id):
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.edit_news_scope, "delete news")
    if deny:
        return deny

    try:
        user = session.get("user") or {}

        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"ok": False, "error": "News item not found"}), 404

        if role.edit_news_scope == UserRole.SELF and not _is_news_owner(existing_news):
            return jsonify({"ok": False, "error": "Not allowed to delete this news item"}), 403

        before_snapshot = existing_news.to_dict()

        existing_news.delete(news_id)

        ChangeLog.log(
            changed_table="News",
            record_pk=str(news_id),
            operation="DELETE",
            changed_by=user.get("PersonID"),
            source=f"api/news/delete/{news_id} DELETE",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"ok": True, "message": "News item deleted successfully", "Id": news_id}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to delete news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/search", methods=["GET"])
def search_news():
    role = _current_role()
    if not role:
        return jsonify({"ok": False, "error": "Not signed in"}), 401

    deny = _require_scope(role.view_news_scope, "view news")
    if deny:
        return deny

    try:
        query = (request.args.get("q") or "").strip()
        if not query:
            return jsonify({"ok": False, "error": "Search query required"}), 400

        rows = fetch_all(
            """
            SELECT
                n.ID,
                n.Title,
                n.Content,
                n.CreatedAt,
                n.UpdatedAt,
                n.AuthorID,
                CONCAT(p.FirstName, ' ', p.LastName) AS AuthorName,
                n.LastEditedBy,
                n.LastEditedAt
            FROM News n
            LEFT JOIN Person p ON p.PersonID = n.AuthorID
            WHERE n.Title LIKE %s OR n.Content LIKE %s
            ORDER BY n.CreatedAt DESC
            """,
            (f"%{query}%", f"%{query}%"),
        )

        news_list = []
        for row in rows:
            news_item = News.from_db_row(row)
            if not news_item:
                continue

            if role.view_news_scope == UserRole.SELF and not _is_news_owner(news_item):
                continue

            news_list.append(news_item.to_dict())

        return jsonify({"ok": True, "data": news_list}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to search news"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


from email_validator import validate_email, EmailNotValidError

# ... rest of your imports ...

@news_bp.route("/subscribe", methods=["POST"])
def subscribe_newsletter():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"ok": False, "error": "Email is required"}), 400
        
        # Correct way to use email_validator
        try:
            valid = validate_email(email)
            email = valid.email  # Use the normalized email
        except EmailNotValidError as e:
            return jsonify({"ok": False, "error": "Invalid email address"}), 400

        execute(
            """
            INSERT INTO NewsletterSubscription (EmailAddress, IsActive, SubscribedAt, UnsubscribedAt)
            VALUES (%s, 1, NOW(), NULL)
            ON DUPLICATE KEY UPDATE
              IsActive = 1,
              SubscribedAt = NOW(),
              UnsubscribedAt = NULL
            """,
            (email,),
        )

        return jsonify({"ok": True, "message": "Subscribed successfully"}), 200

    except Error as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": "Failed to subscribe"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/unsubscribe", methods=["POST"])
def unsubscribe_newsletter():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"ok": False, "error": "Email is required"}), 400
        
        # Correct way to use email_validator
        try:
            valid = validate_email(email)
            email = valid.email  # Use the normalized email
        except EmailNotValidError as e:
            return jsonify({"ok": False, "error": "Invalid email address"}), 400

        rows = execute(
            """
            UPDATE NewsletterSubscription
            SET IsActive = 0,
                UnsubscribedAt = NOW()
            WHERE EmailAddress = %s
              AND IsActive = 1
            """,
            (email,),
        )

        if rows == 0:
            return jsonify({"ok": True, "message": "Email is already unsubscribed or not found"}), 200

        return jsonify({"ok": True, "message": "Unsubscribed successfully"}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to unsubscribe"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500


@news_bp.route("/subscription-status", methods=["GET"])
def newsletter_subscription_status():
    try:
        email = (request.args.get("email") or "").strip().lower()
        if not email:
            return jsonify({"ok": False, "error": "Email is required"}), 400
        
        # Correct way to use email_validator
        try:
            valid = validate_email(email)
            email = valid.email  # Use the normalized email
        except EmailNotValidError as e:
            return jsonify({"ok": False, "error": "Invalid email address"}), 400

        row = fetch_one(
            """
            SELECT IsActive
            FROM NewsletterSubscription
            WHERE EmailAddress = %s
            LIMIT 1
            """,
            (email,),
        )

        is_subscribed = bool(row and int(row.get("IsActive", 0)) == 1)
        return jsonify({"ok": True, "isSubscribed": is_subscribed}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"ok": False, "error": "Failed to check subscription status"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"ok": False, "error": "An unexpected error occurred"}), 500
