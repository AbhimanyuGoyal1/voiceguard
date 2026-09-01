import pytest
from backend.services.explainability import generate_explainability_report
from backend.schemas.analysis import (
    AnalysisResult,
    AudioPreprocessingInfo,
    SpeakerVerificationSignal,
    AuthenticitySignal,
    EvidenceSignal,
    RiskAssessment,
    DegradationStatus,
)


def create_sample_analysis_result(
    speaker_score: float = 95.0,
    synthetic_prob: float = 85.0,
    risk_score: int = 88,
    risk_level: str = "CRITICAL",
) -> AnalysisResult:
    return AnalysisResult(
        session_id="test_session_123",
        timestamp="2026-09-01T23:00:00Z",
        mode="LIVE",
        state="COMPLETE",
        audio_info=AudioPreprocessingInfo(
            duration_seconds=3.0,
            original_sample_rate=16000,
            target_sample_rate=16000,
            channels=1,
            rms_energy=0.04,
            peak_amplitude=0.9,
            is_silent=False,
        ),
        speaker=SpeakerVerificationSignal(
            match_score=speaker_score,
            status="MATCHED" if speaker_score >= 65 else "MISMATCH",
            enrolled_identity="Alice",
            confidence=1.0,
            is_mock=False,
        ),
        authenticity=AuthenticitySignal(
            classification="SYNTHETIC" if synthetic_prob >= 55 else "AUTHENTIC",
            synthetic_probability=synthetic_prob,
            human_probability=100.0 - synthetic_prob,
            confidence=1.0,
            is_mock=False,
        ),
        risk=RiskAssessment(
            score=risk_score,
            level=risk_level,  # type: ignore
            confidence=0.95,
            is_partial=False,
        ),
        evidence=EvidenceSignal(
            spectral_anomaly=60.0,
            prosody_anomaly=70.0,
            pitch_irregularity=65.0,
            temporal_artifacts=50.0,
            speaker_similarity=speaker_score,
            summary="Acoustic analysis complete",
            is_mock=False,
        ),
        timeline=[],
        degradation=DegradationStatus(is_degraded=False),
    )


def test_explainability_clone_attack():
    analysis = create_sample_analysis_result(speaker_score=92.0, synthetic_prob=88.0, risk_score=90, risk_level="CRITICAL")
    report = generate_explainability_report(analysis)

    assert report["verdict_badge"] == "CRITICAL THREAT"
    assert "Targeted Voice Clone Attack" in report["headline"]
    assert "enrolled identity 'Alice'" in report["reasoning"]
    assert len(report["signal_factors"]) == 4


def test_explainability_genuine_speaker():
    analysis = create_sample_analysis_result(speaker_score=95.0, synthetic_prob=5.0, risk_score=5, risk_level="LOW")
    report = generate_explainability_report(analysis)

    assert report["verdict_badge"] == "VERIFIED SAFE"
    assert "Genuine Enrolled Speaker" in report["headline"]
    assert "Caller authenticated" in report["recommendation"]


def test_explainability_unknown_human():
    analysis = create_sample_analysis_result(speaker_score=20.0, synthetic_prob=10.0, risk_score=35, risk_level="MODERATE")
    report = generate_explainability_report(analysis)

    assert report["verdict_badge"] == "MODERATE RISK"
    assert "Organic Voice / Speaker Mismatch" in report["headline"]


def test_explainability_synthetic_impostor():
    analysis = create_sample_analysis_result(speaker_score=25.0, synthetic_prob=80.0, risk_score=65, risk_level="HIGH")
    report = generate_explainability_report(analysis)

    assert report["verdict_badge"] == "HIGH THREAT"
    assert "Unenrolled Synthetic Generation" in report["headline"]
