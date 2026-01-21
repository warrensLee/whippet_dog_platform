from flask import Flask, jsonify
from database import fetch_all, fetch_one
app = Flask(__name__)

@app.get("/")
def home():
    return jsonify(status="ok", message="Flask is running")

@app.get("/health")
def health():
    return "OK", 200
    
@app.get("/api/tables")
def tables():
    rows = fetch_all("SHOW TABLES")
    return jsonify(rows)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
