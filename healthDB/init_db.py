import os
import sqlite3

# Connect to the database.
# If it does not exist, SQLite creates it in healthDB/.
DB_PATH = os.path.join(os.path.dirname(__file__), "healthinsight.db")
connection = sqlite3.connect(DB_PATH)

# Enable relationships between tables.
connection.execute("PRAGMA foreign_keys = ON")

cursor = connection.cursor()

# TABLE 1: Patient information
cursor.execute("""
CREATE TABLE IF NOT EXISTS Patients (
    patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
""")

# TABLE 2: Laboratory test results
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

    FOREIGN KEY (patient_id)
        REFERENCES Patients(patient_id)
)
""")

# TABLE 3: Medical scan information
cursor.execute("""
CREATE TABLE IF NOT EXISTS MedicalScans (
    scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    scan_type TEXT NOT NULL
        CHECK (scan_type IN ('X-ray', 'MRI')),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)
        REFERENCES Patients(patient_id)
)
""")

# Save the changes and close the database connection.
connection.commit()
connection.close()

print("HealthInsight database created successfully!")
print("Tables: Patients, LabResults, MedicalScans")