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
async def get_risks(request: PolicyRequest):
    """
    Analyzes privacy policy for risk factors.
    Returns structured risk data including score, categories, and red flags.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    risk_data = await risk_analyzer.analyze_risks_async(clean_text)

    return RiskResponse(
        status="analyzed",
        url=request.url,
        risk_data=risk_data
    )


@enhanced_router.post("/permissions", response_model=PermissionResponse)
async def get_permissions(request: PolicyRequest):
    """
    Maps privacy policy to device-level permissions.
    Explains each permission's purpose and denial consequences.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    permission_data = await risk_analyzer.map_permissions_async(clean_text)

    return PermissionResponse(
        status="analyzed",
        url=request.url,
        permission_data=permission_data
    )


@enhanced_router.post("/hidden-clauses", response_model=HiddenClauseResponse)
async def get_hidden_clauses(request: PolicyRequest):
    """
    Detects hidden, misleading, or dangerous clauses in the policy.
    """
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    hidden_data = await risk_analyzer.detect_hidden_clauses_async(clean_text)

    return HiddenClauseResponse(
        status="analyzed",
        url=request.url,
        hidden_clauses_data=hidden_data
    )


@enhanced_router.post("/full-analysis", response_model=FullAnalysisResponse)
async def get_full_analysis(request: PolicyRequest, db: Session = Depends(get_db)):
    """
    Complete analysis pipeline optimized for concurrent parallel execution:
    1. Cleans HTML
    2. Runs summary, risk analysis, permission mapping, and hidden clause detection
       simultaneously in parallel to stay under Render's 30s timeout limit.
    Returns everything in one response.
    """
    import asyncio
    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    url_hash = hashlib.md5(request.url.encode()).hexdigest()

    # Define all four analysis tasks to be executed in parallel
    summary_task = ai_engine.process_policy_async(request.html, url_hash)
    risks_task = risk_analyzer.analyze_risks_async(clean_text)
    permissions_task = risk_analyzer.map_permissions_async(clean_text)
    hidden_task = risk_analyzer.detect_hidden_clauses_async(clean_text)

    try:
        # Gather all results concurrently (takes ~5-8 seconds total, down from 32+ seconds!)
        summary_res, risk_data, permission_data, hidden_data = await asyncio.gather(
            summary_task,
            risks_task,
            permissions_task,
            hidden_task
        )
        summary, _, policy_text = summary_res
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Parallel analysis failed: {str(e)}"
        )

    # Save to database synchronously (extremely fast, doesn't block LLMs)
    if policy_text:
        try:
            existing = database.get_scan_by_url(db, request.url)
            if existing:
                existing.risk_summary = summary
                existing.policy_text = policy_text
                db.commit()
            else:
                database.create_scan(db, request.url, summary, "", policy_text)
        except Exception:
            pass  # Don't fail the whole analysis if DB save fails

    return FullAnalysisResponse(
        status="analyzed",
        url=request.url,
        summary=summary,
        risk_data=risk_data,
        permission_data=permission_data,
        hidden_clauses_data=hidden_data
    )
