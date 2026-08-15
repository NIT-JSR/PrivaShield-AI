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
import pipeline

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
    pipeline_data: dict
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
async def get_full_analysis(request: PolicyRequest):
    """
    Complete analysis pipeline optimized for concurrent parallel execution with caching:
    1. Check if we have a cached JSON analysis file in storage/analysis_cache/.
    2. If yes, load and return it instantly (~1ms).
    3. If no, clean HTML, run the new 3-stage pipeline, save cache file, and return.
    """
    import asyncio
    import json
    
    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    cache_dir = "storage/analysis_cache"
    cache_path = os.path.join(cache_dir, f"{url_hash}_v3.json")
    
    # 1. Check cache
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            return FullAnalysisResponse(
                status="cached",
                url=request.url,
                pipeline_data=cached_data.get("pipeline_data", {}),
                permission_data=cached_data.get("permission_data", {}),
                hidden_clauses_data=cached_data.get("hidden_clauses_data", {})
            )
        except Exception as e:
            print(f"Error reading cache file {cache_path}: {e}")

    clean_text = ai_engine.clean_html(request.html)

    if len(clean_text) < 100:
        raise HTTPException(status_code=400, detail="Content too short to analyze.")

    pipeline_task = pipeline.run_full_pipeline(clean_text)
    permissions_task = risk_analyzer.map_permissions_async(clean_text)
    hidden_task = risk_analyzer.detect_hidden_clauses_async(clean_text)

    try:
        pipeline_data, permission_data, hidden_data = await asyncio.gather(
            pipeline_task,
            permissions_task,
            hidden_task
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Concurrent pipeline analysis failed: {str(e)}"
        )

    # Save to database synchronously
    db = database.SessionLocal()
    try:
        existing = database.get_scan_by_url(db, request.url)
        # Extract a brief summary for the DB if possible
        summary_text = "Analysis complete."
        if "trust_score" in pipeline_data:
            summary_text = f"Trust Score: {pipeline_data['trust_score'].get('score')} ({pipeline_data['trust_score'].get('grade')})"
            
        if existing:
            existing.risk_summary = summary_text
            existing.policy_text = clean_text
            db.commit()
        else:
            database.create_scan(db, request.url, summary_text, "", clean_text)
    except Exception:
        pass  # Don't fail the whole analysis if DB save fails
    finally:
        db.close()

    # Save to file cache
    try:
        os.makedirs(cache_dir, exist_ok=True)
        cache_content = {
            "pipeline_data": pipeline_data,
            "permission_data": permission_data,
            "hidden_clauses_data": hidden_data
        }
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(cache_content, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Failed to write cache file {cache_path}: {e}")

    return FullAnalysisResponse(
        status="analyzed",
        url=request.url,
        pipeline_data=pipeline_data,
        permission_data=permission_data,
        hidden_clauses_data=hidden_data
    )
