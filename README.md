<div align="center">
  <h1>⚖️ Justice AI</h1>

  <p>
    <a href="https://readme-typing-svg.demolab.com">
      <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=18&pause=1000&color=3B82F6&center=true&vCenter=true&width=600&lines=AI-powered+Legal+Assistance+SaaS;Normal+Chat+%2B+4-Agent+Deep+Research;Resolving+Consumer+%26+Traffic+Disputes+in+India" alt="Typing Animated Text" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-v1.1-green.svg?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/Python-FastAPI-yellow.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/Next.js-React-black.svg?style=for-the-badge&logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/Gemini-Vertex%20AI-10b981.svg?style=for-the-badge" alt="Gemini">
    <img src="https://img.shields.io/badge/4--Agent-Deep%20Research-8b5cf6.svg?style=for-the-badge" alt="Agentic">
  </p>

  <p>
    <a href="#-1-what-is-justice-ai">Overview</a> •
    <a href="#-2-two-modes-normal-chat--deep-research">Two Modes</a> •
    <a href="#-3-deep-research--the-4-agent-system">4-Agent System</a> •
    <a href="#-4-full-feature-list">Features</a> •
    <a href="#-5-technical-architecture">Architecture</a> •
    <a href="#-8-setup-instructions">Setup</a>
  </p>
</div>

---

## 📖 1. What is Justice AI?

**Justice AI** is an AI-powered legal assistance platform built specifically for everyday Indians who can't afford a lawyer for small disputes. We focus on the cases that are almost never contested — traffic challans, MRP overcharging, e-commerce refund denials, and consumer grievances.

### 🛑 The Problem
Fighting a ₹1,000 traffic challan or a ₹5,000 refund dispute in India is nearly impossible. The legal cost, procedural complexity, and time investment outweigh the benefit. People just give up, and unfair practices continue unchecked.

### 💡 Our Answer
Justice AI acts as the **first layer of legal defense** — helping users understand their rights instantly, identify whether they have a winnable case, and get a clear action plan, all powered by Indian law.

---

## 🔀 2. Two Modes: Normal Chat & Deep Research

Justice AI now has **two completely independent sessions**. You can think of them as a quick-consult vs. a full legal brief.

| | 💬 **Normal Chat** | 🧠 **Deep Research** |
|---|---|---|
| **Speed** | < 1 second TTFT | 15–40 seconds |
| **Depth** | Quick, conversational | Full structured legal report |
| **How it works** | RAG → Gemini → Answer (single pass) | 4 AI agents collaborate in a loop |
| **Best for** | "Is my challan valid?" | "Give me a complete legal analysis" |
| **Citations** | Yes (inline) | Yes (expandable panel) |
| **Confidence Score** | No | Yes (🟢🟡🔴 traffic light) |
| **Agent Log** | No | Yes (full trace of every agent step) |
| **Retry Logic** | No | Yes (up to 2 passes if weak) |

> **Important:** The two sessions share the same database, OCR, and LLM stack — but are completely independent code paths. Normal Chat was not modified when Deep Research was added.

---

## 🤖 3. Deep Research — The 4-Agent System

Deep Research uses a team of 4 AI agents that work together like a law firm:

```
User Question
     │
     ▼
┌─────────────────────────────────────────────────┐
│              🧠 Orchestrator Agent               │
│  (The Manager — routes, coordinates, decides)   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               🔍 Research Agent                  │
│  (The Librarian — searches the legal corpus)    │
│  top_k=8 chunks · score threshold ≥ 0.55        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               ⚖️ Analysis Agent                  │
│  (The Lawyer — drafts the full report)          │
│  5,000 token thinking budget · cited by [N]     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               ✅ Verifier Agent                  │
│  (The Checker — validates, scores 0–1)          │
│  3 checks: Retrieval · Citation · Reasoning     │
└──────────────────────┬──────────────────────────┘
                       │
         confidence ≥ 0.6?
            /          \
          YES            NO (retry, up to 2 passes)
           │
           ▼
  Final Report + Citations + Confidence Score
```

