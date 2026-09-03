"""
Acoustic Forensic Calibration & Baseline Validation Service.
Strictly adheres to training.md Critical Data Rules:
- Only explicitly listed samples in training_config.json are loaded for calibration.
- Zero folder-wide globbing (*.wav / *.mpeg).
- All other samples (user_natural_primary, genuine_primary_1, ai_clone_attack_1, etc.)
  remain strictly test/evaluation data.
"""

import os
import json
from typing import Dict, Any, List
import numpy as np
import soundfile as sf
import scipy.signal

from ml.antispoof.forensic_features import extract_forensic_features, load_forensic_config
from backend.services.audio_preprocessor import decode_and_validate_audio


def run_explicit_calibration(
    config_path: str = "ml/antispoof/training_config.json",
    base_dir: str = ".",
) -> Dict[str, Any]:
    """
    Executes calibration ONLY for explicitly configured samples.
    Computes baseline distribution metrics (mean, std, min, max) for each acoustic feature.
    """
    cfg_file = os.path.join(base_dir, config_path)
    if not os.path.exists(cfg_file):
        raise FileNotFoundError(f"Configuration file not found at {cfg_file}")

    with open(cfg_file, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    active_samples = cfg.get("active_calibration_samples", [])
    if not active_samples:
        raise ValueError("No active calibration samples configured!")

    calibration_records = []

    for sample in active_samples:
        rel_path = sample.get("path")
        full_path = os.path.join(base_dir, rel_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Configured calibration audio not found: {full_path}")

        with open(full_path, "rb") as f:
            raw_bytes = f.read()

        # Resilient decoding using VoiceGuard preprocessor (handles MPEG metadata trailers)
        audio_tensor, meta = decode_and_validate_audio(raw_bytes)

        # Extract acoustic forensic features
        features = extract_forensic_features(audio_tensor, sample_rate=meta["target_sample_rate"], config=cfg)

        calibration_records.append({
            "id": sample.get("id"),
            "designation": sample.get("designation"),
            "path": rel_path,
            "label": sample.get("label"),
            "duration_s": meta["duration_seconds"],
            "features": features.to_dict(),
        })

    # Compute empirical baseline statistics
    stats = {}
    metric_keys = [
        "spectral_flatness",
        "spectral_flux",
        "hf_energy_ratio",
        "pitch_mean_hz",
        "intonation_variance",
        "jitter_pct",
        "energy_variance",
    ]

    for k in metric_keys:
        vals = [r["features"][k] for r in calibration_records if r["features"].get("reliability", {}).get(k, True)]
        if vals:
            stats[k] = {
                "mean": round(float(np.mean(vals)), 5),
                "std": round(float(np.std(vals)), 5),
                "min": round(float(np.min(vals)), 5),
                "max": round(float(np.max(vals)), 5),
                "count": len(vals),
            }

    return {
        "status": "CALIBRATION_COMPLETE",
        "samples_calibrated": [s["designation"] for s in active_samples],
        "sample_count": len(calibration_records),
        "baseline_statistics": stats,
        "sample_records": calibration_records,
    }


if __name__ == "__main__":
    result = run_explicit_calibration()
    print(json.dumps(result, indent=2))
