# SafeGuard ID

A local-first document file-check tool. It does not estimate age from faces, make an automated eligibility decision, or provide legal advice. Reviewers must consult appropriate documents and follow applicable local requirements.

Worker references and technical file-check history are stored in the current browser's local storage. Documents are not sent to the API or saved in the log. This is a prototype, not a secure or shared compliance-record system.

PDF, JPG, and PNG supporting documents (up to 10 MB) are previewed locally in the browser. The check validates type and size and confirms images can be opened; it does not analyze image content or inspect PDF contents. Documents are not uploaded, included in the review log, or retained after the check is saved.

## Run locally

Requires Python 3.10 or newer.

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Open <http://localhost:8000>.

## Deploy

- **Render:** Create a Web Service from this repository and use the included `render.yaml` blueprint.
- **Vercel:** Import this project as a Python project; `vercel.json` routes API requests to the FastAPI function in `api/index.py`.

The review log is browser-local on both hosts. It is not shared between devices or users; use an approved, access-controlled system for real compliance records.