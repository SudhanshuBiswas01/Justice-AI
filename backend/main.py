import sys, io
# Force safe printing globally to prevent ₹ / emoji encoding crashes on Windows
import builtins

_original_print = builtins.print

def safe_print(*args, **kwargs):
    try:
        _original_print(*args, **kwargs)
    except UnicodeEncodeError:
        safe_args = [str(a).encode('ascii', 'replace').decode('ascii') for a in args]
        _original_print(*safe_args, **kwargs)

builtins.print = safe_print

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, scraper, ocr, voice, deep_research

app = FastAPI(title="Justice AI Backend", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(scraper.router, prefix="/api")
app.include_router(ocr.router, prefix="/api")
app.include_router(voice.router, prefix="/api/voice")
app.include_router(deep_research.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to Justice AI API"}
