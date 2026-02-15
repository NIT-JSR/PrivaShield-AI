"""
PrivaShield AI - Standalone Server (SQLite, no MySQL needed)
Runs the complete API with all original + enhanced endpoints.

Usage:
    python start_server.py

This is the recommended way to run the project locally.
It uses SQLite instead of MySQL for zero-config setup.
"""

import os
import sys
import hashlib

# Patch: Replace database module with SQLite version BEFORE importing main
import database_lite as database
sys.modules['database'] = database

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

import ai_engine
from database_lite import get_db, ProcessedSite, init_db
import risk_analyzer

# ──────────────────────────────────────────────
#  APP SETUP
# ──────────────────────────────────────────────

app = FastAPI(title="PrivaShield AI API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
#  MODELS
# ──────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    url: str
    html: str

class ChatRequest(BaseModel):
    url: str
    question: str

class AnalyzeResponse(BaseModel):
    status: str
    summary: str

class ChatResponse(BaseModel):
    answer: str

class RiskResponse(BaseModel):
    status: str
    url: str
    risk_data: dict

class PermissionResponse(BaseModel):
    status: str
    url: str
    permission_data: dict

class HiddenClauseResponse(BaseModel):
    status: str
    url: str
    hidden_clauses_data: dict

class FullAnalysisResponse(BaseModel):
    status: str
    url: str
    summary: str
    risk_data: dict
    permission_data: dict
    hidden_clauses_data: dict

# ──────────────────────────────────────────────
#  ORIGINAL ENDPOINTS
# ──────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "🛡️ PrivaShield AI API is running.", "version": "2.0", "database": "SQLite"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_policy(request: AnalyzeRequest, db: Session = Depends(get_db)):
    existing_scan = database.get_scan_by_url(db, request.url)
    
    if existing_scan and existing_scan.vector_index_path and os.path.exists(existing_scan.vector_index_path):
        return AnalyzeResponse(status="cached", summary=existing_scan.risk_summary)

    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    
    try:
        summary, vector_path = ai_engine.process_policy(request.html, url_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Failed: {str(e)}")

    if not vector_path:
        raise HTTPException(status_code=400, detail="Could not extract text from HTML.")

    if existing_scan:
        existing_scan.risk_summary = summary
        existing_scan.vector_index_path = vector_path
        db.commit()
    else:
        database.create_scan(db, request.url, summary, vector_path)

    return AnalyzeResponse(status="processed_new", summary=summary)

@app.post("/chat", response_model=ChatResponse)
def chat_policy(request: ChatRequest, db: Session = Depends(get_db)):
    scan = database.get_scan_by_url(db, request.url)
    
    if not scan:
        raise HTTPException(status_code=404, detail="Policy not found. Please analyze the site first.")

    if not os.path.exists(scan.vector_index_path):
        raise HTTPException(status_code=410, detail="Session expired. Please re-analyze.")

    answer = ai_engine.chat_with_policy(request.question, scan.vector_index_path)
    return ChatResponse(answer=answer)

# ──────────────────────────────────────────────
#  ENHANCED ENDPOINTS
# ──────────────────────────────────────────────

@app.post("/risks", response_model=RiskResponse)
def get_risks(request: AnalyzeRequest):
    clean_text = ai_engine.clean_html(request.html)
    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")
    risk_data = risk_analyzer.analyze_risks(clean_text)
    return RiskResponse(status="analyzed", url=request.url, risk_data=risk_data)

@app.post("/permissions", response_model=PermissionResponse)
def get_permissions(request: AnalyzeRequest):
    clean_text = ai_engine.clean_html(request.html)
    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")
    permission_data = risk_analyzer.map_permissions(clean_text)
    return PermissionResponse(status="analyzed", url=request.url, permission_data=permission_data)

@app.post("/hidden-clauses", response_model=HiddenClauseResponse)
def get_hidden_clauses(request: AnalyzeRequest):
    clean_text = ai_engine.clean_html(request.html)
    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")
    hidden_data = risk_analyzer.detect_hidden_clauses(clean_text)
    return HiddenClauseResponse(status="analyzed", url=request.url, hidden_clauses_data=hidden_data)

@app.post("/full-analysis", response_model=FullAnalysisResponse)
def get_full_analysis(request: AnalyzeRequest, db: Session = Depends(get_db)):
    clean_text = ai_engine.clean_html(request.html)
    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    try:
        summary, vector_path = ai_engine.process_policy(request.html, url_hash)
    except Exception as e:
        summary = f"Summary generation failed: {str(e)}"
        vector_path = ""

    if vector_path:
        try:
            existing = database.get_scan_by_url(db, request.url)
            if existing:
                existing.risk_summary = summary
                existing.vector_index_path = vector_path
                db.commit()
            else:
                database.create_scan(db, request.url, summary, vector_path)
        except Exception:
            pass

    full_data = risk_analyzer.full_analysis(clean_text)
    return FullAnalysisResponse(
        status="analyzed", url=request.url, summary=summary,
        risk_data=full_data["risk_analysis"],
        permission_data=full_data["permission_mapping"],
        hidden_clauses_data=full_data["hidden_clauses_analysis"]
    )

# ──────────────────────────────────────────────
#  STARTUP
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    init_db()
    print()
    print("=" * 60)
    print("  🛡️  PrivaShield AI — All Systems Online")
    print("=" * 60)
    print()
    print("  Endpoints:")
    print("    GET  /                 → Health check")
    print("    POST /analyze          → Analyze policy")
    print("    POST /chat             → Chat with policy")
    print("    POST /risks            → Risk analysis")
    print("    POST /permissions      → Permission mapping")
    print("    POST /hidden-clauses   → Hidden clause detection")
    print("    POST /full-analysis    → Complete analysis")
    print()
    print("  Database: SQLite (storage/privashield.db)")
    print("  Server:   http://localhost:8000")
    print("  Docs:     http://localhost:8000/docs")
    print()
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)
