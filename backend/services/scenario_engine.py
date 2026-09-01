from typing import Dict, Any, List
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


def get_scenario_fixture(scenario_id: str) -> AnalysisResult:
    """
    Returns deterministic, canonical AnalysisResult fixtures for Demo Mode.
    Scenarios:
      1. 'genuine_voice': Authorized enrolled speaker, authentic organic acoustics.
      2. 'ai_voice_clone': High identity match, but high synthetic deepfake probability (Targeted Attack).
      3. 'replay_attack': High speaker match, but acoustic environmental reverberation / spectral cutoff.
      4. 'unknown_speaker': Organic human voice, but mismatched speaker identity.
    """
    sid = f"demo_session_{scenario_id}"
    timestamp = "2026-09-01T23:30:00Z"

    if scenario_id == "genuine_voice":
        audio_info = AudioPreprocessingInfo(
            duration_seconds=3.4,
            original_sample_rate=44100,
            target_sample_rate=16000,
            channels=1,
            rms_energy=0.048,
            peak_amplitude=0.88,
            is_silent=False,
        )
        speaker = SpeakerVerificationSignal(
            match_score=94.2,
            status="MATCHED",
            enrolled_identity="Primary User",
            confidence=0.98,
            is_mock=False,
        )
        authenticity = AuthenticitySignal(
            classification="AUTHENTIC",
            synthetic_probability=6.5,
            human_probability=93.5,
            confidence=0.97,
            is_mock=False,
        )
        risk = RiskAssessment(
            score=8,
            level="LOW",
            confidence=0.98,
            is_partial=False,
        )
        evidence = EvidenceSignal(
            spectral_anomaly=5.2,
            prosody_anomaly=7.8,
            pitch_irregularity=4.1,
            temporal_artifacts=3.0,
            speaker_similarity=94.2,
            summary="Verified authentic voice for enrolled speaker 'Primary User' (94.2% match, 93.5% human).",
            is_mock=False,
        )
        timeline = [
            TimelineEvent(
                id="evt_gen_01",
                timestamp=timestamp,
                type="AUDIO_INGESTED",
                label="Voice stream captured & preprocessed",
                details="3.4s audio, 16kHz mono normalization",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_gen_02",
                timestamp=timestamp,
                type="SPEAKER_VERIFICATION",
                label="ECAPA-TDNN Match: 94.2% (MATCHED)",
                details="Identity matches enrolled reference profile",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_gen_03",
                timestamp=timestamp,
                type="AUTHENTICITY_DETECTION",
                label="AASIST Verdict: AUTHENTIC (6.5% Synthetic)",
                details="Organic harmonic decay confirmed across high-frequency bands",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_gen_04",
                timestamp=timestamp,
                type="RISK_EVALUATED",
                label="Risk Assessed: 8/100 [LOW]",
                details="Caller authenticated safely",
                level="INFO",
            ),
        ]

    elif scenario_id == "ai_voice_clone":
        audio_info = AudioPreprocessingInfo(
            duration_seconds=4.1,
            original_sample_rate=48000,
            target_sample_rate=16000,
            channels=1,
            rms_energy=0.062,
            peak_amplitude=0.95,
            is_silent=False,
        )
        speaker = SpeakerVerificationSignal(
            match_score=96.4,
            status="MATCHED",
            enrolled_identity="Primary User",
            confidence=0.96,
            is_mock=False,
        )
        authenticity = AuthenticitySignal(
            classification="SYNTHETIC",
            synthetic_probability=91.8,
            human_probability=8.2,
            confidence=0.95,
            is_mock=False,
        )
        risk = RiskAssessment(
            score=92,
            level="CRITICAL",
            confidence=0.96,
            is_partial=False,
        )
        evidence = EvidenceSignal(
            spectral_anomaly=88.4,
            prosody_anomaly=84.2,
            pitch_irregularity=79.0,
            temporal_artifacts=74.5,
            speaker_similarity=96.4,
            summary=(
                "TARGETED AI CLONE DETECTED: Speaker match is HIGH (96.4%), "
                "but voice displays STRONG SYNTHETIC CHARACTERISTICS (91.8% synthetic). "
                "Immediate security verification required."
            ),
            is_mock=False,
        )
        timeline = [
            TimelineEvent(
                id="evt_cln_01",
                timestamp=timestamp,
                type="AUDIO_INGESTED",
                label="Incoming caller voice captured",
                details="4.1s audio resampled to 16kHz",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_cln_02",
                timestamp=timestamp,
                type="SPEAKER_VERIFICATION",
                label="ECAPA-TDNN Match: 96.4% (MATCHED)",
                details="High similarity to enrolled identity 'Primary User'",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_cln_03",
                timestamp=timestamp,
                type="AUTHENTICITY_DETECTION",
                label="AASIST Verdict: SYNTHETIC (91.8% Synth)",
                details="Neural vocoder truncation detected (>7.5kHz cutoff)",
                level="CRITICAL",
            ),
            TimelineEvent(
                id="evt_cln_04",
                timestamp=timestamp,
                type="RISK_EVALUATED",
                label="Risk Assessed: 92/100 [CRITICAL]",
                details="Targeted AI voice impersonation confirmed",
                level="CRITICAL",
            ),
        ]

    elif scenario_id == "replay_attack":
        audio_info = AudioPreprocessingInfo(
            duration_seconds=2.8,
            original_sample_rate=44100,
            target_sample_rate=16000,
            channels=1,
            rms_energy=0.035,
            peak_amplitude=0.78,
            is_silent=False,
        )
        speaker = SpeakerVerificationSignal(
            match_score=89.0,
            status="MATCHED",
            enrolled_identity="Primary User",
            confidence=0.92,
            is_mock=False,
        )
        authenticity = AuthenticitySignal(
            classification="SUSPICIOUS",
            synthetic_probability=68.0,
            human_probability=32.0,
            confidence=0.90,
            is_mock=False,
        )
        risk = RiskAssessment(
            score=64,
            level="HIGH",
            confidence=0.91,
            is_partial=False,
        )
        evidence = EvidenceSignal(
            spectral_anomaly=62.0,
            prosody_anomaly=54.0,
            pitch_irregularity=48.0,
            temporal_artifacts=66.5,
            speaker_similarity=89.0,
            summary="Acoustic replay artifacts detected: Channel convolution and speaker playback reverberation.",
            is_mock=False,
        )
        timeline = [
            TimelineEvent(
                id="evt_rep_01",
                timestamp=timestamp,
                type="AUDIO_INGESTED",
                label="Voice stream captured",
                details="2.8s audio preprocessed",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_rep_02",
                timestamp=timestamp,
                type="SPEAKER_VERIFICATION",
                label="ECAPA-TDNN Match: 89.0% (MATCHED)",
                details="Enrolled speaker recognized",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_rep_03",
                timestamp=timestamp,
                type="AUTHENTICITY_DETECTION",
                label="AASIST Verdict: SUSPICIOUS (68.0% Synth/Replay)",
                details="Secondary transmission channel resonance detected",
                level="WARN",
            ),
            TimelineEvent(
                id="evt_rep_04",
                timestamp=timestamp,
                type="RISK_EVALUATED",
                label="Risk Assessed: 64/100 [HIGH]",
                details="Potential speaker replay transmission",
                level="WARN",
            ),
        ]

    else:  # unknown_speaker default
        audio_info = AudioPreprocessingInfo(
            duration_seconds=3.1,
            original_sample_rate=44100,
            target_sample_rate=16000,
            channels=1,
            rms_energy=0.042,
            peak_amplitude=0.82,
            is_silent=False,
        )
        speaker = SpeakerVerificationSignal(
            match_score=21.5,
            status="MISMATCH",
            enrolled_identity="Primary User",
            confidence=0.95,
            is_mock=False,
        )
        authenticity = AuthenticitySignal(
            classification="AUTHENTIC",
            synthetic_probability=12.0,
            human_probability=88.0,
            confidence=0.94,
            is_mock=False,
        )
        risk = RiskAssessment(
            score=38,
            level="MODERATE",
            confidence=0.95,
            is_partial=False,
        )
        evidence = EvidenceSignal(
            spectral_anomaly=14.0,
            prosody_anomaly=18.0,
            pitch_irregularity=12.0,
            temporal_artifacts=15.0,
            speaker_similarity=21.5,
            summary="Speaker mismatch against enrolled identity 'Primary User' (21.5% match). Voice appears organic (88.0% human).",
            is_mock=False,
        )
        timeline = [
            TimelineEvent(
                id="evt_unk_01",
                timestamp=timestamp,
                type="AUDIO_INGESTED",
                label="Unknown voice stream received",
                details="3.1s audio preprocessed",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_unk_02",
                timestamp=timestamp,
                type="SPEAKER_VERIFICATION",
                label="ECAPA-TDNN Match: 21.5% (MISMATCH)",
                details="Voice profile does not match Primary User",
                level="WARN",
            ),
            TimelineEvent(
                id="evt_unk_03",
                timestamp=timestamp,
                type="AUTHENTICITY_DETECTION",
                label="AASIST Verdict: AUTHENTIC (12.0% Synth)",
                details="Natural biological voice dynamics confirmed",
                level="INFO",
            ),
            TimelineEvent(
                id="evt_unk_04",
                timestamp=timestamp,
                type="RISK_EVALUATED",
                label="Risk Assessed: 38/100 [MODERATE]",
                details="Unauthorized organic speaker",
                level="WARN",
            ),
        ]

    return AnalysisResult(
        session_id=sid,
        timestamp=timestamp,
        mode="DEMO",
        state="COMPLETE",
        audio_info=audio_info,
        speaker=speaker,
        authenticity=authenticity,
        risk=risk,
        evidence=evidence,
        timeline=timeline,
        degradation=DegradationStatus(is_degraded=False),
    )


def list_available_scenarios() -> List[Dict[str, str]]:
    return [
        {
            "id": "genuine_voice",
            "name": "Genuine Voice",
            "threat_level": "LOW",
            "description": "Authorized user speaking authentic, organic audio.",
        },
        {
            "id": "ai_voice_clone",
            "name": "AI Voice Clone",
            "threat_level": "CRITICAL",
            "description": "Targeted neural voice cloning attack matching user identity.",
        },
        {
            "id": "replay_attack",
            "name": "Replay Attack",
            "threat_level": "HIGH",
            "description": "Pre-recorded speaker playback with channel convolution.",
        },
        {
            "id": "unknown_speaker",
            "name": "Unknown Speaker",
            "threat_level": "MODERATE",
            "description": "Unauthorized stranger speaking organic human audio.",
        },
    ]
