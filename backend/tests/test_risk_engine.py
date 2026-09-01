import pytest
from backend.services.risk_engine import evaluate_risk


def test_risk_engine_low_risk_genuine_voice():
    # Genuine enrolled speaker (match=95%, synthetic=5%, anomalies=5%) -> LOW (0 - 25)
    risk = evaluate_risk(
        speaker_match_score=95.0,
        synthetic_probability=5.0,
        spectral_anomaly=5.0,
        prosody_anomaly=5.0,
        temporal_artifacts=5.0,
    )
    assert risk.level == "LOW"
    assert risk.score <= 25
    assert risk.is_partial is False
    assert risk.confidence >= 0.90


def test_risk_engine_moderate_risk_unknown_speaker():
    # Unknown human speaker (match=20%, synthetic=10%, anomalies=15%) -> MODERATE (26 - 50)
    risk = evaluate_risk(
        speaker_match_score=20.0,
        synthetic_probability=10.0,
        spectral_anomaly=10.0,
        prosody_anomaly=10.0,
        temporal_artifacts=10.0,
    )
    assert risk.level == "MODERATE"
    assert 26 <= risk.score <= 50
    assert risk.is_partial is False


def test_risk_engine_high_risk_suspicious_audio():
    # Suspicious synthetic indicators with low anomalies -> HIGH (51 - 75)
    risk = evaluate_risk(
        speaker_match_score=50.0,
        synthetic_probability=65.0,
        spectral_anomaly=50.0,
        prosody_anomaly=45.0,
        temporal_artifacts=40.0,
    )
    assert risk.level == "HIGH"
    assert 51 <= risk.score <= 75


def test_risk_engine_critical_risk_ai_voice_clone():
    # AI Voice Clone: Identity matches high (92%) BUT synthetic probability is high (88%) -> CRITICAL (76 - 100)
    risk = evaluate_risk(
        speaker_match_score=92.0,
        synthetic_probability=88.0,
        spectral_anomaly=75.0,
        prosody_anomaly=80.0,
        temporal_artifacts=70.0,
    )
    assert risk.level == "CRITICAL"
    assert risk.score >= 80
    assert risk.score <= 100


def test_risk_engine_challenge_failure_escalation():
    # Moderate threat fails security challenge -> escalates to CRITICAL/HIGH
    risk_base = evaluate_risk(
        speaker_match_score=60.0,
        synthetic_probability=45.0,
    )
    risk_failed = evaluate_risk(
        speaker_match_score=60.0,
        synthetic_probability=45.0,
        challenge_passed=False,
    )
    assert risk_failed.score > risk_base.score
    assert risk_failed.score >= 75


def test_risk_engine_partial_analysis_degradation():
    # Authenticity signal missing -> returns is_partial=True with reduced confidence
    risk = evaluate_risk(
        speaker_match_score=85.0,
        synthetic_probability=0.0,
        is_authenticity_available=False,
    )
    assert risk.is_partial is True
    assert risk.confidence <= 0.60


def test_risk_engine_boundary_values():
    # Extreme 0 boundary
    risk_zero = evaluate_risk(
        speaker_match_score=100.0,
        synthetic_probability=0.0,
        spectral_anomaly=0.0,
        prosody_anomaly=0.0,
        temporal_artifacts=0.0,
    )
    assert risk_zero.score == 0
    assert risk_zero.level == "LOW"

    # Extreme 100 boundary
    risk_max = evaluate_risk(
        speaker_match_score=100.0,
        synthetic_probability=100.0,
        spectral_anomaly=100.0,
        prosody_anomaly=100.0,
        temporal_artifacts=100.0,
    )
    assert risk_max.score == 100
    assert risk_max.level == "CRITICAL"
