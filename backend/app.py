import json
import os
import sqlite3
import sys
import uuid
from datetime import datetime
from flask import Flask, jsonify, request

# Add parent directory to sys.path to import interpretation engine
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import interpretation  # noqa: E402

app = Flask(__name__)

# Single SQLite Database location in healthDB
DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "healthDB", "healthinsight.db")
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Patients (
            patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS LabResults (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            test_name TEXT NOT NULL,
            test_value REAL NOT NULL,
            unit TEXT,
            reference_min REAL,
            reference_max REAL,
            status TEXT,
            explanation TEXT,
            test_date TEXT DEFAULT CURRENT_DATE,
            FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS MedicalScans (
            scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            scan_type TEXT NOT NULL CHECK (scan_type IN ('X-ray', 'MRI')),
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()


init_db()


# -------------------------------------------------------------
# CORS & OPTIONS Handling
# -------------------------------------------------------------
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return "", 204


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# -------------------------------------------------------------
# Basic & Health Endpoints
# -------------------------------------------------------------
@app.route("/")
def home():
    return "HealthInsight Backend is Running!"


@app.route("/api/health")
def health_check():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(DISTINCT patient_id) FROM LabResults")
        reports_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM MedicalScans")
        imaging_count = cursor.fetchone()[0]
        conn.close()
        db_status = "connected"
    except Exception as e:
        reports_count = 0
        imaging_count = 0
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "success",
        "message": "HealthInsight API is working",
        "database": db_status,
        "reports_count": reports_count,
        "imaging_count": imaging_count,
    })


@app.route("/api/tests", methods=["GET"])
def get_standard_tests():
    """Returns available standard tests and prototype reference ranges."""
    return jsonify({
        "status": "success",
        "tests": interpretation.STANDARD_TESTS,
    })


# -------------------------------------------------------------
# Interpretation Engine Endpoints
# -------------------------------------------------------------
@app.route("/api/interpret", methods=["POST"])
def interpret_single_test():
    """
    Interpret a single medical test value.
    Accepts: { test_name, value, unit (opt), low (opt), high (opt) }
    """
    data = request.get_json(silent=True) or {}
    test_name = data.get("test_name") or data.get("name")
    value = data.get("value")
    unit = data.get("unit")
    low = data.get("low")
    high = data.get("high")

    if not test_name:
        return jsonify({"error": "Test name is required."}), 400

    if value is None:
        return jsonify({"error": "Test value is required."}), 400

    try:
        result = interpretation.interpret_test(
            test_name=test_name,
            value=value,
            unit=unit,
            low=low,
            high=high,
        )
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal interpretation error: {str(e)}"}), 500


@app.route("/api/reports/analyze", methods=["POST"])
def analyze_report_route():
    """
    Analyze multiple laboratory test items for a patient report.
    Accepts: { patient: { name, age, gender }, date, tests: [...] }
    """
    data = request.get_json(silent=True) or {}
    patient = data.get("patient") or {
        "name": data.get("patient_name"),
        "age": data.get("patient_age"),
        "gender": data.get("patient_gender"),
    }
    tests = data.get("tests", [])
    report_date = data.get("date") or data.get("report_date")

    try:
        analyzed = interpretation.interpret_report(
            patient=patient,
            tests=tests,
            report_date=report_date,
        )
        analyzed["id"] = str(uuid.uuid4())
        return jsonify({
            "status": "success",
            "report": analyzed,
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to analyze report: {str(e)}"}), 500


# -------------------------------------------------------------
# Reports Management & SQLite Storage
# -------------------------------------------------------------
@app.route("/api/reports", methods=["GET"])
def list_reports():
    """Retrieve all stored laboratory reports grouped by patient and date."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                p.patient_id,
                p.full_name,
                p.age,
                p.gender,
                p.created_at,
                l.result_id,
                l.test_name,
                l.test_value,
                l.unit,
                l.reference_min,
                l.reference_max,
                l.status,
                l.explanation,
                l.test_date
            FROM Patients p
            JOIN LabResults l ON p.patient_id = l.patient_id
            ORDER BY l.test_date DESC, p.patient_id DESC, l.result_id ASC
        """)
        rows = cursor.fetchall()
        conn.close()

        # Group rows by patient_id and test_date
        reports_map = {}
        for r in rows:
            group_key = f"{r['patient_id']}_{r['test_date']}"
            if group_key not in reports_map:
                reports_map[group_key] = {
                    "id": str(r["patient_id"]),
                    "patient": {
                        "id": r["patient_id"],
                        "name": r["full_name"],
                        "age": r["age"],
                        "gender": r["gender"],
                    },
                    "date": r["test_date"],
                    "tests": [],
                    "createdAt": r["created_at"],
                }

            norm_key = interpretation.normalize_key(r["test_name"])
            reports_map[group_key]["tests"].append({
                "result_id": r["result_id"],
                "key": norm_key or r["test_name"].lower(),
                "name": r["test_name"],
                "test_name": r["test_name"],
                "value": r["test_value"],
                "unit": r["unit"] or "",
                "low": r["reference_min"],
                "high": r["reference_max"],
                "status": r["status"] or "NORMAL",
                "explanation": r["explanation"] or "",
            })

        reports = []
        for rep in reports_map.values():
            attention_count = sum(
                1 for t in rep["tests"] if (t["status"] or "").upper() != "NORMAL"
            )
            if attention_count == 0:
                rep["overall_status"] = "All entered results are within range"
            else:
                rep["overall_status"] = (
                    f"{attention_count} result{'s' if attention_count > 1 else ''} need attention"
                )
            reports.append(rep)

        return jsonify({
            "status": "success",
            "reports": reports,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve reports: {str(e)}"}), 500


@app.route("/api/reports", methods=["POST"])
def save_report():
    """Save an analyzed report to SQLite database (Patients and LabResults)."""
    data = request.get_json(silent=True) or {}
    patient = data.get("patient") or {}
    patient_name = (patient.get("name") or data.get("patient_name", "")).strip()
    patient_age = patient.get("age") or data.get("patient_age")
    patient_gender = patient.get("gender") or data.get("patient_gender", "")
    report_date = data.get("date") or data.get("report_date") or datetime.now().strftime("%Y-%m-%d")
    tests = data.get("tests", [])

    if not patient_name:
        return jsonify({"error": "Patient name is required."}), 400
    if not tests:
        return jsonify({"error": "At least one test is required to save report."}), 400

    # Ensure tests are interpreted
    if any("status" not in t for t in tests):
        try:
            analyzed = interpretation.interpret_report(
                patient={"name": patient_name, "age": patient_age, "gender": patient_gender},
                tests=tests,
                report_date=report_date,
            )
            tests = analyzed["tests"]
            overall_status = analyzed["overall_status"]
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
    else:
        attention_count = sum(
            1 for t in tests if (t.get("status") or "").upper() != "NORMAL"
        )
        overall_status = (
            "All entered results are within range"
            if attention_count == 0
            else f"{attention_count} result{'s' if attention_count > 1 else ''} need attention"
        )

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Insert new patient entry
        cursor.execute(
            """
            INSERT INTO Patients (full_name, age, gender)
            VALUES (?, ?, ?)
            """,
            (patient_name, patient_age, patient_gender),
        )
        patient_id = cursor.lastrowid

        # Insert laboratory results
        for test in tests:
            t_name = test.get("test_name") or test.get("name", "Unknown Test")
            t_val = float(test.get("value", 0))
            t_unit = test.get("unit", "")
            t_low = float(test.get("low", 0)) if test.get("low") is not None else None
            t_high = float(test.get("high", 0)) if test.get("high") is not None else None
            t_status = (test.get("status") or "NORMAL").upper()
            t_explanation = test.get("explanation", "")

            cursor.execute(
                """
                INSERT INTO LabResults
                (patient_id, test_name, test_value, unit, reference_min, reference_max, status, explanation, test_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    patient_id,
                    t_name,
                    t_val,
                    t_unit,
                    t_low,
                    t_high,
                    t_status,
                    t_explanation,
                    report_date,
                ),
            )

        conn.commit()
        conn.close()

        saved_report = {
            "id": str(patient_id),
            "patient": {
                "id": patient_id,
                "name": patient_name,
                "age": patient_age,
                "gender": patient_gender,
            },
            "date": report_date,
            "tests": tests,
            "overall_status": overall_status,
            "createdAt": datetime.now().isoformat(),
        }

        return jsonify({
            "status": "success",
            "message": "Report saved successfully.",
            "report": saved_report,
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to save report: {str(e)}"}), 500


@app.route("/api/reports/<patient_id>", methods=["DELETE"])
def delete_report(patient_id):
    """Delete a patient and their laboratory results by patient_id."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM LabResults WHERE patient_id = ?", (patient_id,))
        cursor.execute("DELETE FROM Patients WHERE patient_id = ?", (patient_id,))
        affected = cursor.rowcount
        conn.commit()
        conn.close()

        if affected == 0:
            return jsonify({"error": "Report not found."}), 404

        return jsonify({
            "status": "success",
            "message": "Report deleted successfully.",
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete report: {str(e)}"}), 500


# -------------------------------------------------------------
# X-Ray / MRI Imaging Reports Management
# -------------------------------------------------------------
@app.route("/api/imaging", methods=["GET"])
def list_imaging_reports():
    """Retrieve all stored imaging records."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                s.scan_id,
                s.patient_id,
                p.full_name,
                s.scan_type,
                s.file_name,
                s.uploaded_at
            FROM MedicalScans s
            JOIN Patients p ON s.patient_id = p.patient_id
            ORDER BY s.uploaded_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()

        records = [
            {
                "id": str(row["scan_id"]),
                "patient_name": row["full_name"],
                "scan_date": row["uploaded_at"].split()[0] if row["uploaded_at"] else "",
                "body_region": row["scan_type"],
                "image_filename": row["file_name"],
                "status": "Cataloged for Review",
                "notes": f"Radiological {row['scan_type']} scan cataloged for patient review.",
                "created_at": row["uploaded_at"],
            }
            for row in rows
        ]

        return jsonify({
            "status": "success",
            "records": records,
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to list imaging reports: {str(e)}"}), 500


@app.route("/api/imaging", methods=["POST"])
def save_imaging_report():
    """Save an X-ray / MRI record to SQLite database."""
    data = request.get_json(silent=True) or {}
    patient_name = (data.get("patient_name") or "Anonymous Patient").strip()
    scan_type = data.get("scan_type") or "X-ray"
    if scan_type not in ("X-ray", "MRI"):
        scan_type = "X-ray"
    file_name = data.get("image_filename") or "xray_scan.jpg"
    file_path = data.get("image_data") or file_name
    notes = data.get("notes") or "Educational preview only. Automated diagnosis is not performed."

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Create patient record for the scan
        cursor.execute(
            """
            INSERT INTO Patients (full_name, age, gender)
            VALUES (?, ?, ?)
            """,
            (patient_name, 0, "Not specified"),
        )
        patient_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO MedicalScans (patient_id, scan_type, file_name, file_path)
            VALUES (?, ?, ?, ?)
            """,
            (patient_id, scan_type, file_name, file_path),
        )
        scan_id = cursor.lastrowid

        conn.commit()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Imaging scan cataloged successfully.",
            "record": {
                "id": str(scan_id),
                "patient_name": patient_name,
                "scan_date": datetime.now().strftime("%Y-%m-%d"),
                "body_region": scan_type,
                "image_filename": file_name,
                "status": "Cataloged for Review",
                "notes": notes,
                "created_at": datetime.now().isoformat(),
            },
        }), 201
    except Exception as e:
        return jsonify({"error": f"Failed to save imaging report: {str(e)}"}), 500


@app.route("/api/imaging/<scan_id>", methods=["DELETE"])
def delete_imaging_report(scan_id):
    """Delete an imaging report."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT patient_id FROM MedicalScans WHERE scan_id = ?", (scan_id,))
        scan_row = cursor.fetchone()

        cursor.execute("DELETE FROM MedicalScans WHERE scan_id = ?", (scan_id,))
        affected = cursor.rowcount

        if scan_row:
            p_id = scan_row["patient_id"]
            cursor.execute("SELECT COUNT(*) FROM LabResults WHERE patient_id = ?", (p_id,))
            has_labs = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM MedicalScans WHERE patient_id = ?", (p_id,))
            has_scans = cursor.fetchone()[0]
            if has_labs == 0 and has_scans == 0:
                cursor.execute("DELETE FROM Patients WHERE patient_id = ?", (p_id,))

        conn.commit()
        conn.close()

        if affected == 0:
            return jsonify({"error": "Imaging report not found."}), 404

        return jsonify({
            "status": "success",
            "message": "Imaging report deleted successfully.",
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete imaging report: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)