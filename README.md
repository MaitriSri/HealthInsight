# HealthInsight

## Medical Test Interpretation & Family Health Management System

HealthInsight is a healthcare web application that helps users keep track of their family's health information in one place.

Instead of managing the health records of only one person, the application allows multiple family members to be added and managed separately. Users can view the health information of individual family members as well as get an overall view of their family's health.

The application interprets laboratory test results by comparing values with their reference ranges and classifying them as **Normal, High, or Low**. It also provides health scores, graphs and visualizations to make changes in health data easier to understand.

HealthInsight is meant to help users organize and understand their health information. It does not replace a doctor or provide a medical diagnosis.

---

## Features

- Family member management
- Individual health profiles for each family member
- Laboratory test value interpretation
- Classification of results as **Normal, High, or Low**
- Simple explanations of test results
- Individual health percentage/score
- Overall family health percentage/score
- Health dashboard
- Health history and previous records
- Health trends over time
- Comparison of test values
- Graphs and charts for health data
- Correlation between different health parameters
- X-ray and MRI report management
- Secure storage of health records
- User authentication and MFA/OTP
- Separate health information for different family members

---

## How It Works

A user can add their family members and maintain their health records separately.

For each family member, the application can store medical test information and interpret laboratory values using the relevant reference ranges.

The dashboard provides both:

- **Individual view** – health information and score of a particular family member
- **Family view** – an overall health percentage/score based on the family's available health data

Graphs and charts are also used to make health trends and changes easier to understand.

---

## Example

For a Hemoglobin test:

| Test | Value | Reference Range | Result |
|---|---:|---:|---|
| Hemoglobin | 10 g/dL | 12–16 g/dL | Low |

The system compares the entered value with the reference range and identifies the result as **Low**. It then provides a simple explanation of the result.

The interpreted result becomes part of the person's health record and can also be used for the health dashboard and visualizations.

---

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** SQLite
- **Visualization:** Charts and graphs
- **Development:** Git and GitHub

---

## System Architecture

The application follows this basic flow:

**User → Frontend → Flask Backend → Interpretation Engine → SQLite Database → Dashboard & Visualizations**

The frontend collects information from the user and communicates with the Flask backend.

The backend processes the request, uses the interpretation logic where required, stores or retrieves information from SQLite, and sends the result back to the frontend.

---

## Main Modules

### 1. Family Member Management

Allows users to add and manage multiple family members.

Each family member has their own health information and records so that the data can be viewed separately.

### 2. Data Input

Allows health and laboratory test information to be entered for individual family members.

### 3. Data Processing

Validates and processes the information entered by the user before it is stored or interpreted.

### 4. Interpretation

Compares laboratory test values with their reference ranges and classifies them as:

- Normal
- High
- Low

### 5. Health Score

The application provides a health percentage/score for individual family members based on their available health data.

An overall family health percentage/score is also displayed to give users a quick view of the family's health status.

### 6. Health Dashboard

The dashboard brings the important health information together in one place.

Users can switch between individual family members and the overall family view.

### 7. Visualization

Health information is presented using graphs and charts.

These visualizations help users understand:

- Changes in test values
- Health trends over time
- Comparisons between values
- Relationships between different health parameters

### 8. Data Storage

Health records, family member information and test data are stored in the SQLite database for future use.

### 9. X-Ray and MRI Management

The application supports the management of X-ray and MRI report information linked to family members.

### 10. Security and Authentication

The application provides authenticated access to protect health information.

---

## Project Objectives

- To provide a single platform for managing family health information.
- To maintain separate health records for different family members.
- To interpret laboratory test values using appropriate reference ranges.
- To classify test results as Normal, High or Low.
- To provide simple explanations of test results.
- To provide individual health scores.
- To provide an overall family health score.
- To display health trends using graphs and visualizations.
- To organize laboratory, X-ray and MRI information.
- To securely store health records for future reference.
- To help users understand their health information without replacing professional medical advice.

---

## Project Status

### Implemented

- Frontend development
- Flask backend
- SQLite database
- Family member management
- Individual health records
- Laboratory test interpretation
- Normal/High/Low classification
- Individual health score
- Overall family health score
- Health dashboard
- Health history
- Graphs and visualizations
- Health trend analysis
- X-ray and MRI report management
- Backend and database integration
- System testing
- GitHub integration

### Future Enhancements

- OCR-based extraction of values directly from medical reports
- Support for a larger number of laboratory tests
- More advanced health analytics
- Advanced medical image analysis
- Additional visualization and reporting features
- Mobile application

---

## Team Members

| Name | Registration Number | Contribution |
|---|---|---|
| Sanskriti Tyagi | 25BHI10124 | Frontend Development |
| Kavya Trivedi | 25BHI10099 | Flask Backend, Routes and API Connections, README/Documentation |
| Harshjyot Rakhra | 25BHI10114 | SQLite Database |
| Maitri Srivastava | 25BHI10037 | Interpretation Engine, Integration, GitHub and Testing |
| Tejashri Bhandari | 25BHI10113 | PPT Modification and Project Report |

## Guided By

**Dr. Trapti Sharma**

---

## Disclaimer

HealthInsight is designed to help users organize and understand their health information. The results and health scores shown by the application are for informational purposes only.

The application does **not provide a medical diagnosis and does not replace professional medical advice**. Users should consult a qualified healthcare professional for medical decisions.

---

## Development

The project was developed by dividing the work into different modules:

1. Frontend development
2. Flask backend development
3. SQLite database
4. Laboratory test interpretation
5. Family member management
6. Health scoring
7. Health dashboard and visualizations
8. X-ray and MRI management
9. Integration of all modules
10. Testing and GitHub management
