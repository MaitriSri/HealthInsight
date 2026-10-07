import "./style.css";

/* =========================================================
   HEALTHINSIGHT TEST DATABASE & BACKEND API CONFIG
========================================================= */

const API_BASE =
  window.location.port === "5000"
    ? "/api"
    : `http://${window.location.hostname || "127.0.0.1"}:5000/api`;

let TESTS = {
  hemoglobin: {
    name: "Hemoglobin",
    unit: "g/dL",
    low: 12,
    high: 17,
    explanationNormal:
      "Your hemoglobin value is within the reference range used by this prototype.",
    explanationLow:
      "Your hemoglobin value is below the reference range. Low hemoglobin may be associated with reduced oxygen-carrying capacity. Discuss the result with a healthcare professional.",
    explanationHigh:
      "Your hemoglobin value is above the reference range. Discuss the result with a healthcare professional, especially if the result is unexpected.",
  },
  glucose: {
    name: "Blood Glucose",
    unit: "mg/dL",
    low: 70,
    high: 99,
    explanationNormal:
      "Your glucose value is within the reference range used by this prototype.",
    explanationLow:
      "Your glucose value is below the reference range. Low glucose can require attention depending on symptoms, timing, medications, and clinical context.",
    explanationHigh:
      "Your glucose value is above the reference range. Glucose results should be interpreted with information such as whether the sample was fasting and the individual's clinical context.",
  },
  cholesterol: {
    name: "Total Cholesterol",
    unit: "mg/dL",
    low: 0,
    high: 200,
    explanationNormal:
      "Your total cholesterol value is within the reference range used by this prototype.",
    explanationLow:
      "Your total cholesterol value is below the reference range used by this prototype.",
    explanationHigh:
      "Your total cholesterol value is above the reference range used by this prototype. Discuss the result with a healthcare professional.",
  },
  triglycerides: {
    name: "Triglycerides",
    unit: "mg/dL",
    low: 0,
    high: 150,
    explanationNormal:
      "Your triglyceride value is within the reference range used by this prototype.",
    explanationLow:
      "Your triglyceride value is below the reference range used by this prototype.",
    explanationHigh:
      "Your triglyceride value is above the reference range used by this prototype. Discuss the result with a healthcare professional.",
  },
  wbc: {
    name: "White Blood Cell Count",
    unit: "×10³/µL",
    low: 4,
    high: 11,
    explanationNormal:
      "Your white blood cell count is within the reference range used by this prototype.",
    explanationLow:
      "Your white blood cell count is below the reference range. Clinical interpretation depends on the individual's health context.",
    explanationHigh:
      "Your white blood cell count is above the reference range. Clinical interpretation depends on symptoms and other laboratory findings.",
  },
  platelets: {
    name: "Platelet Count",
    unit: "×10³/µL",
    low: 150,
    high: 450,
    explanationNormal:
      "Your platelet count is within the reference range used by this prototype.",
    explanationLow:
      "Your platelet count is below the reference range. Discuss the result with a healthcare professional.",
    explanationHigh:
      "Your platelet count is above the reference range. Discuss the result with a healthcare professional.",
  },
  creatinine: {
    name: "Creatinine",
    unit: "mg/dL",
    low: 0.6,
    high: 1.3,
    explanationNormal:
      "Your creatinine value is within the reference range used by this prototype.",
    explanationLow:
      "Your creatinine value is below the reference range used by this prototype.",
    explanationHigh:
      "Your creatinine value is above the reference range. Kidney-related interpretation should consider other clinical information and laboratory findings.",
  },
  vitaminD: {
    name: "Vitamin D",
    unit: "ng/mL",
    low: 30,
    high: 100,
    explanationNormal:
      "Your vitamin D value is within the reference range used by this prototype.",
    explanationLow:
      "Your vitamin D value is below the reference range used by this prototype. Discuss the result with a healthcare professional.",
    explanationHigh:
      "Your vitamin D value is above the reference range used by this prototype. Discuss the result with a healthcare professional.",
  },
};

/* =========================================================
   APPLICATION STATE
========================================================= */

let currentTests = [];
let currentAnalysis = null;
let reports = [];
let storedPatients = [];
let selectedPatientId = null;
let currentTrendView = "graph";

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeDate();
  initializeReportDate();
  setupNavigation();
  setupButtons();
  syncWithBackend();
});

/* =========================================================
   BACKEND SYNCHRONIZATION
========================================================= */

async function syncWithBackend() {
  const statusEl = $(".system-status");

  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    if (healthRes.ok) {
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot" style="background:#20a66a;box-shadow:0 0 0 3px rgba(32,166,106,.2);"></span> Connected (Port 5000)`;
      }

      // Fetch dynamic tests definition if available
      try {
        const testsRes = await fetch(`${API_BASE}/tests`);
        if (testsRes.ok) {
          const testsData = await testsRes.json();
          if (testsData.tests) {
            TESTS = testsData.tests;
          }
        }
      } catch (err) {
        console.warn("Using default tests dictionary.", err);
      }

      await loadPatients();
      await loadReportsFromBackend();
      return;
    }
  } catch (err) {
    console.warn("Backend not reachable at startup:", err);
  }

  // Fallback if backend is offline
  if (statusEl) {
    statusEl.innerHTML = `<span class="status-dot" style="background:#e99528;"></span> Backend Offline (Port 5000)`;
  }
  reports = loadLocalReports();
  deriveLocalPatients();
  updateDashboard();
  renderHistory();
  updatePatientDropdowns();
  updateTrendTestOptions();
}

