import os
import hashlib
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx
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

class URLRequest(BaseModel):
    url: str

# --- 3. ENDPOINTS ---

@app.get("/")
async def home():
    return {"message": "PrivacyLens API is running."}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_policy(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Receives HTML.
    1. Checks if we already have a scan for this URL in Database.
    2. If YES: Returns the cached summary.
    3. If NO: Runs AI, saves clean text to DB.
    """
    # Check Cache (DB)
    existing_scan = database.get_scan_by_url(db, request.url)
    
    # If scan exists and we have the clean policy text
    if existing_scan and existing_scan.policy_text:
        return AnalyzeResponse(
            status="cached",
            summary=existing_scan.risk_summary
        )

    # PROCESS NEW SCAN
    # 1. Create unique hash for filenames
    url_hash = hashlib.md5(request.url.encode()).hexdigest()
    saved_summary = existing_scan.risk_summary if existing_scan else None
    # 2. Run AI Engine (Clean -> Summarize)
    try:
         summary, _, policy_text = ai_engine.process_policy(request.html, url_hash, existing_summary=saved_summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Processing Failed: {str(e)}")

    if not policy_text:
        raise HTTPException(status_code=400, detail="Could not extract text from HTML.")

    # 3. Save Metadata to DB
    if existing_scan:
        existing_scan.risk_summary = summary
        existing_scan.policy_text = policy_text
        db.commit()
    else:
        database.create_scan(db, request.url, summary, "", policy_text)

    return AnalyzeResponse(
        status="processed_new",
        summary=summary
    )

@app.post("/chat", response_model=ChatResponse)
async def chat_policy(request: ChatRequest, db: Session = Depends(get_db)):
    """
    User asks a question about a specific URL.
    We load the persistent policy text from Database and answer directly using Groq's context window.
    """
    # 1. Find the scan record
    scan = database.get_scan_by_url(db, request.url)
    
    if not scan or not scan.policy_text:
        raise HTTPException(status_code=404, detail="Policy not found. Please analyze the site first.")

    # 2. Generate Answer
    answer = ai_engine.chat_with_policy(request.question, scan.policy_text)
    
    return ChatResponse(answer=answer)

@app.post("/fetch-html")
async def fetch_html(request: URLRequest):
    try:
        # We use an async client to keep FastAPI fast
        async with httpx.AsyncClient() as client:
            # Adding a standard User-Agent prevents many websites from blocking the request
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            
            # Fetch the URL
            response = await client.get(request.url, headers=headers, follow_redirects=True)
            response.raise_for_status() # Throw an error if we get a 404, 500, etc.
            
            return {"html": response.text}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Target URL returned an error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {str(e)}")



# --- 4. STARTUP ---
if __name__ == "__main__":
    import uvicorn
    # Create Tables on startup if they don't exist
    database.init_db()
    uvicorn.run(app, host="0.0.0.0", port=8000,reload=True,
                reload_excludes=["storage/*", "*.log", "test.py"])