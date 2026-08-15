import os
import json
import hashlib
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import httpx

# Import our custom modules
import database
from database import get_db, ProcessedSite
import ai_engine
import pipeline

app = FastAPI(title="PrivacyLens API", version="2.0")

# --- 1. CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DATA MODELS ---

class AnalyzeRequest(BaseModel):
    url: str
    html: str

class ChatRequest(BaseModel):
    url: str
    question: str

class AnalyzeResponse(BaseModel):
    status: str
    summary: str  # kept for extension backward-compat
    pipeline_data: dict = {}

class ChatResponse(BaseModel):
    answer: str
    confidence: str = "Low"
    cited_chunks: List[str] = []
    document_silent_on_topic: bool = False

class URLRequest(BaseModel):
    url: str

# --- 3. ENDPOINTS ---

@app.get("/")
async def home():
    return {"message": "PrivacyLens API v2.0 is running."}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_policy(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Full 3-stage pipeline: Extractor → Risk Analyzer → Verifier.
    Cached at file level (v3 cache) + LLM prompt level (SQLiteCache).
    Returns both a brief summary string (for extension compat) and full pipeline_data.
    """
    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    cache_dir = "storage/analysis_cache"
    cache_path = os.path.join(cache_dir, f"{url_hash}_v3.json")

    # 1. File-level cache hit — instant
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached = json.load(f)
            pipeline_data = cached.get("pipeline_data", {})
            summary = _make_summary(pipeline_data)
            return AnalyzeResponse(status="cached", summary=summary, pipeline_data=pipeline_data)
        except Exception as e:
            print(f"[/analyze] Cache read failed: {e}")

    clean_text = ai_engine.clean_html(request.html)
    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    try:
        pipeline_data = await pipeline.run_full_pipeline(clean_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}")

    summary = _make_summary(pipeline_data)

    # 2. Persist to DB
    db_record = database.get_scan_by_url(db, request.url)
    try:
        if db_record:
            db_record.risk_summary = summary
            db_record.policy_text = clean_text
            db.commit()
        else:
            database.create_scan(db, request.url, summary, "", clean_text)
    except Exception:
        pass

    # 3. Persist to file cache
    try:
        os.makedirs(cache_dir, exist_ok=True)
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({"pipeline_data": pipeline_data}, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[/analyze] Cache write failed: {e}")

    return AnalyzeResponse(status="processed_new", summary=summary, pipeline_data=pipeline_data)


@app.post("/chat", response_model=ChatResponse)
async def chat_policy(request: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG-grounded Q&A Agent.
    - Retrieves top-k chunks semantically relevant to the question.
    - Returns structured JSON with confidence and chunk citations.
    - LLM prompt is SQLiteCached — same question on same policy = no Groq call.
    """
    scan = database.get_scan_by_url(db, request.url)
    if not scan or not scan.policy_text:
        raise HTTPException(
            status_code=404,
            detail="Policy not found. Please analyze the site first."
        )

    raw = await ai_engine.chat_with_policy_async(request.question, scan.policy_text)

    # Parse structured JSON from Q&A Agent
    try:
        # Strip any markdown fences the model might add
        clean = raw.strip()
        if clean.startswith("```"):
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean.strip())
        return ChatResponse(
            answer=data.get("answer", raw),
            confidence=data.get("confidence", "Low"),
            cited_chunks=data.get("cited_chunks", []),
            document_silent_on_topic=data.get("document_silent_on_topic", False),
        )
    except (json.JSONDecodeError, Exception):
        # Graceful fallback if model returns plain text instead of JSON
        return ChatResponse(answer=raw, confidence="Low")


@app.post("/fetch-html")
async def fetch_html(request: URLRequest):
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = await client.get(request.url, headers=headers, follow_redirects=True)
            response.raise_for_status()
            return {"html": response.text}
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Target URL returned: {e.response.status_code}"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {str(e)}")


# --- 4. HELPERS ---

def _make_summary(pipeline_data: dict) -> str:
    """Generates a brief human-readable summary for the extension and DB storage."""
    ts = pipeline_data.get("trust_score", {})
    score = ts.get("score")
    grade = ts.get("grade")
    flags = pipeline_data.get("red_flags", [])
    if score is not None:
        flag_text = f" Red flags: {', '.join(flags[:2])}." if flags else ""
        return f"Trust Score: {score}/100 (Grade {grade}).{flag_text}"
    return "Analysis complete. See pipeline_data for full results."


# --- 5. STARTUP ---
if __name__ == "__main__":
    import uvicorn
    database.init_db()
    uvicorn.run(
        app, host="0.0.0.0", port=8000, reload=True,
        reload_excludes=["storage/*", "*.log", "test.py"]
    )