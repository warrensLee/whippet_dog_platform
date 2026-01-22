import os
from flask import Flask, jsonify
from database import fetch_all, fetch_one
from authentication import auth_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-me")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)

app.register_blueprint(auth_bp)

@app.get("/health")
def health():
    return "OK", 200
    
@app.get("/api/tables")
def tables():
    rows = fetch_all("SHOW TABLES")
    return jsonify(rows)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
