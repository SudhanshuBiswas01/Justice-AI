import io
from typing import Optional


def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    """
    Extracts text from a PDF file.
    
    Strategy:
    1. Try embedded text extraction via pypdf (fast path — works for digital PDFs).
    2. If little/no text found, attempt page-by-page image rendering via pdf2image
       and route each page image through the OCR service (slow path — for scanned PDFs).
    
    Returns: { "text": str, "page_count": int, "method": str }
    """
    extracted_pages = []
    method = "embedded"

    # ── Step 1: Try embedded text extraction ──────────────────────────────────
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        page_count = len(reader.pages)

        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            page_text = page_text.strip()
            if page_text:
                extracted_pages.append(f"[Page {i+1}]\n{page_text}")

        full_text = "\n\n".join(extracted_pages).strip()

        # If we extracted meaningful text, return it
        if len(full_text) > 100:
            print(f"[PDF] Embedded text extracted: {len(full_text)} chars across {page_count} pages.")
            return {
                "text": full_text,
                "page_count": page_count,
                "method": "embedded"
            }
        else:
            print(f"[PDF] Embedded text too sparse ({len(full_text)} chars). Trying image OCR...")

    except ImportError:
        print("[PDF] pypdf not installed. Trying image OCR path.")
        page_count = 0
    except Exception as e:
        print(f"[PDF] pypdf extraction failed: {e}. Trying image OCR path.")
        page_count = 0

    # ── Step 2: Image-based OCR (for scanned/image PDFs) ────────────────────
    try:
        import pdf2image  # type: ignore

        print("[PDF] Rendering PDF pages as images for OCR...")
        images = pdf2image.convert_from_bytes(
            pdf_bytes,
            dpi=200,          # Good balance of quality vs speed
            fmt="jpeg",
            first_page=1,
            last_page=10      # Cap at 10 pages to prevent huge uploads
        )

        from ocr.ocr_service import get_ocr_service
        ocr = get_ocr_service()

        page_count = len(images)
        ocr_pages = []

        for i, pil_image in enumerate(images):
            # Convert PIL image to bytes
            img_buffer = io.BytesIO()
            pil_image.save(img_buffer, format="JPEG", quality=85)
            img_bytes = img_buffer.getvalue()

            print(f"[PDF] OCR processing page {i+1}/{page_count}...")
            result = ocr.extract_text_from_image(img_bytes, mime_type="image/jpeg")

            page_text = result.get("text", "").strip()
            if page_text and not page_text.startswith("OCR_FAILED"):
                ocr_pages.append(f"[Page {i+1}]\n{page_text}")

        method = "ocr_image"
        full_text = "\n\n".join(ocr_pages).strip()

        print(f"[PDF] Image OCR complete: {len(full_text)} chars from {page_count} pages.")
        return {
            "text": full_text,
            "page_count": page_count,
            "method": method
        }

    except ImportError:
        print("[PDF] pdf2image not installed. Image OCR path unavailable.")
        return {
            "text": "",
            "page_count": page_count,
            "method": "failed",
            "error": "Could not extract text from this PDF. It may be a scanned document. Please install pdf2image for image-based PDF support."
        }
    except Exception as e:
        print(f"[PDF] Image OCR path failed: {e}")
        return {
            "text": "",
            "page_count": page_count,
            "method": "failed",
            "error": f"PDF processing error: {str(e)}"
        }
