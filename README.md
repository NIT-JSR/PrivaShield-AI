# 🛡️ PrivaShield AI

### An Interactive Legal-to-Permission Mapping Engine

PrivaShield AI is an intelligent middleware that bridges the gap between dense legal privacy policies and actual device-level permissions — transforming **blind consent** into **contextual consent**.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **AI Policy Summarizer** | Instantly summarize 10,000+ word privacy policies into actionable insights |
| **Risk Score Engine** | Get a 1-10 risk rating with detailed breakdowns |
| **Permission Mapper** | Map policy text to device permissions (camera, location, etc.) with deny-consequence explanations |
| **Hidden Clause Detector** | AI finds buried clauses about data selling, perpetual ownership, arbitration traps |
| **RAG Chatbot** | Ask questions about any policy in natural language |
| **Chrome Extension** | One-click analysis on any website |

---

## 🏗️ Architecture

```
Frontend (Chrome Extension / React Dashboard)
        ↓
  Node.js API Gateway (Express)
        ↓
  Python RAG Engine (FastAPI)
        ↓
  ┌─────────────────────────────────────┐
  │  Text Cleaning + Section Chunking   │
  │  Embeddings (MiniLM-L6-v2)         │
  │  Vector DB (FAISS)                  │
  │  AI Analysis (Gemini 2.5 Flash)    │
  │  Risk Analyzer + Permission Mapper  │
  └─────────────────────────────────────┘
```

---

## 📂 Project Structure

```
PrivaShield-AI/
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json       # Extension configuration
│   ├── popup.html/css/js   # Extension popup UI
│   ├── content.js          # Page HTML extractor
│   ├── background.js       # Service worker
│   └── icons/              # Extension icons
│
├── backend/                # Node.js API Gateway
│   └── src/server.js       # Express proxy to Python service
│
├── frontend/               # React + Vite Dashboard
│   └── src/
│       ├── components/
│       │   ├── PrivaShield.jsx   # Main app shell
│       │   ├── LandingPage.jsx   # Hero + features + architecture
│       │   ├── Dashboard.jsx     # URL analysis dashboard
│       │   └── Chatbot.jsx       # RAG chatbot interface
│       └── privashield.css       # Design system
│
├── rag/                    # Python RAG Engine
│   ├── main.py             # FastAPI app (original endpoints)
│   ├── run.py              # Enhanced entry point (all endpoints)
│   ├── ai_engine.py        # Text cleaning, FAISS, Gemini summarizer
│   ├── risk_analyzer.py    # Risk analysis, permission mapping, hidden clauses
│   ├── enhanced_routes.py  # New API routes (risks, permissions, hidden-clauses)
│   ├── database.py         # MySQL/SQLAlchemy models
│   └── requirements.txt    # Python dependencies
│
└── README.md
```

---

## 🚀 Quick Start (Unified Launcher)

If you are on **Windows**, we have provided a unified PowerShell script to launch all three services (**AI Engine**, **Backend Gateway**, and **Frontend**) simultaneously in separate windows:

1. Open a **PowerShell** terminal in the root directory.
2. Run the unified launcher:
   ```powershell
   .\run_all.ps1
   ```
3. Three new windows will open. Once they are initialized, you can access the dashboard at:
   👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Manual Setup

If you prefer to start components individually, follow these steps:

### 1. RAG Engine (Python)
The engine uses **SQLite** by default (zero-config).
```bash
cd rag
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Add your GOOGLE_API_KEY to .env
python run.py
```

### 2. Node.js Gateway
```bash
cd backend
npm install
npm start
```

### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Chrome Extension
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/analyze` | Analyze policy HTML → summary + vector DB |
| `POST` | `/chat` | Chat with analyzed policy (RAG) |
| `POST` | `/risks` | Risk analysis with score & red flags |
| `POST` | `/permissions` | Device permission mapping |
| `POST` | `/hidden-clauses` | Hidden/dangerous clause detection |
| `POST` | `/full-analysis` | Complete analysis (all above combined) |

### Example Request

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "html": "<html><body>We collect your personal data including location, contacts, and browsing history. This data may be shared with third-party advertisers...</body></html>"}'
```

---

## 🧠 How It Works

1. **Policy Extraction** — Chrome extension extracts page HTML via content script
2. **Text Cleaning** — BeautifulSoup strips scripts, styles, nav elements → clean text
3. **Chunking** — RecursiveCharacterTextSplitter creates overlapping chunks (2000 tokens, 200 overlap)
4. **Embeddings** — `sentence-transformers/all-MiniLM-L6-v2` generates vector embeddings
5. **Vector Storage** — FAISS indexes chunks for semantic search
6. **AI Analysis** — Gemini 2.5 Flash analyzes for risks, permissions, hidden clauses
7. **RAG Chat** — User questions → FAISS similarity search → Gemini generates contextual answers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Chrome Extension | Manifest V3, Vanilla JS |
| Frontend | React 19, Vite 7 |
| API Gateway | Node.js, Express |
| RAG Engine | Python, FastAPI |
| AI/LLM | Google Gemini 2.5 Flash |
| Embeddings | sentence-transformers (MiniLM-L6-v2) |
| Vector DB | FAISS |
| Database | MySQL + SQLAlchemy |
| Text Processing | BeautifulSoup, LangChain |

---

## 👥 Team

Built by the PrivaShield AI Team — **NIT Jamshedpur**

- **Prince** — Chief Privacy Architect
- **Harsha** — Policy Miner & API Specialist
- **Shivagya** — RAG Engine Strategist
- **Satyam** — Threat Intelligence Analyst
- **Ashutosh** — Extension & UX Engineer


## 🔧 Troubleshooting

### `npm install` fails with `ENOSPC` (No space left on device)

The `frontend/` install pulls ~160 packages (Babel, Rollup, ESBuild, ESLint, Vite).  
If your disk is almost full, the download will fail mid-way and you may also see `zlib: unexpected end of file` errors from corrupt partial archives.

**Fix:**

```powershell
# 1. Free disk space — the install needs at least ~300–500 MB free
#    (node_modules ~200 MB + npm cache overhead).
#    Check available space with:
Get-PSDrive C

# 2. Clear the corrupted npm cache:
npm cache clean --force

# 3. Delete the broken node_modules folder (Windows):
Remove-Item -Recurse -Force frontend\node_modules

# 4. Retry the install:
cd frontend
npm install
```

### `EPERM: operation not permitted` during cleanup (Windows)

This usually means Windows Defender or another process has locked a file inside `node_modules`.

**Fix:**

```powershell
# Temporarily pause real-time protection, then retry.
# Or run the terminal as Administrator.
Remove-Item -Recurse -Force frontend\node_modules
cd frontend && npm install
```

### `zlib: unexpected end of file`

This means a downloaded package tarball is corrupted in the local npm cache.

**Fix:**

```powershell
npm cache clean --force
npm install
```

---

## 📄 License

This project is developed for academic purposes at NIT Jamshedpur.
