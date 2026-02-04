"""
News API routes
"""
from flask import Blueprint, request, jsonify, session, current_app
from flask_mail import Message
from datetime import datetime
from classes.news import News
from database import fetch_all, execute, fetch_one
from mysql.connector import Error
from email_validator import validate_email, EmailNotValidError

news_bp = Blueprint('news', __name__, url_prefix="/api")

def is_valid_email(email):
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

@news_bp.route('/news', methods=['GET'])
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
    
@news_bp.route("/news/subscribe", methods=["POST"])
def subscribe_newsletter():
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get("email") or "").strip().lower()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        if not is_valid_email(email):
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
            (email,)
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

        if not is_valid_email(email):
            return jsonify({"error": "Invalid email address"}), 400

        rows = execute(
            """
            UPDATE NewsletterSubscription
            SET IsActive = 0,
                UnsubscribedAt = NOW()
            WHERE EmailAddress = %s
              AND IsActive = 1
            """,
            (email,)
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
        if not is_valid_email(email):
            return jsonify({"error": "Invalid email address"}), 400

        row = fetch_one(
            """
            SELECT IsActive
            FROM NewsletterSubscription
            WHERE EmailAddress = %s
            LIMIT 1
            """,
            (email,)
        )

        is_subscribed = bool(row and int(row.get("IsActive", 0)) == 1)
        return jsonify({"isSubscribed": is_subscribed}), 200

    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to check subscription status"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route('/news/<news_id>', methods=['GET'])
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


@news_bp.route('/news', methods=['POST'])
def create_news():
    """Create a new news item and automatically send newsletter to subscribers."""
    try:
        from main import mail  # Import mail
        
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
        
        # Automatically send newsletter to all subscribers
        newsletter_result = None
        try:
            # Get all active subscribers
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
                            sender=current_app.config['MAIL_DEFAULT_SENDER']
                        )
                        
                        # Use the news content as the email body
                        if news_item.content.strip().startswith("<") and ("</html>" in news_item.content or "</div>" in news_item.content or "</p>" in news_item.content):
                            msg.html = news_item.content
                        else:
                            msg.body = news_item.content
                        
                        mail.send(msg)
                        sent_count += 1
                    except Exception as e:
                        print(f"Failed to send to {recipient}: {e}")
                        failed_count += 1
                
                newsletter_result = {
                    "sent": sent_count,
                    "failed": failed_count,
                    "total": len(recipients)
                }
        except Exception as e:
            print(f"Newsletter sending error: {e}")
            # Don't fail the whole request if newsletter fails
            newsletter_result = {"error": "Failed to send newsletter"}
        
        response_data = {
            "message": "News item created successfully",
            "news": news_item.to_dict()
        }
        
        if newsletter_result:
            response_data["newsletter"] = newsletter_result
        
        return jsonify(response_data), 201
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to create news item", "dbError": str(e)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route('/news/<news_id>', methods=['PUT'])
def update_news(news_id):
    """Update an existing news item."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"error": "News item not found"}), 404
        
        news_item = News.from_request_data(data)
        news_item.news_id = news_id 
        
        news_item.updated_at = datetime.now()
        
        if not news_item.last_edited_at:
            news_item.last_edited_at = datetime.now()
        
        errors = news_item.validate()
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400
        
        # Update in database
        news_item.update()
        
        return jsonify({
            "message": "News item updated successfully",
            "news": news_item.to_dict()
        }), 200
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to update news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route('/news/<news_id>', methods=['DELETE'])
def delete_news(news_id):
    """Delete a news item."""
    try:
        existing_news = News.find_by_identifier(news_id)
        if not existing_news:
            return jsonify({"error": "News item not found"}), 404
        
        existing_news.delete(news_id)
        
        return jsonify({
            "message": "News item deleted successfully",
            "Id": news_id
        }), 200
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to delete news item"}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@news_bp.route('/news/search', methods=['GET'])
def search_news():
    """Search news by title or content."""
    try:
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({"error": "Search query required"}), 400
        
        rows = fetch_all(
            """
            SELECT ID, Title, Content, CreatedAt, UpdatedAt, AuthorID, LastEditedBy, LastEditedAt
            FROM News
            WHERE Title LIKE %s OR Content LIKE %s
            ORDER BY CreatedAt DESC
            """,
            (f"%{query}%", f"%{query}%")
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