function getUniquePatients(list = storedPatients) {
  const map = new Map();
  for (const p of list) {
    const key = (p.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        id: p.id,
        name: (p.name || "").trim(),
        age: p.age,
        gender: p.gender,
      });
    } else {
      const existing = map.get(key);
      if (!existing.id && p.id) existing.id = p.id;
      if (
        (existing.age === undefined ||
          existing.age === null ||
          existing.age === 0) &&
        p.age
      ) {
        existing.age = p.age;
      }
      if (
        (!existing.gender || existing.gender === "Unspecified") &&
        p.gender
      ) {
        existing.gender = p.gender;
      }
    }
  }
  return Array.from(map.values());
}

async function loadPatients() {
  try {
    const res = await fetch(`${API_BASE}/patients`);
    if (res.ok) {
      const data = await res.json();
      storedPatients = getUniquePatients(data.patients || []);
      updatePatientDropdowns();
      return;
    }
  } catch (err) {
    console.warn("Could not load patients from backend, deriving from reports:", err);
  }

  deriveLocalPatients();
}

function deriveLocalPatients() {
  const pMap = new Map();
  for (const rep of reports) {
    if (rep.patient && rep.patient.name) {
      const normKey = rep.patient.name.trim().toLowerCase();
      if (!pMap.has(normKey)) {
        pMap.set(normKey, {
          id: rep.patient.id,
          name: rep.patient.name.trim(),
          age: rep.patient.age,
          gender: rep.patient.gender,
        });
      } else {
        const existing = pMap.get(normKey);
        if (!existing.id && rep.patient.id) existing.id = rep.patient.id;
        if (
          (existing.age === undefined ||
            existing.age === null ||
            existing.age === 0) &&
          rep.patient.age
        ) {
          existing.age = rep.patient.age;
        }
        if (
          (!existing.gender || existing.gender === "Unspecified") &&
          rep.patient.gender
        ) {
          existing.gender = rep.patient.gender;
        }
      }
    }
  }
  storedPatients = Array.from(pMap.values());
  updatePatientDropdowns();
}

function updatePatientDropdowns() {
  storedPatients = getUniquePatients(storedPatients);

  // 1. New Report Patient Selector
  const patientSelect = $("#patientSelect");
  if (patientSelect) {
    const currentVal = patientSelect.value;
    patientSelect.innerHTML = `
      <option value="new">+ Create New Patient</option>
      ${storedPatients
        .map(
          (p) => `
            <option value="${p.id}">
              ${escapeHtml(p.name)} (${p.age ? p.age + " yrs, " : ""}${p.gender || "Unspecified"})
            </option>
          `
        )
        .join("")}
    `;
    if (
      currentVal &&
      (currentVal === "new" ||
        storedPatients.some((p) => String(p.id) === String(currentVal)))
    ) {
      patientSelect.value = currentVal;
    } else {
      patientSelect.value = "new";
    }
  }

  // 2. Health Trends Patient Selector
  const trendPatient = $("#trendPatient");
  if (trendPatient) {
    const currentTrendVal = trendPatient.value;
    trendPatient.innerHTML = `
      <option value="all">All Patients</option>
      ${storedPatients
        .map(
          (p) => `
            <option value="${p.id}">
              ${escapeHtml(p.name)} (${p.age ? p.age + " yrs" : ""})
            </option>
          `
        )
        .join("")}
    `;
    if (
      currentTrendVal &&
      (currentTrendVal === "all" ||
        storedPatients.some((p) => String(p.id) === String(currentTrendVal)))
    ) {
      trendPatient.value = currentTrendVal;
    } else {
      trendPatient.value = "all";
    }
  }

  // 3. Dashboard Patient Selector
  const dashboardPatientSelect = $("#dashboardPatientSelect");
  if (dashboardPatientSelect) {
    const currentDashVal = dashboardPatientSelect.value || "all";
    dashboardPatientSelect.innerHTML = `
      <option value="all">All Patients (Aggregate)</option>
      ${storedPatients
        .map(
          (p) => `
            <option value="${p.id}">
              ${escapeHtml(p.name)} (${p.age ? p.age + " yrs, " : ""}${p.gender || "Unspecified"})
            </option>
          `
        )
        .join("")}
    `;
    if (
      currentDashVal &&
      (currentDashVal === "all" ||
        storedPatients.some((p) => String(p.id) === String(currentDashVal)))
    ) {
      dashboardPatientSelect.value = currentDashVal;
    } else {
      dashboardPatientSelect.value = "all";
    }
  }
}

