"""
PrivaShield AI - Start Server Wrapper
Launches the unified, enhanced RAG engine using the robust configuration.
"""
import os
import sys

# Run the unified entrypoint
if __name__ == "__main__":
    import uvicorn
    # Make sure we use the robust database.py which dynamically supports SQLite/Postgres/MySQL
    import database
    database.init_db()
    
    # Import the app from run
    from run import app
    
    print()
    print("=" * 60)
    print("  [PrivaShield AI] -- All Systems Online")
    print("=" * 60)
    print()
    print("  Endpoints:")
    print("    GET  /                 -> Health check")
    print("    POST /analyze          -> Analyze policy")
    print("    POST /chat             -> Chat with policy")
    print("    POST /risks            -> Risk analysis")
    print("    POST /permissions      -> Permission mapping")
    print("    POST /hidden-clauses   -> Hidden clause detection")
    print("    POST /full-analysis    -> Complete analysis")
    print()
    
    db_type = "MySQL/PostgreSQL" if os.getenv("DATABASE_URL") else "SQLite (storage/privashield.db)"
    print(f"  Database: {db_type}")
    print("  Server:   http://localhost:8000")
    print("  Docs:     http://localhost:8000/docs")
    print()
    print("=" * 60)
    
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
