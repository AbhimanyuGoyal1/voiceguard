import io
import pytest
import numpy as np
import soundfile as sf
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.audio_preprocessor import decode_and_validate_audio, AudioProcessingError


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

        # Check full contract fields
        assert "session_id" in data
        assert data["mode"] == "LIVE"
        assert data["state"] == "COMPLETE"
        assert "audio_info" in data
        assert data["audio_info"]["target_sample_rate"] == 16000
        assert data["audio_info"]["channels"] == 1
        assert data["audio_info"]["duration_seconds"] >= 2.4
        assert "speaker" in data
        assert "authenticity" in data
        assert "risk" in data
        assert "evidence" in data
        assert len(data["timeline"]) >= 2


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
        assert "duration" in data["message"].lower()


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


@pytest.mark.asyncio
async def test_analyze_empty_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("empty.wav", b"", "audio/wav")}
        response = await client.post("/api/analyze", files=files)
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] in ["EMPTY_AUDIO", "UNSUPPORTED_FORMAT"]


@pytest.mark.asyncio
async def test_analyze_unsupported_corrupted_file():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("corrupt.wav", b"INVALID_GARBAGE_BYTES_12345", "audio/wav")}
        response = await client.post("/api/analyze", files=files)
        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "UNSUPPORTED_FORMAT"


def test_audio_preprocessor_resampling():
    wav_bytes = create_synthetic_wav(duration=2.0, sample_rate=48000, freq=500.0)
    tensor, meta = decode_and_validate_audio(wav_bytes, "48k.wav")
    assert meta["original_sample_rate"] == 48000
    assert meta["target_sample_rate"] == 16000
    assert meta["channels"] == 1
    # 2 seconds at 16,000 Hz = 32,000 samples
    assert abs(len(tensor) - 32000) < 50
    assert float(np.max(np.abs(tensor))) <= 1.0
