

# Justice AI (Layer AI)

**Layer AI V1.0** is an AI-powered legal assistance platform focused on solving small-scale consumer and traffic-related disputes in India. Instead of generic legal chat, the system routes each case through **category-specific workflows** backed by dedicated RAG pipelines trained on Indian legal acts, case laws, and government procedures.

Users can describe their issue in plain language or upload challans, bills, or screenshots. The platform runs **OCR**, lightweight **ML classifiers**, and **retrieval-augmented generation (RAG)** before an LLM produces actionable guidance: relevant law references, step-by-step remedies, and draft complaints where appropriate.

**V1 scope (this HLD):** Wrong traffic challans, overcharging above MRP, and refund / consumer disputes. The design stays **deterministic and reliable**—no multi-agent orchestration in V1.

---

## Contributors

| Name | Role |
|------|------|
| **Sudhanshu Biswas** | Author & maintainer |

---

# Layer AI — V1 High-Level Design (HLD)

## End-to-end flow

Primary system flow (author design):

```mermaid
flowchart TD
    A[User opens Justice AI] --> B[Landing Page]

    B --> C{Select Category}

    C -->|Traffic Challan| D[Load Traffic Workflow]
    C -->|MRP Overcharging| E[Load MRP Workflow]
    C -->|Refund Dispute| F[Load Refund Workflow]
    C -->|+N Future Categories| G[Load Dynamic Workflow]

    D --> H[User Input Layer]
    E --> H
    F --> H
    G --> H

    H --> I{Document Uploaded?}

    I -->|Yes| J[OCR + Text Extraction]
    I -->|No| K[Direct Text Input]

    J --> L[Metadata Extraction]
    K --> L

    L --> M{ML Module Needed?}

    M -->|Yes| N[Category-specific ML Model]
    M -->|No| O[Skip ML Layer]

    N --> P[Category-specific RAG Retrieval]
    O --> P

    P --> Q[LLM Reasoning Engine]

    Q --> R[Legal Guidance + Action Steps]

    R --> S{Generate Complaint?}

    S -->|Yes| T[Complaint Generator V1 Lite]
    S -->|No| U[End]

    T --> U
```

---

## 1. Landing page & category selection

```mermaid
flowchart TD
    A[User opens Justice AI] --> B[Landing Page]
    B --> C{Select Category}
    C -->|Traffic Challan| D[Load Traffic Workflow]
    C -->|MRP Overcharging| E[Load MRP Workflow]
    C -->|Refund Dispute| F[Load Refund Workflow]
    C -->|+N Future Categories| G[Load Dynamic Workflow]
```

**V1 categories:** Traffic Challan, MRP Overcharging, Refund Dispute.  
**Future:** `+N` categories plug into a **Dynamic Workflow** loader without changing the core pipeline.

---

## 2. Category workflows

Each loaded workflow bundles its own RAG dataset, prompts, SOPs, and optional ML model.

```mermaid
flowchart TB
    C{Select Category} --> D[Load Traffic Workflow]
    C --> E[Load MRP Workflow]
    C --> F[Load Refund Workflow]
    C --> G[Load Dynamic Workflow]

    subgraph Traffic["Traffic Workflow"]
        T1[Motor Vehicles Act]
        T2[Challan rules & fine tables]
        T3[Traffic case laws]
        T4[ML: challan validity model]
        T5[Traffic RAG index]
    end

    subgraph MRP["MRP Workflow"]
        M1[Legal Metrology Act]
        M2[MRP rulings]
        M3[Consumer cases]
        M4[ML: complaint category model]
        M5[MRP RAG index]
    end

    subgraph Refund["Refund Workflow"]
        R1[Consumer Protection Act]
        R2[E-commerce rules]
        R3[Refund judgments]
        R4[ML: dispute type model]
        R5[Refund RAG index]
    end

    subgraph Future["Dynamic Workflow"]
        F1[Configurable RAG index]
        F2[Optional ML slot]
        F3[Category prompts & SOPs]
    end

    D --> Traffic
    E --> MRP
    F --> Refund
    G --> Future

    Traffic & MRP & Refund & Future --> H[User Input Layer]
```

| Workflow | Knowledge base | ML (when needed) |
|----------|----------------|------------------|
| Traffic | Motor Vehicles Act, challan rules, case laws, fine tables | Challan validity / suspicion model |
| MRP | Legal Metrology Act, MRP rulings, consumer cases | Complaint category model |
| Refund | Consumer Protection Act, e-commerce rules, refund judgments | Dispute type model |
| Dynamic (+N) | Plug-in acts, rules, templates per new category | Optional per category config |

---

## 3–4. User input & document processing

```mermaid
flowchart TD
    H[User Input Layer] --> I{Document Uploaded?}

    I -->|Yes| J[OCR + Text Extraction]
    I -->|No| K[Direct Text Input]

    J --> L[Metadata Extraction]
    K --> L

    subgraph Input["User Input Layer — inputs"]
        U1[Natural language issue]
        U2[Bill / challan / screenshot upload]
        U3[Optional location / state]
    end

    U1 --> K
    U2 --> J
    U3 --> L
```

