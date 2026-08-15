# 🛡️ PrivaShield AI
### Bridging the Gap Between Opaque Legal Policies and Actual Device Permissions

PrivaShield AI is a modern, containerized, multi-agent RAG (Retrieval-Augmented Generation) middleware platform. It translates dense, unreadable privacy policies and terms of service into actionable security ratings, structured fact databases, and context-grounded interactive Q&A. 

By cross-referencing legal disclosures against device-level capabilities, PrivaShield AI transforms **blind consent** into **contextual consent**.

---

## 🚀 Core Features & Their Significance

### 1. 3-Stage Sequential Agentic Pipeline
- **Description**: Document processing flows through a multi-agent sequence: **Extractor Agent** (fact extraction) ➔ **Risk Analyzer Agent** (rubric-based grading) ➔ **Verifier Agent** (anti-hallucination QA).
- **Significance**: Prevents LLMs from "skipping steps" or making leaps in logic. Isolating extraction from risk calculation ensures that the risk scores are grounded strictly in explicitly stated facts rather than abstract assumptions or model bias.

### 2. Verified Source-Quote Extraction
- **Description**: Every structured fact extracted from the policy (e.g., data retention limits, deletion mechanisms) is paired with the exact verbatim `source_quote` from the original text.
- **Significance**: Eradicates the classic "black-box LLM" problem. Users and developers do not have to take the AI's word for it; they can cross-verify any flag against the exact sentence in the target policy.

### 3. Strict Rubric-Based Trust Score (0–100)
- **Description**: Replaces subjective "vibe-based" grading with a strict, math-based deduction system (starting at 100, subtracting set penalties for violations like class-action waivers or data-selling).
- **Significance**: Provides a repeatable, standardized audit trail. It allows enterprises and users to compare different platforms' privacy practices using a normalized index.

### 4. Grounded RAG Chatbot with Citation & Confidence Badging
- **Description**: A query interface allowing users to ask questions about the policy. It returns answers cited with `chunk_id`s, alongside a dynamically calculated confidence badge (`High / Medium / Low`).
- **Significance**: The AI self-censors if it doesn't find strong document matches (similarity score < 0.55), notifying the user that the "policy is silent on this topic." This prevents dangerous hallucinations regarding legal rights.

### 5. Concurrent Enrichers (Permissions & Hidden Clauses)
- **Description**: Runs mapping for 15 OS-level permissions (e.g., camera, location tracking) and scans for hidden legal traps (e.g., forced arbitration, unilateral contract changes) concurrently with the main pipeline.
- **Significance**: Delivers comprehensive metadata in a single pass while keeping latency low using parallel async executions (`asyncio.gather()`).

---

## 🏗️ Technical Architecture & Pipeline Flow

The platform separates the presentation, gateway proxy, and intelligence engine layers to ensure security, cache validation, and execution speed.

```
   ┌──────────────────────────────────────────────┐
   │         React Frontend / Chrome Extension    │
   └──────────────────────┬───────────────────────┘
                          │ (HTTPS / CORS-enabled REST)
   ┌──────────────────────▼───────────────────────┐
   │         Node.js Express API Gateway          │
   └──────────────────────┬───────────────────────┘
                          │ (Internal API Proxy)
   ┌──────────────────────▼───────────────────────┐
   │          FastAPI RAG Backend Engine          │
   └──────────────────────┬───────────────────────┘
                          │
             [3-Stage Agentic Pipeline]
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 1: EXTRACTOR                           │ ➔ Extracts structured facts & verbatim quotes
  └───────────────────────┬───────────────────────┘
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 2: RISK ANALYZER                       │ ➔ Executes deduction rubric (0-100 & A-F)
  └───────────────────────┬───────────────────────┘
                          │
  ┌───────────────────────▼───────────────────────┐
  │  Stage 3: VERIFIER                            │ ➔ Cross-checks quote matches & math consistency
  └───────────────────────────────────────────────┘
          ▲                               ▲
          │ (Concurrent)                  │ (Concurrent)
  ┌───────┴───────────────┐       ┌───────┴───────┐
  │   Permission Mapper   │       │ Hidden Clause │
  └───────────────────────┘       └───────────────┘
```

---

## 🛠️ Tech Stack & Significance

