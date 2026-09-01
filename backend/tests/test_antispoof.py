import pytest
import numpy as np
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


def test_antispoof_detector_analysis():
    detector = AntiSpoofDetector()
    
    # Generate realistic dynamic waveform
    t = np.linspace(0, 2.0, 32000, endpoint=False)
    # Mix varied natural harmonics with high-frequency presence
    audio = (
        0.4 * np.sin(2 * np.pi * 300 * t)
        + 0.2 * np.sin(2 * np.pi * 600 * t)
        + 0.1 * np.sin(2 * np.pi * 2400 * t)
        + 0.05 * np.sin(2 * np.pi * 7500 * t)
    ).astype(np.float32)

    result = detector.analyze_authenticity(audio, sample_rate=16000)
    assert "classification" in result
    assert "synthetic_probability" in result
    assert "human_probability" in result
    assert "evidence" in result
    assert result["is_mock"] is False
    assert result["classification"] in ["AUTHENTIC", "SUSPICIOUS", "SYNTHETIC"]
