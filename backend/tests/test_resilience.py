import pytest
import numpy as np
import io
import wave
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.audio_preprocessor import decode_and_validate_audio, AudioProcessingError
from backend.services.pipeline import build_analysis_pipeline_response
from backend.services.analyst_service import generate_ai_analyst_briefing
from backend.services.challenge_service import evaluate_challenge_response
from backend.services.history_service import get_incident_history
from backend.services.threat_map_service import get_simulated_threat_intelligence
from backend.services.fingerprint_service import project_embeddings_pca_2d


def create_test_wav(duration: float = 2.0, sample_rate: int = 16000, is_silent: bool = False) -> bytes:
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    audio = np.zeros_like(t) if is_silent else 0.5 * np.sin(2 * np.pi * 440 * t)
    pcm = (audio * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())
    return buf.getvalue()


# 1. Audio too short (<1.0s)
def test_degradation_audio_too_short():
    short_wav = create_test_wav(duration=0.4)
    with pytest.raises(AudioProcessingError) as exc:
        decode_and_validate_audio(short_wav, "short.wav")
    assert "below the minimum required duration" in exc.value.message


# 2. Silence-only audio
def test_degradation_silence_only():
    silent_wav = create_test_wav(duration=2.0, is_silent=True)
    with pytest.raises(AudioProcessingError) as exc:
        decode_and_validate_audio(silent_wav, "silent.wav")
    assert "near-silent" in exc.value.message or "muted" in exc.value.message


# 3. Invalid audio format / corrupted bytes
def test_degradation_invalid_audio():
    corrupted_bytes = b"NOT_A_REAL_WAV_FILE_HEADER"
    with pytest.raises(AudioProcessingError):
        decode_and_validate_audio(corrupted_bytes, "corrupt.wav")


# 4. Partial Analysis graceful degradation on ML model failure
def test_degradation_partial_analysis():
    valid_wav = create_test_wav(duration=2.0)
    tensor, meta = decode_and_validate_audio(valid_wav, "valid.wav")
    # Force antispoof failure -> Pipeline must degrade gracefully to PARTIAL_ANALYSIS
    result = build_analysis_pipeline_response(
        metadata=meta,
        audio_tensor=tensor,
        session_id="test_partial_deg",
        force_antispoof_failure=True,
    )
    assert result.degradation.is_degraded is True
    assert "authenticity_detection" in result.degradation.unavailable_signals
    assert result.risk.is_partial is True


# 5. Database unavailable / fallback recovery
@pytest.mark.asyncio
async def test_degradation_database_unavailable():
    history = await get_incident_history(db=None)
    assert len(history) >= 3
    assert history[0]["id"].startswith("INC-")


# 6. LLM unavailable / timeout fallback recovery
@pytest.mark.asyncio
async def test_degradation_llm_timeout_fallback():
    valid_wav = create_test_wav(duration=2.0)
    tensor, meta = decode_and_validate_audio(valid_wav, "valid.wav")
    result = build_analysis_pipeline_response(metadata=meta, audio_tensor=tensor, session_id="test_llm_deg")
    briefing = await generate_ai_analyst_briefing(result, force_timeout=True)
    assert briefing["is_fallback"] is True
    assert briefing["is_llm"] is False
    assert len(briefing["forensic_reasoning"]) > 0


# 7. PCA Projection resilience on empty / singular data
def test_degradation_pca_projection_resilience():
    dummy_enrolled = np.zeros(192, dtype=np.float32)
    proj = project_embeddings_pca_2d(enrolled_emb=dummy_enrolled)
    assert len(proj) > 0
    assert "x" in proj[0] and "y" in proj[0]


# 8. Threat Map telemetry isolation resilience
def test_degradation_threat_map_isolation():
    intel = get_simulated_threat_intelligence()
    assert intel["is_simulated"] is True
    assert intel["disclaimer"] == "SIMULATED THREAT INTELLIGENCE"


# 9. API endpoints 404 / 422 error handling
@pytest.mark.asyncio
async def test_degradation_api_error_handling():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid scenario ID returns clean 404
        r404 = await client.get("/api/scenarios/non_existent_id")
        assert r404.status_code == 404

        # Health endpoint always responds healthy
        r_health = await client.get("/health")
        assert r_health.status_code == 200
        assert r_health.json()["status"] == "healthy"
