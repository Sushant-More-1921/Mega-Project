
from importlib.util import find_spec
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI

from app.api.routes.analyze import router as analyze_router
from app.api.routes.similar import router as similar_router
from app.api.routes.hotspot import router as hotspot_router
from app.api.routes.media import router as media_router
from app.api.routes.chatbot import router as chatbot_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="CivicResolve AI Service",
    description="AI service for civic complaint classification and prioritization",
    version="1.0.0"
)

app.include_router(analyze_router)
app.include_router(similar_router)
app.include_router(hotspot_router)
app.include_router(media_router)
app.include_router(chatbot_router)


@app.get("/")
def root():
    return {
        "message": "CivicResolve AI Service is running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "features": {
            "text_analysis": True,
            "whisper_transcription": find_spec("faster_whisper") is not None,
            "similarity_dependencies": (
                find_spec("sentence_transformers") is not None
                and find_spec("faiss") is not None
            ),
        },
    }
