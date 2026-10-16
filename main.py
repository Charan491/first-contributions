from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from model import OPERATION_MODES
from tools import validate_worker_data


BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="SafeGuard ID", docs_url=None, redoc_url=None)


class ReviewRequest(BaseModel):
    outcome: str = Field(max_length=20)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/modes")
def modes():
    return {"modes": OPERATION_MODES}


@app.post("/api/reviews")
def create_review(review: ReviewRequest):
    valid, message = validate_worker_data(review.outcome)
    if not valid:
        raise HTTPException(status_code=422, detail=message)
    return {"status": "accepted"}


@app.get("/")
def home():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/{asset_name}")
def assets(asset_name: str):
    if asset_name not in {"app.js", "styles.css"}:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(BASE_DIR / asset_name)