from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/")
def home():
    return "HealthInsight Backend is Running!"


@app.route("/api/health")
def health_check():
    return jsonify({
        "status": "success",
        "message": "HealthInsight API is working"
    })
@app.route("/api/test", methods=["POST"])
def test_data():
    data = request.get_json()

    return jsonify({
        "status": "success",
        "received_data": data
    })


if __name__ == "__main__":
    app.run(debug=True)