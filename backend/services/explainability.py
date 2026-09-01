from typing import Dict, Any, List, Optional
from backend.schemas.analysis import AnalysisResult


def generate_explainability_report(analysis: AnalysisResult) -> Dict[str, Any]:
    """
    Generates a deterministic, explainable report from real computed pipeline evidence.
    Does not use probabilistic LLM generation. Every metric directly links to computed signals.
    """
    risk = analysis.risk
    speaker = analysis.speaker
    auth = analysis.authenticity
    ev = analysis.evidence

    # Determine core explanation category
    is_clone_attack = auth.synthetic_probability >= 70.0 and speaker.match_score >= 70.0
    is_synthetic_impostor = auth.synthetic_probability >= 70.0 and speaker.match_score < 70.0
    is_unknown_human = auth.synthetic_probability < 50.0 and speaker.match_score < 50.0
    is_verified_genuine = auth.synthetic_probability < 40.0 and speaker.match_score >= 75.0

    if is_clone_attack:
        title = "AI Voice Impersonation Detected"
        verdict_badge = "CRITICAL THREAT"
        headline = "Targeted Voice Clone Attack"
        reasoning = (
            f"The analyzed voice shows high acoustic similarity to enrolled identity '{speaker.enrolled_identity}' "
            f"({speaker.match_score}%), but contains strong synthetic generation indicators "
            f"({auth.synthetic_probability}% synthetic probability). This pattern is characteristic of neural voice cloning."
        )
        recommendation = "Reject caller immediately. Trigger out-of-band biometric or challenge verification."
    elif is_synthetic_impostor:
        title = "Synthetic Voice Spoof Detected"
        verdict_badge = "HIGH THREAT"
        headline = "Unenrolled Synthetic Generation"
        reasoning = (
            f"The input audio exhibits neural vocoder spectral artifacts ({ev.spectral_anomaly}% anomaly) "
            f"and synthetic audio probabilities of {auth.synthetic_probability}%. The speaker does not match the enrolled profile."
        )
        recommendation = "Deny authorization and log audio fingerprint in suspicious threat registry."
    elif is_unknown_human:
        title = "Unverified Human Voice"
        verdict_badge = "MODERATE RISK"
        headline = "Organic Voice / Speaker Mismatch"
        reasoning = (
            f"The voice appears organic ({auth.human_probability}% human probability), but the acoustic voiceprint "
            f"matches only {speaker.match_score}% with '{speaker.enrolled_identity}'. The caller is likely an unauthorized person."
        )
        recommendation = "Request secondary identity verification or re-enroll authorized speaker."
    elif is_verified_genuine:
        title = "Authentic Voice Verified"
        verdict_badge = "VERIFIED SAFE"
        headline = "Genuine Enrolled Speaker"
        reasoning = (
            f"The voice closely matches enrolled identity '{speaker.enrolled_identity}' ({speaker.match_score}%) "
            f"and exhibits natural human acoustic harmonic roll-off ({auth.human_probability}% genuine)."
        )
        recommendation = "Caller authenticated. Proceed with standard workflow."
    else:
        title = "Inconclusive Acoustic Pattern"
        verdict_badge = "EVALUATE FURTHER"
        headline = f"Risk Level: {risk.level} ({risk.score}/100)"
        reasoning = (
            f"Speaker match is {speaker.match_score}% ({speaker.status}) with {auth.synthetic_probability}% synthetic probability. "
            f"Acoustic anomaly metrics: Spectral {ev.spectral_anomaly}%, Prosody {ev.prosody_anomaly}%."
        )
        recommendation = "Issue dynamic security challenge or request a longer clean audio sample."

    # Breakdown of individual signal contributions
    signal_factors: List[Dict[str, Any]] = [
        {
            "id": "speaker_identity",
            "name": "Speaker Identity Match",
            "model": "ECAPA-TDNN (192-d)",
            "value": f"{speaker.match_score}%",
            "status": speaker.status,
            "weight": "30%",
            "impact": "DECREASES RISK" if speaker.match_score >= 75 and auth.synthetic_probability < 40 else "INCREASES RISK",
            "description": f"Acoustic cosine distance against reference voiceprint for '{speaker.enrolled_identity}'.",
        },
        {
            "id": "synthetic_probability",
            "name": "Synthetic / Anti-Spoof Detection",
            "model": "AASIST-Forensic",
            "value": f"{auth.synthetic_probability}%",
            "status": auth.classification,
            "weight": "50%",
            "impact": "CRITICAL RISK ESCALATION" if auth.synthetic_probability >= 70 else "NORMAL",
            "description": "High-frequency neural vocoder harmonic truncation and energy distribution analysis.",
        },
        {
            "id": "spectral_anomaly",
            "name": "Spectral Harmonic Roll-Off",
            "model": "FFT Acoustic Analyzer",
            "value": f"{ev.spectral_anomaly}%",
            "status": "ANOMALOUS" if ev.spectral_anomaly >= 50 else "NORMAL",
            "weight": "10%",
            "impact": "ELEVATED" if ev.spectral_anomaly >= 50 else "NORMAL",
            "description": "Measures steep frequency cutoffs above 7kHz typical of MelGAN/HiFi-GAN synthesis.",
        },
        {
            "id": "prosody_anomaly",
            "name": "Prosody & Pitch Variance",
            "model": "Frame-Energy Variance",
            "value": f"{ev.prosody_anomaly}%",
            "status": "UNNATURAL" if ev.prosody_anomaly >= 50 else "NATURAL",
            "weight": "10%",
            "impact": "ELEVATED" if ev.prosody_anomaly >= 50 else "NORMAL",
            "description": "Detects robotic pitch stability and artificial frame energy transitions.",
        },
    ]

    return {
        "title": title,
        "verdict_badge": verdict_badge,
        "headline": headline,
        "risk_score": risk.score,
        "risk_level": risk.level,
        "is_partial": risk.is_partial,
        "reasoning": reasoning,
        "recommendation": recommendation,
        "signal_factors": signal_factors,
    }
