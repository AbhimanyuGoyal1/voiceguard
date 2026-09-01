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
from ml.antispoof import antispoof_detector


def build_analysis_pipeline_response(
    metadata: Dict[str, Any],
    audio_tensor: Optional[np.ndarray] = None,
    session_id: str = None,
    enrolled_speaker_id: str = "Primary User",
    force_antispoof_failure: bool = False,
) -> AnalysisResult:
    """
    Builds the complete AnalysisResult contract using preprocessed audio metadata,
    real ECAPA-TDNN speaker verification, and real anti-spoof detection with PARTIAL_ANALYSIS
    graceful degradation handling.
    """
    sid = session_id or f"session_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    is_degraded = False
    unavailable_signals = []

    audio_info = AudioPreprocessingInfo(
        duration_seconds=metadata["duration_seconds"],
        original_sample_rate=metadata["original_sample_rate"],
        target_sample_rate=metadata["target_sample_rate"],
        channels=metadata["channels"],
        rms_energy=metadata["rms_energy"],
        peak_amplitude=metadata["peak_amplitude"],
        is_silent=metadata["is_silent"],
    )

    # 1. Execute real ECAPA-TDNN Speaker Verification
    try:
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
    except Exception as e:
        is_degraded = True
        unavailable_signals.append("speaker_verification")
        speaker = SpeakerVerificationSignal(
            match_score=0.0,
            status="UNKNOWN",
            enrolled_identity=enrolled_speaker_id,
            confidence=0.0,
            is_mock=True,
        )

    # 2. Execute real Anti-Spoof Detection with graceful failure -> PARTIAL_ANALYSIS
    if force_antispoof_failure:
        is_degraded = True
        unavailable_signals.append("authenticity_detection")
        authenticity = AuthenticitySignal(
            classification="UNKNOWN",
            synthetic_probability=0.0,
            human_probability=0.0,
            confidence=0.0,
            is_mock=True,
        )
        anti_evidence = {
            "spectral_anomaly": 0.0,
            "prosody_anomaly": 0.0,
            "pitch_irregularity": 0.0,
            "temporal_artifacts": 0.0,
        }
    else:
        try:
            if audio_tensor is not None and len(audio_tensor) > 0:
                as_result = antispoof_detector.analyze_authenticity(
                    audio_tensor=audio_tensor,
                    sample_rate=metadata.get("target_sample_rate", 16000),
                )
                authenticity = AuthenticitySignal(
                    classification=as_result["classification"],
                    synthetic_probability=as_result["synthetic_probability"],
                    human_probability=as_result["human_probability"],
                    confidence=as_result["confidence"],
                    is_mock=False,
                )
                anti_evidence = as_result["evidence"]
            else:
                authenticity = AuthenticitySignal(
                    classification="AUTHENTIC",
                    synthetic_probability=0.0,
                    human_probability=100.0,
                    confidence=1.0,
                    is_mock=True,
                )
                anti_evidence = {
                    "spectral_anomaly": 0.0,
                    "prosody_anomaly": 0.0,
                    "pitch_irregularity": 0.0,
                    "temporal_artifacts": 0.0,
                }
        except Exception as e:
            is_degraded = True
            unavailable_signals.append("authenticity_detection")
            authenticity = AuthenticitySignal(
                classification="UNKNOWN",
                synthetic_probability=0.0,
                human_probability=0.0,
                confidence=0.0,
                is_mock=True,
            )
            anti_evidence = {
                "spectral_anomaly": 0.0,
                "prosody_anomaly": 0.0,
                "pitch_irregularity": 0.0,
                "temporal_artifacts": 0.0,
            }

    # Summary and state
    state = "PARTIAL_ANALYSIS" if is_degraded else "COMPLETE"

    evidence_summary = (
        f"Speaker: {speaker.status} ({speaker.match_score}%), Authenticity: {authenticity.classification} "
        f"({authenticity.synthetic_probability}% synthetic)."
        if not is_degraded
        else f"Degraded Analysis: {', '.join(unavailable_signals)} signal(s) offline."
    )

    evidence = EvidenceSignal(
        spectral_anomaly=anti_evidence["spectral_anomaly"],
        prosody_anomaly=anti_evidence["prosody_anomaly"],
        pitch_irregularity=anti_evidence["pitch_irregularity"],
        temporal_artifacts=anti_evidence["temporal_artifacts"],
        speaker_similarity=speaker.match_score,
        summary=evidence_summary,
        is_mock=speaker.is_mock or authenticity.is_mock,
    )

    risk_score = 0
    if not is_degraded:
        if authenticity.classification == "SYNTHETIC":
            risk_score = 90
        elif authenticity.classification == "SUSPICIOUS":
            risk_score = 60
        elif speaker.status != "MATCHED":
            risk_score = 35
    else:
        risk_score = 45  # Elevated baseline under partial confidence

    risk = RiskAssessment(
        score=risk_score,
        level="CRITICAL" if risk_score >= 76 else "HIGH" if risk_score >= 51 else "MODERATE" if risk_score >= 26 else "LOW",
        confidence=0.5 if is_degraded else 0.95,
        is_partial=is_degraded,
    )

    timeline = [
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="AUDIO_INGESTED",
            label="Audio stream received and preprocessed",
            details=f"{metadata['duration_seconds']}s audio at {metadata['target_sample_rate']}Hz",
            level="INFO",
        ),
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="SPEAKER_VERIFICATION",
            label=f"ECAPA-TDNN Match: {speaker.match_score}% ({speaker.status})",
            level="INFO" if speaker.status == "MATCHED" else "WARN",
        ),
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="AUTHENTICITY_DETECTION",
            label=f"Anti-Spoof Verdict: {authenticity.classification} ({authenticity.synthetic_probability}% Synth)",
            level="CRITICAL" if authenticity.classification == "SYNTHETIC" else "INFO",
        ),
    ]

    return AnalysisResult(
        session_id=sid,
        timestamp=now_iso,
        mode="LIVE",
        state=state,
        audio_info=audio_info,
        speaker=speaker,
        authenticity=authenticity,
        risk=risk,
        evidence=evidence,
        timeline=timeline,
        degradation=DegradationStatus(
            is_degraded=is_degraded,
            reason="Partial analysis due to signal failure" if is_degraded else None,
            unavailable_signals=unavailable_signals,
        ),
    )
