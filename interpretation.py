"""
HealthInsight - Medical Test Interpretation Engine

Provides reference range comparison, status classification (NORMAL, HIGH, LOW),
and educational explanations for laboratory values without diagnostic claims.
"""

from typing import Dict, Any, List, Optional
import math

DISCLAIMER = (
    "Interpretation is based on the provided reference range and does not replace "
    "professional medical advice."
)

# Standard laboratory test definitions with reference ranges and educational clinical notes
STANDARD_TESTS: Dict[str, Dict[str, Any]] = {
    "hemoglobin": {
        "name": "Hemoglobin",
        "unit": "g/dL",
        "low": 12.0,
        "high": 17.0,
        "noteLow": (
            "Reduced hemoglobin may be associated with decreased oxygen-carrying capacity. "
            "Discuss the result with a healthcare professional."
        ),
        "noteHigh": (
            "Discuss the result with a healthcare professional, especially if the result is unexpected."
        ),
        "noteNormal": (
            "Your hemoglobin value is within the reference range used by this prototype."
        ),
    },
    "glucose": {
        "name": "Blood Glucose",
        "unit": "mg/dL",
        "low": 70.0,
        "high": 99.0,
        "noteLow": (
            "Low glucose can require attention depending on symptoms, timing, medications, and clinical context."
        ),
        "noteHigh": (
            "Glucose results should be interpreted with information such as whether the sample was fasting and clinical context."
        ),
        "noteNormal": (
            "Your glucose value is within the standard fasting reference range."
        ),
    },
    "cholesterol": {
        "name": "Total Cholesterol",
        "unit": "mg/dL",
        "low": 0.0,
        "high": 200.0,
        "noteLow": (
            "Your total cholesterol value is below the reference range."
        ),
        "noteHigh": (
            "Discuss the result with a healthcare professional to review lipid profile and cardiovascular wellness."
        ),
        "noteNormal": (
            "Your total cholesterol value is within the desirable reference range."
        ),
    },
    "triglycerides": {
        "name": "Triglycerides",
        "unit": "mg/dL",
        "low": 0.0,
        "high": 150.0,
        "noteLow": (
            "Your triglyceride value is below the reference range."
        ),
        "noteHigh": (
            "Discuss the result with a healthcare professional to assess metabolic health."
        ),
        "noteNormal": (
            "Your triglyceride value is within the normal reference range."
        ),
    },
    "wbc": {
        "name": "White Blood Cell Count",
        "unit": "×10³/µL",
        "low": 4.0,
        "high": 11.0,
        "noteLow": (
            "Clinical interpretation depends on the individual's health context and history."
        ),
        "noteHigh": (
            "Clinical interpretation depends on symptoms, history, and other laboratory findings."
        ),
        "noteNormal": (
            "Your white blood cell count is within the reference range."
        ),
    },
    "platelets": {
        "name": "Platelet Count",
        "unit": "×10³/µL",
        "low": 150.0,
        "high": 450.0,
        "noteLow": (
            "Discuss the result with a healthcare professional."
        ),
        "noteHigh": (
            "Discuss the result with a healthcare professional."
        ),
        "noteNormal": (
            "Your platelet count is within the reference range."
        ),
    },
    "creatinine": {
        "name": "Creatinine",
        "unit": "mg/dL",
        "low": 0.6,
        "high": 1.3,
        "noteLow": (
            "Your creatinine value is below the reference range."
        ),
        "noteHigh": (
            "Kidney-related interpretation should consider other clinical information and laboratory findings."
        ),
        "noteNormal": (
            "Your creatinine value is within the reference range."
        ),
    },
    "vitaminD": {
        "name": "Vitamin D",
        "unit": "ng/mL",
        "low": 30.0,
        "high": 100.0,
        "noteLow": (
            "Low vitamin D is common; discuss supplementation or dietary sources with a physician."
        ),
        "noteHigh": (
            "Discuss the result with a healthcare professional if taking high-dose supplements."
        ),
        "noteNormal": (
            "Your vitamin D value is within the adequate reference range."
        ),
    },
}

# Alias resolution mapping
TEST_ALIASES: Dict[str, str] = {
    "hemoglobin": "hemoglobin",
    "hb": "hemoglobin",
    "hgb": "hemoglobin",
    "blood glucose": "glucose",
    "glucose": "glucose",
    "fbs": "glucose",
    "sugar": "glucose",
    "blood sugar": "glucose",
    "total cholesterol": "cholesterol",
    "cholesterol": "cholesterol",
    "chol": "cholesterol",
    "triglycerides": "triglycerides",
    "triglyceride": "triglycerides",
    "tg": "triglycerides",
    "white blood cell count": "wbc",
    "white blood cells": "wbc",
    "wbc": "wbc",
    "wbc count": "wbc",
    "platelet count": "platelets",
    "platelets": "platelets",
    "plt": "platelets",
    "creatinine": "creatinine",
    "creat": "creatinine",
    "serum creatinine": "creatinine",
    "vitamin d": "vitaminD",
    "vitamind": "vitaminD",
    "vit d": "vitaminD",
    "25-oh vitamin d": "vitaminD",
}


def normalize_key(name: str) -> str:
    """Normalize test name string to find alias or canonical key."""
    if not name:
        return ""
    clean = name.strip().lower().replace("_", " ").replace("-", " ")
    return TEST_ALIASES.get(clean, TEST_ALIASES.get(name.strip(), name.strip()))


def classify_value(value: float, low: float, high: float) -> str:
    """
    Classify a numeric test value relative to low and high boundaries.
    Returns: 'NORMAL', 'HIGH', or 'LOW'.
    """
    if value < low:
        return "LOW"
    elif value > high:
        return "HIGH"
    return "NORMAL"


