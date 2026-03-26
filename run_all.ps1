# PrivaShield AI - Unified Run Script
# This script starts all three components of the PrivaShield AI application in separate windows.

Write-Host "[PrivaShield] Starting Services..." -ForegroundColor Cyan

# 1. RAG Engine (Python FastAPI)
Write-Host "[1/3] Launching Python RAG Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd rag; venv\Scripts\activate; python run.py" -WindowStyle Normal

# 2. Backend Gateway (Node.js Express)
Write-Host "[2/3] Launching Node.js Backend Gateway (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# 3. Frontend Dashboard (React + Vite)
Write-Host "[3/3] Launching React Frontend Dashboard (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host "[DONE] All services launched!" -ForegroundColor Green
Write-Host "Access the dashboard at: http://localhost:5173" -ForegroundColor White
