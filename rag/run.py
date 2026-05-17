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

# Mount the enhanced analysis routes onto the existing app
app.include_router(enhanced_router)

if __name__ == "__main__":
    import uvicorn
    database.init_db()
    print("🛡️  PrivaShield AI starting with enhanced routes...")
    print("📍 Endpoints available:")
    print("   GET  /           - Health check")
    print("   POST /analyze    - Analyze policy (original)")
    print("   POST /chat       - Chat with policy (original)")
    print("   POST /risks      - Risk analysis (new)")
    print("   POST /permissions - Permission mapping (new)")
    print("   POST /hidden-clauses - Hidden clause detection (new)")
    print("   POST /full-analysis  - Complete analysis (new)")
    uvicorn.run(app, host="0.0.0.0", port=8000)
