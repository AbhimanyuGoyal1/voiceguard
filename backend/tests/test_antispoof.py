import pytest
import numpy as np
import torch
from ml.antispoof.calibration import calibrate_antispoof_score
from ml.antispoof.detector import AntiSpoofDetector


def test_calibrate_antispoof_score_authentic():
    # Low synthetic metric (0.15) -> AUTHENTIC
    synth_pct, human_pct, label = calibrate_antispoof_score(0.15, threshold_synthetic=0.55, threshold_suspicious=0.40)
    assert label == "AUTHENTIC"
    assert synth_pct < 50.0
    assert human_pct > 50.0
    assert pytest.approx(synth_pct + human_pct, 0.1) == 100.0


def test_calibrate_antispoof_score_suspicious():
    # Mid synthetic metric (0.48) -> SUSPICIOUS
    synth_pct, human_pct, label = calibrate_antispoof_score(0.48, threshold_synthetic=0.55, threshold_suspicious=0.40)
    assert label == "SUSPICIOUS"
    assert synth_pct >= 50.0
    assert synth_pct < 75.0
    assert pytest.approx(synth_pct + human_pct, 0.1) == 100.0


def test_calibrate_antispoof_score_synthetic():
    # High synthetic metric (0.80) -> SYNTHETIC
    synth_pct, human_pct, label = calibrate_antispoof_score(0.80, threshold_synthetic=0.55, threshold_suspicious=0.40)
    assert label == "SYNTHETIC"
    assert synth_pct >= 75.0
    assert human_pct <= 25.0
    assert pytest.approx(synth_pct + human_pct, 0.1) == 100.0


def test_antispoof_detector_model_loading():
    """Verify genuine AASIST-L architecture loads checkpoint weights cleanly and caches."""
    detector = AntiSpoofDetector()
    loaded = detector.load_model()
    assert loaded is True
    assert detector.model is not None
    assert detector.model_name == "AASIST-L (ASVspoof 2019)"


def test_antispoof_detector_short_audio():
    """Verify input shorter than 64600 samples is circularly padded conforming to AASIST protocol."""
    detector = AntiSpoofDetector()
    short_audio = np.random.randn(8000).astype(np.float32)  # 0.5s
    res = detector.analyze_authenticity(short_audio, sample_rate=16000)
    assert "classification" in res
    assert 0.0 <= res["synthetic_probability"] <= 100.0
    assert 0.0 <= res["human_probability"] <= 100.0
    assert pytest.approx(res["synthetic_probability"] + res["human_probability"], 0.2) == 100.0


def test_antispoof_detector_exact_length_audio():
    """Verify exact 64600 samples (4.0375s) audio inference."""
    detector = AntiSpoofDetector()
    exact_audio = np.random.randn(64600).astype(np.float32)
    res = detector.analyze_authenticity(exact_audio, sample_rate=16000)
    assert res["is_mock"] is False
    assert res["model_name"] == "AASIST-L (ASVspoof 2019)"


def test_antispoof_detector_long_audio_multislice():
    """Verify long audio (>64600 samples) uses multi-window sliding aggregation."""
    detector = AntiSpoofDetector()
    long_audio = np.random.randn(120000).astype(np.float32)  # 7.5s
    res = detector.analyze_authenticity(long_audio, sample_rate=16000)
    assert "classification" in res
    assert "evidence" in res
    assert 0.0 <= res["confidence"] <= 1.0


def test_antispoof_detector_invalid_audio():
    """Verify audio shorter than 100ms or None raises ValueError."""
    detector = AntiSpoofDetector()
    with pytest.raises(ValueError):
        detector.analyze_authenticity(np.zeros(100, dtype=np.float32))
    with pytest.raises(ValueError):
        detector.analyze_authenticity(None)
