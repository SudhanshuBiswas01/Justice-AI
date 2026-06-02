import os
import re
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# ── Category keyword maps ──────────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "traffic_challan": [
        "challan", "e-challan", "traffic", "motor vehicle", "mvact",
        "helmet", "seat belt", "speeding", "license", "rc ", "parivahan",
        "traffic police", "fine", "violation", "rto", "vehicle number",
        "registration number", "dl ", "driving license"
    ],
    "mrp_overcharging": [
        "mrp", "maximum retail price", "overcharg", "metrology",
        "packaged commodit", "retail price", "legal metrology",
        "bill", "invoice", "price tag", "labeled price"
    ],
    "refund": [
        "refund", "cancellation", "cancel", "e-commerce", "amazon",
        "flipkart", "swiggy", "zomato", "booking", "wallet",
        "return", "chargeback", "order", "payment failed", "transaction"
    ],
    "consumer_dispute": [
        "consumer", "deficiency", "service", "complaint", "nch",
        "grievance", "unfair trade", "defect", "fraud", "cheated"
    ]
}

# ── Groq metadata extraction prompt ───────────────────────────────────────────
METADATA_PROMPT = """You are an expert at extracting structured information from Indian legal and commercial documents.

Given the following text extracted from a document (could be a traffic challan, invoice, bill, or legal notice), extract these fields and return ONLY a valid JSON object:

{
  "document_category": "One of: traffic_challan | mrp_overcharging | refund | consumer_dispute | unknown",
  "document_type": "One of: challan | invoice | bill | receipt | legal_notice | screenshot | unknown",
  "fine_amount": "The penalty/fine/total amount with currency symbol, e.g. ₹1000. null if not found.",
  "challan_number": "Challan/complaint/order/transaction ID number. null if not found.",
  "date": "Date mentioned in the document in DD-MM-YYYY format. null if not found.",
  "location": "City, state, or address mentioned. null if not found.",
  "vehicle_number": "Vehicle registration number if present. null if not found.",
  "offence_type": "The specific violation or offence listed (e.g. 'No Helmet', 'Speeding'). null if not found.",
  "merchant_name": "Name of the company, platform, or merchant. null if not found.",
  "product_service": "Name of product or service involved. null if not found.",
  "summary": "One sentence summary of what this document is about."
}

IMPORTANT: Respond ONLY with the raw JSON object. No markdown, no explanation, no extra text.
"""


class MetadataParser:
    """
    Extracts structured legal metadata from OCR text.
    Uses Groq LLM as primary extractor, with regex heuristics as fallback.
    """

    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.client = None
        if self.groq_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.groq_key)
                print("[MetadataParser] Initialized with Groq extractor.")
            except Exception as e:
                print(f"[MetadataParser] Groq init failed: {e}. Using heuristic fallback.")
        else:
            print("[MetadataParser] No Groq key — using heuristic fallback only.")

    def extract(self, text: str) -> Dict[str, Any]:
        """
        Main entry point. Returns structured metadata dict.
        """
        if not text or not text.strip():
            return self._empty_metadata("No text provided for extraction.")

        # Detect category first (fast, rule-based — used as fallback)
        heuristic_category = self._detect_category(text)

        # Try LLM extraction
        if self.client:
            try:
                llm_result = self._extract_via_groq(text)
                if llm_result:
                    # Fill any null fields with heuristic results
                    if not llm_result.get("document_category") or llm_result["document_category"] == "unknown":
                        llm_result["document_category"] = heuristic_category
                    return llm_result
            except Exception as e:
                print(f"[MetadataParser] Groq extraction failed: {e}. Using heuristics.")

        # Fallback: heuristic extraction
        return self._extract_via_heuristics(text, heuristic_category)

    def _extract_via_groq(self, text: str) -> Optional[Dict[str, Any]]:
        """Call Groq to extract structured metadata from text snippet."""
        # Use first 3000 chars to stay within token budget
        snippet = text[:3000]
        completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": METADATA_PROMPT},
                {"role": "user", "content": f"Document text:\n{snippet}"}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        raw = completion.choices[0].message.content.strip()
        data = json.loads(raw)
        return data

    def _detect_category(self, text: str) -> str:
        """Rule-based category detection using keyword matching."""
        text_lower = text.lower()
        scores = {cat: 0 for cat in CATEGORY_KEYWORDS}

        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    scores[cat] += 1

        best = max(scores, key=lambda k: scores[k])
        return best if scores[best] > 0 else "consumer_dispute"

    def _extract_via_heuristics(self, text: str, category: str) -> Dict[str, Any]:
        """Regex-based fallback extractor."""
        result: Dict[str, Any] = {
            "document_category": category,
            "document_type": "unknown",
            "fine_amount": None,
            "challan_number": None,
            "date": None,
            "location": None,
            "vehicle_number": None,
            "offence_type": None,
            "merchant_name": None,
            "product_service": None,
            "summary": f"Document related to {category.replace('_', ' ')}."
        }

        # Amount: ₹1,000 / Rs.500 / INR 2000
        amount_match = re.search(
            r"(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)", text, re.IGNORECASE
        )
        if amount_match:
            result["fine_amount"] = f"₹{amount_match.group(1)}"

        # Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD Month YYYY
        date_match = re.search(
            r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b", text
        )
        if date_match:
            result["date"] = date_match.group(1)

        # Vehicle number: KA01AB1234 style
        vehicle_match = re.search(
            r"\b([A-Z]{2}\s?\d{2}\s?[A-Z]{0,2}\s?\d{4})\b", text
        )
        if vehicle_match:
            result["vehicle_number"] = vehicle_match.group(1).strip()

        # Challan/order number
        challan_match = re.search(
            r"(?:challan|order|transaction|booking)\s*(?:no\.?|number|#)?\s*:?\s*([A-Z0-9\-/]+)",
            text, re.IGNORECASE
        )
        if challan_match:
            result["challan_number"] = challan_match.group(1).strip()

        # Infer document type
        text_lower = text.lower()
        if "challan" in text_lower or "e-challan" in text_lower:
            result["document_type"] = "challan"
        elif "invoice" in text_lower:
            result["document_type"] = "invoice"
        elif "receipt" in text_lower:
            result["document_type"] = "receipt"
        elif "bill" in text_lower:
            result["document_type"] = "bill"

        return result

    def _empty_metadata(self, reason: str) -> Dict[str, Any]:
        return {
            "document_category": "unknown",
            "document_type": "unknown",
            "fine_amount": None,
            "challan_number": None,
            "date": None,
            "location": None,
            "vehicle_number": None,
            "offence_type": None,
            "merchant_name": None,
            "product_service": None,
            "summary": reason
        }


# Singleton
_parser_instance: Optional[MetadataParser] = None

def get_metadata_parser() -> MetadataParser:
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = MetadataParser()
    return _parser_instance