### The 4 Agents Explained Simply

**🧠 Orchestrator — "The Manager"**
- Receives the user's question and detects the legal category (traffic challan, MRP, refund, etc.)
- Kicks off the research-analyze-verify loop
- If the Verifier rejects the report, it orders a retry (up to 2 loops)
- Attaches a disclaimer automatically if confidence stays low

**🔍 Research Agent — "The Librarian"**
- Searches the vector database of Indian laws, acts, and case excerpts
- Uses wider parameters than Normal Chat (top_k=8 vs 3, threshold=0.55 vs 0.65) to cast a broader net
- Returns ranked chunks with scores to feed the Analysis Agent

**⚖️ Analysis Agent — "The Lawyer"**
- Takes the user's question + all research chunks as numbered references
- Uses Gemini 2.5 Flash with a **5,000-token thinking budget** for deep legal reasoning
- Produces a structured markdown report with 5 sections: Issue Summary, Win Probability, Applicable Law, Action Plan, Caveats
- Every claim is tied to a source reference [N]

**✅ Verifier Agent — "The Checker"**
- Grades the Analysis Agent's draft on 3 dimensions (each 0.0–1.0):
  - **Retrieval (30%)** — Were the right legal sources used?
  - **Citation (45%)** — Do claims actually match their sources?
  - **Reasoning (25%)** — Is the legal logic internally consistent?
- Computes a weighted confidence score
- If `confidence < 0.6` → sends the report back for a second pass

### Confidence Traffic Light

| Score | Badge | Meaning |
|---|---|---|
| ≥ 0.80 | 🟢 High Confidence | Well-sourced, cite-verified report |
| 0.60–0.79 | 🟡 Medium Confidence | Mostly sourced, minor gaps |
| < 0.60 | 🔴 Low Confidence | Auto-disclaimer added — consult a lawyer |

---

## ✨ 4. Full Feature List

### Chat Sessions
* 💬 **Normal Chat** — Fast RAG-powered legal Q&A. Single LLM call, streaming response, < 1s TTFT.
* 🧠 **Deep Research** — 4-agent collaborative session. Produces a full structured legal report with a verified confidence score.
* 🏷️ **Source Attribution** — Every response shows whether it came from the Indian law corpus or general LLM knowledge.
* 📎 **Citation Cards** — Inline cards mapping claims to specific Indian Acts, sections, and source documents.

### Voice & OCR
* 🎙️ **Nyay Voice AI** — Bilingual real-time voice consultation. Browser-native Speech-to-Text + Google Cloud TTS with Indian Neural2 voices (`en-IN-Neural2-B`, `hi-IN-Neural2-C`).
* 📄 **OCR Document Ingestion** — Upload traffic challans, bills, or invoices. Gemini 2.0 Vision extracts text; a metadata parser pulls out fine amounts, section numbers, merchant names, etc.

### Legal Categories Covered
* 🚦 Traffic Challan Disputes
* 🏷️ MRP / Price Overcharging
* 🛒 E-Commerce & Refund Disputes
* 📋 Consumer Forum Grievances (NCH, eDaakhil)

### Platform
* 🔒 **Secure Auth** — Google OAuth + Email/Password via NextAuth.js, backed by PostgreSQL.
* 💼 **SaaS Dashboard** — Dark-mode, modern UI with case cards, quick actions, and session navigation.

---

## 🏗️ 5. Technical Architecture

