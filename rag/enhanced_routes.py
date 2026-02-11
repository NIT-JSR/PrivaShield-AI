"""
PrivaShield AI - Enhanced API Routes
Additional endpoints for risk analysis, permission mapping, and hidden clause detection.
Mount this router in main.py: app.include_router(enhanced_router)
"""

import os
import hashlib
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

# Import existing modules
import ai_engine
import database
from database import get_db
import risk_analyzer

enhanced_router = APIRouter(tags=["Enhanced Analysis"])


# ──────────────────────────────────────────────
#  REQUEST / RESPONSE MODELS
# ──────────────────────────────────────────────

class PolicyRequest(BaseModel):
    url: str
    html: str


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
#  ENDPOINTS
# ──────────────────────────────────────────────

@enhanced_router.post("/risks", response_model=RiskResponse)
def get_risks(request: PolicyRequest):
    """
    Analyzes privacy policy for risk factors.
    Returns structured risk data including score, categories, and red flags.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    risk_data = risk_analyzer.analyze_risks(clean_text)

    return RiskResponse(
        status="analyzed",
        url=request.url,
        risk_data=risk_data
    )


@enhanced_router.post("/permissions", response_model=PermissionResponse)
def get_permissions(request: PolicyRequest):
    """
    Maps privacy policy to device-level permissions.
    Explains each permission's purpose and denial consequences.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    permission_data = risk_analyzer.map_permissions(clean_text)

    return PermissionResponse(
        status="analyzed",
        url=request.url,
        permission_data=permission_data
    )


@enhanced_router.post("/hidden-clauses", response_model=HiddenClauseResponse)
def get_hidden_clauses(request: PolicyRequest):
    """
    Detects hidden, misleading, or dangerous clauses in the policy.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    hidden_data = risk_analyzer.detect_hidden_clauses(clean_text)

    return HiddenClauseResponse(
        status="analyzed",
        url=request.url,
        hidden_clauses_data=hidden_data
    )


@enhanced_router.post("/full-analysis", response_model=FullAnalysisResponse)
def get_full_analysis(request: PolicyRequest, db: Session = Depends(get_db)):
    """
    Complete analysis pipeline:
    1. Cleans HTML
    2. Generates summary (reuses existing ai_engine.process_policy)
    3. Runs risk analysis
    4. Maps permissions
    5. Detects hidden clauses
    Returns everything in one response.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    # Generate summary using existing pipeline
    url_hash = hashlib.md5(request.url.encode()).hexdigest()

    try:
        summary, vector_path = ai_engine.process_policy(request.html, url_hash)
    except Exception as e:
        summary = f"Summary generation failed: {str(e)}"
        vector_path = ""

    # Save to database if we got a vector path
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
            pass  # Don't fail the whole analysis if DB save fails

    # Run all analysis pipelines
    full_data = risk_analyzer.full_analysis(clean_text)

    return FullAnalysisResponse(
        status="analyzed",
        url=request.url,
        summary=summary,
        risk_data=full_data["risk_analysis"],
        permission_data=full_data["permission_mapping"],
        hidden_clauses_data=full_data["hidden_clauses_analysis"]
    )