**Metadata extracted:** offence type, amount, date, merchant/platform, state, and other category-specific fields.

**Example:** *“I got ₹2000 challan for no helmet but I was wearing one”*

---

## 5–7. ML, RAG & LLM reasoning engine

ML runs only when the workflow defines it (`ML Module Needed?`).

```mermaid
flowchart TD
    L[Metadata Extraction] --> M{ML Module Needed?}

    M -->|Yes| N[Category-specific ML Model]
    M -->|No| O[Skip ML Layer]

    N --> P[Category-specific RAG Retrieval]
    O --> P

    P --> Q[LLM Reasoning Engine]
    Q --> R[Legal Guidance + Action Steps]
```

```mermaid
sequenceDiagram
    participant L as Metadata Extraction
    participant ML as Category-specific ML Model
    participant RAG as Category-specific RAG Retrieval
    participant LLM as LLM Reasoning Engine
    participant OUT as Legal Guidance + Action Steps

    L->>ML: Text + metadata (if ML enabled)
    ML-->>LLM: Category signals, confidence, flags
    L->>RAG: Category-scoped query
    RAG-->>LLM: Laws, sections, cases, SOPs, templates
    LLM->>OUT: Explanation, law refs, action steps, disclaimers
```

**ML example output (Traffic):**

```txt
Category: Traffic
Confidence: 92%
Possible Wrong Fine: Yes
```

---

## 8–9. Legal guidance & complaint generator

```mermaid
flowchart TD
    Q[LLM Reasoning Engine] --> R[Legal Guidance + Action Steps]

    R --> R1[Plain-language explanation]
    R --> R2[Relevant law sections]
    R --> R3[Confidence / disclaimer]
    R --> R4[Step-by-step actions]

    R --> S{Generate Complaint?}

    S -->|Yes| T[Complaint Generator V1 Lite]
    S -->|No| U[End]

    T --> T1[Email draft]
    T --> T2[Grievance portal text]
    T --> T3[Legal notice draft lite]
    T1 & T2 & T3 --> U
```

**Example output:**

```txt
This challan may be disputable because...
Relevant Section: [Act / Section]
Recommended Action:
1. File dispute on Parivahan
2. Attach helmet proof
3. Escalate if rejected
```

---

## V1 architecture summary

```mermaid
flowchart TB
    FE[Frontend — Next.js] --> API[API Backend — FastAPI]
    API --> WF[Load Category Workflow]
    WF --> IN[User Input Layer]
    IN --> DOC{Document Uploaded?}
    DOC -->|Yes| OCR[OCR + Text Extraction]
    DOC -->|No| TXT[Direct Text Input]
    OCR --> META[Metadata Extraction]
    TXT --> META
    META --> MLQ{ML Module Needed?}
    MLQ -->|Yes| ML[Category-specific ML Model]
    MLQ -->|No| SKIP[Skip ML Layer]
    ML --> RAG[Category-specific RAG Retrieval]
    SKIP --> RAG
    RAG --> LLM[LLM Reasoning Engine]
    LLM --> OUT[Legal Guidance + Action Steps]
    OUT --> CG{Generate Complaint?}
    CG -->|Yes| CMP[Complaint Generator V1 Lite]
    CG -->|No| END[End]
    CMP --> END
```

### Component responsibilities

| Layer | Technology (planned) | Responsibility |
|-------|----------------------|----------------|
| Frontend | Next.js | Landing page, category selection, workflow routing, uploads, complaint export |
| API | FastAPI | Load category workflow, auth, orchestration, rate limits |
| OCR + text extraction | Tesseract / cloud OCR + rules | Document → text when upload present |
| Metadata extraction | Rules + parsers | Offence, amount, date, merchant, state, etc. |
| ML (optional) | Per-category lightweight models | Run only when `ML Module Needed?` is true |
| RAG | Per-category vector DB + embeddings | Category-specific RAG retrieval |
| LLM | Hosted or self-hosted LLM | LLM reasoning engine → legal guidance + action steps |
| Complaint generator | Prompt templates | Complaint Generator V1 Lite (email, grievance, notice) |

---

## Out of scope for V1

V1 does **not** include:

- Multi-agent orchestration
- Autonomous tool-calling workflows
- Long-running agent chains

Design principle for V1:

> **Deterministic + reliable** — predictable pipeline per category.

Agent-based automation is planned for **V2/V3**.

---

## Frontend (landing page)

Dark-themed marketing UI lives in `frontend/` (Next.js 16 + React 19 + Tailwind CSS 4).

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the Justice AI landing page.

---

## Repository

This repository hosts the **Justice AI / Layer AI** project documentation and implementation. The remote is:

[https://github.com/SudhanshuBiswas01/Justice-AI](https://github.com/SudhanshuBiswas01/Justice-AI)

---

## License

To be determined.
