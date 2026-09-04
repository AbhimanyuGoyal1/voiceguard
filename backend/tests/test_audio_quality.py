import numpy as np
import pytest
from backend.services.audio_quality import assess_audio_quality
from backend.services.pipeline import build_analysis_pipeline_response


def generate_test_tone(duration=2.0, sr=16000, freq=440.0, amplitude=0.5):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Sine wave with envelope
    envelope = np.ones_like(t)
    fade = int(0.1 * sr)
    envelope[:fade] = np.linspace(0, 1, fade)
    envelope[-fade:] = np.linspace(1, 0, fade)
    return (amplitude * np.sin(2 * np.pi * freq * t) * envelope).astype(np.float32)


def test_audio_quality_clean():
    clean_audio = generate_test_tone(duration=2.5, amplitude=0.6)
    res = assess_audio_quality(clean_audio, sample_rate=16000)
    assert res["quality_score"] >= 60.0
    assert res["rating"] in ["EXCELLENT", "GOOD"]
    assert res["snr_db"] >= 15.0
    assert res["clipping_pct"] == 0.0
    assert res["is_clipped"] is False
    assert res["is_noisy"] is False
    assert res["is_degraded"] is False
    assert res["confidence_multiplier"] >= 0.90


def test_audio_quality_heavy_noise():
    clean_audio = generate_test_tone(duration=2.0, amplitude=0.2)
    # Add heavy white noise (SNR < 6 dB)
    noise = np.random.normal(0, 0.35, len(clean_audio)).astype(np.float32)
    noisy_audio = clean_audio + noise
    noisy_audio = noisy_audio / (np.max(np.abs(noisy_audio)) + 1e-9)
    
    res = assess_audio_quality(noisy_audio, sample_rate=16000)
    assert res["is_noisy"] is True
    assert res["rating"] == "DEGRADED"
    assert res["is_degraded"] is True
    assert res["confidence_multiplier"] <= 0.70
    assert "noise" in res["recommendation"].lower()


def test_audio_quality_severe_clipping():
    clean_audio = generate_test_tone(duration=2.0, amplitude=1.0)
    # Force hard clipping on 5% of samples
    clipped = np.clip(clean_audio * 3.0, -1.0, 1.0)
    
    res = assess_audio_quality(clipped, sample_rate=16000)
    assert res["clipping_pct"] > 1.0
    assert res["is_clipped"] is True
    assert res["rating"] == "DEGRADED"
    assert res["is_degraded"] is True
    assert "clipping" in res["recommendation"].lower()


def test_audio_quality_pipeline_integration():
    clean_audio = generate_test_tone(duration=2.0, amplitude=0.5)
    meta = {
        "duration_seconds": 2.0,
        "original_sample_rate": 16000,
        "target_sample_rate": 16000,
        "channels": 1,
        "rms_energy": float(np.sqrt(np.mean(clean_audio**2))),
        "peak_amplitude": float(np.max(np.abs(clean_audio))),
        "is_silent": False,
    }
    result = build_analysis_pipeline_response(meta, audio_tensor=clean_audio)
    assert result.quality is not None
    assert result.quality.quality_score >= 60.0
    assert result.quality.is_degraded is False


def test_audio_quality_pipeline_degraded_confidence_penalty():
    # Noisy signal
    clean_audio = generate_test_tone(duration=2.0, amplitude=0.15)
    noise = np.random.normal(0, 0.4, len(clean_audio)).astype(np.float32)
    noisy_audio = (clean_audio + noise) / np.max(np.abs(clean_audio + noise))
    
    meta = {
        "duration_seconds": 2.0,
        "original_sample_rate": 16000,
        "target_sample_rate": 16000,
        "channels": 1,
        "rms_energy": float(np.sqrt(np.mean(noisy_audio**2))),
        "peak_amplitude": 1.0,
        "is_silent": False,
    }
    result = build_analysis_pipeline_response(meta, audio_tensor=noisy_audio)
    assert result.quality.is_degraded is True
    assert result.degradation.is_degraded is True
    assert result.authenticity.confidence < 0.90
    # Timeline should have quality warning event
    quality_events = [e for e in result.timeline if e.type == "AUDIO_QUALITY_ALERT"]
    assert len(quality_events) >= 1
