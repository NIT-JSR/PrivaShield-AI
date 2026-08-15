# 🛡️ PrivaShield AI
### Bridging Dense Legal Disclosures and OS-Level Permissions using Multi-Agent RAG Pipelines

PrivaShield AI is an intelligent legal-to-technical compliance audit platform. It ingests complex, opaque privacy policies or terms of service, extracts structured facts, maps those statements to requested hardware/software permissions, scores their security risk using a mathematical rubric, and acts as a context-cased interactive Q&A assistant.

---

## 🚀 Detailed Features & Their Significance

### 1. Sequential 3-Stage Agentic Pipeline
* **Orchestration**: Runs sequentially: **Extractor Agent** (fact and verbatim quote miner) ➔ **Risk Analyzer Agent** (rubric scoring) ➔ **Verifier Agent** (hallucination checker).
* **Significance**: Large Language Models (LLMs) often hallucinate or combine extraction and analysis stages, leading to skewed reasoning. Separating extraction, grading, and validation ensures that each agent performs a single, testable responsibility.

### 2. Verified Source-Quote Mapping
* **Orchestration**: Extracted compliance facts (e.g., deletion availability, third-party sharing details) are paired with the exact verbatim string from the privacy policy.
* **Significance**: Demystifies black-box AI outputs. Users and legal analysts do not have to trust the AI blindly—they can inspect the verbatim quotes and verify context immediately.

### 3. Strict Rubric-Based Trust Score (0–100) & Deductions
* **Orchestration**: Applies a strict mathematical deduction engine starting at 100 points. Set values are subtracted for non-transparent factors (e.g., forced arbitration: -15, no data deletion mechanism: -15, indefinite retention: -15).
* **Significance**: Replaces subjective "vibe-based" grades with consistent, deterministic scores. The resulting letter grade (A–F) is auditable and repeatable.

### 4. Asynchronous Concurrent Mappers
* **Orchestration**: Runs OS-level device permission mapping (Camera, Contacts, Location, etc.) and hidden clause scanning concurrently using Python's `asyncio.gather()`.
* **Significance**: Accelerates analysis throughput by processing decoupled tasks in parallel, yielding a comprehensive profile without linear latency buildup.

### 5. Grounded RAG Q&A with Semantic Boundary Control
* **Orchestration**: Splits policies using paragraph/sentence boundaries. When asked a question, it retrieves the top 5 chunks via keyword overlap, checks similarity, and queries the LLM.
* **Significance**: Prevents chunk boundaries from slicing critical context in half. The system declines to answer (`confidence: Low`, `silent: true`) if relevant source passages are missing.

### 6. Interactive History & Dashboard Analytics
* **Orchestration**: Features a local tracking sidebar, animated score gauges, and a tabbed details view (Summary, Trust Score Breakdown, Risks, Permissions, and Hidden Clauses).
* **Significance**: Saves recently analyzed policies to local state for rapid re-load, visualizing policy performance metrics interactively.

### 7. Manifest V3 Chrome Extension
* **Orchestration**: In-page scraping of target active tabs, proxying content to backend gateways with one-click analysis popup triggers.
* **Significance**: Evaluates compliance in real-time as users browse, offering protection without leaving the target web app.

---

## 🏗️ Technical Architecture