```mermaid
graph TD
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef agents fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff;
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef llm fill:#6366f1,stroke:#3730a3,stroke-width:2px,color:#fff;
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff;

    subgraph "Frontend (Next.js)"
        UI[Normal Chat]:::frontend
        DR[Deep Research Page]:::frontend
        VoiceOrb[Voice AI]:::frontend
        OCRUpload[OCR Upload]:::frontend
        AuthClient[NextAuth.js]:::frontend
    end

    subgraph "Backend (FastAPI)"
        ChatAPI[POST /api/chat]:::backend
        DRAPI[POST /api/deep-research]:::backend
        OCRService[OCR Service]:::backend
        VoiceRouter[Voice Router]:::backend

        subgraph "4-Agent System"
            Orch[Orchestrator Agent]:::agents
            Res[Research Agent]:::agents
            Ana[Analysis Agent]:::agents
            Ver[Verifier Agent]:::agents
        end

        RAG[RAG Pipeline]:::backend
        VectorStore[Vector Store]:::backend
    end

    subgraph "Databases"
        PG[(PostgreSQL)]:::db
        SQLite[(SQLite - Legal Corpus)]:::db
    end

    subgraph "AI Providers"
        Vertex[Vertex AI / Gemini 2.5]:::llm
        GemVision[Gemini 2.0 Vision]:::llm
        GCPVoice[Google Cloud STT/TTS]:::llm
        Groq[Groq / Llama 3.3]:::llm
        OAuth[Google OAuth]:::external
    end

    UI -->|messages| ChatAPI
    DR -->|messages| DRAPI
    VoiceOrb --> VoiceRouter
    OCRUpload --> OCRService

    ChatAPI --> RAG
    RAG --> VectorStore
    VectorStore --> SQLite
    RAG --> Vertex
    RAG -.->|fallback| Groq

    DRAPI --> Orch
    Orch --> Res
    Res --> VectorStore
    Res --> Ana
    Ana --> Vertex
    Ana --> Ver
    Ver -.->|retry if low confidence| Res
    Ver --> DRAPI

    OCRService --> GemVision
    VoiceRouter <--> GCPVoice
    AuthClient <--> OAuth
    AuthClient --> PG

    RAG -->|response + citations| UI
    DRAPI -->|report + confidence + agent_log| DR
```

### Frontend Stack
| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, file-based routing, API proxy |
| Language | TypeScript + React | Type safety, reusable components |
| Styling | Tailwind CSS (dark theme) | Rapid custom design system |
| Auth | NextAuth.js v4 | Google OAuth + credentials, JWT sessions |
| Animations | Framer Motion | Smooth transitions, agent stepper |

### Backend Stack
| Layer | Choice | Reason |
|---|---|---|
| API | FastAPI (Python) | Async, fast, auto-docs |
| Auth DB | PostgreSQL | Relational integrity for users |
| Vector DB | SQLite (`legal_resources.db`) | Portable, zero-config, fast L2 search |
| Agents | Custom Python classes | Modular, testable, independently replaceable |

---

## 🧠 6. AI & LLM Stack

### Model Routing (with automatic fallbacks)
```
Request
  │
  ├─► 1st: Vertex AI (GCP ADC) — gemini-2.5-flash
  ├─► 2nd: Google AI Studio (GEMINI_API_KEY) — gemini-2.5-flash
  └─► 3rd: Groq API — llama-3.3-70b-versatile
```

### Thinking Budget (Dynamic)
| Use Case | Budget | Why |
|---|---|---|
| Normal Chat answer | 2,000 tokens | Good legal reasoning, still fast |
| Deep Research analysis | 5,000 tokens | Maximum reasoning for a full report |
| Verifier grading | 0 tokens | Speed — lightweight classification only |
| Greeting/generic | 0 tokens | No reasoning needed |

### Embedding Models
| Priority | Model | Dimensions |
|---|---|---|
| Primary | Google `text-embedding-004` (Vertex AI) | 768 |
| Fallback | Google `text-embedding-004` (AI Studio) | 768 |
| Fallback | OpenAI `text-embedding-3-small` | 1536 |
| Offline | Custom Token-Hash BoW (no API needed) | 384 |

### Other AI Services
* **OCR:** `gemini-2.0-flash` — end-to-end vision extraction of challans, bills, and legal papers
* **STT:** Browser Web Speech API (primary) → Google Cloud STT (fallback)
* **TTS:** Google Cloud TTS — `en-IN-Neural2-B` (English) and `hi-IN-Neural2-C` (Hindi)

---

## 🔍 7. How the RAG Pipeline Works

The **Normal Chat** uses a heavily tuned single-pass RAG:

