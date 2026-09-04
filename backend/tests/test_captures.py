import io
import pytest
import numpy as np
import soundfile as sf
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.services.capture_archiver import list_captures


def create_test_wav(duration: float = 1.0, sample_rate: int = 16000) -> bytes:
    num_samples = int(duration * sample_rate)
    t = np.linspace(0, duration, num_samples, endpoint=False)
    samples = (0.3 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV", subtype="PCM_16")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_capture_archiving_and_labeling():
    wav_bytes = create_test_wav(duration=1.5)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Post to analyze
        files = {"file": ("mic_test_recording.wav", wav_bytes, "audio/wav")}
        res = await client.post("/api/analyze", files=files)
        assert res.status_code == 200
        data = res.json()
        assert "capture_id" in data
        assert data["capture_id"] is not None
        capture_id = data["capture_id"]

        # 2. Get captures list
        res_list = await client.get("/api/captures")
        assert res_list.status_code == 200
        captures = res_list.json()
        assert any(c["capture_id"] == capture_id for c in captures)

        # 3. Label capture as genuine human
        res_label = await client.post(
            f"/api/captures/{capture_id}/label",
            json={"label": "human", "auto_recalibrate": False},
        )
        assert res_label.status_code == 200
        label_data = res_label.json()
        assert label_data["ground_truth"] == "genuine"

        # 4. Stream audio
        res_audio = await client.get(f"/api/captures/{capture_id}/audio")
        assert res_audio.status_code == 200
        assert len(res_audio.content) > 0
