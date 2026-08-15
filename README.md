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

## 🔍 Behind-The-Scenes Execution Flow

Here is a step-by-step walkthrough of what happens under the hood during a typical user lifecycle:

### Phase 1: Policy Analysis Workflow
```
[User Action] ➔ [Node Gateway] ➔ [FastAPI Router] ➔ [Cache Check] 
                                                        │
                      ┌─────────────────────────────────┴───┐
                  (Cache Hit)                           (Cache Miss)
                      │                                     │
             [Return Cache JSON]                     [Clean HTML Content]
                                                            │
                                                     [asyncio.gather]
                                             ┌──────────────┼──────────────┐
                                             ▼              ▼              ▼
                                        [Pipeline]     [Permissions]   [Hidden]
                                             │
                                     (Stage 1: Extract)
                                             │
                                     (Stage 2: Score)
                                             │
                                     (Stage 3: Verify)
                                             │
                                             ▼
                                     [Collate Payloads]
                                             │
                                    [SQLiteCache Check]
                                             │
                                     [Save File & DB] ➔ [Render View]
```

1. **Ingestion & Proxying**: The user triggers an analysis (via URL or paste) from the frontend. The request hits the Node.js Express Gateway, which adds headers for extension context mapping, and forwards the payload to FastAPI on `http://localhost:8000/full-analysis`.
2. **File Caching Check**: The FastAPI backend generates an MD5 hash of the URL and searches `storage/analysis_cache/` for a matching `*_v3.json` file. If found, it returns the cached result in **~1-2ms** bypassing all AI calls.
3. **HTML Sanitization**: On a cache miss, the engine extracts raw text from the input HTML. `BeautifulSoup4` decomposes `<script>`, `<style>`, `<header>`, and `<footer>` nodes to prevent DOM/prompt injection and minimize tokens.
4. **Concurrent Multi-Agent Dispatch**: The system launches three asynchronous tasks in parallel via `asyncio.gather()`:
   * **The Sequential Pipeline**: Initiates `pipeline.run_full_pipeline()`.
     * **Stage 1 (Extractor)**: The text is cropped to the first 20,000 characters and sent to Groq. It extracts structural facts matching a strict JSON schema, ensuring every claim is backed by a verbatim `source_quote`.
     * **Stage 2 (Risk Analyzer)**: Receives the JSON data from Stage 1. It calculates trust score deductions and translates the remaining score into a grade (A-F).
     * **Stage 3 (Verifier)**: Cross-checks the risk data. It checks that quotes match the original text exactly, verifies deduction math, and filters out non-neutral language.
   * **Permission Mapper**: Simultaneously parses the policy text to map OS permissions.
   * **Hidden Clause Detector**: Simultaneously scans the document for hidden legal clauses.
5. **SQLite Prompt Cache Interception**: During each LLM invocation inside the agents, LangChain interceptors query `storage/llm_cache.db`. If the exact prompt was processed before, it returns the LLM response instantly without invoking Groq's APIs.
6. **Data Consolidation & Storage**: The backend merges the sequential pipeline's output, permissions, and hidden clauses. The result is stored in SQLite (`storage/privashield.db`), written as a local cache file, and returned to the client.

### Phase 2: RAG Q&A Chat Workflow
```
[Chat Question] ➔ [Fetch DB Policy] ➔ [Semantic Chunking] ➔ [TF-IDF Keyword Similarity]
                                                                        │
                                                    ┌───────────────────┴───┐
                                              (Score >= 0.55)         (Score < 0.55)
                                                    │                       │
                                            [Query Q&A Agent]       [Censor: Silent Reply]
```
1. **Document Loading**: When the user posts a chatbot query, FastAPI loads the verified policy text from the database.
2. **Semantic Boundary Chunking**: The text is chunked dynamically using LangChain's `RecursiveCharacterTextSplitter` into overlapping blocks, preventing information loss at boundaries.
3. **Overlapped Similarity Retrieval**: The question is tokenized (excluding stopwords). A similarity algorithm calculates overlap metrics across all document chunks, returning the top 5 chunks.
4. **Relevance Guard (Censoring)**:
   * If the highest chunk score is below **0.55**, the system declines to answer (`document_silent_on_topic: true`) to avoid hallucinations.
   * If the score matches, it sends the top 5 chunks and the question to the Q&A Agent.
5. **Structured Return**: The chatbot receives the response containing chunk citations and confidence levels, rendering color-coded badges to the user.

