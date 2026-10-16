# SafeGuard ID

A local-first age-review log for human reviewers. It does not estimate age from faces, make an automated eligibility decision, or provide legal advice. Reviewers must consult appropriate documents and follow applicable local requirements.

Worker references and review history are stored in the current browser's local storage. The outcome alone is sent to the API for validation and is not persisted by the server. This is a prototype, not a secure or shared compliance-record system.

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