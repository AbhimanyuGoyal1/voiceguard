import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from backend.schemas.analysis import (
    AnalysisResult,
    AudioPreprocessingInfo,
    SpeakerVerificationSignal,
    AuthenticitySignal,
    EvidenceSignal,
    RiskAssessment,
    TimelineEvent,
    DegradationStatus,
)


def build_analysis_pipeline_response(
    metadata: Dict[str, Any],
    session_id: str = None,
) -> AnalysisResult:
    """
    Builds the complete AnalysisResult contract using preprocessed audio metadata.
    Initially establishes the contract; ML fields are marked is_mock=True until PR-04/PR-05.
    """
    sid = session_id or f"session_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    audio_info = AudioPreprocessingInfo(
        duration_seconds=metadata["duration_seconds"],
        original_sample_rate=metadata["original_sample_rate"],
        target_sample_rate=metadata["target_sample_rate"],
        channels=metadata["channels"],
        rms_energy=metadata["rms_energy"],
        peak_amplitude=metadata["peak_amplitude"],
        is_silent=metadata["is_silent"],
    )

    # Contract mock defaults for PR-03 (Replaced in PR-04 and PR-05)
    speaker = SpeakerVerificationSignal(
        match_score=0.0,
        status="NOT_ENROLLED",
        enrolled_identity="Primary User",
        confidence=1.0,
        is_mock=True,
    )

    authenticity = AuthenticitySignal(
        classification="AUTHENTIC",
        synthetic_probability=0.0,
        human_probability=100.0,
        confidence=1.0,
        is_mock=True,
    )

    evidence = EvidenceSignal(
        spectral_anomaly=0.0,
        prosody_anomaly=0.0,
        pitch_irregularity=0.0,
        temporal_artifacts=0.0,
        speaker_similarity=0.0,
        summary="Audio ingested and validated successfully. ML inference pipeline ready for model execution.",
        is_mock=True,
    )

    risk = RiskAssessment(
        score=0,
        level="LOW",
        confidence=1.0,
        is_partial=False,
    )

    timeline = [
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="AUDIO_INGESTED",
            label="Audio stream received and decoded",
            details=f"{metadata['duration_seconds']}s audio, resampled to {metadata['target_sample_rate']}Hz",
            level="INFO",
        ),
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="PREPROCESSING_COMPLETE",
            label="Audio normalization and validation complete",
            details=f"RMS energy {metadata['rms_energy']}, peak {metadata['peak_amplitude']}",
            level="INFO",
        ),
    ]

    return AnalysisResult(
        session_id=sid,
        timestamp=now_iso,
        mode="LIVE",
        state="COMPLETE",
        audio_info=audio_info,
        speaker=speaker,
        authenticity=authenticity,
        risk=risk,
        evidence=evidence,
        timeline=timeline,
        degradation=DegradationStatus(is_degraded=False),
    )
