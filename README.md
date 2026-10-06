# HealthInsight

## Medical Test Interpretation & Health Report Management System

HealthInsight is a healthcare web application designed to help users understand and manage their medical test reports in a simple and organized way. The system interprets laboratory test values by comparing them with appropriate reference ranges and classifies the results as **Normal, High, or Low**.

The project also provides a platform for managing **laboratory reports, X-ray reports, and MRI reports**, along with secure storage and authenticated access. It is designed to provide simple explanations of test results without replacing professional medical advice.

## Features

- Patient and report data management
- Laboratory test value interpretation
- Classification of results as **Normal, High, or Low**
- Simple explanations of laboratory results
- Upload and management of X-ray and MRI reports
- Secure storage of medical records
- User authentication with **Username, Password, and MFA/OTP**
- Dashboard for viewing interpreted results
- Historical record management
- Health trend analysis
- Comparison of test values over time
- Visualization using charts and graphs
- Correlation analysis between health parameters

## Example

For a Hemoglobin test:

| Test | Value | Reference Range | Result |
|---|---:|---:|---|
| Hemoglobin | 10 g/dL | 12–16 g/dL | Low |

The system compares the entered value with the reference range and provides a simple explanation that the value is below the given range.

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** SQLite
- **Visualization:** Matplotlib
- **Report Generation:** ReportLab

## System Architecture

The application follows this architecture:

**User → HTML/CSS/JavaScript → Flask Backend → Python Interpretation Engine → SQLite Database → Dashboard**

## Main Modules

### 1. Data Input
Allows patient details and laboratory test values to be entered into the system.

### 2. Data Processing
Validates and organizes the entered medical data.

### 3. Interpretation
Compares laboratory test values with their reference ranges and classifies them as **Normal, High, or Low**.

### 4. Explanation
Provides simple and understandable explanations of the interpreted results.

### 5. Visualization
Displays medical data using charts and graphs to help users understand their results and changes over time.

### 6. Data Storage
Stores patient information, test records, and report details securely for future reference.

### 7. Security and MFA
Provides authenticated access using username, password, and multi-factor authentication.

### 8. X-Ray and MRI Scan Management
Allows users to upload, select, validate, store, and retrieve X-ray and MRI report information linked to patient records.

### 9. Correlation and Health Trend Analysis
Uses historical test values to identify trends, changes, and relationships between different health parameters.

## Project Objectives

- To interpret laboratory test values using appropriate reference ranges.
- To classify test results as Normal, High, or Low.
- To provide simple explanations without giving a medical diagnosis.
- To organize laboratory, X-ray, and MRI reports.
- To provide secure access to medical information.
- To securely store health records for future reference.
- To help users understand changes and trends in their test results.

## Project Status

### Implemented

- Project requirements and system design
- Module identification and functional planning
- Database structure planning
- Laboratory interpretation logic design
- Frontend and backend architecture

### In Progress

- Web application development
- SQLite integration
- Laboratory interpretation module
- X-ray and MRI management
- Multi-factor authentication
- Correlation and health trend analysis

### Future Enhancements

- OCR-based medical report extraction
- Advanced medical image analysis
- Expanded laboratory test coverage

## Team Members

| Name | Roll Number | Contribution |
|---|---|---|
| Sanskriti Tyagi | 25BHI10124 | Frontend Development |
| Kavya Trivedi | 25BHI10099 | Flask Backend, Routes and API Connections, README/Documentation |
| Harshjyot Rakhra | 25BHI10114 | SQLite Database |
| Maitri Srivastava | 25BHI10037 | Interpretation Engine |
| Maitri Srivastava | 25BHI10037 | Integration, GitHub and Testing |
| Tejashri Bhandari | 25BHI10113 | PPT Modification and Project Report |

## Guided By

**Dr. Trapti Sharma**

## Disclaimer

HealthInsight is intended to help users understand and organize medical test information. It does **not provide medical diagnosis or replace professional medical advice**. Users should consult qualified healthcare professionals for medical decisions.

## Development Plan

The project development includes:

1. Frontend development
2. Flask backend development
3. SQLite database integration
4. Laboratory test interpretation
5. X-ray and MRI report management
6. Multi-factor authentication
7. Correlation and health trend analysis
8. System integration and testing
9. Final prototype development