```
User Query
    │
    ▼
Generate Embedding (text-embedding-004)
    │
    ▼
Vector Search (SQLite, L2 normalized dot product)
    │
    ▼
Score Filter (threshold ≥ 0.65)
    │
  above?         below?
    │                │
    ▼                ▼
Inject context   "Limited context"
into prompt      warning injected
    │                │
    └────────┬────────┘
             ▼
    Gemini 2.5 Flash
    (thinking_budget=2000)
             │
             ▼
  Response + source_type + citations[]
```

**Deep Research** uses the same vector store but with wider search parameters (top_k=8, threshold=0.55) and feeds the results through the 4-agent loop instead.

### RAG Design Decisions
* **Why not CRAG?** We tried LLM-based document grading (Corrective RAG). It added 3–5s latency per turn, which broke the SaaS UX. We rolled back to score-threshold filtering.
* **Why SQLite?** Portable, zero-config, fast enough for our corpus size. Avoids Pinecone/Milvus operational overhead at this stage.
* **Why source attribution?** Users need to know if the AI is citing a real law or guessing. The `corpus` / `web_fallback` / `greeting` flags make this transparent.

---

## 📚 8. Data Sources

Our legal knowledge base is curated from verified Indian sources only:
* 🏛️ **India Code** — Bare Acts & Rules (Motor Vehicles Act, Consumer Protection Act, Legal Metrology Act)
* ⚖️ **Indian Kanoon** — Case law & judgements
* 🏛️ **Supreme Court & High Court Portals**
* 🏢 **NCH & eDaakhil** — Consumer Forum guidelines and complaint templates

---

## 🗄️ 9. Database Design

**Hybrid architecture — right tool for each job:**

| Database | What it stores | Why this choice |
|---|---|---|
| **SQLite** (`legal_resources.db`) | Legal corpus chunks + vector embeddings + metadata | Portable, zero-config, fast for read-heavy search |
| **PostgreSQL** (`justiceai`) | Users, NextAuth sessions, auth tokens | Relational integrity, concurrent writes, scalable |

---

## 🧗 10. Challenges We Solved

| Challenge | What went wrong | How we fixed it |
|---|---|---|
| **CRAG latency** | LLM grading added 3–5s per turn | Replaced with score-threshold filtering |
| **Legal hallucinations** | LLM making up section numbers | Strict system prompts + confidence-gated output |
| **Retrieval quality** | Standard chunking split critical legal context | Custom chunking strategy, metadata tagging |
| **OCR accuracy** | PDFs with mixed Hindi/English text | Gemini 2.0 Vision with structured JSON output |
| **STT reliability** | Empty transcripts on short recordings | 1 KB guard + echo cancellation + mono capture |
| **Agent confidence** | No way to know if AI answer is reliable | 3-dimensional Verifier scoring with retry loop |

---

## 💡 11. Key Learnings

* **Speed is a feature.** A 95%-accurate RAG that takes 15s to respond is worse than a 90%-accurate one that answers in 1s.
* **Modular agents > monolithic pipelines.** Each agent (Research, Analysis, Verifier) can be independently improved, swapped, or replaced without touching the others.
* **Constrain the LLM.** You can't trust LLMs to interpret law. Use them as synthesis engines over verified retrieved text, not as legal oracles.
* **Dual sessions, not one.** Fast chat for casual queries + deep research for serious analysis. Forcing one UX for both would break either the speed or the quality.
* **User-facing confidence matters.** A legal AI that doesn't tell you how confident it is in its answer is dangerous. The traffic-light system builds trust.

---

## 🔮 12. Roadmap

- [x] **RAG Chat** — Fast streaming legal Q&A
- [x] **OCR Uploads** — Parse challans and invoices
- [x] **Voice AI** — Bilingual real-time consultation
- [x] **Source Attribution** — Corpus vs. general knowledge labelling
- [x] **4-Agent Deep Research** — Orchestrator + Research + Analysis + Verifier
- [x] **Verifier Confidence Scores** — Traffic-light grading system
- [ ] **Complaint Generator** — Auto-draft NCH/eDaakhil legal notices
- [ ] **Case Success Prediction** — ML model on historical judgements
- [ ] **Filing Agent** — Submit complaints to consumer forums automatically
- [ ] **Docker + GCP Deployment** — Containerised with Pinecone/Milvus for scale