| Layer / Library | Technology Used | Significance |
|:---|:---|:---|
| **Frontend** | React 19 + Vite 7 | Provides a lightning-fast Single Page Application (SPA) dashboard. Vite optimizes development reloading and bundles asset chunks dynamically for instant load times. |
| **Styling** | Vanilla CSS + Tailwind | Delivers a highly responsive, modern dark-mode aesthetic with custom animated glassmorphism panels, while avoiding heavy framework overhead. |
| **API Gateway** | Node.js + Express | Acts as a secure, stateless reverse proxy, decoupling the client UI from the Python backend to prevent direct exposition of AI endpoints. |
| **Engine** | FastAPI (Python) | High-performance, asynchronous REST framework that handles incoming payloads natively, enabling rapid async I/O loops. |
| **LLM Provider** | Groq (Llama-3.3-70b-versatile) | Provides sub-second inference latency, making a multi-agent pipeline feasible by keeping wait times down. |
| **Prompt Cache** | LangChain `SQLiteCache` | Intercepts repeated prompt patterns. If an identical question is asked, it serves the answer from a local database instantly (0 API calls, zero cost, zero rate-limit risk). |
| **Chunking** | LangChain `RecursiveCharacterTextSplitter` | Intelligently segments long legal documents based on natural boundaries (paragraphs, punctuation) so sentences do not get sliced in half at chunk edges. |
| **Database** | SQLAlchemy + SQLite | Provides zero-config, highly portable local storage for policy logs and cached summaries, easily swappable to PostgreSQL or MySQL in production. |
| **HTML Parser** | BeautifulSoup4 | Strips scripts, styling sheets, nav elements, and tracking trackers from raw HTML payloads, mitigating prompt-injection risks. |

---

## 📂 Project Structure

```
PrivaShield-AI/
├── extension/              # Chrome Extension (Manifest V3)
│   ├── manifest.json       # Browser configuration
│   ├── popup.html/css/js   # Extension dashboard popup UI
│   └── content.js          # In-page HTML text scraper
│
├── backend/                # Node.js API Gateway Proxy
│   └── src/server.js       # Express gateway script
│
├── frontend/               # React + Vite Dashboard
│   └── src/
│       ├── components/
│       │   ├── LandingPage.jsx   # Interactive marketing page & live gauge demo
│       │   ├── Dashboard.jsx     # Analysis dashboard, History list, & Score breakdown
│       │   └── Chatbot.jsx       # RAG chat component with sources & confidence
│       └── privashield.css       # Unified design token stylesheet
│
├── rag/                    # FastAPI AI RAG Engine
│   ├── main.py             # FastAPI entry router
│   ├── pipeline.py         # 3-Stage Agentic Pipeline Orchestrator
│   ├── ai_engine.py        # Text clean, recursive split, TF-IDF RAG matcher
│   ├── risk_analyzer.py    # Permission mapping & hidden clause detection logic
│   ├── llm_config.py       # Shared LLM instance & persistent SQLiteCache
│   ├── database.py         # Local SQLite DB configuration and schema
│   └── requirements.txt    # Python packages
│
└── README.md
```

---

## 🚀 Quick Start (Unified Launcher)

If you are on **Windows**, we have provided a unified script to launch all three services (**AI Engine**, **Backend Gateway**, and **Frontend**) concurrently in separate shell windows:

1. Open a **PowerShell** terminal in the root directory.
2. Run the unified launcher:
   ```powershell
   .\run_all.ps1
   ```
3. Three new terminal windows will spawn. Once they initialize, access the dashboard at:
   👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛠️ Manual Setup

### 1. RAG Engine (Python)
The engine automatically configures a local SQLite file (`storage/privashield.db`).
```bash
cd rag
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
# Populate your GROQ_API_KEY in the generated .env file
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
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the root `extension/` directory.

---

## 🔌 API Gateway Endpoints

| Method | Endpoint | Description | Payload Schema |
|:---|:---|:---|:---|
| `GET` | `/` | Service health check | None |
| `POST` | `/analyze` | Invokes the sequential 3-stage agentic pipeline and saves results | `{"url": "string", "html": "string"}` |
| `POST` | `/chat` | RAG-grounded question query returning chunk citations and confidence | `{"url": "string", "question": "string"}` |
| `POST` | `/risks` | Returns raw risk factors, data collected categories, and severity | `{"url": "string", "html": "string"}` |
| `POST` | `/permissions` | Maps privacy policy statements to device hardware permissions | `{"url": "string", "html": "string"}` |
| `POST` | `/hidden-clauses` | Inspects policy for arbitration, waivers, or licensing clauses | `{"url": "string", "html": "string"}` |
| `POST` | `/full-analysis` | Asynchronously executes the pipeline + enrichers concurrently | `{"url": "string", "html": "string"}` |

---

## 👥 Developers

Built for academic evaluation at **NIT Jamshedpur**.

- **Prince** — Chief Privacy Architect
- **Harsha** — Policy Miner & API Specialist
- **Shivagya** — RAG Engine Strategist
- **Satyam** — Threat Intelligence Analyst
- **Ashutosh** — Extension & UX Engineer
