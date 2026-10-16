const STORAGE_KEY = "safeguard-id-reviews-v1";
const outcomeLabels = {
  eligible: "Meets applicable requirement",
  ineligible: "Below applicable requirement",
  pending: "Needs follow-up",
};

const form = document.querySelector("#review-form");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const reviewList = document.querySelector("#review-list");
const reviewCount = document.querySelector("#review-count");
const exportButton = document.querySelector("#export-button");
const clearButton = document.querySelector("#clear-button");

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
    empty.textContent = "No reviews recorded on this device.";
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
    status.dataset.outcome = review.outcome;
    status.textContent = outcomeLabels[review.outcome] || "Needs follow-up";
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const reference = String(formData.get("worker_reference") || "").trim();
  const outcome = String(formData.get("outcome") || "");
  message.textContent = "";
  message.classList.remove("success");

  if (!reference || !outcome) {
    message.textContent = "Enter a worker reference and select a review outcome.";
    return;
  }

  submitButton.disabled = true;
  try {
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Could not save review.");

    const reviews = getReviews();
    reviews.push({ reference, outcome, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    renderReviews();
    form.reset();
    message.textContent = "Review saved in this browser.";
    message.classList.add("success");
  } catch (error) {
    message.textContent = error.message || "Service unavailable. Your review was not saved.";
  } finally {
    submitButton.disabled = false;
  }
});

exportButton.addEventListener("click", () => {
  const rows = [["Worker reference", "Human review outcome", "Recorded at"]];
  for (const review of getReviews()) {
    rows.push([review.reference, outcomeLabels[review.outcome] || "Needs follow-up", review.createdAt]);
  }
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "safeguard-review-log.csv";
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