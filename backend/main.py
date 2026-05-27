from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, scraper

app = FastAPI(title="Justice AI Backend", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(scraper.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to Justice AI API"}
