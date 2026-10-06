import "./style.css";


/* =========================================================
   HEALTHINSIGHT TEST DATABASE

   These are prototype reference ranges.
   In a real healthcare system they should come from
   the laboratory/backend according to the patient's
   applicable reference range.
========================================================= */

const TESTS = {

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
      "Your hemoglobin value is above the reference range. Discuss the result with a healthcare professional, especially if the result is unexpected."
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
      "Your glucose value is above the reference range. Glucose results should be interpreted with information such as whether the sample was fasting and the individual's clinical context."
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
      "Your total cholesterol value is above the reference range used by this prototype. Discuss the result with a healthcare professional."
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
      "Your triglyceride value is above the reference range used by this prototype. Discuss the result with a healthcare professional."
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
      "Your white blood cell count is above the reference range. Clinical interpretation depends on symptoms and other laboratory findings."
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
      "Your platelet count is above the reference range. Discuss the result with a healthcare professional."
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
      "Your creatinine value is above the reference range. Kidney-related interpretation should consider other clinical information and laboratory findings."
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
      "Your vitamin D value is above the reference range used by this prototype. Discuss the result with a healthcare professional."
  }

};


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentTests = [];
let currentAnalysis = null;

let reports = loadReports();


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeDate();

  initializeReportDate();

  setupNavigation();

  setupButtons();

  renderHistory();

  updateDashboard();

  updateTrendTestOptions();

});


/* =========================================================
   DATE
========================================================= */

function initializeDate() {

  const element = $("#currentDate");

  if (!element) return;

  const today = new Date();

  element.textContent =
    today.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

}


function initializeReportDate() {

  const input = $("#reportDate");

  if (!input) return;

  const today = new Date();

  input.value =
    today.toISOString().split("T")[0];

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  $$(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

      const section =
        button.dataset.section;

      navigateTo(section);

    });

  });


  $$("[data-go]").forEach(button => {

    button.addEventListener("click", () => {

      navigateTo(button.dataset.go);

    });

  });

}


function navigateTo(sectionId) {

  $$(".page-section").forEach(section => {

    section.classList.remove("active");

  });


  const target =
    document.getElementById(sectionId);

  if (target) {

    target.classList.add("active");

  }


  $$(".nav-item").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
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

  $("#startReportButton")
    ?.addEventListener(
      "click",
      () => navigateTo("new-report")
    );


  $("#addTestButton")
    ?.addEventListener(
      "click",
      addTest
    );


  $("#analyzeButton")
    ?.addEventListener(
      "click",
      analyzeReport
    );


  $("#clearReportButton")
    ?.addEventListener(
      "click",
      clearReportForm
    );


  $("#newAnalysisButton")
    ?.addEventListener(
      "click",
      () => navigateTo("new-report")
    );


  $("#saveReportButton")
    ?.addEventListener(
      "click",
      saveCurrentReport
    );


  $("#viewHistoryButton")
    ?.addEventListener(
      "click",
      () => navigateTo("history")
    );


  $("#historyNewButton")
    ?.addEventListener(
      "click",
      () => navigateTo("new-report")
    );


  $("#trendTest")
    ?.addEventListener(
      "change",
      renderTrendChart
    );

}


/* =========================================================
   ADD TEST
========================================================= */

function addTest() {

  const testKey =
    $("#testSelect").value;

  const value =
    parseFloat($("#testValue").value);


  if (!testKey) {

    showToast(
      "Please select a laboratory test.",
      "error"
    );

    return;

  }


  if (
    Number.isNaN(value) ||
    !Number.isFinite(value)
  ) {

    showToast(
      "Please enter a valid numerical value.",
      "error"
    );

    return;

  }


  const test = TESTS[testKey];


  const existing =
    currentTests.find(
      item => item.key === testKey
    );


  if (existing) {

    existing.value = value;

    showToast(
      `${test.name} updated.`,
      "success"
    );

  } else {

    currentTests.push({

      key: testKey,

      name: test.name,

      value,

      unit: test.unit,

      low: test.low,

      high: test.high

    });

    showToast(
      `${test.name} added.`,
      "success"
    );

  }


  $("#testSelect").value = "";

  $("#testValue").value = "";

  renderSelectedTests();

}


/* =========================================================
   RENDER SELECTED TESTS
========================================================= */

