"""Anti-Spoof & Audio Authenticity ML Package."""

from ml.antispoof.calibration import calibrate_antispoof_score
from ml.antispoof.detector import AntiSpoofDetector, antispoof_detector

__all__ = [
    "calibrate_antispoof_score",
    "AntiSpoofDetector",
    "antispoof_detector",
]
