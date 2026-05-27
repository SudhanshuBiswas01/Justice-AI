import pypdf
import os
from typing import Dict, Any, Optional
from scraper.text_cleaner import TextCleaner

class PDFProcessor:
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Reads a PDF file and returns the concatenated raw text from all pages."""
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")
            
        raw_text = []
        try:
            reader = pypdf.PdfReader(pdf_path)
            for page_idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    raw_text.append(page_text)
        except Exception as e:
            raise RuntimeError(f"Failed to read PDF file {pdf_path}: {str(e)}")
            
        return "\n".join(raw_text)

    @classmethod
    def process_pdf(cls, pdf_path: str) -> Dict[str, Any]:
        """
        Extracts, cleans text from a PDF, and returns a dictionary with content and basic metadata.
        """
        raw_content = cls.extract_text_from_pdf(pdf_path)
        cleaned_content = TextCleaner.clean_text(raw_content)
        
        # Try to extract PDF file metadata
        metadata = {}
        try:
            reader = pypdf.PdfReader(pdf_path)
            meta = reader.metadata
            if meta:
                metadata = {
                    "pdf_title": meta.title if meta.title else "",
                    "pdf_author": meta.author if meta.author else "",
                    "pdf_subject": meta.subject if meta.subject else "",
                    "pdf_creator": meta.creator if meta.creator else "",
                    "pdf_pages": len(reader.pages)
                }
        except Exception:
            # Fallback if metadata read fails
            metadata = {
                "pdf_pages": len(pypdf.PdfReader(pdf_path).pages) if os.path.exists(pdf_path) else 0
            }
            
        # Infer title from file name if PDF metadata title is empty
        file_name = os.path.basename(pdf_path)
        inferred_title, _ = os.path.splitext(file_name)
        # Clean title (e.g. replace dashes or underscores with spaces)
        inferred_title = inferred_title.replace("_", " ").replace("-", " ")
        
        return {
            "title": metadata.get("pdf_title") or inferred_title,
            "raw_content": raw_content,
            "cleaned_content": cleaned_content,
            "metadata": metadata
        }
