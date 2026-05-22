

# Justice AI (Layer AI)

**Layer AI V0.5** is an AI-powered legal assistance platform focused on solving small-scale consumer and traffic-related disputes in India. Instead of generic legal chat, the system routes each case through **category-specific workflows** backed by dedicated RAG pipelines trained on Indian legal acts, case laws, and government procedures.

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

```mermaid
flowchart TD
    A[User opens Justice AI] --> B[Landing Page]
    B --> C{Select V1 category}
    C -->|Traffic| D1[Traffic Pipeline]
    C -->|MRP| D2[MRP Pipeline]
    C -->|Refund| D3[Refund Pipeline]

    D1 & D2 & D3 --> E[User Input Layer]
    E --> F{Document uploaded?}
    F -->|Yes| G[OCR + Preprocessing]
    F -->|No| H[Text issue only]
    G --> I[Metadata extraction]
    H --> I

    I --> J[ML Classifier]
    J --> K[Category-specific RAG]
    K --> L[LLM Reasoning]
    L --> M[Response Layer]
    M --> N{Generate complaint?}
    N -->|Yes| O[Complaint Generator V1 Lite]
    N -->|No| P[End]
    O --> P
```

---

## 1. Landing Page

User opens the platform and picks one of three V1 categories.

```mermaid
flowchart LR
    LP[Landing Page] --> T[Wrong Traffic Challan]
    LP --> M[Overcharging Above MRP]
    LP --> R[Refund / Consumer Dispute]
```

---

## 2. Category-based pipelines

Each category has its own RAG dataset, prompts, workflow, and optional ML module.

```mermaid
flowchart TB
    subgraph Traffic["Traffic Pipeline"]
        T1[Motor Vehicles Act]
        T2[Challan rules & fine tables]
        T3[Traffic case laws]
        T4[ML: challan validity classifier]
    end

    subgraph MRP["MRP Pipeline"]
        M1[Legal Metrology Act]
        M2[MRP rulings]
        M3[Consumer cases]
        M4[ML: complaint category classifier]
    end

    subgraph Refund["Refund Pipeline"]
        R1[Consumer Protection Act]
        R2[E-commerce rules]
        R3[Refund judgments]
        R4[ML: dispute type classifier]
    end

    CAT[User category selection] --> Traffic
    CAT --> MRP
    CAT --> Refund
```

| Pipeline | Knowledge base | ML module |
|----------|----------------|-----------|
| Traffic | Motor Vehicles Act, challan rules, case laws, fine tables | Challan validity / suspicion classifier |
| MRP | Legal Metrology Act, MRP rulings, consumer cases | Complaint category classifier |
| Refund | Consumer Protection Act, e-commerce rules, refund judgments | Dispute type classification |

---

## 3–4. User input & processing

```mermaid
flowchart LR
    subgraph Input["User Input Layer"]
        U1[Type issue in natural language]
        U2[Upload bill / challan / screenshot]
        U3[Optional: location / state]
    end

    subgraph Process["Input Processing Layer"]
        P1[OCR text extraction]
        P2[Preprocessing & cleanup]
        P3[Metadata: offence, amount, date, merchant]
    end

    U2 --> P1 --> P2 --> P3
    U1 --> P3
    U3 --> P3
```

**Example input:** *“I got ₹2000 challan for no helmet but I was wearing one”*

---

## 5–7. ML, RAG & LLM reasoning

```mermaid
sequenceDiagram
    participant U as User issue
    participant ML as ML Classifier
    participant RAG as Category RAG
    participant LLM as LLM Reasoning

    U->>ML: Text + metadata
    ML-->>LLM: Category, confidence, flags
    U->>RAG: Query (category-scoped)
    RAG-->>LLM: Laws, sections, cases, SOPs, templates
    LLM-->>LLM: Combine inputs
    Note over LLM: Legal plausibility, rights violated, next steps
```

**ML example output:**

```txt
Category: Traffic
Confidence: 92%
Possible Wrong Fine: Yes
```

**RAG retrieves:** applicable laws & sections, case law snippets, SOPs, complaint templates.

---

## 8–9. Response & complaint generator

```mermaid
flowchart TD
    LLM[LLM output] --> R1[Plain-language explanation]
    LLM --> R2[Relevant law sections]
    LLM --> R3[Confidence / disclaimer]
    LLM --> R4[Step-by-step actions]

    R4 --> CG{Generate Complaint?}
    CG -->|Yes| C1[Email draft]
    CG -->|Yes| C2[Grievance portal text]
    CG -->|Yes| C3[Legal notice draft lite]
    CG -->|No| DONE[Done]
    C1 & C2 & C3 --> DONE
```

**Example response:**

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
    API --> OCR[Input Processing / OCR]
    OCR --> ML[ML Classifier]
    ML --> RAG[Category-specific RAG]
    RAG --> LLM[LLM]
    LLM --> OUT[Response + Complaint Draft]
```

### Component responsibilities

| Layer | Technology (planned) | Responsibility |
|-------|----------------------|----------------|
| Frontend | Next.js | Category selection, uploads, chat UI, complaint export |
| API | FastAPI | Auth, routing, orchestration, rate limits |
| OCR / preprocessing | Tesseract / cloud OCR + rules | Text + metadata from documents |
| ML | Lightweight models (sklearn / small NN) | Category & anomaly signals |
| RAG | Per-category vector DB + embeddings | Law, cases, SOPs, templates |
| LLM | Hosted or self-hosted LLM | Reasoning, drafting, user-facing copy |

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

## Repository

This repository hosts the **Justice AI / Layer AI** project documentation and implementation. The remote is:

[https://github.com/SudhanshuBiswas01/Justice-AI](https://github.com/SudhanshuBiswas01/Justice-AI)

---

## License

To be determined.
