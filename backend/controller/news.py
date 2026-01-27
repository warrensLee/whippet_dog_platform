from flask import Blueprint, jsonify, request
from mysql.connector import Error
from classes.news import News

news_bp = Blueprint("news", __name__, url_prefix="/api/news")


@news_bp.post("/register")
def register_news():
    data = request.get_json(silent=True) or {}
    news = News.from_request_data(data)

    validation_errors = news.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if News.exists(news.news_id):
        return jsonify({"ok": False, "error": "News already exists"}), 409
    try:
        news.save()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 201


@news_bp.post("/edit")
def edit_news():
    data = request.get_json(silent=True) or {}

    news_id = (data.get("newsId") or "").strip()
    if not news_id:
        return jsonify({"ok": False, "error": "News ID is required"}), 400

    news = News.from_request_data(data)
    news.news_id = news_id
    validation_errors = news.validate()
    if validation_errors:
        return jsonify({"ok": False, "error": ", ".join(validation_errors)}), 400

    if not News.exists(news_id):
        return jsonify({"ok": False, "error": "News does not exist"}), 404

    try:
        news.update()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@news_bp.post("/delete")
def delete_news():
    data = request.get_json(silent=True) or {}
    news_id = (data.get("newsId") or "").strip()

    if not news_id:
        return jsonify({"ok": False, "error": "News ID is required"}), 400

    if not News.exists(news_id):
        return jsonify({"ok": False, "error": "News does not exist"}), 404

    try:
        news = News.find_by_identifier(news_id)
        if not news:
            return jsonify({"ok": False, "error": "News does not exist"}), 404
        news.delete(news_id)
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    return jsonify({"ok": True}), 200


@news_bp.get("/get/<news_id>")
def get_news(news_id: str):
    news = News.find_by_identifier(news_id)
    if not news:
        return jsonify({"ok": False, "error": "News does not exist"}), 404
    return jsonify(news.to_dict()), 200


@news_bp.get("/list")
def list_all_news():
    try:
        news = News.list_all_news()
    except Error as e:
        return jsonify({"ok": False, "error": f"Database error: {str(e)}"}), 500

    news_data = [news.to_dict() for news in news]
    return jsonify(news_data), 200           