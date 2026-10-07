/* =========================================================
   HEALTHINSIGHT — X-RAY & IMAGING REVIEW MODULE
   ========================================================= */

const API_BASE =
  window.location.port === "5000"
    ? "/api"
    : `http://${window.location.hostname || "127.0.0.1"}:5000/api`;

const $ = (selector) => document.querySelector(selector);

let currentFile = null;
let currentDataUrl = null;

document.addEventListener("DOMContentLoaded", () => {
  initializeScanDate();
  setupUploadHandlers();
  setupActionButtons();
  loadStoredScans();
});

function initializeScanDate() {
  const scanDateInput = $("#scanDate");
  if (scanDateInput && !scanDateInput.value) {
    const today = new Date().toISOString().split("T")[0];
    scanDateInput.value = today;
  }
}

function setupUploadHandlers() {
  const fileInput = $("#xrayInput");
  const uploadArea = $("#uploadArea");

  if (!fileInput || !uploadArea) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  });

  // Drag and drop support
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  });
}

function handleFileSelected(file) {
  const fileInfo = $("#fileInfo");
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  if (!allowedTypes.includes(file.type)) {
    renderError("Please choose a valid image format (PNG, JPG, or WEBP).");
    resetPreview();
    return;
  }

  if (file.size > maxSizeBytes) {
    renderError("The selected file exceeds the 10 MB size limit.");
    resetPreview();
    return;
  }

  currentFile = file;

  // Show file info
  if (fileInfo) {
    fileInfo.innerHTML = `
      <div class="file-name">${escapeHtml(file.name)}</div>
      <div class="file-meta">${formatFileSize(file.size)} • ${file.type.toUpperCase().replace("IMAGE/", "")}</div>
    `;
  }

  // Load preview
  const reader = new FileReader();
  reader.onload = (e) => {
    currentDataUrl = e.target.result;
    displayImage(currentDataUrl, file.name, formatFileSize(file.size));
  };
  reader.readAsDataURL(file);
}

function displayImage(src, filename, sizeStr) {
  const container = $("#imageContainer");
  const statusBadge = $("#status");
  const removeBtn = $("#removeButton");
  const analyzeBtn = $("#analyzeButton");

  if (container) {
    container.innerHTML = `
      <img class="xray-image" src="${src}" alt="Radiological Scan Preview" />
      <div class="image-overlay">
        <span>${escapeHtml(filename)}</span>
        <span>${sizeStr}</span>
      </div>
    `;
  }

  if (statusBadge) {
    statusBadge.textContent = "Ready";
    statusBadge.classList.add("ready");
  }

  if (removeBtn) removeBtn.disabled = false;
  if (analyzeBtn) analyzeBtn.disabled = false;
}

function resetPreview() {
  currentFile = null;
  currentDataUrl = null;

  const fileInput = $("#xrayInput");
  if (fileInput) fileInput.value = "";

  const container = $("#imageContainer");
  if (container) {
    container.innerHTML = `
      <div class="empty-preview">
        <div class="image-placeholder">X</div>
        <h4>No image selected</h4>
        <p>Upload an X-ray to see the preview.</p>
      </div>
    `;
  }

  const statusBadge = $("#status");
  if (statusBadge) {
    statusBadge.textContent = "Waiting";
    statusBadge.classList.remove("ready");
  }

  const removeBtn = $("#removeButton");
  const analyzeBtn = $("#analyzeButton");
  if (removeBtn) removeBtn.disabled = true;
  if (analyzeBtn) analyzeBtn.disabled = true;
}

function renderError(message) {
  const fileInfo = $("#fileInfo");
  if (fileInfo) {
    fileInfo.innerHTML = `
      <div class="error-message">
        <span>⚠</span>
        <span>${escapeHtml(message)}</span>
      </div>
    `;
  }
}

function setupActionButtons() {
  const removeBtn = $("#removeButton");
  const analyzeBtn = $("#analyzeButton");

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      resetPreview();
      const fileInfo = $("#fileInfo");
      if (fileInfo) fileInfo.innerHTML = "";
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", handleAnalyzeScan);
  }
}

