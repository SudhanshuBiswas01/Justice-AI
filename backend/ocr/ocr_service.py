import os
import re
import json
import base64
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# ── Prompt used for Gemini Vision OCR ──────────────────────────────────────────
OCR_SYSTEM_PROMPT = """You are a precise OCR (Optical Character Recognition) engine specialized in Indian legal and commercial documents.
Your task is to extract ALL visible text from the provided image exactly as it appears.

Instructions:
1. Extract every piece of text visible in the image — do NOT summarize or paraphrase.
2. Preserve original formatting where possible (line breaks, table structure, lists).
3. For handwritten text, do your best to transcribe it accurately and indicate uncertainty with [?].
4. Include amounts (₹), dates, ID numbers, addresses, and any printed codes.
5. If the image is too blurry or unreadable, return exactly: "OCR_FAILED: Image quality too low."
6. Do NOT add any commentary, headers, or explanations — only the raw extracted text.
"""


class OCRService:
    """
    Production OCR service using Gemini Vision API.
    Supports JPG, PNG, WEBP image formats.
    Falls back gracefully if credentials are unavailable.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.gcp_token: Optional[str] = None
        self.gcp_project: Optional[str] = None
        self._load_gcp_credentials()

        if self.gcp_token and self.gcp_project:
            self.provider = "vertex"
            print("[OCR] Initialized with Vertex AI Vision provider.")
        elif self.gemini_key:
            self.provider = "gemini"
            print("[OCR] Initialized with Google AI Studio Vision provider.")
        else:
            self.provider = "unavailable"
            print("[OCR] WARNING: No AI credentials found. OCR will not function.")

    def _load_gcp_credentials(self):
        try:
            from rag.gcp_auth import get_gcp_credentials
            self.gcp_token, self.gcp_project = get_gcp_credentials()
        except Exception as e:
            print(f"[OCR] GCP credentials not loaded: {e}")

    def _refresh_gcp_token(self):
        try:
            from rag.gcp_auth import get_gcp_credentials
            self.gcp_token, self.gcp_project = get_gcp_credentials(force=True)
        except Exception:
            pass

    def _preprocess_image(self, image_bytes: bytes, max_size_kb: int = 4096) -> bytes:
        """
        Compress and resize an image if it exceeds max_size_kb.
        Returns processed image bytes in JPEG format.
        """
        try:
            from PIL import Image
            import io

            img = Image.open(io.BytesIO(image_bytes))

            # Convert RGBA/P mode to RGB for JPEG compatibility
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Resize if image is very large (>2000px on longest side)
            max_dim = 2000
            if max(img.width, img.height) > max_dim:
                ratio = max_dim / max(img.width, img.height)
                new_size = (int(img.width * ratio), int(img.height * ratio))
                img = img.resize(new_size, Image.LANCZOS)
                print(f"[OCR] Resized image to {new_size}")

            # Compress to target size
            output = io.BytesIO()
            quality = 90
            while quality > 30:
                output.seek(0)
                output.truncate()
                img.save(output, format="JPEG", quality=quality, optimize=True)
                if output.tell() <= max_size_kb * 1024:
                    break
                quality -= 15

            print(f"[OCR] Image preprocessed: {output.tell() // 1024}KB at quality={quality}")
            return output.getvalue()

        except ImportError:
            print("[OCR] Pillow not installed — skipping image preprocessing.")
            return image_bytes
        except Exception as e:
            print(f"[OCR] Image preprocessing failed: {e}. Using original.")
            return image_bytes

    def extract_text_from_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg"
    ) -> dict:
        """
        Main OCR entry point. Sends image to Gemini Vision API.
        Returns: { "text": str, "confidence": str, "provider": str }
        """
        if self.provider == "unavailable":
            return {
                "text": "",
                "confidence": "failed",
                "provider": "none",
                "error": "No AI credentials configured for OCR."
            }

        # Preprocess image for better API performance
        processed_bytes = self._preprocess_image(image_bytes)
        b64_image = base64.b64encode(processed_bytes).decode("utf-8")

        # Normalize MIME type for JPEG
        if mime_type in ("image/jpg",):
            mime_type = "image/jpeg"

        result = self._call_gemini_vision(b64_image, mime_type)

        if result.get("text", "").startswith("OCR_FAILED"):
            result["confidence"] = "low"
        elif result.get("text"):
            result["confidence"] = "high"
        else:
            result["confidence"] = "failed"

        return result

    def _call_gemini_vision(self, b64_image: str, mime_type: str) -> dict:
        """Try Vertex AI first, then fall back to AI Studio."""

        # 1. Try Vertex AI
        for attempt in range(2):
            if attempt == 1:
                self._refresh_gcp_token()

            if self.gcp_token and self.gcp_project and self.provider == "vertex":
                try:
                    url = (
                        f"https://us-central1-aiplatform.googleapis.com/v1/projects/{self.gcp_project}"
                        f"/locations/us-central1/publishers/google/models/gemini-2.0-flash:generateContent"
                    )
                    headers = {
                        "Authorization": f"Bearer {self.gcp_token}",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "contents": [{
                            "role": "user",
                            "parts": [
                                {"text": OCR_SYSTEM_PROMPT},
                                {
                                    "inlineData": {
                                        "mimeType": mime_type,
                                        "data": b64_image
                                    }
                                }
                            ]
                        }],
                        "generationConfig": {"temperature": 0.0}
                    }
                    res = requests.post(url, headers=headers, json=payload, timeout=45)
                    if res.status_code == 200:
                        data = res.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {"text": text.strip(), "provider": "vertex"}
                    elif res.status_code == 401 and attempt == 0:
                        continue  # Refresh and retry
                    else:
                        print(f"[OCR-Vertex] API error {res.status_code}. Trying AI Studio...")
                        break
                except Exception as e:
                    print(f"[OCR-Vertex] Request failed: {e}. Trying AI Studio...")
                    break

        # 2. Try Google AI Studio
        if self.gemini_key:
            try:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"gemini-2.0-flash:generateContent?key={self.gemini_key}"
                )
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": OCR_SYSTEM_PROMPT},
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": b64_image
                                }
                            }
                        ]
                    }],
                    "generationConfig": {"temperature": 0.0}
                }
                res = requests.post(url, json=payload, timeout=45)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"text": text.strip(), "provider": "gemini_studio"}
                else:
                    print(f"[OCR-Studio] API error {res.status_code}: {res.text[:200]}")
            except Exception as e:
                print(f"[OCR-Studio] Request failed: {e}")

        return {"text": "", "provider": "none", "error": "All OCR providers failed."}


# Singleton instance
_ocr_service_instance: Optional[OCRService] = None

def get_ocr_service() -> OCRService:
    global _ocr_service_instance
    if _ocr_service_instance is None:
        _ocr_service_instance = OCRService()
    return _ocr_service_instance