async function loadReportsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/reports`);
    if (res.ok) {
      const data = await res.json();
      reports = data.reports || [];
      saveLocalReports(reports); // cache locally
      updateDashboard();
      renderHistory();
      updatePatientDropdowns();
      updateTrendTestOptions();
      return;
    }
  } catch (err) {
    console.warn("Could not load reports from backend, using local cache:", err);
  }

  reports = loadLocalReports();
  updateDashboard();
  renderHistory();
  updatePatientDropdowns();
  updateTrendTestOptions();
}

/* =========================================================
   DATE
========================================================= */

function initializeDate() {
  const element = $("#currentDate");
  if (!element) return;

  const today = new Date();
  element.textContent = today.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initializeReportDate() {
  const input = $("#reportDate");
  if (!input) return;

  const today = new Date();
  input.value = today.toISOString().split("T")[0];
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;
      if (section) {
        navigateTo(section);
      }
    });
  });

  $$("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.go);
    });
  });
}

function navigateTo(sectionId) {
  if (!sectionId) return;

  $$(".page-section").forEach((section) => {
    section.classList.remove("active");
  });

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add("active");
  }

  $$(".nav-item").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });

  if (sectionId === "dashboard") {
    updatePatientDropdowns();
    updateDashboard();
  }

  if (sectionId === "new-report") {
    updatePatientDropdowns();
  }

  if (sectionId === "history") {
    renderHistory();
  }

  if (sectionId === "trends") {
    updatePatientDropdowns();
    updateTrendTestOptions();
    renderTrendChart();
  }
}

/* =========================================================
   BUTTONS & EVENT LISTENERS
========================================================= */

function setupButtons() {
  $("#startReportButton")?.addEventListener("click", () => {
    clearReportForm();
    navigateTo("new-report");
  });

  $("#dashboardPatientSelect")?.addEventListener("change", () => {
    updateDashboard();
  });

  $("#patientSelect")?.addEventListener("change", onPatientSelectChange);

  $("#patientName")?.addEventListener("input", onPatientNameInput);

  $("#addTestButton")?.addEventListener("click", addTest);

  $("#analyzeButton")?.addEventListener("click", analyzeReport);

  $("#clearReportButton")?.addEventListener("click", clearReportForm);

  $("#newAnalysisButton")?.addEventListener("click", () => {
    clearReportForm();
    navigateTo("new-report");
  });

  $("#saveReportButton")?.addEventListener("click", saveCurrentReport);

  $("#viewHistoryButton")?.addEventListener("click", () =>
    navigateTo("history")
  );

  $("#historyNewButton")?.addEventListener("click", () => {
    clearReportForm();
    navigateTo("new-report");
  });

  $("#trendPatient")?.addEventListener("change", onTrendPatientChange);

  $("#trendTest")?.addEventListener("change", renderTrendChart);

  $("#viewGraphBtn")?.addEventListener("click", () => {
    currentTrendView = "graph";
    $("#viewGraphBtn")?.classList.add("active");
    $("#viewLinearBtn")?.classList.remove("active");
    renderTrendChart();
  });

  $("#viewLinearBtn")?.addEventListener("click", () => {
    currentTrendView = "linear";
    $("#viewLinearBtn")?.classList.add("active");
    $("#viewGraphBtn")?.classList.remove("active");
    renderTrendChart();
  });
}

function onPatientSelectChange() {
  const select = $("#patientSelect");
  if (!select) return;

  const val = select.value;
  if (val === "new") {
    selectedPatientId = null;
    $("#patientName").value = "";
    $("#patientAge").value = "";
    $("#patientGender").value = "";
    $("#patientName").focus();
  } else {
    const patient = storedPatients.find((p) => String(p.id) === String(val));
    if (patient) {
      selectedPatientId = patient.id;
      $("#patientName").value = patient.name || "";
      $("#patientAge").value = patient.age || "";
      $("#patientGender").value = patient.gender || "";
    }
  }
}

function onPatientNameInput() {
  const nameInput = $("#patientName");
  if (!nameInput) return;
  const typed = nameInput.value.trim().toLowerCase();
  if (!typed) {
    selectedPatientId = null;
    const select = $("#patientSelect");
    if (select && select.value !== "new") select.value = "new";
    return;
  }

  const matched = storedPatients.find(
    (p) => (p.name || "").trim().toLowerCase() === typed
  );

  if (matched) {
    selectedPatientId = matched.id;
    const select = $("#patientSelect");
    if (select && String(select.value) !== String(matched.id)) {
      select.value = String(matched.id);
    }
    const ageInput = $("#patientAge");
    const genderSelect = $("#patientGender");
    if (
      ageInput &&
      (!ageInput.value || Number(ageInput.value) === 0) &&
      matched.age
    ) {
      ageInput.value = matched.age;
    }
    if (genderSelect && !genderSelect.value && matched.gender) {
      genderSelect.value = matched.gender;
    }
  } else {
    selectedPatientId = null;
    const select = $("#patientSelect");
    if (select && select.value !== "new") {
      select.value = "new";
    }
  }
}

function onTrendPatientChange() {
  updateTrendTestOptions();
  renderTrendChart();
}

/* =========================================================
   ADD TEST
========================================================= */

function addTest() {
  const testKey = $("#testSelect").value;
  const rawValue = $("#testValue").value;
  const value = parseFloat(rawValue);

  if (!testKey) {
    showToast("Please select a laboratory test.", "error");
    return;
  }

  if (rawValue.trim() === "" || Number.isNaN(value) || !Number.isFinite(value)) {
    showToast("Please enter a valid numerical value.", "error");
    return;
  }

  const test = TESTS[testKey] || {
    name: testKey,
    unit: "",
    low: 0,
    high: 100,
  };

  const existing = currentTests.find((item) => item.key === testKey);

  if (existing) {
    existing.value = value;
    showToast(`${test.name} value updated.`, "success");
  } else {
    currentTests.push({
      key: testKey,
      name: test.name,
      value,
      unit: test.unit,
      low: test.low,
      high: test.high,
    });
    showToast(`${test.name} added.`, "success");
  }

  $("#testSelect").value = "";
  $("#testValue").value = "";

  renderSelectedTests();
}

/* =========================================================
   RENDER SELECTED TESTS
========================================================= */

function renderSelectedTests() {
  const container = $("#selectedTests");
  if (!container) return;

  if (!currentTests.length) {
    container.innerHTML = `
      <div class="empty-tests">
        <div>◌</div>
        <p>No tests added yet.</p>
        <span>Select a test above to begin.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = currentTests
    .map(
      (test, index) => `
        <div class="selected-test">
          <div class="test-info">
            <div class="test-symbol">
              ${getTestIcon(test.key)}
            </div>
            <div>
              <strong>${test.name}</strong>
              <span>
                Reference: ${test.low} – ${test.high} ${test.unit}
              </span>
            </div>
          </div>

          <div class="entered-value">
            <strong>${test.value}</strong>
            <span>${test.unit}</span>
          </div>

          <button
            class="remove-test"
            data-index="${index}"
            aria-label="Remove test"
          >
            ×
          </button>
        </div>
      `
    )
    .join("");

  $$(".remove-test").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      currentTests.splice(index, 1);
      renderSelectedTests();
    });
  });
}