def interpret_test(
    test_name: str,
    value: Any,
    unit: Optional[str] = None,
    low: Optional[float] = None,
    high: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Interpret a single laboratory test value.

    Args:
        test_name: Name or key of the test (e.g. 'Hemoglobin', 'glucose').
        value: Numeric test value (or numeric string).
        unit: Optional measurement unit (e.g. 'g/dL').
        low: Optional custom lower bound of reference range.
        high: Optional custom upper bound of reference range.

    Returns:
        Dict with status (LOW, NORMAL, HIGH), reference range, explanation, disclaimer.
    """
    if not test_name or not str(test_name).strip():
        raise ValueError("Test name is required.")

    # Validate and convert value
    try:
        numeric_value = float(value)
        if math.isnan(numeric_value) or math.isinf(numeric_value):
            raise ValueError()
    except (TypeError, ValueError):
        raise ValueError(f"Invalid test value: '{value}'. A finite numeric value is required.")

    key = normalize_key(test_name)
    standard_def = STANDARD_TESTS.get(key)

    # Determine reference range
    ref_low = low
    ref_high = high
    ref_unit = unit

    if ref_low is None and standard_def is not None:
        ref_low = standard_def["low"]

    if ref_high is None and standard_def is not None:
        ref_high = standard_def["high"]

    if not ref_unit and standard_def is not None:
        ref_unit = standard_def["unit"]

    if ref_low is None or ref_high is None:
        raise ValueError(
            f"Reference range not found for '{test_name}'. Please specify low and high values."
        )

    try:
        ref_low = float(ref_low)
        ref_high = float(ref_high)
    except (TypeError, ValueError):
        raise ValueError("Reference range boundaries (low and high) must be valid numbers.")

    if ref_low > ref_high:
        raise ValueError(
            f"Invalid reference range: lower bound ({ref_low}) cannot exceed upper bound ({ref_high})."
        )

    # Classification
    status = classify_value(numeric_value, ref_low, ref_high)
    display_name = standard_def["name"] if standard_def else str(test_name).strip()
    unit_str = f" {ref_unit}" if ref_unit else ""

    # Generate understandable educational explanation
    if status == "LOW":
        base_explanation = (
            f"The {display_name} value ({numeric_value}{unit_str}) is below "
            f"the provided reference range ({ref_low}-{ref_high}{unit_str})."
        )
        extra_note = standard_def.get("noteLow", "") if standard_def else ""
    elif status == "HIGH":
        base_explanation = (
            f"The {display_name} value ({numeric_value}{unit_str}) is above "
            f"the provided reference range ({ref_low}-{ref_high}{unit_str})."
        )
        extra_note = standard_def.get("noteHigh", "") if standard_def else ""
    else:
        base_explanation = (
            f"The {display_name} value ({numeric_value}{unit_str}) is within "
            f"the provided reference range ({ref_low}-{ref_high}{unit_str})."
        )
        extra_note = standard_def.get("noteNormal", "") if standard_def else ""

    full_explanation = f"{base_explanation} {extra_note}".strip() if extra_note else base_explanation

    return {
        "test_name": display_name,
        "key": key if standard_def else test_name.strip().lower(),
        "value": numeric_value,
        "unit": ref_unit or "",
        "low": ref_low,
        "high": ref_high,
        "status": status,
        "explanation": full_explanation,
        "disclaimer": DISCLAIMER,
    }


def interpret_report(
    patient: Dict[str, Any],
    tests: List[Dict[str, Any]],
    report_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Interpret a complete patient report containing multiple test items.
    """
    if not isinstance(tests, list) or len(tests) == 0:
        raise ValueError("Please provide at least one laboratory test.")

    patient_name = str(patient.get("name", "")).strip()
    if not patient_name:
        raise ValueError("Patient name is required.")

    try:
        patient_age = int(patient.get("age", 0))
        if patient_age < 1:
            raise ValueError()
    except (TypeError, ValueError):
        raise ValueError("Patient age must be a positive integer.")

    patient_gender = str(patient.get("gender", "")).strip()
    if not patient_gender:
        raise ValueError("Patient gender is required.")

    interpreted_tests = []
    normal_count = 0
    low_count = 0
    high_count = 0

    for test_item in tests:
        name = test_item.get("name") or test_item.get("key") or test_item.get("test_name")
        val = test_item.get("value")
        unit = test_item.get("unit")
        low = test_item.get("low")
        high = test_item.get("high")

        result = interpret_test(name, val, unit=unit, low=low, high=high)
        interpreted_tests.append(result)

        if result["status"] == "NORMAL":
            normal_count += 1
        elif result["status"] == "LOW":
            low_count += 1
        elif result["status"] == "HIGH":
            high_count += 1

    attention_count = low_count + high_count

    if attention_count == 0:
        overall_status = "All entered results are within range"
        overall_description = (
            "All entered values fall within the reference ranges used by this prototype."
        )
    else:
        overall_status = f"{attention_count} result{'s' if attention_count > 1 else ''} need attention"
        overall_description = (
            "Some entered values fall outside the reference ranges used by this prototype. "
            "Please consult a qualified healthcare provider."
        )

    return {
        "patient": {
            "name": patient_name,
            "age": patient_age,
            "gender": patient_gender,
        },
        "date": report_date or "",
        "tests": interpreted_tests,
        "summary": {
            "total": len(interpreted_tests),
            "normal": normal_count,
            "low": low_count,
            "high": high_count,
            "attention": attention_count,
            "normal_percentage": (
                round((normal_count / len(interpreted_tests)) * 100)
                if interpreted_tests
                else 0
            ),
        },
        "overall_status": overall_status,
        "overall_description": overall_description,
        "disclaimer": DISCLAIMER,
    }
