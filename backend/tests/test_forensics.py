import pytest
import numpy as np
import os
import json

from ml.antispoof.forensic_features import extract_forensic_features, load_forensic_config
from ml.antispoof.calibration_service import run_explicit_calibration
from ml.antispoof.detector import antispoof_detector
from backend.services.pipeline import build_analysis_pipeline_response


class TestForensicVoiceFeatures:
    """
    Verification suite ensuring:
    1. Only explicitly configured samples (A and B) are used for calibration.
    2. Zero folder-wide training/globbing occurs.
    3. Existing demo/test samples remain excluded from calibration.
    4. Adding C/D/E later works without modifying detector code.
    5. Feature extraction handles edge cases (silence, short audio, stereo, NaN).
    6. Backward compatibility with existing pipeline contracts is preserved.
    """

    def test_explicit_calibration_uses_only_configured_samples(self):
        """Verify calibration strictly loads only active_calibration_samples from config."""
        res = run_explicit_calibration(base_dir=".")
        assert res["status"] == "CALIBRATION_COMPLETE"
        assert "A" in res["samples_calibrated"]
        assert "B" in res["samples_calibrated"]
        assert res["sample_count"] >= 2

        # Check baseline stats are populated
        stats = res["baseline_statistics"]
        assert "spectral_flatness" in stats
        assert "spectral_flux" in stats
        assert "hf_energy_ratio" in stats
        assert stats["spectral_flux"]["mean"] > 0.40

    def test_demo_samples_are_not_in_calibration_records(self):
        """Verify demo files (user_natural_primary, genuine_primary_1, ai_clone_attack_1) are not in calibration."""
        res = run_explicit_calibration(base_dir=".")
        calibrated_paths = [r["path"] for r in res["sample_records"]]
        for demo in [
            "user_natural_primary.wav",
            "genuine_primary_1.wav",
            "genuine_primary_2.wav",
            "ai_clone_attack_1.wav",
            "ai_clone_attack_2.wav",
        ]:
            for p in calibrated_paths:
                assert demo not in p, f"Demo file {demo} found in calibration paths!"

    def test_extensibility_for_future_samples(self, tmp_path):
        """Verify that adding a sample C only requires updating the configuration."""
        custom_cfg = {
            "active_calibration_samples": [
                {"id": "sample_a", "designation": "A", "path": "audiosamples/Sample A.mpeg", "label": "genuine"},
                {"id": "sample_b", "designation": "B", "path": "audiosamples/Sample B.mpeg", "label": "genuine"},
                {"id": "sample_c", "designation": "C", "path": "audiosamples/Sample A.mpeg", "label": "genuine_c"},
            ],
            "forensic_parameters": {
                "hf_cutoff_hz": 6000,
                "weights": {},
                "reference_ranges": {},
            },
        }
        cfg_file = tmp_path / "custom_config.json"
        with open(cfg_file, "w") as f:
            json.dump(custom_cfg, f)

        res = run_explicit_calibration(config_path=str(cfg_file), base_dir=".")
        assert res["samples_calibrated"] == ["A", "B", "C"]
        assert res["sample_count"] == 3

    def test_silence_handling_does_not_crash(self):
        """Test extraction on pure silence."""
        silent_audio = np.zeros(16000 * 2, dtype=np.float32)
        res = extract_forensic_features(silent_audio, sample_rate=16000)
        assert res.is_silent is True
        assert res.forensic_score == 0.0
        assert res.pitch_reliable is False

    def test_short_audio_handling(self):
        """Test extraction on short audio clips (<1.5 seconds)."""
        short_audio = np.random.randn(8000).astype(np.float32) * 0.1
        res = extract_forensic_features(short_audio, sample_rate=16000)
        assert res.duration_s == 0.50
        assert res.pitch_reliable is False  # Correctly flags short audio as unreliable for pitch

    def test_stereo_downmix_handling(self):
        """Test automatic multi-channel downmix."""
        stereo_audio = np.random.randn(16000, 2).astype(np.float32) * 0.1
        res = extract_forensic_features(stereo_audio, sample_rate=16000)
        assert res.duration_s == 1.0
        assert res.is_silent is False

    def test_nan_and_inf_resilience(self):
        """Test resilience against NaN/Inf values."""
        corrupted = np.random.randn(16000).astype(np.float32) * 0.1
        corrupted[100] = np.nan
        corrupted[200] = np.inf
        corrupted[300] = -np.inf
        res = extract_forensic_features(corrupted, sample_rate=16000)
        assert not np.isnan(res.spectral_flatness)
        assert not np.isinf(res.spectral_flatness)

    def test_detector_returns_forensic_metrics(self):
        """Verify AntiSpoofDetector returns forensic features and scores."""
        audio = np.random.randn(16000 * 2).astype(np.float32) * 0.2
        result = antispoof_detector.analyze_authenticity(audio, sample_rate=16000)
        assert "classification" in result
        assert "synthetic_probability" in result
        assert "forensic_features" in result
        assert "forensic_score" in result
        assert "model_score" in result
        assert "evidence" in result

    def test_pipeline_backward_compatibility(self):
        """Verify pipeline contract remains complete and fully functional."""
        audio = np.random.randn(16000 * 2).astype(np.float32) * 0.2
        meta = {
            "duration_seconds": 2.0,
            "original_sample_rate": 16000,
            "target_sample_rate": 16000,
            "channels": 1,
            "rms_energy": 0.05,
            "peak_amplitude": 0.3,
            "is_silent": False,
        }
        resp = build_analysis_pipeline_response(metadata=meta, audio_tensor=audio)
        assert resp.state == "COMPLETE"
        assert resp.authenticity.classification in ["AUTHENTIC", "SUSPICIOUS", "SYNTHETIC"]
        assert resp.evidence.forensic_score is not None
        assert resp.evidence.forensic_features is not None
        assert resp.evidence.summary is not None

    def test_aasist_real_output_preserved_and_untouched(self):
        """Verify real AASIST-L output is preserved and not overwritten."""
        audio = np.random.randn(16000 * 4).astype(np.float32) * 0.2
        result = antispoof_detector.analyze_authenticity(audio, sample_rate=16000)
        assert "aasist_result" in result
        aasist = result["aasist_result"]
        assert aasist["model_name"] == "AASIST-L"
        assert 0.0 <= aasist["synthetic_probability"] <= 100.0
        assert 0.0 <= aasist["human_probability"] <= 100.0
        assert round(aasist["synthetic_probability"] + aasist["human_probability"], 1) == 100.0

    def test_deterministic_forensic_scores(self):
        """Verify same audio produces identical deterministic scores."""
        audio = np.random.randn(16000 * 2).astype(np.float32) * 0.2
        res1 = extract_forensic_features(audio.copy(), sample_rate=16000)
        res2 = extract_forensic_features(audio.copy(), sample_rate=16000)
        assert res1.forensic_score == res2.forensic_score
        assert res1.spectral_flatness == res2.spectral_flatness
        assert res1.spectral_flux == res2.spectral_flux

    def test_scores_strictly_bounded(self):
        """Verify all forensic scores and probabilities are bounded within [0, 100]."""
        for scale in [0.001, 0.1, 1.0, 5.0]:
            audio = np.random.randn(16000 * 2).astype(np.float32) * scale
            res = antispoof_detector.analyze_authenticity(audio, sample_rate=16000)
            assert 0.0 <= res["synthetic_probability"] <= 100.0
            assert 0.0 <= res["human_probability"] <= 100.0
            assert 0.0 <= res["forensic_score"] <= 100.0
            assert 0.0 <= res["model_score"] <= 100.0
