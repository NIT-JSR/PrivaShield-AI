"""
PrivaShield AI - Enhanced Entry Point
Wraps the existing FastAPI app and mounts the enhanced routes.
Run this instead of main.py to get all features (existing + new).

Usage:
    python run.py
"""

import database
from main import app
from enhanced_routes import enhanced_router
from auth import auth_router

# Mount the authentication and enhanced analysis routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(enhanced_router)

if __name__ == "__main__":
    import uvicorn
    import os
    database.init_db()
    print("[PrivaShield AI] starting with enhanced routes...")
    print("Endpoints available:")
    print("   GET  /           - Health check")
    print("   POST /analyze    - Analyze policy (original)")
    print("   POST /chat       - Chat with policy (original)")
    print("   POST /risks      - Risk analysis (new)")
    print("   POST /permissions - Permission mapping (new)")
    print("   POST /hidden-clauses - Hidden clause detection (new)")
    print("   POST /full-analysis  - Complete analysis (new)")
    default_port = 7860 if "SPACE_ID" in os.environ else 8000
    port = int(os.environ.get("PORT", default_port))
    uvicorn.run(app, host="0.0.0.0", port=port)
