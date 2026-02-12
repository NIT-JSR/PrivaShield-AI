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

## ⚡ Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **MySQL** (or modify `database.py` for SQLite)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### 1. RAG Engine (Python)

```bash
cd rag

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure API key
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# Initialize database
python database.py

# Start the server (with enhanced routes)
python run.py
# Server runs on http://localhost:8000
```

### 2. Node.js Gateway

```bash
cd backend
npm install
npm start
# Gateway runs on http://localhost:5000
```

### 3. React Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard runs on http://localhost:5173
```

### 4. Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The 🛡️ PrivaShield icon appears in your toolbar

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

---

## 📄 License

This project is developed for academic purposes at NIT Jamshedpur.
