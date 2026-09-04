from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# Enums & Literals
AnalysisState = Literal[
    "IDLE",
    "RECORDING",
    "ANALYZING",
    "PARTIAL_ANALYSIS",
    "COMPLETE",
    "ERROR",
    "DEGRADED",
]

ThreatSeverity = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
AuthenticityClassification = Literal["AUTHENTIC", "SYNTHETIC", "SUSPICIOUS", "UNKNOWN"]
SpeakerMatchStatus = Literal["MATCHED", "MISMATCH", "UNCERTAIN", "UNKNOWN", "NOT_ENROLLED"]


class AudioPreprocessingInfo(BaseModel):
    duration_seconds: float = Field(..., description="Duration of processed audio in seconds")
    original_sample_rate: int = Field(..., description="Sample rate before ingestion")
    target_sample_rate: int = Field(16000, description="Normalized model-target sample rate in Hz")
    channels: int = Field(1, description="Number of channels (1=mono)")
    rms_energy: float = Field(..., description="Root Mean Square audio energy")
    peak_amplitude: float = Field(..., description="Peak normalized amplitude (0.0 - 1.0)")
    is_silent: bool = Field(False, description="Whether audio was flagged as silence")


class SpeakerVerificationSignal(BaseModel):
    match_score: float = Field(..., description="Calibrated similarity percentage 0.0 - 100.0")
    status: SpeakerMatchStatus = Field("UNKNOWN", description="Speaker match classification")
    enrolled_identity: Optional[str] = Field("Primary User", description="Name/ID of target speaker")
    confidence: float = Field(1.0, description="Model signal confidence 0.0 - 1.0")
    is_mock: bool = Field(True, description="True while ML model integration is in progress")


class AuthenticitySignal(BaseModel):
    classification: AuthenticityClassification = Field("AUTHENTIC", description="Classification verdict")
    synthetic_probability: float = Field(0.0, description="Probability that voice is AI/synthesized (0.0 - 100.0)")
    human_probability: float = Field(100.0, description="Probability that voice is organic human (0.0 - 100.0)")
    confidence: float = Field(1.0, description="Model signal confidence 0.0 - 1.0")
    is_mock: bool = Field(True, description="True while ML model integration is in progress")


class EvidenceSignal(BaseModel):
    spectral_anomaly: float = Field(0.0, description="High-frequency / spectral inconsistency metric (0-100)")
    prosody_anomaly: float = Field(0.0, description="Unnatural pitch/prosody consistency metric (0-100)")
    pitch_irregularity: float = Field(0.0, description="Pitch contour irregularities (0-100)")
    temporal_artifacts: float = Field(0.0, description="Boundary/splicing temporal artifacts (0-100)")
    speaker_similarity: float = Field(..., description="Speaker match score")
    summary: str = Field(..., description="Forensic human-readable evidence summary")
    forensic_score: Optional[float] = Field(None, description="Acoustic forensic anomaly composite score (0-100)")
    forensic_features: Optional[dict] = Field(None, description="Detailed multi-parameter forensic measurements")
    model_score: Optional[float] = Field(None, description="Raw model synthetic score (0-100)")
    is_mock: bool = Field(True, description="True while ML model integration is in progress")


class RiskAssessment(BaseModel):
    score: int = Field(..., description="Authoritative security risk score 0 - 100")
    level: ThreatSeverity = Field("LOW", description="Risk level category")
    confidence: float = Field(1.0, description="Overall risk assessment confidence 0.0 - 1.0")
    is_partial: bool = Field(False, description="True if any critical signals were missing/timed out")


class TimelineEvent(BaseModel):
    id: str
    timestamp: str
    type: str
    label: str
    details: Optional[str] = None
    level: Literal["INFO", "WARN", "CRITICAL"] = "INFO"


QualityRating = Literal["EXCELLENT", "GOOD", "FAIR", "DEGRADED"]


class AudioQualitySignal(BaseModel):
    quality_score: float = Field(85.0, description="Overall voice quality index 0.0 - 100.0")
    rating: QualityRating = Field("GOOD", description="Quality band rating")
    snr_db: float = Field(20.0, description="Estimated Signal-to-Noise Ratio in dB")
    clipping_pct: float = Field(0.0, description="Percentage of audio samples with digital clipping")
    is_noisy: bool = Field(False, description="True if background noise exceeds acceptable thresholds")
    is_clipped: bool = Field(False, description="True if severe clipping distortion detected")
    is_degraded: bool = Field(False, description="True if audio quality is degraded")
    confidence_multiplier: float = Field(1.0, description="Confidence scaling factor for degraded audio")
    recommendation: Optional[str] = Field("Optimal acoustic signal quality.", description="Actionable advisory")


class DegradationStatus(BaseModel):
    is_degraded: bool = False
    reason: Optional[str] = None
    unavailable_signals: List[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    session_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    mode: Literal["LIVE", "DEMO"] = "LIVE"
    state: AnalysisState = "COMPLETE"
    audio_info: AudioPreprocessingInfo
    speaker: SpeakerVerificationSignal
    authenticity: AuthenticitySignal
    risk: RiskAssessment
    evidence: EvidenceSignal
    timeline: List[TimelineEvent] = Field(default_factory=list)
    degradation: DegradationStatus = Field(default_factory=DegradationStatus)
    quality: AudioQualitySignal = Field(default_factory=AudioQualitySignal)
    capture_id: Optional[str] = None
    capture_file: Optional[str] = None


class ErrorResponse(BaseModel):
    error_code: Literal[
        "INVALID_AUDIO",
        "UNSUPPORTED_FORMAT",
        "AUDIO_TOO_SHORT",
        "EMPTY_AUDIO",
        "SILENT_AUDIO",
        "PROCESSING_ERROR",
    ]
    message: str
    detail: Optional[str] = None
    action_hint: Optional[str] = None
