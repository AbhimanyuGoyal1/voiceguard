"use client";

import { useState, useCallback, useEffect } from "react";
import { AudioCapture } from "@/components/audio/audio-capture";
import { CallSimulator } from "@/components/dashboard/call-simulator";
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
import { AiSecurityAnalyst } from "@/components/dashboard/ai-security-analyst";
import { CapturesManager } from "@/components/dashboard/captures-manager";
import { AudioQualityBadge } from "@/components/dashboard/audio-quality-badge";
import { useAnalysisSocket } from "@/hooks/use-analysis-socket";
import { ValidatedAudio } from "@/types/audio";
import { AnalysisResult, TimelineEvent } from "@/types/analysis";
import {
  ShieldAlert,
  Radio,
  Cpu,
  RefreshCw,
  AlertCircle,
  FileText,
  History,
  Fingerprint,
  Bot,
  Clock,
  Mic,
  Zap,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { VoiceLibraryScenario, VOICE_LIBRARY } from "@/lib/voice-library";

type IngestionMode = "CALL" | "CAPTURE" | "PRESETS";
type IntelligenceTab = "timeline" | "analyst" | "fingerprint" | "history" | "report" | "captures";

export function ThreatDashboard() {
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("CALL");
  const [activeAudio, setActiveAudio] = useState<ValidatedAudio | null>(null);
  const [activeScenario, setActiveScenario] = useState<VoiceLibraryScenario | null>(VOICE_LIBRARY[2]);
  const [activeTimelineEventId, setActiveTimelineEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("timeline");
  const [selectedHistoryIncidentId, setSelectedHistoryIncidentId] = useState<string | null>(null);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);
  const [modulatedResult, setModulatedResult] = useState<AnalysisResult | null>(null);
  const [labeledStatus, setLabeledStatus] = useState<Record<string, "genuine" | "synthetic">>({});

  const {
    isConnected,
    isReconnecting,
    analysisState,
    analysisResult,
    errorMessage,
    analyzeViaHttp,
  } = useAnalysisSocket();

  const handleLabelCapture = useCallback(async (captureId: string, label: "human" | "ai") => {
    try {
      const res = await fetch(`http://localhost:8000/api/captures/${captureId}/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, auto_recalibrate: true }),
      });
      if (res.ok) {
        setLabeledStatus((prev) => ({
          ...prev,
          [captureId]: label === "human" ? "genuine" : "synthetic",
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync modulatedResult whenever new analysis arrives from pipeline
  useEffect(() => {
    if (analysisResult) {
      setModulatedResult(analysisResult);
    }
  }, [analysisResult]);

  const activeResult = modulatedResult || analysisResult;

  // Unified audio pipeline ingestion
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Sleek Top Navigation Header */}
      <header className="border-b border-white/10 bg-[#0A0F1D]/80 backdrop-blur-xl px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider font-mono uppercase text-slate-100 flex items-center gap-2">
                VOICEGUARD
                <span className="text-cyan-400 font-normal">// AUDIO FORENSIC SHIELD</span>
              </h1>
              <span className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ACTIVE
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Enterprise Anti-Spoof, Deepfake Defense & Acoustic Forensic Attribution
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Mode Switcher */}
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
              <span>LIVE CALL INTERCEPT</span>
            </button>
            <button
              onClick={() => setIngestionMode("CAPTURE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                ingestionMode === "CAPTURE"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>UPLOAD & LIVE MIC</span>
            </button>
            <button
              onClick={() => setIngestionMode("PRESETS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                ingestionMode === "PRESETS"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>ATTACK SCENARIOS</span>
            </button>
          </div>

          {/* Engine Status */}
          {isReconnecting ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-950/60 border border-yellow-700/60 text-yellow-400 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>RECONNECTING</span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>REAL ML: ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-slate-400 text-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>STANDALONE ENGINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
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

        {/* Two-Column Hero Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Audio Ingestion Cockpit (Cols 6) */}
          <div className="lg:col-span-6 space-y-6">
            {ingestionMode === "CALL" && (
              <div className="w-full">
                <CallSimulator
                  onAudioStreamReady={handleProcessAudioStream}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            )}

            {ingestionMode === "CAPTURE" && (
              <div className="w-full">
                <AudioCapture onAudioCaptured={handleProcessAudioStream} />
              </div>
            )}

            {ingestionMode === "PRESETS" && (
              <div className="w-full">
                <AttackSimulator
                  onLaunchAttackAudio={handleProcessAudioStream}
                  isLaunching={isAnalyzing}
                />
              </div>
            )}

            {/* Interactive Active Defense Challenge */}
            {activeResult && (
              <SecurityChallenge
                analysis={activeResult}
                onChallengeComplete={handleChallengeResult}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Executive Biometric & Forensic Threat HUD (Cols 6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Microphone Capture Archiving & Ground Truth Banner */}
            {activeResult?.capture_file && (
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                      {activeResult.capture_id?.replace("_", " #") || "CAPTURE RECORDED"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({activeResult.capture_file})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Saved to <code className="text-cyan-300">audiosamples/captures/</code>. Verdict:{" "}
                    <strong className={activeResult.risk.score > 50 ? "text-rose-400" : "text-emerald-400"}>
                      {activeResult.authenticity.classification} ({activeResult.risk.score}/100 Risk)
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Set Ground Truth:</span>
                  <button
                    onClick={() => handleLabelCapture(activeResult.capture_id!, "human")}
                    disabled={labeledStatus[activeResult.capture_id!] !== undefined}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
                      labeledStatus[activeResult.capture_id!] === "genuine"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                        : "bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                    }`}
                  >
                    {labeledStatus[activeResult.capture_id!] === "genuine" ? "✓ Labeled Human" : "👤 Human"}
                  </button>
                  <button
                    onClick={() => handleLabelCapture(activeResult.capture_id!, "ai")}
                    disabled={labeledStatus[activeResult.capture_id!] !== undefined}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
                      labeledStatus[activeResult.capture_id!] === "synthetic"
                        ? "bg-rose-500 text-white border-rose-400 font-bold"
                        : "bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-rose-500/20 hover:border-rose-500/50"
                    }`}
                  >
                    {labeledStatus[activeResult.capture_id!] === "synthetic" ? "✓ Labeled AI" : "🤖 AI / Synth"}
                  </button>
                </div>
              </div>
            )}

            {/* Risk Meter HUD */}
            <RiskMeter risk={activeResult?.risk ?? null} isAnalyzing={isAnalyzing} />

            {/* Audio Signal Quality & Integrity Meter */}
            <AudioQualityBadge quality={activeResult?.quality ?? null} isAnalyzing={isAnalyzing} />

            {/* Dual Biometric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuthenticityCard authenticity={activeResult?.authenticity ?? null} isAnalyzing={isAnalyzing} />
              <SpeakerCard speaker={activeResult?.speaker ?? null} isAnalyzing={isAnalyzing} />
            </div>

            {/* Forensic Explainability Panel */}
            {activeResult ? (
              <WhyPanel analysis={activeResult} />
            ) : (
              <div className="p-8 rounded-2xl border border-white/10 bg-[#0A0F1D]/60 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs font-mono text-slate-300 uppercase font-bold tracking-wider">
                  Awaiting Voice Ingestion
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Accept an incoming phone call, upload an audio file, or record your live microphone to generate real-time acoustic forensic attribution.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM INTELLIGENCE DOCK */}
        <div className="w-full bg-[#0A0F1D]/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-8">
          {/* Navigation Bar */}
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
              <span>2D VOICEPRINT</span>
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
              <span>AUDIT HISTORY</span>
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

            <button
              onClick={() => setActiveTab("captures")}
              className={`px-3 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "captures"
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>MIC CALIBRATION SAMPLES</span>
            </button>
          </div>

          {/* Tab Content Area */}
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
                    No active threat timeline events yet. Answer an incoming call or capture microphone audio.
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

            {activeTab === "captures" && (
              <CapturesManager />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