async function handleAnalyzeScan() {
  if (!currentFile || !currentDataUrl) {
    renderError("Please select an image first.");
    return;
  }

  const patientName = $("#patientName")?.value.trim() || "Anonymous Patient";
  const scanDate = $("#scanDate")?.value || new Date().toISOString().split("T")[0];
  const bodyRegion = $("#bodyRegion")?.value || "Chest";
  const statusBadge = $("#status");
  const analyzeBtn = $("#analyzeButton");

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Saving Scan...";
  }

  const payload = {
    patient_name: patientName,
    scan_date: scanDate,
    body_region: bodyRegion,
    scan_type: "X-ray",
    image_filename: currentFile.name,
    image_data: currentDataUrl,
    status: "Ready for Clinician Review",
    notes: `Radiological review record for ${bodyRegion}. Automated medical diagnosis is not performed without clinical verification.`,
  };

  try {
    const res = await fetch(`${API_BASE}/imaging`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to catalog scan.");
    }

    if (statusBadge) {
      statusBadge.textContent = "Cataloged";
      statusBadge.classList.add("ready");
    }

    const fileInfo = $("#fileInfo");
    if (fileInfo) {
      fileInfo.innerHTML += `
        <div style="margin-top: 10px; padding: 8px 12px; background: #eaf7f0; color: #198754; border-radius: 6px; font-size: 10px; font-weight: 700;">
          ✓ Scan successfully cataloged for clinical review.
        </div>
      `;
    }

    await loadStoredScans();
  } catch (err) {
    renderError(`Backend communication error: ${err.message}`);
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Continue to analysis →";
    }
  }
}

async function loadStoredScans() {
  const container = $("#storedScansList");
  const countBadge = $("#storedScansCount");
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/imaging`);
    if (!res.ok) throw new Error("Failed to load records");
    const data = await res.json();
    const records = data.records || [];

    if (countBadge) {
      countBadge.textContent = `${records.length} record${records.length !== 1 ? "s" : ""}`;
    }

    if (records.length === 0) {
      container.innerHTML = `
        <p style="font-size: 11px; color: var(--muted); margin: 0;">
          No stored scans yet. Upload and submit a scan above to catalog records.
        </p>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
        ${records
          .map(
            (r) => `
          <div style="background: #fafcfd; border: 1px solid var(--border); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="font-size: 11px; color: var(--ink); display: block;">${escapeHtml(r.patient_name || "Anonymous")}</strong>
                <span style="font-size: 9px; color: var(--muted);">${escapeHtml(r.scan_date || "Date unknown")} • ${escapeHtml(r.body_region || "Scan")}</span>
              </div>
              <button class="delete-scan-btn" data-id="${r.id}" style="border: none; background: transparent; color: var(--muted); cursor: pointer; font-size: 14px;" title="Delete record">×</button>
            </div>
            <div style="font-size: 9px; color: #556b78; line-height: 1.4; background: white; padding: 6px 8px; border-radius: 5px; border: 1px solid #eef2f5;">
              ${escapeHtml(r.notes || "Ready for review")}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 4px;">
              <span style="font-size: 8px; font-weight: 800; color: #198754; text-transform: uppercase;">● ${escapeHtml(r.status || "Cataloged")}</span>
              <span style="font-size: 8px; color: var(--muted);">${escapeHtml(r.image_filename || "")}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;

    container.querySelectorAll(".delete-scan-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const scanId = btn.dataset.id;
        if (confirm("Delete this stored scan record?")) {
          try {
            await fetch(`${API_BASE}/imaging/${scanId}`, { method: "DELETE" });
            loadStoredScans();
          } catch (e) {
            alert("Failed to delete record.");
          }
        }
      });
    });
  } catch (err) {
    if (countBadge) countBadge.textContent = "Offline";
    container.innerHTML = `
      <p style="font-size: 10px; color: var(--muted); margin: 0;">
        Backend records unavailable. Ensure Flask backend is running on port 5000.
      </p>
    `;
  }
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
