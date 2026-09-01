import numpy as np
from typing import Tuple


def compute_cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Computes cosine similarity between two 1D embedding vectors.
    Returns value in [-1.0, 1.0].
    """
    if vec_a is None or vec_b is None:
        raise ValueError("Vectors cannot be None")

    a = np.asarray(vec_a, dtype=np.float32).flatten()
    b = np.asarray(vec_b, dtype=np.float32).flatten()

    if len(a) != len(b):
        raise ValueError(f"Vector dimensions mismatch: {len(a)} vs {len(b)}")

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    dot = np.dot(a, b)
    similarity = float(dot / (norm_a * norm_b))
    return max(-1.0, min(1.0, similarity))


def calibrate_speaker_similarity(
    raw_similarity: float,
    threshold_match: float = 0.65,
    threshold_uncertain: float = 0.40,
) -> Tuple[float, str]:
    """
    Calibrates raw ECAPA-TDNN cosine similarity [-1.0, 1.0] to a 0.0 - 100.0 application score
    and assigns a speaker verification status: 'MATCHED' | 'UNCERTAIN' | 'MISMATCH'.
    
    Calibration Mapping:
      - raw_sim >= threshold_match (e.g. 0.65): maps linearly to [80.0, 100.0] -> MATCHED
      - threshold_uncertain <= raw_sim < threshold_match (0.40 - 0.65): maps linearly to [50.0, 79.9] -> UNCERTAIN
      - raw_sim < threshold_uncertain: maps [0.0, 49.9] -> MISMATCH
    """
    sim = max(-1.0, min(1.0, float(raw_similarity)))

    if sim >= threshold_match:
        # Linear scale from threshold_match -> 1.0 into 80.0 -> 100.0
        normalized = 80.0 + ((sim - threshold_match) / max(1e-5, (1.0 - threshold_match))) * 20.0
        status = "MATCHED"
    elif sim >= threshold_uncertain:
        # Linear scale from threshold_uncertain -> threshold_match into 50.0 -> 79.9
        normalized = 50.0 + ((sim - threshold_uncertain) / max(1e-5, (threshold_match - threshold_uncertain))) * 29.9
        status = "UNCERTAIN"
    else:
        # Sub-uncertainty similarity (sim < 0.40) into 0.0 -> 49.9
        clamped_sim = max(0.0, sim)
        normalized = (clamped_sim / max(1e-5, threshold_uncertain)) * 49.9
        status = "MISMATCH"

    final_score = round(max(0.0, min(100.0, normalized)), 1)
    return final_score, status
