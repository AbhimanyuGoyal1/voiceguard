import io
import pytest
import numpy as np
import soundfile as sf
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.pipeline import build_analysis_pipeline_response


def create_synthetic_wav(duration: float = 2.0, sample_rate: int = 44100, freq: float = 440.0, silence: bool = False) -> bytes:
    """Helper to generate in-memory WAV audio bytes for testing."""
    num_samples = int(duration * sample_rate)
    if silence:
        samples = np.zeros(num_samples, dtype=np.float32)
    else:
        t = np.linspace(0, duration, num_samples, endpoint=False)
        samples = (0.5 * np.sin(2 * np.pi * freq * t)).astype(np.float32)

    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_analyze_valid_audio():
    wav_bytes = create_synthetic_wav(duration=2.5, sample_rate=44100, freq=440.0)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("test.wav", wav_bytes, "audio/wav")}
        response = await client.post("/api/analyze", files=files)
        assert response.status_code == 200
        data = response.json()

        assert "session_id" in data
        assert data["mode"] == "LIVE"
        assert data["state"] == "COMPLETE"
        assert "audio_info" in data
        assert "speaker" in data
        assert "authenticity" in data
        assert data["authenticity"]["is_mock"] is False
        assert "evidence" in data
        assert len(data["timeline"]) >= 3


@pytest.mark.asyncio
async def test_pipeline_partial_analysis_on_failure():
    metadata = {
        "duration_seconds": 2.5,
        "original_sample_rate": 16000,
        "target_sample_rate": 16000,
        "channels": 1,
        "rms_energy": 0.05,
        "peak_amplitude": 0.8,
        "is_silent": False,
    }
    t = np.linspace(0, 2.5, 40000, endpoint=False)
    audio_tensor = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

    # Force antispoof failure to test PARTIAL_ANALYSIS
    result = build_analysis_pipeline_response(
        metadata=metadata,
        audio_tensor=audio_tensor,
        force_antispoof_failure=True,
    )

    assert result.state == "PARTIAL_ANALYSIS"
    assert result.degradation.is_degraded is True
    assert "authenticity_detection" in result.degradation.unavailable_signals
    assert result.risk.is_partial is True
    assert result.risk.confidence == 0.5


@pytest.mark.asyncio
async def test_analyze_audio_too_short():
    wav_bytes = create_synthetic_wav(duration=0.5, sample_rate=16000)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("short.wav", wav_bytes, "audio/wav")}
        response = await client.post("/api/analyze", files=files)
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "AUDIO_TOO_SHORT"


@pytest.mark.asyncio
async def test_analyze_audio_silent():
    wav_bytes = create_synthetic_wav(duration=2.0, sample_rate=16000, silence=True)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("silent.wav", wav_bytes, "audio/wav")}
        response = await client.post("/api/analyze", files=files)
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "SILENT_AUDIO"
