from fastapi import APIRouter, File, UploadFile, HTTPException, status
from ocr.ocr_service import get_ocr_service
from ocr.pdf_handler import extract_text_from_pdf
from ocr.metadata_parser import get_metadata_parser

router = APIRouter(tags=["OCR"])

ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/ocr/extract")
async def extract_document_info(file: UploadFile = File(...)):
    """
    Upload a document (Image or PDF) to extract raw text and structured legal metadata.
    """
    # ── Step 1: Validate file type ────────────────────────────────────────────
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Only JPG, PNG, WEBP, and PDF are supported."
        )

    # ── Step 2: Validate file size ────────────────────────────────────────────
    try:
        file_bytes = await file.read()
        file_size = len(file_bytes)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds limit of 10MB (got {file_size / 1024 / 1024:.2f}MB)."
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file bytes: {str(e)}"
        )

    # ── Step 3: Extract text ──────────────────────────────────────────────────
    extracted_text = ""
    method = ""
    confidence = "low"

    try:
        if content_type == "application/pdf":
            # Pass ocr_service as helper to enable image OCR fallback inside PDF
            ocr_service = get_ocr_service()
            pdf_result = extract_text_from_pdf(file_bytes)
            # Support both API signatures of extract_text_from_pdf if pdf_result has a dictionary
            if isinstance(pdf_result, dict):
                extracted_text = pdf_result.get("text", "")
                method = pdf_result.get("method", "pdf")
                confidence = pdf_result.get("confidence", "high")
            else:
                extracted_text = str(pdf_result)
                method = "pdf"
                confidence = "high"
        else:
            ocr_service = get_ocr_service()
            ocr_result = ocr_service.extract_text_from_image(file_bytes, mime_type=content_type)
            extracted_text = ocr_result.get("text", "")
            method = ocr_result.get("provider", "gemini")
            confidence = ocr_result.get("confidence", "high")

    except Exception as e:
        print(f"[OCR-Router] Extraction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from document: {str(e)}"
        )

    if not extracted_text or extracted_text.strip() == "OCR_FAILED: Image quality too low.":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any readable text from the document. Please ensure the image is clear and well-lit."
        )

    # ── Step 4: Parse structured metadata ─────────────────────────────────────
    metadata = {}
    try:
        parser = get_metadata_parser()
        metadata = parser.extract(extracted_text)
    except Exception as e:
        print(f"[OCR-Router] Metadata parsing failed: {e}")
        # Return fallback heuristic metadata if LLM fails
        metadata = {
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
            "summary": "Failed to parse metadata, using raw extracted text."
        }

    # Normalize category
    category = metadata.get("document_category", "unknown")
    if category == "unknown":
        category = "consumer_dispute"  # Safe legal category fallback

    return {
        "extracted_text": extracted_text,
        "metadata": metadata,
        "category": category,
        "confidence": confidence,
        "method": method
    }
