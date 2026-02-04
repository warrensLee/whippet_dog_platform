"""
News API routes
"""
from flask import Blueprint, request, jsonify, session, current_app
from flask_mail import Message
from datetime import datetime
from classes.news import News
from classes.change_log import ChangeLog
from database import fetch_all, execute, fetch_one
from mysql.connector import Error
from email_validator import validate_email, EmailNotValidError

news_bp = Blueprint("news", __name__, url_prefix="/api")

@news_bp.route("/news", methods=["GET"])
def get_all_news():
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
            if news_item:
                news_list.append(news_item.to_dict())

        return jsonify(news_list), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/<news_id>", methods=["GET"])
def get_news_by_id(news_id):
    """Get a specific news item by ID."""
    try:
        news_item = News.find_by_identifier(news_id)

        if not news_item:
            return jsonify({"error": "News item not found"}), 404

        return jsonify(news_item.to_dict()), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to fetch news"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news", methods=["POST"])
def create_news():
    """Create a new news item and automatically send newsletter to subscribers."""
    try:
        from main import mail  
        user = session.get("user")
        if not user:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

        data = request.get_json(silent=True) or {}

        news_item = News.from_request_data(data)
        news_item.author_id = user["PersonID"]
        news_item.last_edited_by = user["PersonID"]

        errors = news_item.validate()
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400

        news_item.save()

        created_id = getattr(news_item, "news_id", None) or getattr(news_item, "id", None)
        ChangeLog.log(
            changed_table="News",
            record_pk=str(created_id) if created_id is not None else "UNKNOWN",
            operation="INSERT",
            changed_by=user.get("PersonID"),
            source="api/news POST",
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
                        if content.startswith("<") and ("</html>" in content or "</div>" in content or "</p>" in content):
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

        response_data = {"message": "News item created successfully", "news": news_item.to_dict()}
        if newsletter_result:
            response_data["newsletter"] = newsletter_result

        return jsonify(response_data), 201

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to create news item", "dbError": str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/<news_id>", methods=["PUT"])
def update_news(news_id):
    """Update an existing news item."""
    try:
        user = session.get("user")
        if not user:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "No data provided"}), 400

        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"error": "News item not found"}), 404

        before_snapshot = existing_news.to_dict()

        news_item = News.from_request_data(data)
        news_item.id = news_id  
        news_item.updated_at = datetime.now()
        news_item.last_edited_by = user.get("PersonID")
        if not getattr(news_item, "last_edited_at", None):
            news_item.last_edited_at = datetime.now()

        errors = news_item.validate()
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400

        news_item.update()

        refreshed = News.find_by_identifier(news_id)
        after_snapshot = refreshed.to_dict() if refreshed else news_item.to_dict()

        ChangeLog.log(
            changed_table="News",
            record_pk=str(news_id),
            operation="UPDATE",
            changed_by=user.get("PersonID"),
            source=f"api/news/{news_id} PUT",
            before_obj=before_snapshot,
            after_obj=after_snapshot,
        )

        return jsonify({"message": "News item updated successfully", "news": after_snapshot}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to update news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/<news_id>", methods=["DELETE"])
def delete_news(news_id):
    """Delete a news item."""
    try:
        user = session.get("user")
        if not user:
            return jsonify({"ok": False, "error": "Not signed in"}), 401

        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"error": "News item not found"}), 404

        before_snapshot = existing_news.to_dict()

        existing_news.delete(news_id)

        ChangeLog.log(
            changed_table="News",
            record_pk=str(news_id),
            operation="DELETE",
            changed_by=user.get("PersonID"),
            source=f"api/news/{news_id} DELETE",
            before_obj=before_snapshot,
            after_obj=None,
        )

        return jsonify({"message": "News item deleted successfully", "Id": news_id}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to delete news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/search", methods=["GET"])
def search_news():
    """Search news by title or content."""
    try:
        query = (request.args.get("q") or "").strip()
        if not query:
            return jsonify({"error": "Search query required"}), 400

        rows = fetch_all(
            """
            SELECT ID, Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt
            FROM News
            WHERE Title LIKE %s OR Content LIKE %s
            ORDER BY CreatedAt DESC
            """,
            (f"%{query}%", f"%{query}%"),
        )

        news_list = []
        for row in rows:
            news_item = News.from_db_row(row)
            if news_item:
                news_list.append(news_item.to_dict())

        return jsonify(news_list), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to search news"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/subscribe", methods=["POST"])
def subscribe_newsletter():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not validate_email(email):
            return jsonify({"error": "Invalid email address"}), 400

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

        return jsonify({"message": "Subscribed successfully"}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to subscribe"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/unsubscribe", methods=["POST"])
def unsubscribe_newsletter():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not validate_email(email):
            return jsonify({"error": "Invalid email address"}), 400

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
            return jsonify({"message": "Email is already unsubscribed or not found"}), 200

        return jsonify({"message": "Unsubscribed successfully"}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to unsubscribe"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route("/news/subscription-status", methods=["GET"])
def newsletter_subscription_status():
    try:
        email = (request.args.get("email") or "").strip().lower()
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not validate_email(email):
            return jsonify({"error": "Invalid email address"}), 400

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
        return jsonify({"isSubscribed": is_subscribed}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to check subscription status"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500