function getTestIcon(key) {
  const icons = {
    hemoglobin: "Hb",
    glucose: "G",
    cholesterol: "C",
    triglycerides: "TG",
    wbc: "W",
    platelets: "P",
    creatinine: "Cr",
    vitaminD: "D",
  };
  return icons[key] || "T";
}

/* =========================================================
   ANALYZE REPORT VIA BACKEND ENGINE
========================================================= */

async function analyzeReport() {
  const patientName = $("#patientName").value.trim();
  const age = $("#patientAge").value;
  const gender = $("#patientGender").value;
  const date = $("#reportDate").value;

  const validation = validateReport(patientName, age, gender, date);
  if (!validation.valid) {
    showValidation(validation.message);
    return;
  }

  // Auto-capture test input if user entered or changed a value without clicking "+ Add Test"
  const pendingTestKey = $("#testSelect")?.value;
  const pendingRawValue = $("#testValue")?.value;
  if (pendingTestKey && pendingRawValue && pendingRawValue.trim() !== "") {
    const val = parseFloat(pendingRawValue);
    if (!Number.isNaN(val) && Number.isFinite(val)) {
      const testDef = TESTS[pendingTestKey] || {
        name: pendingTestKey,
        unit: "",
        low: 0,
        high: 100,
      };
      const existing = currentTests.find((item) => item.key === pendingTestKey);
      if (existing) {
        existing.value = val;
      } else {
        currentTests.push({
          key: pendingTestKey,
          name: testDef.name,
          value: val,
          unit: testDef.unit,
          low: testDef.low,
          high: testDef.high,
        });
      }
      $("#testSelect").value = "";
      $("#testValue").value = "";
      renderSelectedTests();
    }
  }

  if (!currentTests.length) {
    showValidation("Please add at least one laboratory test.");
    return;
  }

  hideValidation();

  const analyzeBtn = $("#analyzeButton");
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing Report with Backend Engine...";
  }

  // Ensure selectedPatientId is linked if patient name matches existing patient
  if (!selectedPatientId && patientName) {
    const matched = storedPatients.find(
      (p) => (p.name || "").trim().toLowerCase() === patientName.toLowerCase()
    );
    if (matched) {
      selectedPatientId = matched.id;
    }
  }

  const payload = {
    patient: {
      id: selectedPatientId,
      name: patientName,
      age: Number(age),
      gender,
    },
    date,
    tests: currentTests,
  };

  try {
    const res = await fetch(`${API_BASE}/reports/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    currentAnalysis = data.report;
    if (selectedPatientId && currentAnalysis.patient) {
      currentAnalysis.patient.id = selectedPatientId;
    }

    renderResults();
    navigateTo("results");
    showToast("Report analyzed successfully by Backend Engine.", "success");
  } catch (error) {
    console.error("Backend analysis error:", error);
    showToast(
      `Backend interpretation failed: ${error.message}. Ensure Flask backend is running on port 5000.`,
      "error"
    );
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = "Analyze Report <span>→</span>";
    }
  }
}

/* =========================================================
   VALIDATION
========================================================= */

function validateReport(name, age, gender, date) {
  if (!name) {
    return {
      valid: false,
      message: "Please enter the patient name.",
    };
  }

  if (!age || Number(age) < 1) {
    return {
      valid: false,
      message: "Please enter a valid patient age.",
    };
  }

  if (!gender) {
    return {
      valid: false,
      message: "Please select the patient's gender.",
    };
  }

  if (!date) {
    return {
      valid: false,
      message: "Please select the report date.",
    };
  }

  return { valid: true };
}

/* =========================================================
   RESULTS
========================================================= */

function renderResults() {
  if (!currentAnalysis) return;

  const tests = currentAnalysis.tests;

  const normal = tests.filter(
    (test) => (test.status || "").toUpperCase() === "NORMAL"
  ).length;

  const low = tests.filter(
    (test) => (test.status || "").toUpperCase() === "LOW"
  ).length;

  const high = tests.filter(
    (test) => (test.status || "").toUpperCase() === "HIGH"
  ).length;

  $("#resultPatientText").textContent = `${currentAnalysis.patient.name} • ${
    currentAnalysis.patient.age
  } years • ${formatDate(currentAnalysis.date)}`;

  $("#resultNormalCount").textContent = normal;
  $("#resultLowCount").textContent = low;
  $("#resultHighCount").textContent = high;

  const attention = low + high;

  if (attention === 0) {
    $("#overallStatus").textContent = "All entered results are within range";
    $("#overallDescription").textContent =
      "All entered values fall within the reference ranges used by this prototype.";
  } else {
    $("#overallStatus").textContent = `${attention} result${
      attention > 1 ? "s" : ""
    } need attention`;
    $("#overallDescription").textContent =
      "Some entered values fall outside the reference ranges used by this prototype. Consult a qualified physician.";
  }

  renderResultCards();
  renderResultChart();
}

/* =========================================================
   RESULT CARDS
========================================================= */

function renderResultCards() {
  const container = $("#resultsList");
  if (!container || !currentAnalysis) return;

  container.innerHTML = currentAnalysis.tests
    .map((test) => {
      const statusClass = (test.status || "NORMAL").toLowerCase();
      const statusDisplay = (test.status || "NORMAL").toUpperCase();

      return `
        <article class="result-card ${statusClass}">
          <div class="result-card-header">
            <div class="result-test">
              <div class="result-test-icon">
                ${getTestIcon(test.key)}
              </div>
              <div>
                <h3>${test.test_name || test.name}</h3>
                <span>
                  Reference: ${test.low} – ${test.high} ${test.unit}
                </span>
              </div>
            </div>

            <div class="status-badge ${statusClass}">
              ${getStatusIcon(test.status)}
              ${statusDisplay}
            </div>
          </div>

          <div class="result-value-row">
            <div>
              <span class="result-label">Your value</span>
              <strong class="result-value">
                ${test.value}
                <small>${test.unit}</small>
              </strong>
            </div>

            <div class="range-mini">
              <span>${test.low}</span>
              <div class="range-track">
                <i style="width:${calculateRangePosition(test)}%;"></i>
                <b style="left:${calculateRangePosition(test)}%;"></b>
              </div>
              <span>${test.high}</span>
            </div>
          </div>

          <div class="explanation">
            <div class="explanation-icon">💡</div>
            <div>
              <strong>What this means</strong>
              <p>${escapeHtml(test.explanation || "")}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function getStatusIcon(status) {
  const s = (status || "").toUpperCase();
  if (s === "NORMAL") return "✓";
  if (s === "HIGH") return "↑";
  return "↓";
}

function calculateRangePosition(test) {
  const range = test.high - test.low;
  if (range <= 0) return 50;

  const extendedMin = test.low - range * 0.5;
  const extendedMax = test.high + range * 0.5;

  let percentage =
    ((test.value - extendedMin) / (extendedMax - extendedMin)) * 100;

  percentage = Math.max(4, Math.min(96, percentage));
  return percentage;
}

/* =========================================================
   RESULT CHART
========================================================= */

function renderResultChart() {
  const container = $("#resultChart");
  if (!container || !currentAnalysis) return;

  container.innerHTML = currentAnalysis.tests
    .map((test) => {
      const percentage = calculateRangePosition(test);
      const statusClass = (test.status || "NORMAL").toLowerCase();
      const statusDisplay = (test.status || "NORMAL").toUpperCase();

      return `
        <div class="chart-row">
          <div class="chart-label">${test.test_name || test.name}</div>
          <div class="chart-line">
            <div class="chart-normal-zone"></div>
            <div
              class="chart-marker ${statusClass}"
              style="left:${percentage}%"
            >
              <span>${test.value}</span>
            </div>
          </div>
          <div class="chart-status ${statusClass}">
            ${statusDisplay}
          </div>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   SAVE REPORT (SQLITE BACKEND INTEGRATION)
========================================================= */

async function saveCurrentReport() {
  if (!currentAnalysis) {
    showToast("There is no report to save.", "error");
    return;
  }

  const saveBtn = $("#saveReportButton");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving to SQLite...";
  }

  try {
    const res = await fetch(`${API_BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentAnalysis),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save report.");
    }

    const data = await res.json();
    if (data.report) {
      currentAnalysis = data.report;
    }

    await loadReportsFromBackend();
    await loadPatients();
    updateDashboard();
    renderHistory();
    updatePatientDropdowns();
    updateTrendTestOptions();

    // Reset draft state so subsequent reports start fresh
    currentTests = [];
    selectedPatientId = null;
    if ($("#patientSelect")) $("#patientSelect").value = "new";
    if ($("#testSelect")) $("#testSelect").value = "";
    if ($("#testValue")) $("#testValue").value = "";
    renderSelectedTests();

    showToast("Report saved successfully in SQLite database.", "success");
  } catch (error) {
    console.error("Save report error:", error);
    showToast(`Failed to save report: ${error.message}`, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Report";
    }
  }
}

/* =========================================================
   LOCAL STORAGE FALLBACK CACHE
========================================================= */

function loadLocalReports() {
  try {
    const stored = localStorage.getItem("healthInsightReports");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(list) {
  try {
    localStorage.setItem("healthInsightReports", JSON.stringify(list));
  } catch {
    // Ignored
  }
}

/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {
  const container = $("#historyList");
  if (!container) return;

  if (!reports.length) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">◷</div>
        <h3>No reports saved yet</h3>
        <p>Your analyzed reports will appear here when you save them.</p>
        <button class="primary-button" id="emptyHistoryButton">
          Create First Report →
        </button>
      </div>
    `;

    $("#emptyHistoryButton")?.addEventListener("click", () =>
      navigateTo("new-report")
    );
    return;
  }

  container.innerHTML = reports
    .map((report) => {
      const normal = (report.tests || []).filter(
        (t) => (t.status || "").toUpperCase() === "NORMAL"
      ).length;

      const attention = (report.tests || []).filter(
        (t) => (t.status || "").toUpperCase() !== "NORMAL"
      ).length;

      return `
        <article class="history-card">
          <div class="history-date">
            <span>${formatDate(report.date)}</span>
            <small>
              ${report.tests.length} test${report.tests.length !== 1 ? "s" : ""}
            </small>
          </div>

          <div class="history-patient">
            <div class="history-avatar">
              ${getInitials(report.patient?.name || "Patient")}
            </div>
            <div>
              <strong>${escapeHtml(report.patient?.name || "Anonymous")}</strong>
              <span>
                ${report.patient?.age || "?"} years • ${report.patient?.gender || "Unknown"}
              </span>
            </div>
          </div>

          <div class="history-results">
            <span class="history-normal">✓ ${normal} Normal</span>
            ${
              attention
                ? `<span class="history-attention">! ${attention} Attention</span>`
                : ""
            }
          </div>

          <button
            class="delete-report"
            data-id="${report.id}"
            title="Delete report from database"
          >
            ×
          </button>
        </article>
      `;
    })
    .join("");

  $$(".delete-report").forEach((button) => {
    button.addEventListener("click", () => {
      deleteReport(button.dataset.id);
    });
  });
}

async function deleteReport(id) {
  const confirmed = window.confirm("Delete this stored report from database?");
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/reports/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete report on backend.");
    }

    await loadReportsFromBackend();
    await loadPatients();
    renderHistory();
    updateDashboard();
    updatePatientDropdowns();
    updateTrendTestOptions();
    renderTrendChart();

    showToast("Report deleted from SQLite database.", "info");
  } catch (error) {
    console.error("Delete report error:", error);
    showToast(`Error: ${error.message}`, "error");
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {
  const selectedPatient = $("#dashboardPatientSelect")?.value || "all";

  // Find target patient's normalized name for resilient matching across dates
  const matchedSelectedPatient =
    selectedPatient !== "all"
      ? storedPatients.find((p) => String(p.id) === String(selectedPatient))
      : null;
  const targetPatientName = matchedSelectedPatient
    ? (matchedSelectedPatient.name || "").trim().toLowerCase()
    : null;

  // Filter reports according to selected patient scope
  const userFilteredReports = reports.filter((rep) => {
    if (selectedPatient === "all") return true;
    const repId = String(rep.patient?.id || "");
    const repName = (rep.patient?.name || "").trim().toLowerCase();
    return (
      repId === String(selectedPatient) ||
      (targetPatientName && repName === targetPatientName)
    );
  });

  // Collect the top 2 latest reports per patient for the health percentage calculation
  let latestReportsForHealthScore = [];

  if (selectedPatient !== "all") {
    // Specific patient: take their 2 most recent reports
    const sorted = [...userFilteredReports].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    latestReportsForHealthScore = sorted.slice(0, 2);
  } else {
    // All patients: for EACH unique user (by normalized name or id), extract their 2 most recent reports
    const patientReportsMap = new Map();
    for (const rep of reports) {
      const pid = (rep.patient?.name || rep.patient?.id || "unknown")
        .trim()
        .toLowerCase();
      if (!patientReportsMap.has(pid)) {
        patientReportsMap.set(pid, []);
      }
      patientReportsMap.get(pid).push(rep);
    }

    patientReportsMap.forEach((patientReports) => {
      const sorted = [...patientReports].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      latestReportsForHealthScore.push(...sorted.slice(0, 2));
    });
  }

  // All tests (hemoglobin, glucose, cholesterol, etc.) together from the latest reports
  const latestTests = latestReportsForHealthScore.flatMap((r) => r.tests || []);

  const normalLatest = latestTests.filter(
    (test) => (test.status || "").toUpperCase() === "NORMAL"
  ).length;

  const attentionLatest = latestTests.filter(
    (test) => (test.status || "").toUpperCase() !== "NORMAL"
  ).length;

  const totalLatestTests = normalLatest + attentionLatest;
  const normalPercentage = totalLatestTests
    ? Math.round((normalLatest / totalLatestTests) * 100)
    : 0;

  // Update active patient name label
  const nameEl = $("#dashboardActivePatientName");
  if (nameEl) {
    if (selectedPatient === "all") {
      nameEl.textContent = "All Patients (Aggregate)";
    } else {
      const found = storedPatients.find((p) => String(p.id) === String(selectedPatient));
      if (found) {
        nameEl.textContent = `${found.name} (${found.age ? found.age + " yrs, " : ""}${found.gender || "Unspecified"})`;
      } else {
        nameEl.textContent = "Selected Patient";
      }
    }
  }

  // Update hero sublabel to indicate calculation basis
  const basisEl = $("#healthAnalysisBasis");
  if (basisEl) {
    if (selectedPatient === "all") {
      basisEl.textContent = "Latest 2 Reports per Patient";
    } else {
      const count = latestReportsForHealthScore.length;
      basisEl.textContent = `Latest ${count} Report${count === 1 ? "" : "s"}`;
    }
  }

  // Update avatar in topbar
  const avatarEl = $(".avatar");
  if (avatarEl) {
    if (selectedPatient === "all") {
      avatarEl.textContent = "ALL";
    } else {
      const found = storedPatients.find((p) => String(p.id) === String(selectedPatient));
      avatarEl.textContent = found ? getInitials(found.name) : "PT";
    }
  }

  // Stat cards
  const totalReportsEl = $("#totalReports");
  const normalResultsEl = $("#normalResults");
  const attentionResultsEl = $("#attentionResults");
  const testsAnalyzedEl = $("#testsAnalyzed");

  if (totalReportsEl) totalReportsEl.textContent = userFilteredReports.length;
  if (normalResultsEl) normalResultsEl.textContent = normalLatest;
  if (attentionResultsEl) attentionResultsEl.textContent = attentionLatest;
  if (testsAnalyzedEl) testsAnalyzedEl.textContent = totalLatestTests;

  // Percentage and progress bars
  const normalPercentEl = $("#dashboardNormalPercent");
  const normalBarEl = $("#normalBar");
  const attentionBarEl = $("#attentionBar");

  if (normalPercentEl) normalPercentEl.textContent = `${normalPercentage}%`;
  if (normalBarEl) normalBarEl.style.width = `${normalPercentage}%`;
  if (attentionBarEl) attentionBarEl.style.width = `${100 - normalPercentage}%`;

  // Dynamically update the score ring conic gradient to match the normal percentage
  const ringEl = $(".score-ring");
  if (ringEl) {
    const deg = Math.round((normalPercentage / 100) * 360);
    ringEl.style.background = `radial-gradient(circle at center, white 55%, transparent 56%), conic-gradient(var(--blue) 0deg, #8c7cf0 ${deg}deg, #e8edf6 ${deg}deg)`;
  }
}

/* =========================================================
   TRENDS
========================================================= */

function updateTrendTestOptions() {
  const select = $("#trendTest");
  if (!select) return;

  const selectedPatient = $("#trendPatient")?.value || "all";
  const previousSelection = select.value;

  const matchedSelectedPatient =
    selectedPatient !== "all"
      ? storedPatients.find((p) => String(p.id) === String(selectedPatient))
      : null;
  const targetPatientName = matchedSelectedPatient
    ? (matchedSelectedPatient.name || "").trim().toLowerCase()
    : null;

  // Filter reports by selected patient if not "all"
  const relevantReports = reports.filter((rep) => {
    if (selectedPatient === "all") return true;
    const repId = String(rep.patient?.id || "");
    const repName = (rep.patient?.name || "").trim().toLowerCase();
    return (
      repId === String(selectedPatient) ||
      (targetPatientName && repName === targetPatientName)
    );
  });

  // Deduplicate test keys case-insensitively
  const testMap = new Map();
  for (const report of relevantReports) {
    for (const test of report.tests || []) {
      const rawKey = (test.key || test.test_name || test.name || "").trim();
      const normKey = rawKey.toLowerCase();
      if (normKey && !testMap.has(normKey)) {
        testMap.set(normKey, {
          key: normKey,
          displayName: TESTS[normKey]?.name || test.test_name || test.name || rawKey,
        });
      }
    }
  }

  const availableTests = Array.from(testMap.values());

  select.innerHTML = `
    <option value="">Select a test</option>
    ${availableTests
      .map(
        (t) => `
          <option value="${t.key}">
            ${t.displayName}
          </option>
        `
      )
      .join("")}
  `;

  if (previousSelection && testMap.has(previousSelection.toLowerCase())) {
    select.value = previousSelection.toLowerCase();
  } else if (availableTests.length > 0) {
    select.value = availableTests[0].key;
  } else {
    select.value = "";
  }
}

function renderTrendChart() {
  const chart = $("#trendChart");
  const empty = $("#trendEmpty");
  if (!chart || !empty) return;

  const key = $("#trendTest").value;
  const selectedPatient = $("#trendPatient")?.value || "all";

  if (!key) {
    chart.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  const matchedSelectedPatient =
    selectedPatient !== "all"
      ? storedPatients.find((p) => String(p.id) === String(selectedPatient))
      : null;
  const targetPatientName = matchedSelectedPatient
    ? (matchedSelectedPatient.name || "").trim().toLowerCase()
    : null;

  const normKey = key.toLowerCase();
  const points = reports
    .filter((rep) => {
      if (selectedPatient === "all") return true;
      const repId = String(rep.patient?.id || "");
      const repName = (rep.patient?.name || "").trim().toLowerCase();
      return (
        repId === String(selectedPatient) ||
        (targetPatientName && repName === targetPatientName)
      );
    })
    .flatMap((report) =>
      (report.tests || [])
        .filter((test) => {
          const tKey = (test.key || test.test_name || test.name || "").toLowerCase();
          return tKey === normKey;
        })
        .map((test) => ({
          date: report.date,
          patientName: report.patient?.name || "Patient",
          value: Number(test.value),
          unit: test.unit || "",
          status: test.status || "NORMAL",
        }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!points.length) {
    chart.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  const testDef = TESTS[normKey] || {
    name: normKey,
    low: points[0].value * 0.8,
    high: points[0].value * 1.2,
    unit: points[0].unit || "",
  };

  chart.className = `trend-chart ${currentTrendView === "graph" ? "graph-mode" : "linear-mode"}`;

  if (currentTrendView === "graph") {
    chart.innerHTML = renderGraphView(points, testDef);
  } else {
    chart.innerHTML = renderLinearView(points, testDef);
  }
}

function renderGraphView(points, testDef) {
  const svgWidth = 680;
  const svgHeight = 310;
  const marginLeft = 60;
  const marginRight = 40;
  const marginTop = 30;
  const marginBottom = 50;
  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  const values = points.map((p) => p.value);
  const dataMax = Math.max(...values, testDef.high);
  const dataMin = Math.min(...values, testDef.low);
  const yPadding = Math.max((dataMax - dataMin) * 0.15, 1);
  const yMax = dataMax + yPadding;
  const yMin = Math.max(0, dataMin - yPadding);
  const ySpread = Math.max(yMax - yMin, 0.1);

  const getY = (val) =>
    marginTop + chartHeight - ((val - yMin) / ySpread) * chartHeight;

  const getX = (index) => {
    if (points.length === 1) return marginLeft + chartWidth / 2;
    return marginLeft + (index / (points.length - 1)) * chartWidth;
  };

  // Normal range zone
  const normalTop = Math.max(marginTop, getY(testDef.high));
  const normalBottom = Math.min(marginTop + chartHeight, getY(testDef.low));
  const normalHeight = Math.max(2, normalBottom - normalTop);

  // Generate 5 grid ticks
  const tickCount = 5;
  const ticks = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(yMin + (i / (tickCount - 1)) * ySpread);
  }

  const pointCoords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.value),
    point: p,
  }));

  const polylinePoints = pointCoords.map((c) => `${c.x},${c.y}`).join(" ");

  let areaPath = "";
  if (points.length > 1) {
    const first = pointCoords[0];
    const last = pointCoords[pointCoords.length - 1];
    const baseline = marginTop + chartHeight;
    areaPath = `M ${first.x},${baseline} L ${polylinePoints.replace(/ /g, " L ")} L ${last.x},${baseline} Z`;
  }

  const getStatusColor = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "NORMAL") return "#20a66a";
    if (s === "HIGH") return "#d94141";
    return "#e08a1e";
  };

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="trend-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#356df3" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#356df3" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Background normal reference range zone -->
      <rect x="${marginLeft}" y="${normalTop}" width="${chartWidth}" height="${normalHeight}" fill="rgba(32, 166, 106, 0.12)" rx="4"/>
      
      <!-- Gridlines & Y-axis scale labels -->
      ${ticks
        .map((t) => {
          const y = getY(t);
          return `
            <line x1="${marginLeft}" y1="${y}" x2="${marginLeft + chartWidth}" y2="${y}" stroke="#edf1f7" stroke-width="1"/>
            <text x="${marginLeft - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#8896ab" font-family="Manrope, sans-serif">${t.toFixed(1)}</text>
          `;
        })
        .join("")}

      <!-- Normal threshold guide lines -->
      <line x1="${marginLeft}" y1="${normalBottom}" x2="${marginLeft + chartWidth}" y2="${normalBottom}" stroke="#20a66a" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.6"/>
      <text x="${marginLeft + chartWidth}" y="${normalBottom - 4}" text-anchor="end" font-size="9" fill="#1b8857" font-weight="700">Min: ${testDef.low} ${testDef.unit || ""}</text>

      <line x1="${marginLeft}" y1="${normalTop}" x2="${marginLeft + chartWidth}" y2="${normalTop}" stroke="#20a66a" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.6"/>
      <text x="${marginLeft + chartWidth}" y="${normalTop + 12}" text-anchor="end" font-size="9" fill="#1b8857" font-weight="700">Max: ${testDef.high} ${testDef.unit || ""}</text>

      <!-- Area fill underneath line -->
      ${areaPath ? `<path d="${areaPath}" fill="url(#trendAreaGradient)"/>` : ""}

      <!-- Main trend polyline -->
      ${points.length > 1 ? `<polyline points="${polylinePoints}" fill="none" stroke="#356df3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ""}

      <!-- Data point markers and labels -->
      ${pointCoords
        .map((c) => {
          const color = getStatusColor(c.point.status);
          const valDisplay = `${c.point.value}`;
          return `
            <!-- Vertical guide line -->
            <line x1="${c.x}" y1="${c.y}" x2="${c.x}" y2="${marginTop + chartHeight}" stroke="#dfe5ef" stroke-dasharray="2,2"/>
            
            <!-- Value pill -->
            <rect x="${c.x - 22}" y="${c.y - 28}" width="44" height="20" rx="5" fill="#1e293b"/>
            <text x="${c.x}" y="${c.y - 14}" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff" font-family="Manrope, sans-serif">${valDisplay}</text>
            
            <!-- Point circle marker -->
            <circle cx="${c.x}" cy="${c.y}" r="6.5" fill="${color}" stroke="#ffffff" stroke-width="2.5">
              <title>${c.point.patientName}: ${c.point.value} ${c.point.unit} (${c.point.status}) on ${formatDate(c.point.date)}</title>
            </circle>

            <!-- Date and patient label on X-axis -->
            <text x="${c.x}" y="${marginTop + chartHeight + 20}" text-anchor="middle" font-size="10" fill="#475569" font-weight="700" font-family="Manrope, sans-serif">${formatDate(c.point.date)}</text>
            <text x="${c.x}" y="${marginTop + chartHeight + 33}" text-anchor="middle" font-size="8" fill="#94a3b8">${escapeHtml(c.point.patientName)}</text>
          `;
        })
        .join("")}
    </svg>

    <div class="trend-legend">
      <div class="legend-item">
        <span class="legend-box green"></span>
        <span>Normal Range (${testDef.low} – ${testDef.high} ${testDef.unit || ""})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line blue"></span>
        <span>Measured Trend</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot green"></span>
        <span>Normal</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot orange"></span>
        <span>Low</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot red"></span>
        <span>High</span>
      </div>
    </div>
  `;
}

function renderLinearView(points, testDef) {
  return `
    <div class="trend-axis">
      ${points
        .map((point, index) => {
          const leftPercent =
            points.length === 1 ? 50 : 8 + (index / (points.length - 1)) * 84;
          const statusClass = (point.status || "NORMAL").toLowerCase();

          return `
            <div class="trend-point-wrapper" style="left:${leftPercent}%" title="${point.patientName}: ${point.value} ${point.unit} on ${formatDate(point.date)}">
              <div class="trend-point ${statusClass}">
                ${point.value}
              </div>
              <span>${formatDate(point.date)}</span>
            </div>
          `;
        })
        .join("")}
    </div>

    <div class="trend-reference">
      <span>
        Reference: ${testDef.low} – ${testDef.high} ${testDef.unit || ""}
      </span>
    </div>
  `;
}

/* =========================================================
   CLEAR FORM
========================================================= */

function clearReportForm() {
  selectedPatientId = null;
  if ($("#patientSelect")) $("#patientSelect").value = "new";
  $("#patientName").value = "";
  $("#patientAge").value = "";
  $("#patientGender").value = "";
  initializeReportDate();
  $("#testSelect").value = "";
  $("#testValue").value = "";
  currentTests = [];
  renderSelectedTests();
  hideValidation();
  showToast("Form cleared.", "info");
}

/* =========================================================
   VALIDATION MESSAGE & TOAST
========================================================= */

function showValidation(message) {
  const element = $("#validationMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.add("show");
}

function hideValidation() {
  $("#validationMessage")?.classList.remove("show");
}

function showToast(message, type = "info") {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

/* =========================================================
   UTILITIES
========================================================= */

function formatDate(dateString) {
  if (!dateString) return "Unknown date";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "P";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}