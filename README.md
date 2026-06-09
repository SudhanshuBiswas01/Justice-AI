<div align="center">
  <h1>⚖️ Justice AI</h1>

  <p>
    <a href="https://readme-typing-svg.demolab.com">
      <img src="https://readme-typing-svg.demolab.com?font=Inter&weight=600&size=18&pause=1000&color=3B82F6&center=true&vCenter=true&width=500&lines=AI-powered+Legal+Assistance+SaaS;Resolving+Consumer+%26+Traffic+Disputes;Democratizing+Legal+Access+in+India" alt="Typing Animated Text" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-v1.0-green.svg?style=for-the-badge" alt="Version">
    <img src="https://img.shields.io/badge/Python-FastAPI-yellow.svg?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/Next.js-React-black.svg?style=for-the-badge&logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/Gemini-Vertex%20AI-10b981.svg?style=for-the-badge" alt="Gemini">
    <img src="https://img.shields.io/badge/PostgreSQL-SQLite-4169e1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database">
  </p>
  <p>
    <a href="#project-overview">Overview</a> •
    <a href="#core-features">Features</a> •
    <a href="#technical-architecture">Architecture</a> •
    <a href="#ai-llm-stack">AI Stack</a> •
    <a href="#rag-architecture">RAG Pipeline</a> •
    <a href="#setup-instructions">Setup</a>
  </p>
</div>

---

## 📖 1. Project Overview

**Justice AI** is an intelligent, modular legal tech platform built to democratize access to legal guidance in India. We focus strictly on the cases that typically go ignored—small-scale consumer grievances, arbitrary traffic challans, MRP overcharging, and e-commerce refund disputes. 

### 🛑 The Problem
In India, small claims and minor disputes are rarely contested. The legal cost, procedural ambiguity, and sheer time required to fight a ₹5,000 refund or a ₹1,000 traffic challan completely outweigh the benefits. As a result, users suffer in silence, and unfair practices thrive.

### 💡 Our Vision
To act as the **first layer of defense** for the everyday consumer. By combining localized legal reasoning, RAG (Retrieval-Augmented Generation), OCR, and structured workflows, Justice AI helps users instantly determine if they have a case, outlines a precise legal strategy, and will soon automate drafting legal complaints.

---

## 🚀 2. Current Status

**Current Version:** `V1.0` (Production Ready)

* ✅ **RAG Chatbot:** Fully functional streaming legal guidance utilizing Vertex AI and optimized Simple RAG pipelines.
* ✅ **Auth Integration:** PostgreSQL-backed NextAuth with Google OAuth & Email/Password in place.
* ✅ **Data Pipeline:** Scalable scraping & vector embedding ingestion for Indian legal texts.
* ✅ **OCR Upload Pipeline:** Production-ready extraction of text and metadata from challans, invoices, and receipts utilizing Gemini 2.0 Vision.
* ✅ **Hands-free Voice AI**: Integrated Google Cloud STT/TTS proxy for real-time bilingual (Hindi/English) legal consultation.
* 🚧 **Complaint Generation:** Planned for V1.1/V2.

---

## ✨ 3. Core Features

* 🗂️ **Category-Based Workflows:** Specialized pipelines for distinct legal categories:
  * 🚦 **Traffic Challan Disputes** (OCR integrated)
  * 🏷️ **MRP Overcharging Claims** (Invoice/Bill OCR integrated)
  * 🛒 **E-Commerce & Refund Disputes**
* 🧠 **Legal Document Retrieval:** Semantically searches a curated corpus of Indian acts, rules, and judgements.
* 🔒 **Google Authentication & Secure Sessions:** Built on NextAuth.js and PostgreSQL.
* ⚡ **Streaming AI Responses:** Instant, ultra-low latency response streaming directly to the UI.
* 🎙️ **Real-time Bilingual Voice AI**: Full Speech-to-Text and Text-to-Speech loops supporting natural Indian English (`en-IN-Neural2-B`) and Hindi/Hinglish (`hi-IN-Neural2-C`).
* 📁 **OCR-Driven Document Ingestion**: Upload traffic challans or commercial invoices for automated text extraction (via Gemini 2.0 Vision) and LLM-backed metadata parsing (fine amount, vehicle number, merchant details).
* 💼 **SaaS-Style Dashboard**: Modern, dark-mode, minimal SaaS interface built for accessibility and trust.
* 📝 **AI-Generated Complaint Drafts:** (Upcoming) Automated drafting of legal notices tailored for the National Consumer Helpline (NCH) or eDaakhil.