### Phase 3: Handling React SPAs & Client-Rendered Policies
Modern React, Vue, or Angular single-page applications (SPAs) do not serve pre-rendered text over basic HTTP. If you run a static GET request on them, the server only receives a blank root skeleton (`<div id="root"></div>`). PrivaShield AI solves this with two ingestion strategies:
* **Live DOM Scraping via Chrome Extension**: The Chrome extension's `content.js` script queries the live tab DOM *after* JavaScript execution has occurred and the React components are fully hydrated. It captures `document.documentElement.outerHTML` (which contains the actual rendered text) and sends it directly to the backend.
* **Paste Policy Text Mode**: For systems behind authentication or complex hydration structures, the Dashboard allows users to copy and paste the rendered text directly. This bypasses static page fetching issues.

### 4. TF-IDF & Token Overlap Fallback System
While the primary search relies on the `SentenceTransformer` vector space to retrieve semantically matching chunks, the system maintains a built-in **TF-IDF/Token Overlap fallback engine**:
* **Resilience against CPU/Memory limits**: If the local hardware fails to load or host the neural network weights (e.g. out of memory, or running on low-resource legacy systems), the server automatically downgrades the query routine to an in-memory TF-IDF overlap search.
* **Stopword Filtering**: The fallback tokenizes queries and removes grammatical noise (like "what", "is", "the"), matching keyword densities to guarantee that basic RAG services are never offline.

---

## ⚙️ Process Coordination & Launcher Mechanics (Behind the Scenes)

When running the application, multiple processes operate and coordinate asynchronously. Here is how they interact behind the scenes:

### 1. Unified Launcher (`run_all.ps1`) Process Spawning
When you execute the unified script `.\run_all.ps1`, the following actions occur at the OS level:
* **Asynchronous Subprocess Detachment**: The script uses PowerShell's `Start-Process` cmdlet to spawn three separate, persistent terminal windows. Each subprocess is given its own process ID (PID) and CPU execution thread.
* **Component Startup Isolation**:
  1. **Python Engine (Port 8000)**: Spawns a PowerShell instance, activates the virtual environment (`venv\Scripts\activate`), and runs `start_server.py`. Uvicorn initializes, creates the SQLite file `storage/privashield.db` via SQLAlchemy if it is missing, runs structural migrations, and binds to all interfaces on port `8000`.
  2. **Express Gateway (Port 5000)**: Spawns a shell, installs dependencies if necessary, and starts the Node server. It binds to port `5000` and configures proxy routing rules.
  3. **Vite Development Server (Port 5173)**: Spawns a shell and runs `vite`. Vite loads configuration scopes, parses environment variables, prepares Hot Module Replacement (HMR) sockets, and serves raw frontend assets on port `5173`.

### 2. Port Binding, Network Traffic, & CORS Redirection
The three components run on separate ports, which introduces security and coordination challenges:
* **The CORS Challenge**: If the browser client (port `5173` or the Chrome extension popup) directly called the FastAPI backend (port `8000`), the browser would block the request due to Same-Origin Policy (SOP).
* **The Reverse Proxy Solution**: The Node.js Express server acts as a Reverse Proxy. It binds HTTP routing patterns (e.g. `/api/rag`) to target the FastAPI engine using `http-proxy-middleware`. All frontend traffic is routed through port `5000`, which modifies header properties to enable cross-origin (CORS) access safely.

### 3. Cooperative Multitasking and Asynchronous Concurrency
To handle heavy LLM traffic without slowing down user responses, the FastAPI backend uses Python's `asyncio` event loop:
* **Zero Thread-Overhead Concurrency**: Instead of spawning heavy OS threads (which eat system memory and introduce context-switching latency), Python uses cooperative multitasking.
* **Non-Blocking I/O**: When the backend waits for external events (e.g. fetching policy text via `httpx` or waiting for the Groq API response), the execution scope yields control back to the event loop. The loop immediately runs the next task (like permission mapping or hidden clause detection). This is why parallelizing tasks with `asyncio.gather()` results in massive latency reduction.

---

## 🏗️ Technical Architecture

See [Pipeline Flow] diagram above for visual routing overview.

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
| **`httpx`** | Asynchronous HTTP Requests | Performs async requests inside `/fetch-html` to fetch remote policy assets. Unlike synchronous `requests`, it yields thread execution back to the event loop, ensuring the backend never freezes while waiting for external server responses. |
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
