"use client";

import { useState, useCallback, useEffect } from "react";
import { AudioCapture } from "@/components/audio/audio-capture";
import { RiskMeter } from "@/components/dashboard/risk-meter";
import { SpeakerCard } from "@/components/dashboard/speaker-card";
import { AuthenticityCard } from "@/components/dashboard/authenticity-card";
import { WhyPanel } from "@/components/dashboard/why-panel";
import { AttackSimulator } from "@/components/dashboard/attack-simulator";
import { ThreatTimeline } from "@/components/dashboard/threat-timeline";
import { SecurityChallenge } from "@/components/dashboard/security-challenge";
import { IncidentReport } from "@/components/dashboard/incident-report";
import { AttackHistory, IncidentRecord } from "@/components/dashboard/attack-history";
import { VoiceFingerprint } from "@/components/dashboard/voice-fingerprint";
import { GlobalThreatMap } from "@/components/dashboard/global-threat-map";
import { AiSecurityAnalyst } from "@/components/dashboard/ai-security-analyst";
import { CallSimulator } from "@/components/dashboard/call-simulator";
import { TheatricalStage } from "@/components/dashboard/theatrical-stage";
import { AudioVisualizer } from "@/components/visualization/audio-visualizer";
import { useAnalysisSocket } from "@/hooks/use-analysis-socket";
import { ValidatedAudio } from "@/types/audio";
import { AnalysisResult, TimelineEvent } from "@/types/analysis";
import {
  Activity,
  Radio,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileText,
  History,
  Fingerprint,
  Globe2,
  Bot,
  PhoneCall,
  Clock,
  Mic,
  Swords,
  ShieldCheck,
} from "lucide-react";
import { VoiceLibraryScenario, VOICE_LIBRARY } from "@/lib/voice-library";

type IngestionMode = "LIVE" | "SCENARIOS" | "CALL";
type IntelligenceTab = "timeline" | "analyst" | "fingerprint" | "threatmap" | "history" | "report";