---

## 🏗️ 4. Technical Architecture

```mermaid
graph TD
    %% Styling definitions
    classDef frontend fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff,rx:10,ry:10;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff,rx:10,ry:10;
    classDef db fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff,rx:10,ry:10;
    classDef llm fill:#8b5cf6,stroke:#5b21b6,stroke-width:2px,color:#fff,rx:10,ry:10;
    classDef external fill:#ef4444,stroke:#b91c1c,stroke-width:2px,color:#fff,rx:10,ry:10;

    subgraph "Frontend (Next.js)"
        UI[User Interface]:::frontend
        VoiceOrb[Voice AI Controller]:::frontend
        OCRUpload[OCR Document Upload]:::frontend
        AuthClient[NextAuth.js Client]:::frontend
    end

    subgraph "Backend (FastAPI)"
        API[API Gateway/Router]:::backend
        RAG[RAG Pipeline Engine]:::backend
        AuthAPI[Auth Middleware]:::backend
        OCRService[OCR Service - Gemini Vision]:::backend
        MetaParser[Metadata Parser]:::backend
        VoiceRouter[Voice Router - STT/TTS]:::backend
        Scraper[Legal Scraper/Ingestion]:::backend
    end

    subgraph "Databases"
        PG[(PostgreSQL - Auth/Users)]:::db
        SQLite[(SQLite - Vector/Docs)]:::db
    end

    subgraph "AI & External Providers"
        Vertex[Vertex AI / Gemini 2.5]:::llm
        GeminiVision[Gemini 2.0 Vision OCR]:::llm
        GCPVoice[Google Cloud STT/TTS]:::llm
        Embed[Embedding Models]:::llm
        Groq[Groq API / Llama 3.3]:::llm
        OAuth[Google OAuth]:::external
    end

    %% Connections
    UI -->|HTTP/REST| API
    UI -->|Auth Flow| AuthClient
    AuthClient <-->|Token Exchange| OAuth
    AuthClient -->|Persist Users| PG

    OCRUpload -->|Upload Image/PDF| API
    VoiceOrb -->|Stream Audio/Speech| API
    
    API --> AuthAPI
    AuthAPI --> RAG
    
    API --> OCRService
    OCRService -->|Vision Analysis| GeminiVision
    OCRService --> MetaParser
    MetaParser -->|Structured JSON| RAG
    
    API --> VoiceRouter
    VoiceRouter <-->|Transcribe & Synthesize| GCPVoice
    
    RAG -->|Semantic Search| SQLite
    RAG <-->|Stream Response| Vertex
    RAG <-->|Generate Embeddings| Embed
    RAG -.->|Fallback| Groq
    
    Scraper -->|Extract & Clean| SQLite
    Scraper <-->|Metadata Extraction| Groq
```

Justice AI is designed as a scalable, modern SaaS application, utilizing a decoupled frontend and backend.

### Frontend
* **Framework:** Next.js 14+ (App Router), React, TypeScript.
* **Styling:** Tailwind CSS (Dark-themed, professional legal-tech aesthetic).
* **Auth:** NextAuth.js v4 (Pure JWT sessions, Google OAuth, bcryptjs credentials).

### Backend
* **Framework:** FastAPI (Python) for high-performance async APIs.
* **Database (Auth):** PostgreSQL (`justice_users` table).
* **Database (Vector/Corpus):** SQLite (`legal_resources.db`).
* **Retrieval Flow:** Vector search via locally computed L2-normalized embeddings, routed to LLMs with strict system instructions.
* **Streaming:** Async generator utilizing Server-Sent Events (SSE) to stream Vertex AI / Gemini responses.

