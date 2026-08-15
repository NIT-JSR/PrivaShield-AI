# 🛡️ PrivaShield AI

### An Interactive Legal-to-Permission Mapping Engine

PrivaShield AI is an intelligent middleware that bridges the gap between dense legal privacy policies and actual device-level permissions — transforming **blind consent** into **contextual consent**.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **3-Stage Sequential Pipeline** | Extractor (facts & quotes) → Risk Analyzer (weighted grading) → Verifier (anti-hallucination QA) |
| **Centralized LLM Cache** | SQLite prompt caching so identical analyses/questions load instantly with 0 Groq API calls |
| **RAG-Grounded Chatbot** | Smart recursive chunking & overlap matching to answer user questions using only the policy document |
| **Chat Citations & Confidence** | Chat responses include a verifiability confidence level badge and cite specific source chunk IDs |
| **Permission Mapper** | Maps legal text to 15 device-level permissions with deny-consequence recommendations |
| **Hidden Clause Detector** | Flags arbitration clauses, data-selling practices, and class-action waivers |
| **Chrome Extension** | Analyze any website's privacy policy directly from Manifest V3 popup |
| **Interactive History** | Save past analyzed policies in a local tracker for quick re-load |

---

## 🏗️ Architecture & Pipeline Flow

```
   ┌──────────────────────────────────────────────┐
   │         React Frontend / Chrome Extension    │
   └──────────────────────┬───────────────────────┘
                          │ (REST API)
   ┌──────────────────────▼───────────────────────┐
   │         Node.js Express API Gateway          │
   └──────────────────────┬───────────────────────┘
                          │ (REST API)
   ┌──────────────────────▼───────────────────────┐
   │          FastAPI RAG Backend Engine          │
   └──────────────────────┬───────────────────────┘
                          │
            [Sequential 3-Stage Pipeline]
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 1: EXTRACTOR                           │ (Extracts facts & quotes)
  └───────────────────────┬───────────────────────┘
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 2: RISK ANALYZER                       │ (Calculates weighted Trust Score 0-100)
  └───────────────────────┬───────────────────────┘
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 3: VERIFIER                            │ (Anti-hallucination check & math validation)
  └───────────────────────────────────────────────┘
          ▲                               ▲
          │ (Concurrent)                  │ (Concurrent)
  ┌───────┴───────────────┐       ┌───────┴───────┐
  │   Permission Mapper   │       │ Hidden Clause │
  └───────────────────────┘       └───────────────┘
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
│       │   ├── LandingPage.jsx   # Hero + features + architecture (animated demo)
│       │   ├── Dashboard.jsx     # URL analysis dashboard (History + Score breakdown)
│       │   └── Chatbot.jsx       # RAG chatbot interface (Confidence + Source badges)
│       └── privashield.css       # Design system
│
├── rag/                    # Python RAG Engine
│   ├── main.py             # FastAPI app (unified v2 endpoint shell)
│   ├── run.py              # Enhanced entry point (all endpoints)
│   ├── ai_engine.py        # Text cleaning, recursive chunking, similarity matching
│   ├── risk_analyzer.py    # Permission mapping & hidden clause detection logic
│   ├── pipeline.py         # Sequential 3-stage agentic pipeline orchestration
│   ├── database.py         # SQLAlchemy SQLite Models & Helpers
│   ├── llm_config.py       # Centralized LLM client + SQLite prompt cache
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
# Add your GROQ_API_KEY to .env
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
| `POST` | `/analyze` | Analyze policy HTML → summary + database save (v2 pipeline) |
| `POST` | `/chat` | Chat with analyzed policy (RAG-grounded with citations) |
| `POST` | `/risks` | Risk analysis with score & red flags |
| `POST` | `/permissions` | Device permission mapping |
| `POST` | `/hidden-clauses` | Hidden/dangerous clause detection |
| `POST` | `/full-analysis` | Complete analysis (combined concurrent pipeline execution) |

---

## 🧠 How It Works

1. **Policy Extraction** — The React dashboard or Chrome extension extracts policy text or HTML.
2. **Text Cleaning** — BeautifulSoup sanitizes HTML tags to prevent prompt injection and garbage tokens.
3. **Sequential Pipeline** — The FastAPI engine triggers the three sequential stages:
   - **Extractor** pulls explicit statements and matches verbatim source quotes.
   - **Risk Analyzer** uses a strict mathematical deduction rubric starting at 100 to grade policies (A-F).
   - **Verifier** cross-checks quotes against source context and ensures score breakdowns sum up correctly.
4. **Concurrent Enrichers** — Parallel threads detect device permissions and hidden clauses asynchronously to minimize total latency.
5. **RAG-Grounded Chat** — Natural language queries are tokenized, matched against recursively split document chunks, and verified by a self-censor if source matching is too low (< 0.55 similarity).
6. **Prompt Caching** — All LLM operations query a localized `SQLiteCache` to prevent redundant external API calls and rate-limiting.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Chrome Extension | Manifest V3, Vanilla JS |
| Frontend | React 19, Vite 7 |
| API Gateway | Node.js, Express |
| RAG Engine | Python, FastAPI |
| AI/LLM | Groq (Llama-3.3-70b-versatile) |
| LangChain Cache | SQLiteCache (Centralized prompt cache) |
| Chunking | RecursiveCharacterTextSplitter (LangChain) |
| Database | SQLite / MySQL via SQLAlchemy |
| HTML Processing | BeautifulSoup4 |

---

## 👥 Team

Built by the PrivaShield AI Team — **NIT Jamshedpur**

- **Prince** — Chief Privacy Architect
- **Harsha** — Policy Miner & API Specialist
- **Shivagya** — RAG Engine Strategist
- **Satyam** — Threat Intelligence Analyst
- **Ashutosh** — Extension & UX Engineer

## 📄 License

This project is developed for academic purposes at NIT Jamshedpur.
