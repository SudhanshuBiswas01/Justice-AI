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

## 1. Landing Page

User opens the platform and selects a V1 category:

- Wrong Traffic Challan
- Overcharging Above MRP
- Refund / Consumer Dispute

---

## 2. Category-Based Pipeline

Each category has its own:

- RAG dataset (vector store)
- Prompt templates
- Workflow steps
- Optional ML module

### Traffic Pipeline

**Knowledge base:** Motor Vehicles Act, challan rules, traffic case laws, fine tables  

**ML:** Challan validity / suspicion classifier

### MRP Pipeline

**Knowledge base:** Legal Metrology Act, MRP rulings, consumer cases  

**ML:** Complaint category classifier

### Refund Pipeline

**Knowledge base:** Consumer Protection Act, e-commerce rules, refund judgments  

**ML:** Dispute type classification

---

## 3. User Input Layer

The user can:

- Type the issue in natural language
- Upload a bill, challan, or screenshot (image/PDF)
- Optionally provide location / state

**Example:**

> “I got ₹2000 challan for no helmet but I was wearing one”

---

## 4. Input Processing Layer

When an image or PDF is uploaded:

1. **OCR** extracts text
2. **Preprocessing** normalizes and cleans text
3. **Metadata extraction** — offence, amount, date, merchant/platform, etc.

---

## 5. ML Layer

Small on-path classifiers:

- Predict issue category (sanity check vs. user selection)
- Flag suspicious or likely wrong challans
- Classify dispute type (refund / MRP / traffic)

**Example output:**

```txt
Category: Traffic
Confidence: 92%
Possible Wrong Fine: Yes
```

---

## 6. RAG Retrieval Layer

Based on the selected category, the query is sent to the **category-specific vector database**.

**Retrieved context:**

- Applicable laws and sections
- Case law snippets
- Standard operating procedures (SOPs)
- Complaint / grievance templates

---

## 7. LLM Reasoning Layer

The LLM combines:

- User issue (text + structured metadata)
- ML classifier output
- Retrieved legal context

**Produces:**

- Whether the grievance is legally plausible
- Rights possibly violated
- Recommended next steps

---

## 8. Response Layer

**User-facing output:**

- Plain-language explanation
- Relevant law sections (cited)
- Confidence / disclaimer warnings
- Step-by-step actions

**Example:**

```txt
This challan may be disputable because...
Relevant Section: [Act / Section]
Recommended Action:
1. File dispute on Parivahan
2. Attach helmet proof
3. Escalate if rejected
```

---

## 9. Complaint Generator (V1 Lite)

**Action:** “Generate Complaint”

**Outputs:**

- Email draft
- Grievance portal text
- Lightweight legal notice draft

---

## V1 Architecture Summary

```txt
Frontend (Next.js)
      ↓
API Backend (FastAPI)
      ↓
Input Processing / OCR
      ↓
ML Classifier
      ↓
Category-specific RAG
      ↓
LLM
      ↓
Response + Complaint Draft
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