---

## 🧠 5. AI & LLM Stack

Our AI stack is designed with built-in redundancies, ensuring maximum uptime and cost efficiency.

* **Primary Reasoning LLM:** `gemini-2.5-flash` via **Google Cloud Vertex AI** (GCP ADC authentication).
* **Primary Fallback:** Google AI Studio API (`gemini-2.5-flash`).
* **Secondary Fallback:** Groq Cloud API (`llama-3.3-70b-versatile`).
* **OCR Document Engine:** `gemini-2.0-flash` (via Vertex AI / AI Studio) for end-to-end vision-based transcription of legal papers and invoices.
* **Speech-to-Text (STT):** Browser-native Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) as the primary client-side STT engine with real-time interim transcripts, falling back to Google Cloud Speech-to-Text API for unsupported browsers.
* **Audio Capture Enhancements:** Advanced browser audio capture settings requesting mono audio, echo cancellation, noise suppression, and a safeguard rejecting recordings under 1 KB to prevent empty transcripts.
* **Text-to-Speech (TTS):** Google Cloud Text-to-Speech API with premium Neural2 Indian voices (`en-IN-Neural2-B` and `hi-IN-Neural2-C`).
* **Embedding Models:** 
  * Primary: Google `text-embedding-004` (768 dimensions).
  * Fallback: OpenAI `text-embedding-3-small` (1536 dimensions).
  * Offline Fallback: Custom deterministic Token-Hashing Bag-of-Words (384 dimensions) with query expansion.
* **Metadata Extraction (Scraper & OCR Pipeline):** LLMs (specifically `llama-3.3-70b-versatile` via Groq, or Gemini models) are used to heuristically structure scraped legal texts and OCR outputs into standardized schema fields (Act, Year, Sections, Fine Amount, Offence Type, Merchant).

---

## 🔍 6. RAG Architecture

Justice AI relies on a heavily optimized Retrieval-Augmented Generation (RAG) pipeline.

* **Simple RAG:** We currently rely on a highly tuned Simple RAG pipeline. User queries are matched against local vector embeddings, filtered by confidence thresholds, and injected as context.
* **The CRAG Experiment:** We initially explored Corrective RAG (CRAG) involving an LLM-based grader to evaluate document relevance before generation.
* **Latency Challenges:** The LLM evaluation step in CRAG added 3-5 seconds of latency per turn. For a consumer SaaS application, this broke the UX.
* **The Decision:** We rolled back to a score-threshold Simple RAG pipeline, bringing TTFT (Time To First Token) down to < 1 second. 
* **Confidence-Aware Retrieval:** If cosine similarity scores fall below `0.65`, the system gracefully restricts hallucination by informing the LLM of "Limited Context".
* **Future Direction:** We are moving toward **Agentic RAG / Self-RAG**, offloading verification to asynchronous background tasks rather than blocking the main chat thread.

---

## 📚 7. Data Sources

Our knowledge base is aggressively curated to prevent general-purpose hallucination, populated from:
* 🏛️ **India Code** (Bare Acts & Rules)
* ⚖️ **Indian Kanoon** (Case Law & Judgements)
* 🏛️ **Supreme Court & High Court Portals**
* 🏢 **eCourts & Consumer Forums** (NCH, eDaakhil guidelines)

---

## 🗄️ 8. Database Structure

We utilize a deliberate **Hybrid Database Architecture**:

* 🪶 **SQLite (`legal_resources.db`):** Houses the scraped legal corpus, pre-computed vector embeddings, and chunk metadata. Chosen for its portability, zero-config setup, and ease of distributing the RAG knowledge base.
* 🐘 **PostgreSQL (`justiceai`):** Handles user data, NextAuth identities, and application state. Chosen for robust relational integrity, concurrency, and future scalability for SaaS billing and chat history.

---

## 🧗‍♂️ 9. Challenges Faced

