import os
import hashlib
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import our custom modules
import database
from database import get_db, ProcessedSite
import ai_engine

app = FastAPI(title="PrivacyLens API", version="1.0")

# --- 1. CORS CONFIGURATION (Crucial for Chrome Extensions) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all extensions/sites to access. Secure enough for MVP.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DATA MODELS (Pydantic) ---

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

# --- 3. ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "PrivacyLens API is running."}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_policy(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Receives HTML.
    1. Checks if we already have a scan for this URL in MySQL.
    2. If YES: Returns the cached summary.
    3. If NO: Runs AI, saves vector DB to disk, saves record to MySQL.
    """
    # Check Cache (MySQL)
    existing_scan = database.get_scan_by_url(db, request.url)
    
    # If scan exists AND the file is actually on disk (handling server restarts)
    if existing_scan and existing_scan.vector_index_path and os.path.exists(existing_scan.vector_index_path):
        return AnalyzeResponse(
            status="cached",
            summary=existing_scan.summary
        )

    # PROCESS NEW SCAN
    # 1. Create unique hash for filenames
    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    saved_summary = existing_scan.summary if existing_scan else None
    # 2. Run AI Engine (Clean -> Embed -> Save Index)
    try:
         summary,vector_path = ai_engine.process_policy(request.html, url_hash,existing_summary=saved_summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Failed: {str(e)}")

    if not vector_path:
        raise HTTPException(status_code=400, detail="Could not extract text from HTML.")

    # 3. Save Metadata to MySQL
    # If entry existed but file was missing (server restart), update it. Otherwise create new.
    if existing_scan:
        existing_scan.summary = summary
        existing_scan.vector_index_path = vector_path
        db.commit()
    else:
        database.create_scan(db, request.url, summary, vector_path)

    return AnalyzeResponse(
        status="processed_new",
        summary=summary
    )

@app.post("/chat", response_model=ChatResponse)
def chat_policy(request: ChatRequest, db: Session = Depends(get_db)):
    """
    User asks a question about a specific URL.
    We load the FAISS index from disk and answer.
    """
    # 1. Find the scan record
    scan = database.get_scan_by_url(db, request.url)
    
    if not scan:
        raise HTTPException(status_code=404, detail="Policy not found. Please analyze the site first.")

    # 2. Check if file still exists (Render ephemeral storage check)
    if not os.path.exists(scan.vector_index_path):
        # Optional: You could trigger a re-analysis here if you saved the HTML
        raise HTTPException(status_code=410, detail="Session expired (Server Restart). Please refresh the page to re-analyze.")

    # 3. Generate Answer
    answer = ai_engine.chat_with_policy(request.question, scan.vector_index_path)
    
    return ChatResponse(answer=answer)

# --- 4. STARTUP ---
if __name__ == "__main__":
    import uvicorn
    # Create Tables on startup if they don't exist
    database.init_db()
    uvicorn.run(app, host="0.0.0.0", port=8000,
                reload_excludes=["storage/*", "*.log", "test.py"])