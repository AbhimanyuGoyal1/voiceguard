from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.config import settings
from backend.database import engine, Base
from backend.api.analyze import router as analyze_router
from backend.api.scenarios import router as scenarios_router
from backend.api.challenge import router as challenge_router
from backend.api.history import router as history_router
from backend.api.fingerprint import router as fingerprint_router
from backend.api.websocket import ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables on application startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="VoiceGuard API — Voice Impersonation and Deepfake Defense",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(analyze_router)
app.include_router(scenarios_router)
app.include_router(challenge_router)
app.include_router(history_router)
app.include_router(fingerprint_router)
app.include_router(ws_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Returns backend system status and operational mode."""
    return {
        "status": "healthy",
        "service": "VoiceGuard Backend",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "database": "sqlite",
        "ai_enrichment_configured": {
            "llm": bool(settings.LLM_API_KEY),
            "tts": bool(settings.TTS_API_KEY),
            "stt": bool(settings.STT_API_KEY),
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENVIRONMENT == "development"),
    )
