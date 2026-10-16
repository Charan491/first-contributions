const STORAGE_KEY = "safeguard-id-reviews-v1";

const form = document.querySelector("#review-form");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const reviewList = document.querySelector("#review-list");
const reviewCount = document.querySelector("#review-count");
const exportButton = document.querySelector("#export-button");
const clearButton = document.querySelector("#clear-button");
const documentInput = document.querySelector("#supporting-document");
const documentPreview = document.querySelector("#document-preview");
const maxDocumentSize = 10 * 1024 * 1024;
let selectedDocumentUrl = null;
let selectedDocument = null;

function getReviews() {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function renderReviews() {
  const reviews = getReviews();
  reviewCount.textContent = String(reviews.length);
  exportButton.disabled = reviews.length === 0;
  clearButton.disabled = reviews.length === 0;
  reviewList.replaceChildren();

  if (reviews.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No file checks recorded on this device.";
    reviewList.append(empty);
    return;
  }

  for (const review of [...reviews].reverse()) {
    const entry = document.createElement("article");
    entry.className = "review-entry";
    const reference = document.createElement("span");
    reference.className = "entry-reference";
    reference.textContent = review.reference;
    const date = document.createElement("time");
    date.className = "entry-date";
    date.dateTime = review.createdAt;
    date.textContent = new Date(review.createdAt).toLocaleString();
    const status = document.createElement("span");
    status.className = "entry-status";
    status.dataset.check = "complete";
    status.textContent = review.result;
    entry.append(reference, date, status);
    reviewList.append(entry);
  }
}

async function checkService() {
  const indicator = document.querySelector("#connection");
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("Service unavailable");
    indicator.textContent = "Service online";
    indicator.classList.remove("offline");
  } catch {
    indicator.textContent = "Service offline";
    indicator.classList.add("offline");
  }
}

function clearDocumentPreview() {
  if (selectedDocumentUrl) URL.revokeObjectURL(selectedDocumentUrl);
  selectedDocumentUrl = null;
  selectedDocument = null;
  documentInput.value = "";
  documentPreview.replaceChildren();
  documentPreview.hidden = true;
  submitButton.disabled = true;
}

documentInput.addEventListener("change", () => {
  const file = documentInput.files[0];
  clearDocumentPreview();
  if (!file) return;

  const supportedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!supportedTypes.includes(file.type)) {
    message.textContent = "Choose a PDF, JPG, or PNG file.";
    return;
  }
  if (file.size > maxDocumentSize) {
    message.textContent = "The selected file exceeds the 10 MB limit.";
    return;
  }

  message.textContent = "";
  selectedDocument = file;
  submitButton.disabled = false;
  selectedDocumentUrl = URL.createObjectURL(file);
  documentPreview.hidden = false;

  const meta = document.createElement("div");
  meta.className = "preview-meta";
  const name = document.createElement("span");
  name.className = "preview-name";
  name.textContent = file.name;
  const size = document.createElement("span");
  size.className = "preview-size";
  size.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  const remove = document.createElement("button");
  remove.className = "preview-remove";
  remove.type = "button";
  remove.setAttribute("aria-label", "Remove supporting document");
  remove.title = "Remove supporting document";
  remove.textContent = "×";
  remove.addEventListener("click", clearDocumentPreview);
  meta.append(name, size, remove);
  documentPreview.append(meta);

  if (file.type.startsWith("image/")) {
    const image = document.createElement("img");
    image.className = "preview-image";
    image.alt = "Local preview of selected supporting document";
    image.src = selectedDocumentUrl;
    documentPreview.append(image);
  } else {
    const pdf = document.createElement("iframe");
    pdf.className = "preview-pdf";
    pdf.title = "Local PDF preview";
    pdf.src = selectedDocumentUrl;
    documentPreview.append(pdf);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const reference = String(formData.get("worker_reference") || "").trim();
  message.textContent = "";
  message.classList.remove("success");

  if (!reference || !selectedDocument || !selectedDocumentUrl) {
    message.textContent = "Enter a worker reference and select a supported document.";
    return;
  }

  submitButton.disabled = true;
  try {
    let result;
    if (selectedDocument.type.startsWith("image/")) {
      const image = new Image();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Image check timed out. Try another file.")),
          10000,
        );
        image.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        image.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("The selected image could not be opened."));
        };
        image.src = selectedDocumentUrl;
      });
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error("The selected image could not be opened.");
      }
      result = `Image opened (${image.naturalWidth} × ${image.naturalHeight}px)`;
    } else {
      result = "PDF type and size checked; contents not inspected";
    }

    const reviews = getReviews();
    reviews.push({ reference, result, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    renderReviews();
    form.reset();
    clearDocumentPreview();
    message.textContent = `${result}. No age or eligibility analysis was performed.`;
    message.classList.add("success");
  } catch (error) {
    message.textContent = error.message || "Service unavailable. Your review was not saved.";
  } finally {
    submitButton.disabled = !selectedDocument;
  }
});

exportButton.addEventListener("click", () => {
  const rows = [["Worker reference", "Technical file check", "Recorded at"]];
  for (const review of getReviews()) {
    rows.push([review.reference, review.result, review.createdAt]);
  }
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "safeguard-file-check-log.csv";
  link.click();
  URL.revokeObjectURL(url);
});

clearButton.addEventListener("click", () => {
  if (!window.confirm("Clear all review entries stored in this browser?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderReviews();
});

renderReviews();
checkService();