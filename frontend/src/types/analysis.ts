export type AnalysisState =
  | "IDLE"
  | "RECORDING"
  | "ANALYZING"
  | "PARTIAL_ANALYSIS"
  | "COMPLETE"
  | "ERROR"
  | "RECONNECTING"
  | "DEGRADED";

export type ThreatSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AuthenticityClassification = "AUTHENTIC" | "SYNTHETIC" | "SUSPICIOUS" | "UNKNOWN";
export type SpeakerMatchStatus = "MATCHED" | "MISMATCH" | "UNKNOWN" | "NOT_ENROLLED";

export interface AudioPreprocessingInfo {
  duration_seconds: number;
  original_sample_rate: number;
  target_sample_rate: number;
  channels: number;
  rms_energy: number;
  peak_amplitude: number;
  is_silent: boolean;
}

export interface SpeakerVerificationSignal {
  match_score: number; // 0 - 100
  status: SpeakerMatchStatus;
  enrolled_identity?: string;
  confidence: number;
  is_mock: boolean;
}

export interface AuthenticitySignal {
  classification: AuthenticityClassification;
  synthetic_probability: number; // 0 - 100
  human_probability: number; // 0 - 100
  confidence: number;
  is_mock: boolean;
}

export interface EvidenceSignal {
  spectral_anomaly: number;
  prosody_anomaly: number;
  pitch_irregularity: number;
  temporal_artifacts: number;
  speaker_similarity: number;
  summary: string;
  is_mock: boolean;
}

export interface RiskAssessment {
  score: number; // 0 - 100
  level: ThreatSeverity;
  confidence: number;
  is_partial: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: string;
  label: string;
  details?: string;
  level: "INFO" | "WARN" | "CRITICAL";
}

export interface DegradationStatus {
  is_degraded: boolean;
  reason?: string | null;
  unavailable_signals: string[];
}

export interface SignalFactor {
  id: string;
  name: string;
  model: string;
  value: string;
  status: string;
  weight: string;
  impact: string;
  description: string;
}

export interface ExplainabilityReport {
  title: string;
  verdict_badge: string;
  headline: string;
  risk_score: number;
  risk_level: ThreatSeverity;
  is_partial: boolean;
  reasoning: string;
  recommendation: string;
  signal_factors: SignalFactor[];
}

export interface AnalysisResult {
  session_id: string;
  timestamp: string;
  mode: "LIVE" | "DEMO";
  state: AnalysisState;
  audio_info: AudioPreprocessingInfo;
  speaker: SpeakerVerificationSignal;
  authenticity: AuthenticitySignal;
  risk: RiskAssessment;
  evidence: EvidenceSignal;
  timeline: TimelineEvent[];
  degradation: DegradationStatus;
  explanation?: ExplainabilityReport;
}