---

## 📁 13. Folder Structure

```text
Justice-AI/
├── backend/                     # FastAPI Application
│   ├── agents/                  # 🆕 4-Agent Deep Research System
│   │   ├── orchestrator_agent.py  # Manager — coordinates the loop
│   │   ├── research_agent.py      # Librarian — searches legal corpus
│   │   ├── analysis_agent.py      # Lawyer — drafts the report
│   │   └── verifier_agent.py      # Checker — scores + validates
│   ├── rag/                     # RAG Pipelines, Vector Store, Embeddings
│   │   ├── crag_pipeline.py       # Normal Chat RAG pipeline
│   │   ├── vector_store.py        # Cosine similarity search
│   │   └── embeddings.py          # Multi-provider embedding helper
│   ├── routers/                 # API Endpoints
│   │   ├── chat.py                # POST /api/chat  (Normal Chat)
│   │   ├── deep_research.py       # POST /api/deep-research  (4-Agent)
│   │   ├── ocr.py                 # POST /api/ocr
│   │   └── voice.py               # POST /api/voice/stt + tts
│   ├── ocr/                     # OCR service + metadata parser
│   ├── scraper/                 # Data ingestion, PDF processor
│   ├── data/                    # SQLite DB + raw corpus files
│   └── main.py                  # FastAPI entrypoint
│
├── frontend/                    # Next.js Application
│   └── src/
│       ├── app/
│       │   ├── chat/              # Normal Chat page
│       │   ├── deep-research/     # 🆕 Deep Research page
│       │   ├── voice/             # Voice AI page
│       │   ├── ocr/               # Document upload page
│       │   ├── dashboard/         # Overview dashboard
│       │   └── api/               # Next.js proxy routes
│       └── components/
│           ├── deep-research/     # 🆕 AgentStepper, ConfidenceBadge, ResearchReport
│           ├── chat/              # ChatBubble, ChatComposer, TypingIndicator
│           ├── shared/            # AppShell, Sidebar, CitationChip, SourceBadge
│           └── voice/             # VoiceOrb, TranscriptPanel
│
├── documents/                   # Legal PDFs and reference docs
├── start-dev.bat                # One-click dev server launcher
├── README.md                    # You are here
└── TROUBLESHOOTING.md           # Debugging runbooks
```

---

## 🛠️ 14. Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL (local or Docker)
* Google Cloud account (for Vertex AI + STT/TTS) **or** a `GEMINI_API_KEY`

### 1. Clone & Environment Variables

**Backend (`backend/.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
# Optional: use GCP ADC instead of GEMINI_API_KEY
# gcloud auth application-default login
# gcloud services enable speech.googleapis.com texttospeech.googleapis.com aiplatform.googleapis.com
```

**Frontend (`frontend/.env.local`):**
```env
NEXTAUTH_SECRET=any_long_random_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
DATABASE_URL=postgresql://postgres:password@localhost:5432/justiceai
```

### 2. Database Setup
```bash
createdb -U postgres justiceai
# The users table auto-creates on first login
```

### 3. Quick Start (Windows)
```bat
# Just double-click this file — it opens both servers in separate windows
start-dev.bat
```

### 4. Manual Start
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 5. URLs
| Service | URL |
|---|---|
| Frontend (main app) | `http://localhost:3000` |
| Normal Chat | `http://localhost:3000/chat` |
| Deep Research | `http://localhost:3000/deep-research` |
| Voice AI | `http://localhost:3000/voice` |
| OCR | `http://localhost:3000/ocr` |
| Backend API docs | `http://localhost:8000/docs` |

---

<div align="center">
  <i>Built to bridge the justice gap in India. ⚖️ 🇮🇳 ✨ 🚀</i>
</div>