Building a deterministic legal AI is hard. Key challenges included:
* ⏱️ **Latency in RAG Pipelines:** Balancing complex multi-step reasoning (CRAG) with user expectations for instant SaaS responses.
* 🎯 **Retrieval Quality vs. Corpus Size:** The Indian legal corpus is massive and highly nuanced. Standard chunking often split critical context (like exceptions to a rule).
* 🤖 **Legal Hallucinations:** Stopping the LLM from making up fine amounts or section numbers when it lacked context.
* 🏷️ **Metadata Tagging:** Extracting accurate metadata (Year, Act, Section) from unstructured HTML/PDF legal documents required a dedicated LLM pipeline.
* 🔄 **OAuth & Session Management:** Managing redirect loops and JWT persistence in Next.js App Router.

---

## 💡 10. Learnings

* **Modular Backend Architecture:** Decoupling the scraper, embedder, and API router was critical for maintaining sanity.
* **Production AI Workflows:** A 95% accurate RAG system is useless if it takes 15 seconds to reply. Speed is a feature.
* **Vector Search Systems:** L2 normalized dot products are incredibly fast and completely sufficient for our scale compared to deploying heavy vector databases.
* **Legal-Tech System Design:** You cannot trust LLMs to interpret law directly; you must constrain them to act as synthesis engines over verified retrieved text.
* **SaaS-Oriented Thinking:** Users don't care about the AI; they care about solving their ₹2000 refund issue. The UX must reflect that urgency and clarity.

---

## 🔮 11. Future Roadmap

- [x] **OCR Uploads:** Allow users to upload traffic challans or invoices for automated parsing.
- [x] **Voice AI Integration:** Real-time bilingual vocal consultation with the RAG chatbot.
- [ ] **Complaint Generator:** Auto-fill standardized legal notices and NCH complaint formats (eDaakhil).
- [ ] **Case Success Prediction:** Use ML models to estimate the probability of winning based on historical judgements.
- [ ] **Agentic Workflows:** Multi-agent collaboration (e.g., a "Researcher" agent passing data to a "Drafter" agent).
- [ ] **Deployment:** Containerize via Docker and deploy to AWS/GCP with scalable vector infrastructure (Pinecone/Milvus).

---

## 📁 12. Folder Structure

```text
Justice-AI/
├── backend/                  # FastAPI Application
│   ├── data/                 # SQLite DB and raw corpus files
│   ├── rag/                  # RAG Pipelines, Vector Store, Embeddings
│   ├── routers/              # API Endpoints (chat, scraper)
│   ├── scraper/              # Data ingestion, chunking, LLM metadata extraction
│   └── main.py               # FastAPI Entrypoint
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/              # App Router (auth, app, chat, landing)
│   │   ├── components/       # UI Components
│   │   ├── lib/              # Auth config, DB connections
│   │   └── types/            # TypeScript definitions
│   ├── public/               # Static assets
│   ├── tailwind.config.ts    # Styling configuration
│   └── .env.local            # Frontend environment variables
├── documents/                # Project documentation and planning
├── README.md                 # You are here
└── TROUBLESHOOTING.md        # Debugging and runbooks
```

---

## 🛠️ 13. Setup Instructions

### Prerequisites
* Python 3.10+
* Node.js 18+
* PostgreSQL running locally or via Docker

### 1. Environment Variables
You will need two environment files.

**Backend (`backend/.env`):**
```env
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
# Or use GCP Application Default Credentials via `gcloud auth application-default login`
# Make sure to enable Speech-to-Text and Text-to-Speech APIs:
# gcloud services enable speech.googleapis.com texttospeech.googleapis.com
```

**Frontend (`frontend/.env.local`):**
```env
NEXTAUTH_SECRET=generate_a_random_secret_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
DATABASE_URL=postgresql://postgres:password@localhost:5432/justiceai
```

### 2. Database Setup
Create a PostgreSQL database named `justiceai`:
```bash
createdb -U postgres justiceai
```
*(The users table will be automatically generated upon the first login attempt).*

### 3. Run the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### 4. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.

---
<div align="center">
  <i>Built to bridge the justice gap in India.</i>
</div>
