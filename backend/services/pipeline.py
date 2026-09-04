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
    AudioQualitySignal,
)
from ml.speaker import speaker_verifier
from ml.antispoof import antispoof_detector
from backend.services.risk_engine import evaluate_risk
from backend.services.explainability import generate_explainability_report
from backend.services.audio_quality import assess_audio_quality


def build_analysis_pipeline_response(
    metadata: Dict[str, Any],
    audio_tensor: Optional[np.ndarray] = None,
    session_id: str = None,
    enrolled_speaker_id: str = "Primary User",
    challenge_passed: Optional[bool] = None,
    force_antispoof_failure: bool = False,
    force_speaker_failure: bool = False,
) -> AnalysisResult:
    """
    Builds the complete AnalysisResult contract using preprocessed audio metadata,
    real ECAPA-TDNN speaker verification, real anti-spoof detection, authoritative
    Risk Engine evaluation, and deterministic explainability generation.
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
    is_speaker_ok = True
    if force_speaker_failure:
        is_degraded = True
        is_speaker_ok = False
        unavailable_signals.append("speaker_verification")
        speaker = SpeakerVerificationSignal(
            match_score=0.0,
            status="UNKNOWN",
            enrolled_identity=enrolled_speaker_id,
            confidence=0.0,
            is_mock=True,
        )
    else:
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
            import traceback
            traceback.print_exc()
            is_degraded = True
            is_speaker_ok = False
            unavailable_signals.append("speaker_verification")
            speaker = SpeakerVerificationSignal(
                match_score=0.0,
                status="UNKNOWN",
                enrolled_identity=enrolled_speaker_id,
                confidence=0.0,
                is_mock=True,
            )

    # 2. Execute real Anti-Spoof Detection
    is_antispoof_ok = True
    if force_antispoof_failure:
        is_degraded = True
        is_antispoof_ok = False
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
        except Exception:
            is_degraded = True
            is_antispoof_ok = False
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

    # 3. Authoritative Risk Engine Scoring
    risk = evaluate_risk(
        speaker_match_score=speaker.match_score,
        synthetic_probability=authenticity.synthetic_probability,
        spectral_anomaly=anti_evidence["spectral_anomaly"],
        prosody_anomaly=anti_evidence["prosody_anomaly"],
        temporal_artifacts=anti_evidence["temporal_artifacts"],
        challenge_passed=challenge_passed,
        is_speaker_available=is_speaker_ok,
        is_authenticity_available=is_antispoof_ok,
    )

    is_subsystem_degraded = is_degraded

    # 4. Assess Acoustic Signal Quality & Integrity
    quality_dict = assess_audio_quality(audio_tensor, sample_rate=metadata.get("target_sample_rate", 16000))
    quality = AudioQualitySignal(**quality_dict)

    if quality.is_degraded:
        # Scale down confidence on degraded/noisy audio to prevent false certainty
        authenticity.confidence = round(float(authenticity.confidence * quality.confidence_multiplier), 2)
        risk.confidence = round(float(risk.confidence * quality.confidence_multiplier), 2)
        speaker.confidence = round(float(speaker.confidence * quality.confidence_multiplier), 2)

    state = "PARTIAL_ANALYSIS" if is_subsystem_degraded else "COMPLETE"

    evidence = EvidenceSignal(
        spectral_anomaly=anti_evidence["spectral_anomaly"],
        prosody_anomaly=anti_evidence["prosody_anomaly"],
        pitch_irregularity=anti_evidence["pitch_irregularity"],
        temporal_artifacts=anti_evidence["temporal_artifacts"],
        speaker_similarity=speaker.match_score,
        forensic_score=as_result.get("forensic_score") if "as_result" in locals() and isinstance(as_result, dict) else None,
        forensic_features=as_result.get("forensic_features") if "as_result" in locals() and isinstance(as_result, dict) else None,
        model_score=as_result.get("model_score") if "as_result" in locals() and isinstance(as_result, dict) else None,
        summary=(
            f"Speaker: {speaker.status} ({speaker.match_score}%), Authenticity: {authenticity.classification} "
            f"({authenticity.synthetic_probability}% synthetic)."
            if not is_degraded
            else f"Degraded Analysis: Missing required signals ({', '.join(unavailable_signals)})."
        ),
        is_mock=speaker.is_mock or authenticity.is_mock,
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
        TimelineEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=now_iso,
            type="RISK_EVALUATED",
            label=f"Risk Assessed: {risk.score}/100 [{risk.level}]",
            level="CRITICAL" if risk.level == "CRITICAL" else "WARN" if risk.level == "HIGH" else "INFO",
        ),
    ]

    if quality.is_degraded:
        timeline.append(
            TimelineEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                timestamp=now_iso,
                type="AUDIO_QUALITY_ALERT",
                label=f"Acoustic Quality: {quality.rating} ({quality.quality_score}%)",
                details=quality.recommendation,
                level="WARN",
            )
        )

    # Construct complete AnalysisResult
    result = AnalysisResult(
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
            is_degraded=bool(is_subsystem_degraded or quality.is_degraded),
            reason="Partial analysis due to signal failure" if unavailable_signals else (f"Degraded Audio: {quality.recommendation}" if quality.is_degraded else None),
            unavailable_signals=unavailable_signals,
        ),
        quality=quality,
    )

    # Attach deterministic explainability report
    result.evidence.summary = generate_explainability_report(result)["reasoning"]
    return result