```
   ┌──────────────────────────────────────────────┐
   │         React Frontend / Chrome Extension    │
   └──────────────────────┬───────────────────────┘
                          │ (REST API Gateway call)
   ┌──────────────────────▼───────────────────────┐
   │         Node.js Express API Gateway          │
   └──────────────────────┬───────────────────────┘
                          │ (Internal FastAPI proxy)
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

## 🛠️ Complete Tech Stack & Package Significance

### 1. Python RAG Engine (FastAPI & LangChain Stack)

| Package / Library | Purpose in Project | Technical Significance |
|:---|:---|:---|
| **`fastapi`** | REST API Routing | Asynchronous framework with Pydantic integrations, providing low-latency routing and automatic OpenAPI documentation. |
| **`uvicorn`** | ASGI Server hosting | Manages worker loops and handles client concurrency for python processes. |
| **`langchain-core`** | LLM orchestrations | Standardizes model interfaces, configuration, and invocation syntax (e.g. `ainvoke` and runnables). |
| **`langchain-community`** | Persistence & Caching | Provides database connectors for SQLite prompt caches (`SQLiteCache`), avoiding duplicated external requests. |
| **`langchain-openai`** | Model Client | Interfaces with the OpenAI-compatible Groq endpoint using high-speed streaming integrations. |
| **`langchain-text-splitters`** | Content chunking | Contains the `RecursiveCharacterTextSplitter` which divides text based on native boundaries (`\n\n`, `.`, ` `) instead of cutting sentences. |
| **`beautifulsoup4`** | HTML processing | Cleans crawled web content by removing scripts, styling, headers, and footer garbage to block prompt injections. |
| **`SQLAlchemy`** | Object Relational Mapping | Maps DB schemas to database drivers, enabling simple SQLite/MySQL storage swaps. |
| **`psycopg2-binary`** | Postgres driver support | Provides production-ready database adapters for cloud relational storage. |
| **`python-dotenv`** | Environment settings | Loads local system variables (like API keys) safely into Python configuration scopes. |
| **`httpx`** | Asynchronous HTTP Requests | Performs async requests inside `/fetch-html` to fetch remote policy assets without blocking server operations. |
| **`tenacity`** | Retry logic | Implements exponential backoff routines for Groq model endpoint calls during rate limits or server latency spikes. |

---

### 2. Node.js API Gateway Stack

| Package / Library | Purpose in Project | Technical Significance |
|:---|:---|:---|
| **`express`** | Gateway Routing | Lightweight framework to accept UI calls and route them safely to underlying microservices. |
| **`cors`** | CORS Policy control | Manages cross-origin permissions, allowing Chrome Extension context access without configuration blocks. |
| **`http-proxy-middleware`**| API Proxying | Transparently forwards client requests to the python RAG backend, hiding inner IP topology. |
| **`dotenv`** | Config Management | Loads environment vars for port assignments and base URLs. |

---

### 3. Frontend & Client Stack (React & Chrome Extension)

| Package / Library | Purpose in Project | Technical Significance |
|:---|:---|:---|
| **`react` (v19)** | UI State rendering | Handles UI rendering loops, local states, and component mount routines. |
| **`vite` (v7)** | Dev & Bundler tool | Offers hot module replacement (HMR) and bundles optimized client assets. |
| **Manifest V3** | Extension architecture | The security-oriented Chrome extension standard utilizing service-worker architectures and secure background scripts. |
| **Local Storage** | Session caching | Maintains client-side state of the 10 most recent URL analysis operations so data is preserved across page refreshes. |

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Payload Schema |
|:---|:---|:---|:---|
| `GET` | `/` | Service health check | None |
| `POST` | `/analyze` | Invokes the sequential 3-stage agentic pipeline and saves results | `{"url": "string", "html": "string"}` |
| `POST` | `/chat` | RAG-grounded question query returning chunk citations and confidence | `{"url": "string", "question": "string"}` |
| `POST` | `/risks` | Returns raw risk factors, data collected categories, and severity | `{"url": "string", "html": "string"}` |
| `POST` | `/permissions` | Maps privacy policy statements to device hardware permissions | `{"url": "string", "html": "string"}` |
| `POST` | `/hidden-clauses` | Inspects policy for arbitration, waivers, or licensing clauses | `{"url": "string", "html": "string"}` |
| `POST` | `/full-analysis` | Asynchronously executes the pipeline + mappers concurrently | `{"url": "string", "html": "string"}` |

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
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
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

## 👥 Developers

Built for academic evaluation at **NIT Jamshedpur**.

- **Prince** — Chief Privacy Architect
- **Harsha** — Policy Miner & API Specialist
- **Shivagya** — RAG Engine Strategist
- **Satyam** — Threat Intelligence Analyst
- **Ashutosh** — Extension & UX Engineer