export function ThreatDashboard() {
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("CALL");
  const [activeAudio, setActiveAudio] = useState<ValidatedAudio | null>(null);
  const [activeScenario, setActiveScenario] = useState<VoiceLibraryScenario | null>(VOICE_LIBRARY[2]);
  const [callState, setCallState] = useState<"IDLE" | "INCOMING" | "CONNECTED" | "ANALYZING" | "ENDED">("IDLE");
  const [activeTimelineEventId, setActiveTimelineEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("timeline");
  const [selectedHistoryIncidentId, setSelectedHistoryIncidentId] = useState<string | null>(null);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);
  const [modulatedResult, setModulatedResult] = useState<AnalysisResult | null>(null);

  const {
    isConnected,
    isReconnecting,
    analysisState,
    analysisResult,
    errorMessage,
    analyzeViaHttp,
  } = useAnalysisSocket();

  // Sync modulatedResult whenever new analysis arrives from pipeline
  useEffect(() => {
    if (analysisResult) {
      setModulatedResult(analysisResult);
    }
  }, [analysisResult]);

  const activeResult = modulatedResult || analysisResult;

  // Unified audio pipeline ingestion: Live Mic, Call Simulator, or Attack Simulator
  const handleProcessAudioStream = useCallback(async (audio: ValidatedAudio | null, scenario?: VoiceLibraryScenario) => {
    setActiveAudio(audio);
    if (scenario) setActiveScenario(scenario);
    setActiveTimelineEventId(null);
    if (audio && audio.blob) {
      setIsSimulatingAudio(true);
      try {
        await analyzeViaHttp(audio.blob, scenario?.targetIdentity || "Primary User");
      } finally {
        setIsSimulatingAudio(false);
      }
    }
  }, [analyzeViaHttp]);

  const isAnalyzing = analysisState === "ANALYZING" || isSimulatingAudio;

  // Active Defense dynamic risk score modulation (+35 on fail, -25 on pass)
  const handleChallengeResult = useCallback((passed: boolean) => {
    setModulatedResult((prev) => {
      if (!prev) return prev;
      let newScore = prev.risk.score;
      let newLevel = prev.risk.level;

      if (!passed) {
        newScore = Math.min(100, newScore + 35);
        newLevel = "CRITICAL";
      } else {
        newScore = Math.max(0, newScore - 25);
        if (newScore <= 25) newLevel = "LOW";
        else if (newScore <= 50) newLevel = "MODERATE";
        else if (newScore <= 75) newLevel = "HIGH";
        else newLevel = "CRITICAL";
      }

      const challengeEvent: TimelineEvent = {
        id: `evt_chal_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: passed ? "CHALLENGE_PASSED" : "CHALLENGE_FAILED",
        label: passed ? "Security Challenge Passed" : "Security Challenge Failed",
        details: passed
          ? "Caller successfully validated dynamic phonetic verification phrase (-25 risk)."
          : "Phonetic anomaly and neural vocoder delay detected during challenge phrase (+35 risk).",
        level: passed ? "INFO" : "CRITICAL",
      };

      return {
        ...prev,
        risk: {
          ...prev.risk,
          score: newScore,
          level: newLevel,
        },
        timeline: [...prev.timeline, challengeEvent],
      };
    });
  }, []);

  const handleSelectTimelineEvent = useCallback((eventId: string) => {
    setActiveTimelineEventId(eventId);
  }, []);

  const handleSelectHistoryIncident = useCallback((incident: IncidentRecord) => {
    setSelectedHistoryIncidentId(incident.id);
    setActiveTab("report");
  }, []);

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Tactical SOC Header */}
      <header className="border-b border-white/10 bg-[#0A0F1D]/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-lg">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-100">
                VOICEGUARD // SOC COMMAND
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ACTIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              AI Voice Authentication, Anti-Spoof & Forensic Defense • SESSION: #VG-8942
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Ingestion Mode Segmented Switcher */}
          <div className="flex rounded-xl border border-white/10 bg-slate-950/80 p-1">
            <button
              onClick={() => setIngestionMode("CALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                ingestionMode === "CALL"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>TELEPHONY</span>
            </button>
            <button
              onClick={() => setIngestionMode("LIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                ingestionMode === "LIVE"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>LIVE MIC</span>
            </button>
            <button
              onClick={() => setIngestionMode("SCENARIOS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                ingestionMode === "SCENARIOS"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>ATTACK SCENARIOS</span>
            </button>
          </div>

          {/* Real-time Pipeline Health Status */}
          {isReconnecting ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-950/60 border border-yellow-700/60 text-yellow-400 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RECONNECTING</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>REAL ML: ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>STANDALONE ENGINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Tactical Command Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <span className="font-bold">SYSTEM NOTICE: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Two-Column Tactical Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Telemetry & Ingestion Cockpit (Cols 6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Dynamic Ingestion Surface */}
            {ingestionMode === "CALL" && (
              <CallSimulator
                onAudioStreamReady={handleProcessAudioStream}
                isAnalyzing={isAnalyzing}
                onCallStateChange={(st, sc) => {
                  setCallState(st);
                  if (sc) setActiveScenario(sc);
                }}
              />
            )}

            {ingestionMode === "LIVE" && (
              <div className="w-full">
                <AudioCapture onAudioCaptured={handleProcessAudioStream} />
              </div>
            )}

            {ingestionMode === "SCENARIOS" && (
              <AttackSimulator
                onLaunchAttackAudio={handleProcessAudioStream}
                isLaunching={isAnalyzing}
              />
            )}

            {/* Theatrical Investigation Stage */}
            <TheatricalStage
              scenario={activeScenario}
              callState={callState}
              isAnalyzing={isAnalyzing}
              analysisResult={activeResult}
            />

            {/* Active Defense Challenge Box (Interactive) */}
            {activeResult && (
              <SecurityChallenge
                analysis={activeResult}
                onChallengeComplete={handleChallengeResult}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Forensic Verification Matrix (Cols 6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Radial HUD Threat Score Meter */}
            <RiskMeter risk={activeResult?.risk ?? null} isAnalyzing={isAnalyzing} />

            {/* Biometric Verification Dual-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpeakerCard speaker={activeResult?.speaker ?? null} isAnalyzing={isAnalyzing} />
              <AuthenticityCard authenticity={activeResult?.authenticity ?? null} isAnalyzing={isAnalyzing} />
            </div>

            {/* "WHY?" Forensic Explainability Panel */}
            {activeResult ? (
              <WhyPanel analysis={activeResult} />
            ) : (
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0F1D]/80 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-mono text-slate-400 uppercase font-bold">
                  Awaiting Forensic Ingestion
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Provide voice input via Telephony, Microphone, or Attack Scenarios to trigger full acoustic attribution.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM DRAWER: Investigation & Intelligence Tabbed Dock */}
        <div className="w-full bg-[#0A0F1D]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-8">
          {/* Dock Navigation Bar */}
          <div className="flex flex-wrap items-center border-b border-white/10 bg-slate-950/60 px-4 py-2 gap-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "timeline"
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>THREAT TIMELINE</span>
            </button>

            <button
              onClick={() => setActiveTab("analyst")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "analyst"
                  ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI SECURITY ANALYST</span>
            </button>

            <button
              onClick={() => setActiveTab("fingerprint")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "fingerprint"
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>2D FINGERPRINT</span>
            </button>

            <button
              onClick={() => setActiveTab("threatmap")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "threatmap"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>GLOBAL THREAT MAP</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "history"
                  ? "bg-purple-500/20 border border-purple-500/40 text-purple-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ATTACK HISTORY</span>
            </button>

            {activeResult && (
              <button
                onClick={() => setActiveTab("report")}
                className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "report"
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>INCIDENT REPORT</span>
              </button>
            )}
          </div>

          {/* Active Tab Content Area */}
          <div className="p-6">
            {activeTab === "timeline" && (
              <div>
                {activeResult ? (
                  <ThreatTimeline
                    timeline={activeResult.timeline}
                    activeEventId={activeTimelineEventId}
                    onSelectEvent={handleSelectTimelineEvent}
                    analysisMode={activeResult.mode}
                  />
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    No active threat timeline events yet. Initiate a call or microphone capture.
                  </div>
                )}
              </div>
            )}

            {activeTab === "analyst" && (
              <div>
                {activeResult ? (
                  <AiSecurityAnalyst analysis={activeResult} />
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    AI Security Analyst briefing requires an active audio analysis session.
                  </div>
                )}
              </div>
            )}

            {activeTab === "fingerprint" && (
              <div>
                <VoiceFingerprint />
              </div>
            )}

            {activeTab === "threatmap" && (
              <div>
                <GlobalThreatMap />
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <AttackHistory
                  onSelectIncident={handleSelectHistoryIncident}
                  activeIncidentId={selectedHistoryIncidentId}
                />
              </div>
            )}

            {activeTab === "report" && (
              <div>
                {activeResult ? (
                  <IncidentReport
                    analysis={activeResult}
                    onClose={() => setActiveTab("timeline")}
                  />
                ) : (
                  <div className="py-8 text-center text-xs font-mono text-slate-500">
                    Incident report generation requires a completed audio analysis.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
