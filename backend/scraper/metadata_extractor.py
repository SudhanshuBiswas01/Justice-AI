import re
import os
import json
from typing import Dict, Any, Optional, List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

class MetadataExtractor:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        if self.groq_api_key:
            self.client = Groq(api_key=self.groq_api_key)
        else:
            self.client = None

    def extract_metadata(self, text: str, title: str, source: str) -> Dict[str, Any]:
        """
        Main entry point for metadata extraction.
        Tries to use LLM first (if API key exists), otherwise falls back to rule-based parser.
        """
        # Run heuristic rules first to get baseline guesses
        heuristics = self.extract_by_heuristics(text, title)
        
        # If LLM client is available, refine with LLM
        if self.client:
            try:
                llm_metadata = self.extract_by_llm(text, title, source)
                if llm_metadata:
                    # Merge and prefer LLM values
                    for k, v in llm_metadata.items():
                        if v:  # Only override if LLM returned a non-null/non-empty value
                            heuristics[k] = v
            except Exception as e:
                print(f"Error extracting metadata via LLM: {e}. Using heuristics.")
                
        # Fill in source
        heuristics["source"] = source
        return heuristics

    def extract_by_heuristics(self, text: str, title: str) -> Dict[str, Any]:
        """Rule-based regex heuristics to extract legal metadata fields."""
        text_lower = text[:10000].lower()  # Scan first 10k characters
        title_lower = title.lower()

        # 1. Determine Category
        category = "consumer_dispute"  # Default
        if any(w in title_lower or w in text_lower for w in ["challan", "traffic", "motor vehicle", "helmet", "speeding", "driving license", "rc ", "seat belt"]):
            category = "traffic_challan"
        elif any(w in title_lower or w in text_lower for w in ["mrp", "overcharg", "maximum retail price", "packaged commodities"]):
            category = "mrp_overcharging"
        elif any(w in title_lower or w in text_lower for w in ["refund", "e-commerce", "cancelled", "cancellation", "wallet", "booking refund", "chargeback"]):
            category = "refund"
        elif any(w in title_lower or w in text_lower for w in ["grievance", "complaint procedure", "online filing", "nch", "cgrams", "national consumer helpline", "e-daakhil"]):
            category = "grievance_system"
        elif any(w in title_lower or w in text_lower for w in ["consumer protection", "consumer dispute", "unfair trade", "deficiency"]):
            category = "consumer_dispute"

        # 2. Determine Document Type
        doc_type = "Procedure"  # Default
        if any(w in title_lower for w in [" act", "act,"]):
            doc_type = "Act"
        elif any(w in title_lower for w in [" rule", "rules"]):
            doc_type = "Rule"
        elif any(w in title_lower for w in ["amendment"]):
            doc_type = "Amendment"
        elif any(w in title_lower or w in text_lower[:2000] for w in ["versus", " v. ", " vs ", "civil appeal", "writ petition", "judgment", "crl.a.", "s.l.p."]):
            doc_type = "Judgment"
        elif any(w in title_lower or w in text_lower[:2000] for w in ["template", "draft complaint", "format", "complaint notice", "legal notice"]):
            doc_type = "Complaint Template"

        # 3. Extract Year
        year = None
        # Look for years in title first, e.g. "Act, 1988" or "Rules, 1989"
        year_match = re.search(r"\b(19\d{2}|20\d{2})\b", title)
        if year_match:
            year = int(year_match.group(1))
        else:
            # Look in the text
            year_matches = re.findall(r"\b(19\d{2}|20\d{2})\b", text_lower[:2000])
            if year_matches:
                # Use the most frequent year in the introduction
                year = int(max(set(year_matches), key=year_matches.count))

        # 4. Extract Act Name
        act_name = None
        act_patterns = [
            r"([A-Za-z0-9\s]+Act,\s+\d{4})",
            r"([A-Za-z0-9\s]+Rules,\s+\d{4})",
            r"([A-Za-z0-9\s]+Regulations,\s+\d{4})"
        ]
        for pattern in act_patterns:
            match = re.search(pattern, title)
            if match:
                act_name = match.group(1).strip()
                break
        
        if not act_name:
            # Try to search in the first 2000 chars of text
            for pattern in act_patterns:
                match = re.search(pattern, text[:2000])
                if match:
                    act_name = match.group(1).strip()
                    break

        # 5. Extract Court
        court = None
        if doc_type == "Judgment":
            if "supreme court" in text_lower[:2000]:
                court = "Supreme Court of India"
            elif "high court" in text_lower[:2000]:
                # Find which high court
                hc_match = re.search(r"high court of ([a-zA-z\s]+)", text_lower[:2000])
                if hc_match:
                    court = f"High Court of {hc_match.group(1).strip().title()}"
                else:
                    court = "High Court"
            elif "consumer dispute" in text_lower[:2000] or "commission" in text_lower[:2000]:
                court = "Consumer Forum / Commission"

        # 6. Sections
        sections = []
        section_matches = re.findall(r"(?i)\bsection\s+(\d+[a-z]?)\b", text[:5000])
        if section_matches:
            # Keep unique and limit to first 5
            sections = list(set([f"Section {m}" for m in section_matches]))[:5]

        # 7. Summary heuristic
        summary = f"Legal document regarding {category.replace('_', ' ')}."
        if doc_type == "Act":
            summary = f"Official Act: {title}. Covers regulations and legal provisions."
        elif doc_type == "Judgment":
            summary = f"Court Judgment related to {category.replace('_', ' ')}: {title}."

        return {
            "title": title,
            "category": category,
            "doc_type": doc_type,
            "court": court,
            "act_name": act_name,
            "section": ", ".join(sections) if sections else None,
            "year": year,
            "summary": summary
        }

    def extract_by_llm(self, text: str, title: str, source: str) -> Optional[Dict[str, Any]]:
        """Call Groq API to extract legal metadata from a snippet of the text."""
        # Use first 4000 characters to stay within context and limit API costs
        snippet = text[:4000]
        
        system_prompt = """You are an expert AI system helping clean and structure Indian legal documents for a RAG (Retrieval-Augmented Generation) system.
Given the Title, Source, and a Snippet of the document, extract the following metadata fields in JSON format:
1. "title": The official/correct title of the document (cleaned up).
2. "category": Must be exactly one of: "traffic_challan", "mrp_overcharging", "consumer_dispute", "refund", "grievance_system".
3. "doc_type": Must be exactly one of: "Act", "Rule", "Judgment", "Amendment", "Procedure", "Complaint Template".
4. "court": (For Judgments only) e.g., "Supreme Court of India" or "Delhi High Court". Leave null if not a judgment.
5. "act_name": The primary Act referenced (e.g., "Motor Vehicles Act, 1988" or "Consumer Protection Act, 2019").
6. "section": Specific section(s) mentioned if any (e.g., "Section 194D, Section 129").
7. "year": The year of the Act, Rules, or Judgment as an integer (e.g., 2019, 1988).
8. "summary": A concise 2-3 sentence summary of what this document covers.

Respond ONLY with a valid JSON block, no markdown format, no extra characters, no explanation.
Example Output format:
{
  "title": "...",
  "category": "...",
  "doc_type": "...",
  "court": "...",
  "act_name": "...",
  "section": "...",
  "year": 2019,
  "summary": "..."
}"""

        user_content = f"Title: {title}\nSource: {source}\nDocument Snippet:\n{snippet}"

        try:
            completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                max_tokens=500,
                response_format={"type": "json_object"}
            )
            
            result_json = completion.choices[0].message.content.strip()
            data = json.loads(result_json)
            
            # Clean section array to string if it was returned as a list
            if "section" in data and isinstance(data["section"], list):
                data["section"] = ", ".join(data["section"])
                
            return data
            
        except Exception as e:
            print(f"Groq extraction failed: {e}")
            return None
