import sys
import os

# Add backend directory to system path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from ocr.ocr_service import get_ocr_service
from ocr.pdf_handler import extract_text_from_pdf
from ocr.metadata_parser import get_metadata_parser

def main():
    # Fix console encoding on Windows to prevent Unicode/Rupee output issues
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    print("=== Justice AI OCR & Metadata Pipeline Verification ===")

    # 1. Test OCR Service Initialization
    print("\n1. Initializing OCR Service...")
    try:
        ocr = get_ocr_service()
        print(f"[Success] OCR provider resolved to: '{ocr.provider}'")
    except Exception as e:
        print(f"[FAIL] Failed to initialize OCR Service: {e}")
        return

    # 2. Test Metadata Parser Initialization
    print("\n2. Initializing Metadata Parser...")
    try:
        parser = get_metadata_parser()
        print(f"[Success] Metadata Parser loaded. Groq active: {parser.client is not None}")
    except Exception as e:
        print(f"[FAIL] Failed to initialize Metadata Parser: {e}")
        return

    # 3. Test Metadata Parser Extraction heuristics & LLM fallback
    print("\n3. Testing Metadata Extraction on dummy challan text...")
    dummy_challan_text = """
    E-Challan Uttar Pradesh Traffic Police
    Challan No: UP-123456789-2026
    Date: 28-05-2026 14:30
    Vehicle Registration No: UP16AB9999
    Offence: RIDING WITHOUT HELMET
    Fine Amount: Rs. 1000
    Location: Sector 62, Noida
    Please pay your fine online at parivahan website.
    """
    try:
        metadata = parser.extract(dummy_challan_text)
        print("[Success] Extracted Metadata:")
        print(f"  - Category: {metadata.get('document_category')}")
        print(f"  - Type: {metadata.get('document_type')}")
        print(f"  - Fine Amount: {metadata.get('fine_amount')}")
        print(f"  - Challan Number: {metadata.get('challan_number')}")
        print(f"  - Date: {metadata.get('date')}")
        print(f"  - Location: {metadata.get('location')}")
        print(f"  - Vehicle: {metadata.get('vehicle_number')}")
        print(f"  - Offence: {metadata.get('offence_type')}")
        print(f"  - Summary: {metadata.get('summary')}")
        
        # Verify heuristics or LLM captured the critical details
        assert metadata.get('fine_amount') == "₹1000" or metadata.get('fine_amount') == "Rs. 1000", "Fine amount check failed"
        assert "UP16AB9999" in str(metadata.get('vehicle_number')), "Vehicle number check failed"
    except Exception as e:
        print(f"[FAIL] Metadata extraction test failed: {e}")
        return

    # 4. Test PDF Handler (mocking empty/invalid bytes to check error handling)
    print("\n4. Testing PDF handler error handling with empty bytes...")
    try:
        pdf_res = extract_text_from_pdf(b"")
        # Should gracefully fail or indicate lack of pages
        print(f"[Success] Empty PDF handled: {pdf_res}")
    except Exception as e:
        print(f"[FAIL] PDF handler failed on empty bytes: {e}")
        return

    print("\n=== ALL OCR PIPELINE PIECES STRUCTURALLY VERIFIED ===")

if __name__ == "__main__":
    main()
