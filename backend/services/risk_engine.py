from typing import Dict, Any, Optional, Tuple
from backend.schemas.analysis import RiskAssessment, ThreatSeverity


def evaluate_risk(
    speaker_match_score: float,
    synthetic_probability: float,
    spectral_anomaly: float = 0.0,
    prosody_anomaly: float = 0.0,
    temporal_artifacts: float = 0.0,
    challenge_passed: Optional[bool] = None,
    is_speaker_available: bool = True,
    is_authenticity_available: bool = True,
) -> RiskAssessment:
    """
    Authoritative, deterministic Risk Engine scoring function.
    Combines speaker match, authenticity/synthetic probability, acoustic anomalies,
    and optional active security challenge outcomes into a 0 - 100 risk score.

    Risk Bands:
      - 0  - 25:  LOW
      - 26 - 50:  MODERATE
      - 51 - 75:  HIGH
      - 76 - 100: CRITICAL

    Core Security Axiom:
      If a voice matches an enrolled speaker (high speaker similarity) BUT is identified
      as synthetic (high synthetic probability), this represents a direct AI Voice Clone attack
      and must immediately escalate to CRITICAL risk.
    """
    # 1. Handle Degraded / Partial Analysis
    if not is_speaker_available or not is_authenticity_available:
        missing_count = int(not is_speaker_available) + int(not is_authenticity_available)
        confidence = 0.5 if missing_count == 1 else 0.2

        if is_authenticity_available:
            # Authenticity is known, speaker is missing
            base_risk = synthetic_probability * 0.85
        elif is_speaker_available:
            # Speaker is known, authenticity is missing
            base_risk = 45.0 if speaker_match_score < 60.0 else 25.0
        else:
            base_risk = 50.0

        final_score = int(round(max(0.0, min(100.0, base_risk))))
        return RiskAssessment(
            score=final_score,
            level=_classify_severity(final_score),
            confidence=confidence,
            is_partial=True,
        )

    # 2. Complete Analysis Calculation
    # Normalize inputs [0.0 - 1.0]
    spk = max(0.0, min(100.0, float(speaker_match_score))) / 100.0
    synth = max(0.0, min(100.0, float(synthetic_probability))) / 100.0
    anomalies = max(0.0, min(100.0, (spectral_anomaly + prosody_anomaly + temporal_artifacts) / 3.0)) / 100.0

    # Base weighted risk components:
    # Authenticity is the dominant threat indicator (50%), acoustic anomalies (20%),
    # and speaker identity mismatch (30%).
    authenticity_component = synth * 50.0
    anomaly_component = anomalies * 20.0
    speaker_mismatch_component = (1.0 - spk) * 30.0

    raw_risk = authenticity_component + anomaly_component + speaker_mismatch_component

    # 3. AI Voice Impersonation Escalation Multiplier:
    # When synthetic probability >= 70% AND speaker match >= 70%,
    # this is a high-fidelity targeted clone. Force escalation into CRITICAL (> 85).
    if synth >= 0.70 and spk >= 0.70:
        impersonation_boost = 30.0 * synth * spk
        raw_risk = max(80.0, raw_risk + impersonation_boost)

    # 4. Active Security Challenge Modulation
    if challenge_passed is not None:
        if challenge_passed is False:
            # Failed challenge severely escalates risk
            raw_risk = max(75.0, raw_risk + 35.0)
        elif challenge_passed is True:
            # Passed challenge reduces risk if synthetic probability is not overwhelming
            reduction = 25.0 * (1.0 - synth)
            raw_risk = max(0.0, raw_risk - reduction)

    final_score = int(round(max(0.0, min(100.0, raw_risk))))
    severity = _classify_severity(final_score)

    return RiskAssessment(
        score=final_score,
        level=severity,
        confidence=0.95,
        is_partial=False,
    )


def _classify_severity(score: int) -> ThreatSeverity:
    if score >= 76:
        return "CRITICAL"
    elif score >= 51:
        return "HIGH"
    elif score >= 26:
        return "MODERATE"
    else:
        return "LOW"
