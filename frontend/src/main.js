import "./style.css";

/* =========================================================
   HEALTHINSIGHT TEST DATABASE & BACKEND API CONFIG
========================================================= */

const API_BASE =
  window.location.port === "5000" ? "/api" : "http://127.0.0.1:5000/api";

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
  updateDashboard();
  renderHistory();
  updateTrendTestOptions();
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
      updateTrendTestOptions();
      return;
    }
  } catch (err) {
    console.warn("Could not load reports from backend, using local cache:", err);
  }

  reports = loadLocalReports();
  updateDashboard();
  renderHistory();
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

  if (sectionId === "history") {
    renderHistory();
  }

  if (sectionId === "trends") {
    updateTrendTestOptions();
    renderTrendChart();
  }
}

/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {
  $("#startReportButton")?.addEventListener("click", () =>
    navigateTo("new-report")
  );

  $("#addTestButton")?.addEventListener("click", addTest);

  $("#analyzeButton")?.addEventListener("click", analyzeReport);

  $("#clearReportButton")?.addEventListener("click", clearReportForm);

  $("#newAnalysisButton")?.addEventListener("click", () =>
    navigateTo("new-report")
  );

  $("#saveReportButton")?.addEventListener("click", saveCurrentReport);

  $("#viewHistoryButton")?.addEventListener("click", () =>
    navigateTo("history")
  );

  $("#historyNewButton")?.addEventListener("click", () =>
    navigateTo("new-report")
  );

  $("#trendTest")?.addEventListener("change", renderTrendChart);
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

  const payload = {
    patient: {
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
    updateDashboard();
    renderHistory();
    updateTrendTestOptions();

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
    renderHistory();
    updateDashboard();
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
  const totalReports = reports.length;
  const allTests = reports.flatMap((report) => report.tests || []);

  const normal = allTests.filter(
    (test) => (test.status || "").toUpperCase() === "NORMAL"
  ).length;

  const attention = allTests.filter(
    (test) => (test.status || "").toUpperCase() !== "NORMAL"
  ).length;

  const totalReportsEl = $("#totalReports");
  const normalResultsEl = $("#normalResults");
  const attentionResultsEl = $("#attentionResults");
  const testsAnalyzedEl = $("#testsAnalyzed");

  if (totalReportsEl) totalReportsEl.textContent = totalReports;
  if (normalResultsEl) normalResultsEl.textContent = normal;
  if (attentionResultsEl) attentionResultsEl.textContent = attention;
  if (testsAnalyzedEl) testsAnalyzedEl.textContent = allTests.length;

  const total = normal + attention;
  const normalPercentage = total ? Math.round((normal / total) * 100) : 0;

  const normalPercentEl = $("#dashboardNormalPercent");
  const normalBarEl = $("#normalBar");
  const attentionBarEl = $("#attentionBar");

  if (normalPercentEl) normalPercentEl.textContent = `${normalPercentage}%`;
  if (normalBarEl) normalBarEl.style.width = `${normalPercentage}%`;
  if (attentionBarEl) attentionBarEl.style.width = `${100 - normalPercentage}%`;
}

/* =========================================================
   TRENDS
========================================================= */

function updateTrendTestOptions() {
  const select = $("#trendTest");
  if (!select) return;

  const selected = select.value;
  const availableTests = [
    ...new Set(
      reports.flatMap((report) =>
        (report.tests || []).map((test) => test.key || test.test_name)
      )
    ),
  ];

  select.innerHTML = `
    <option value="">Select a test</option>
    ${availableTests
      .map(
        (key) => `
          <option value="${key}">
            ${TESTS[key]?.name || key}
          </option>
        `
      )
      .join("")}
  `;

  if (availableTests.includes(selected)) {
    select.value = selected;
  }
}

function renderTrendChart() {
  const chart = $("#trendChart");
  const empty = $("#trendEmpty");
  if (!chart || !empty) return;

  const key = $("#trendTest").value;

  if (!key) {
    chart.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  const points = reports
    .flatMap((report) =>
      (report.tests || [])
        .filter((test) => (test.key || test.test_name) === key)
        .map((test) => ({
          date: report.date,
          value: test.value,
          status: test.status,
        }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!points.length) {
    chart.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  const test = TESTS[key] || {
    low: points[0].value * 0.8,
    high: points[0].value * 1.2,
    unit: "",
  };

  const values = points.map((point) => point.value);
  const max = Math.max(...values, test.high);
  const min = Math.min(...values, test.low);
  const spread = Math.max(max - min, 1);

  chart.innerHTML = `
    <div class="trend-axis">
      ${points
        .map((point) => {
          const position = ((point.value - min) / spread) * 100;
          const statusClass = (point.status || "NORMAL").toLowerCase();

          return `
            <div class="trend-point-wrapper" style="left:${position}%">
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
        Reference: ${test.low} – ${test.high} ${test.unit}
      </span>
    </div>
  `;
}

/* =========================================================
   CLEAR FORM
========================================================= */

function clearReportForm() {
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