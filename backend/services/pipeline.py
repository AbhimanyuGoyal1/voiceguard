import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import numpy as np

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
from ml.speaker import speaker_verifier


def build_analysis_pipeline_response(
    metadata: Dict[str, Any],
    audio_tensor: Optional[np.ndarray] = None,
    session_id: str = None,
    enrolled_speaker_id: str = "Primary User",
) -> AnalysisResult:
    """
    Builds the complete AnalysisResult contract using preprocessed audio metadata
    and real ML speaker verification inference.
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

    # Execute real ECAPA-TDNN Speaker Verification if audio_tensor is provided
    if audio_tensor is not None and len(audio_tensor) > 0:
        spk_result = speaker_verifier.verify_speaker(
            comparison_audio_tensor=audio_tensor,
            enrolled_speaker_id=enrolled_speaker_id,
        )
        speaker = SpeakerVerificationSignal(
            match_score=spk_result["match_score"],
            status=spk_result["status"],
            enrolled_identity=spk_result["enrolled_identity"],
            confidence=spk_result["confidence"],
            is_mock=False,
        )
    else:
        speaker = SpeakerVerificationSignal(
            match_score=0.0,
            status="NOT_ENROLLED",
            enrolled_identity=enrolled_speaker_id,
            confidence=1.0,
            is_mock=True,
        )

    # Authenticity signal (to be replaced with real anti-spoof model in PR-05)
    authenticity = AuthenticitySignal(
        classification="AUTHENTIC",
        synthetic_probability=0.0,
        human_probability=100.0,
        confidence=1.0,
        is_mock=True,
    )

    evidence_summary = (
        f"ECAPA-TDNN embedding evaluated against {enrolled_speaker_id}: "
        f"{speaker.status} ({speaker.match_score}% similarity)."
        if not speaker.is_mock
        else "Audio ingested and validated successfully. Model ready for verification."
    )

    evidence = EvidenceSignal(
        spectral_anomaly=0.0,
        prosody_anomaly=0.0,
        pitch_irregularity=0.0,
        temporal_artifacts=0.0,
        speaker_similarity=speaker.match_score,
        summary=evidence_summary,
        is_mock=speaker.is_mock,
    )

    risk = RiskAssessment(
        score=0 if speaker.status == "MATCHED" else 30,
        level="LOW" if speaker.status == "MATCHED" else "MODERATE",
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
            type="SPEAKER_VERIFICATION_COMPLETE",
            label="ECAPA-TDNN Speaker Verification Complete",
            details=f"Match Score: {speaker.match_score}% | Status: {speaker.status}",
            level="INFO" if speaker.status == "MATCHED" else "WARN",
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
