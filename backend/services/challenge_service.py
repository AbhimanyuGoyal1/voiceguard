from typing import Dict, Any, List, Optional
import random

# Fixed canonical security challenge pool
CHALLENGE_POOL = [
    {
        "id": "chal_01",
        "phrase": "Blue mountains remember seven.",
        "phonetic_complexity": "High (Plosive & Nasal distribution)",
        "expected_duration_seconds": 2.5,
    },
    {
        "id": "chal_02",
        "phrase": "Quiet silver rivers flow forward.",
        "phonetic_complexity": "High (Fricative & Liquid transition)",
        "expected_duration_seconds": 2.8,
    },
    {
        "id": "chal_03",
        "phrase": "Echo forty-two confirms beacon.",
        "phonetic_complexity": "Medium (Numeric boundary shift)",
        "expected_duration_seconds": 2.4,
    },
    {
        "id": "chal_04",
        "phrase": "Solar wind whispers golden amber.",
        "phonetic_complexity": "High (Sibilant & Vowel variance)",
        "expected_duration_seconds": 2.7,
    },
]


def get_security_challenge(challenge_index: Optional[int] = 0) -> Dict[str, Any]:
    """
    Returns a deterministic challenge phrase from the fixed pool.
    In Demo Mode, returns the canonical challenge (chal_01).
    """
    idx = 0 if challenge_index is None else (challenge_index % len(CHALLENGE_POOL))
    return CHALLENGE_POOL[idx]


def evaluate_challenge_response(
    speaker_match_score: float,
    synthetic_probability: float,
    match_threshold: float = 65.0,
    max_synthetic_threshold: float = 40.0,
) -> Dict[str, Any]:
    """
    Evaluates an active security challenge response against strict verification gates.
    PASS Criteria:
      1. Speaker similarity >= match_threshold (65.0%)
      2. Synthetic probability < max_synthetic_threshold (40.0%)
    FAIL Criteria:
      - Synthetic voice / clone attempt OR mismatched speaker identity.
    """
    spk_passed = speaker_match_score >= match_threshold
    auth_passed = synthetic_probability < max_synthetic_threshold

    overall_passed = spk_passed and auth_passed

    if overall_passed:
        status = "PASS"
        verdict = "CHALLENGE PASSED: Genuine biological voice verified."
        recommendation = "Session authenticated. Access granted."
    elif not spk_passed and not auth_passed:
        status = "FAIL"
        verdict = "CHALLENGE FAILED: Synthetic audio from unverified speaker."
        recommendation = "Session blocked immediately. Incident report filed."
    elif not auth_passed:
        status = "FAIL"
        verdict = "CHALLENGE FAILED: High synthetic deepfake characteristics detected."
        recommendation = "Impersonation attack blocked. Access denied."
    else:
        status = "FAIL"
        verdict = "CHALLENGE FAILED: Speaker acoustic profile mismatch."
        recommendation = "Unauthorized caller identity. Access denied."

    return {
        "status": status,
        "overall_passed": overall_passed,
        "speaker_verified": spk_passed,
        "authenticity_verified": auth_passed,
        "speaker_match_score": speaker_match_score,
        "synthetic_probability": synthetic_probability,
        "verdict": verdict,
        "recommendation": recommendation,
    }