function renderSelectedTests() {

  const container =
    $("#selectedTests");


  if (!currentTests.length) {

    container.innerHTML = `

      <div class="empty-tests">

        <div>◌</div>

        <p>No tests added yet.</p>

        <span>
          Select a test above to begin.
        </span>

      </div>

    `;

    return;

  }


  container.innerHTML =
    currentTests.map(
      (test, index) => `

        <div class="selected-test">

          <div class="test-info">

            <div class="test-symbol">
              ${getTestIcon(test.key)}
            </div>

            <div>

              <strong>
                ${test.name}
              </strong>

              <span>
                Reference:
                ${test.low}
                –
                ${test.high}
                ${test.unit}
              </span>

            </div>

          </div>


          <div class="entered-value">

            <strong>
              ${test.value}
            </strong>

            <span>
              ${test.unit}
            </span>

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
    ).join("");


  $$(".remove-test").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const index =
          Number(button.dataset.index);

        currentTests.splice(index, 1);

        renderSelectedTests();

      }
    );

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

    vitaminD: "D"

  };

  return icons[key] || "T";

}


/* =========================================================
   ANALYZE REPORT
========================================================= */

function analyzeReport() {

  const patientName =
    $("#patientName").value.trim();

  const age =
    $("#patientAge").value;

  const gender =
    $("#patientGender").value;

  const date =
    $("#reportDate").value;


  const validation =
    validateReport(
      patientName,
      age,
      gender,
      date
    );


  if (!validation.valid) {

    showValidation(validation.message);

    return;

  }


  if (!currentTests.length) {

    showValidation(
      "Please add at least one laboratory test."
    );

    return;

  }


  hideValidation();


  const analyzedTests =
    currentTests.map(test => {

      const status =
        classifyValue(
          test.value,
          test.low,
          test.high
        );


      return {

        ...test,

        status,

        explanation:
          getExplanation(
            test.key,
            status
          )

      };

    });


  currentAnalysis = {

    id: crypto.randomUUID(),

    patient: {

      name: patientName,

      age: Number(age),

      gender

    },

    date,

    tests: analyzedTests,

    createdAt:
      new Date().toISOString()

  };


  renderResults();

  navigateTo("results");

}


/* =========================================================
   VALIDATION
========================================================= */

function validateReport(
  name,
  age,
  gender,
  date
) {

  if (!name) {

    return {
      valid: false,
      message: "Please enter the patient name."
    };

  }


  if (!age || Number(age) < 1) {

    return {
      valid: false,
      message: "Please enter a valid patient age."
    };

  }


  if (!gender) {

    return {
      valid: false,
      message: "Please select the patient's gender."
    };

  }


  if (!date) {

    return {
      valid: false,
      message: "Please select the report date."
    };

  }


  return {
    valid: true
  };

}


/* =========================================================
   CLASSIFICATION ENGINE
========================================================= */

function classifyValue(
  value,
  low,
  high
) {

  if (value < low) {

    return "Low";

  }


  if (value > high) {

    return "High";

  }


  return "Normal";

}


/* =========================================================
   EXPLANATION ENGINE
========================================================= */

function getExplanation(
  testKey,
  status
) {

  const test =
    TESTS[testKey];

  if (!test) {

    return "No explanation available.";

  }


  if (status === "Low") {

    return test.explanationLow;

  }


  if (status === "High") {

    return test.explanationHigh;

  }


  return test.explanationNormal;

}


/* =========================================================
   RESULTS
========================================================= */

function renderResults() {

  if (!currentAnalysis) return;


  const tests =
    currentAnalysis.tests;


  const normal =
    tests.filter(
      test => test.status === "Normal"
    ).length;


  const low =
    tests.filter(
      test => test.status === "Low"
    ).length;


  const high =
    tests.filter(
      test => test.status === "High"
    ).length;


  $("#resultPatientText").textContent =
    `${currentAnalysis.patient.name} • ${currentAnalysis.patient.age} years • ${formatDate(currentAnalysis.date)}`;


  $("#resultNormalCount").textContent =
    normal;


  $("#resultLowCount").textContent =
    low;


  $("#resultHighCount").textContent =
    high;


  const attention =
    low + high;


  if (attention === 0) {

    $("#overallStatus").textContent =
      "All entered results are within range";

    $("#overallDescription").textContent =
      "All entered values fall within the reference ranges used by this prototype.";

  } else {

    $("#overallStatus").textContent =
      `${attention} result${attention > 1 ? "s" : ""} need attention`;

    $("#overallDescription").textContent =
      "Some entered values fall outside the reference ranges used by this prototype.";

  }


  renderResultCards();

  renderResultChart();

}


/* =========================================================
   RESULT CARDS
========================================================= */

function renderResultCards() {

  const container =
    $("#resultsList");


  container.innerHTML =
    currentAnalysis.tests
      .map(test => {

        const statusClass =
          test.status.toLowerCase();


        return `

          <article
            class="result-card ${statusClass}"
          >

            <div class="result-card-header">

              <div class="result-test">

                <div class="result-test-icon">
                  ${getTestIcon(test.key)}
                </div>

                <div>

                  <h3>
                    ${test.name}
                  </h3>

                  <span>
                    Reference:
                    ${test.low}
                    –
                    ${test.high}
                    ${test.unit}
                  </span>

                </div>

              </div>


              <div class="status-badge ${statusClass}">
                ${getStatusIcon(test.status)}
                ${test.status}
              </div>

            </div>


            <div class="result-value-row">

              <div>

                <span class="result-label">
                  Your value
                </span>

                <strong class="result-value">
                  ${test.value}
                  <small>${test.unit}</small>
                </strong>

              </div>


              <div class="range-mini">

                <span>
                  ${test.low}
                </span>

                <div class="range-track">

                  <i
                    style="
                      width:${calculateRangePosition(test)}%;
                    "
                  ></i>

                  <b
                    style="
                      left:${calculateRangePosition(test)}%;
                    "
                  ></b>

                </div>

                <span>
                  ${test.high}
                </span>

              </div>

            </div>


            <div class="explanation">

              <div class="explanation-icon">
                💡
              </div>

              <div>

                <strong>
                  What this means
                </strong>

                <p>
                  ${test.explanation}
                </p>

              </div>

            </div>

          </article>

        `;

      })
      .join("");

}


function getStatusIcon(status) {

  if (status === "Normal") return "✓";

  if (status === "High") return "↑";

  return "↓";

}


function calculateRangePosition(test) {

  const range =
    test.high - test.low;


  if (range <= 0) return 50;


  const extendedMin =
    test.low - range * 0.5;


  const extendedMax =
    test.high + range * 0.5;


  let percentage =
    ((test.value - extendedMin) /
      (extendedMax - extendedMin)) * 100;


  percentage =
    Math.max(
      4,
      Math.min(96, percentage)
    );


  return percentage;

}


/* =========================================================
   RESULT CHART
========================================================= */

function renderResultChart() {

  const container =
    $("#resultChart");


  if (!container || !currentAnalysis) return;


  container.innerHTML =
    currentAnalysis.tests
      .map(test => {

        const percentage =
          calculateRangePosition(test);


        return `

          <div class="chart-row">

            <div class="chart-label">
              ${test.name}
            </div>

            <div class="chart-line">

              <div class="chart-normal-zone"></div>

              <div
                class="chart-marker ${test.status.toLowerCase()}"
                style="left:${percentage}%"
              >

                <span>
                  ${test.value}
                </span>

              </div>

            </div>

            <div class="chart-status ${test.status.toLowerCase()}">
              ${test.status}
            </div>

          </div>

        `;

      })
      .join("");

}


/* =========================================================
   SAVE REPORT
========================================================= */

function saveCurrentReport() {

  if (!currentAnalysis) {

    showToast(
      "There is no report to save.",
      "error"
    );

    return;

  }


  const alreadyExists =
    reports.some(
      report =>
        report.id === currentAnalysis.id
    );


  if (alreadyExists) {

    showToast(
      "This report is already saved.",
      "info"
    );

    return;

  }


  reports.unshift(currentAnalysis);

  saveReports();


  updateDashboard();

  renderHistory();

  updateTrendTestOptions();


  showToast(
    "Report saved successfully.",
    "success"
  );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadReports() {

  try {

    const stored =
      localStorage.getItem(
        "healthInsightReports"
      );


    return stored
      ? JSON.parse(stored)
      : [];

  } catch {

    return [];

  }

}


function saveReports() {

  localStorage.setItem(
    "healthInsightReports",
    JSON.stringify(reports)
  );

}


/* =========================================================
   HISTORY
========================================================= */

function renderHistory() {

  const container =
    $("#historyList");


  if (!container) return;


  if (!reports.length) {

    container.innerHTML = `

      <div class="history-empty">

        <div class="empty-icon">
          ◷
        </div>

        <h3>No reports saved yet</h3>

        <p>
          Your analyzed reports will appear here
          when you save them.
        </p>

        <button
          class="primary-button"
          id="emptyHistoryButton"
        >
          Create First Report →
        </button>

      </div>

    `;


    $("#emptyHistoryButton")
      ?.addEventListener(
        "click",
        () => navigateTo("new-report")
      );


    return;

  }


  container.innerHTML =
    reports.map(
      report => {

        const normal =
          report.tests.filter(
            t => t.status === "Normal"
          ).length;


        const attention =
          report.tests.filter(
            t => t.status !== "Normal"
          ).length;


        return `

          <article class="history-card">

            <div class="history-date">

              <span>
                ${formatDate(report.date)}
              </span>

              <small>
                ${report.tests.length}
                test${report.tests.length !== 1 ? "s" : ""}
              </small>

            </div>


            <div class="history-patient">

              <div class="history-avatar">
                ${getInitials(report.patient.name)}
              </div>

              <div>

                <strong>
                  ${escapeHtml(report.patient.name)}
                </strong>

                <span>
                  ${report.patient.age}
                  years •
                  ${report.patient.gender}
                </span>

              </div>

            </div>


            <div class="history-results">

              <span class="history-normal">
                ✓ ${normal} Normal
              </span>

              ${
                attention
                  ? `
                    <span class="history-attention">
                      ! ${attention} Attention
                    </span>
                  `
                  : ""
              }

            </div>


            <button
              class="delete-report"
              data-id="${report.id}"
              title="Delete report"
            >
              ×
            </button>

          </article>

        `;

      }
    ).join("");


  $$(".delete-report").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        deleteReport(
          button.dataset.id
        );

      }
    );

  });

}


function deleteReport(id) {

  const confirmed =
    window.confirm(
      "Delete this stored report?"
    );


  if (!confirmed) return;


  reports =
    reports.filter(
      report => report.id !== id
    );


  saveReports();

  renderHistory();

  updateDashboard();

  updateTrendTestOptions();

  renderTrendChart();


  showToast(
    "Report deleted.",
    "info"
  );

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  const totalReports =
    reports.length;


  const allTests =
    reports.flatMap(
      report => report.tests
    );


  const normal =
    allTests.filter(
      test => test.status === "Normal"
    ).length;


  const attention =
    allTests.filter(
      test => test.status !== "Normal"
    ).length;


  $("#totalReports").textContent =
    totalReports;


  $("#normalResults").textContent =
    normal;


  $("#attentionResults").textContent =
    attention;


  $("#testsAnalyzed").textContent =
    allTests.length;


  const total =
    normal + attention;


  const normalPercentage =
    total
      ? Math.round((normal / total) * 100)
      : 0;


  $("#dashboardNormalPercent").textContent =
    `${normalPercentage}%`;


  $("#normalBar").style.width =
    `${normalPercentage}%`;


  $("#attentionBar").style.width =
    `${100 - normalPercentage}%`;

}


/* =========================================================
   TRENDS
========================================================= */

function updateTrendTestOptions() {

  const select =
    $("#trendTest");


  if (!select) return;


  const selected =
    select.value;


  const availableTests =
    [...new Set(
      reports.flatMap(
        report =>
          report.tests.map(
            test => test.key
          )
      )
    )];


  select.innerHTML = `

    <option value="">
      Select a test
    </option>

    ${
      availableTests
        .map(
          key => `
            <option value="${key}">
              ${TESTS[key]?.name || key}
            </option>
          `
        )
        .join("")
    }

  `;


  if (
    availableTests.includes(selected)
  ) {

    select.value = selected;

  }

}


function renderTrendChart() {

  const chart =
    $("#trendChart");


  const empty =
    $("#trendEmpty");


  if (!chart || !empty) return;


  const key =
    $("#trendTest").value;


  if (!key) {

    chart.innerHTML = "";

    empty.style.display = "block";

    return;

  }


  const points =
    reports
      .flatMap(
        report =>
          report.tests
            .filter(
              test => test.key === key
            )
            .map(
              test => ({
                date: report.date,
                value: test.value,
                status: test.status
              })
            )
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  if (!points.length) {

    chart.innerHTML = "";

    empty.style.display = "block";

    return;

  }


  empty.style.display = "none";


  const test =
    TESTS[key];


  const values =
    points.map(
      point => point.value
    );


  const max =
    Math.max(
      ...values,
      test.high
    );


  const min =
    Math.min(
      ...values,
      test.low
    );


  const spread =
    Math.max(
      max - min,
      1
    );


  chart.innerHTML = `

    <div class="trend-axis">

      ${points
        .map(
          point => {

            const position =
              ((point.value - min) /
                spread) * 100;


            return `

              <div
                class="trend-point-wrapper"
                style="left:${position}%"
              >

                <div
                  class="
                    trend-point
                    ${point.status.toLowerCase()}
                  "
                >
                  ${point.value}
                </div>

                <span>
                  ${formatDate(point.date)}
                </span>

              </div>

            `;

          }
        )
        .join("")}

    </div>

    <div class="trend-reference">

      <span>
        Reference:
        ${test.low}
        –
        ${test.high}
        ${test.unit}
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


  showToast(
    "Form cleared.",
    "info"
  );

}


/* =========================================================
   VALIDATION MESSAGE
========================================================= */

function showValidation(message) {

  const element =
    $("#validationMessage");


  element.textContent =
    message;


  element.classList.add("show");

}


function hideValidation() {

  $("#validationMessage")
    ?.classList.remove("show");

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "info"
) {

  const toast =
    $("#toast");


  toast.textContent =
    message;


  toast.className =
    `toast show ${type}`;


  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}


/* =========================================================
   UTILITIES
========================================================= */

function formatDate(dateString) {

  if (!dateString) return "Unknown date";


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function getInitials(name) {

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

}


function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}