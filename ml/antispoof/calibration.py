import numpy as np
from typing import Tuple, Dict, Any


def calibrate_antispoof_score(
    raw_synthetic_logit: float,
    threshold_synthetic: float = 0.55,
    threshold_suspicious: float = 0.40,
) -> Tuple[float, float, str]:
    """
    Calibrates raw anti-spoof model logit / score to:
      - synthetic_probability (0.0 - 100.0%)
      - human_probability (0.0 - 100.0%)
      - authenticity_classification: 'AUTHENTIC' | 'SUSPICIOUS' | 'SYNTHETIC'

    Mapping:
      - raw_score >= threshold_synthetic (>= 0.55) -> SYNTHETIC (synthetic_prob >= 75%)
      - threshold_suspicious <= raw_score < threshold_synthetic (0.40 - 0.55) -> SUSPICIOUS (synthetic_prob 50 - 74.9%)
      - raw_score < threshold_suspicious (< 0.40) -> AUTHENTIC (synthetic_prob < 50%)
    """
    # Sigmoid / logistic mapping if raw score is unnormalized logit, otherwise clamp [0.0, 1.0]
    if raw_synthetic_logit < 0.0 or raw_synthetic_logit > 1.0:
        prob = float(1.0 / (1.0 + np.exp(-raw_synthetic_logit)))
    else:
        prob = float(raw_synthetic_logit)

    if prob >= threshold_synthetic:
        # Scale [threshold_synthetic, 1.0] -> [75.0, 99.5]
        synthetic_pct = 75.0 + ((prob - threshold_synthetic) / max(1e-5, (1.0 - threshold_synthetic))) * 24.5
        label = "SYNTHETIC"
    elif prob >= threshold_suspicious:
        # Scale [threshold_suspicious, threshold_synthetic] -> [50.0, 74.9]
        synthetic_pct = 50.0 + ((prob - threshold_suspicious) / max(1e-5, (threshold_synthetic - threshold_suspicious))) * 24.9
        label = "SUSPICIOUS"
    else:
        # Scale [0.0, threshold_suspicious] -> [0.5, 49.9]
        synthetic_pct = (prob / max(1e-5, threshold_suspicious)) * 49.9
        label = "AUTHENTIC"

    synthetic_pct = round(max(0.0, min(100.0, synthetic_pct)), 1)
    human_pct = round(100.0 - synthetic_pct, 1)

    return synthetic_pct, human_pct, label
