# HealthInsight

## Medical Test Interpretation & Health Report Management System

HealthInsight is a web-based healthcare application designed to help users understand and manage laboratory test results and medical reports in a simple, organized, and understandable way.

The system interprets laboratory test values by comparing them with appropriate reference ranges and classifies the results as **Normal, High, or Low**. It also supports the management and storage of health records, X-ray reports, and MRI reports.

> **Disclaimer:** HealthInsight provides general information based on entered medical test values. It does not provide a medical diagnosis and does not replace professional medical advice.

---

## Project Domain

- Web Development
- Healthcare
- Health Informatics

---

## Problem Statement

Medical reports contain complex medical terminology, numerical values, reference ranges, and medical imaging information. Patients may find it difficult to understand laboratory results and information from medical reports and scans.

Using multiple online sources for interpretation can lead to confusion and inconsistent understanding of medical information.

Health information is sensitive, creating a need for secure authentication and controlled access to patient records.

### Key Problem

Patients need a single, understandable, and secure platform to interpret and manage laboratory reports and medical imaging information without replacing professional medical advice.

---

## Objectives

The main objectives of HealthInsight are:

- Interpret laboratory test values using appropriate reference ranges.
- Classify test results as **Normal, High, or Low**.
- Provide simple and understandable explanations of medical results without providing a diagnosis.
- Support the management and organization of laboratory, X-ray, and MRI reports.
- Provide secure access to sensitive health information using Multi-Factor Authentication (MFA).
- Store patient health records securely for future reference.
- Help users understand changes in health parameters over time.
- Provide trend and correlation analysis using stored health data.

---

## Key Features

### 1. Laboratory Test Interpretation

HealthInsight compares entered laboratory test values with predefined reference ranges.

The result is classified as:

- Normal
- High
- Low

### 2. Simple Explanation

The system converts interpreted test results into simple and understandable language.

It explains whether a value is within, above, or below the specified reference range without providing a medical diagnosis.

### 3. Data Visualization

Results can be displayed using charts and graphs to make the information easier to understand.

Visual indicators are used to distinguish different result categories:

- Green = Normal
- Red = High
- Orange = Low

### 4. Health Record Storage

Patient details and laboratory test results are stored in an SQLite database.

The system maintains previous records so that stored information can be accessed for future reference.

### 5. X-Ray & MRI Scan Management

HealthInsight supports the management of medical imaging information.

Users can:

- Upload X-ray and MRI scan files.
- Select the scan type.
- Validate and store scan information.
- Associate scans with the corresponding patient record.
- View and retrieve previously uploaded scans.

### 6. Secure Authentication

The system provides secure authentication before users can access protected patient records.

The authentication process includes:

- Username
- Password
- Multi-Factor Authentication (MFA)

### 7. Health Trend & Correlation Analysis

HealthInsight uses previously stored test results to track changes over time.

It can help with:

- Historical health data visualization
- Parameter comparison
- Trend identification
- Relationships between selected health parameters
- Correlation analysis

### 8. Patient Dashboard

The dashboard provides a centralized place where users can:

- View interpreted results
- Access previous records
- Manage reports
- View health trends
- View visualizations

---

## System Architecture

```text
                         USER
                           |
                           ↓
                HTML / CSS / JavaScript
                           |
                           ↓
                    Flask Backend
                           |
                           ↓
              Python Interpretation Engine
                           |
                           ↓
                    SQLite Database
                           |
                           ↓
                  Patient Dashboard
