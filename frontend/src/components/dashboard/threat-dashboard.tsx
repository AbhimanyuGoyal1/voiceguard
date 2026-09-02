"use client";

import { useState } from "react";
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
import { useAnalysisSocket } from "@/hooks/use-analysis-socket";
import { ValidatedAudio } from "@/types/audio";
import { AnalysisResult } from "@/types/analysis";
import { Activity, Radio, Cpu, RefreshCw, AlertCircle, CheckCircle2, Sparkles, FileText, History, Fingerprint } from "lucide-react";

export function ThreatDashboard() {
  const [mode, setMode] = useState<"LIVE" | "DEMO">("LIVE");
  const [activeAudio, setActiveAudio] = useState<ValidatedAudio | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("ai_voice_clone");
  const [demoResult, setDemoResult] = useState<AnalysisResult | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [activeTimelineEventId, setActiveTimelineEventId] = useState<string | null>(null);
  const [showIncidentReport, setShowIncidentReport] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showFingerprint, setShowFingerprint] = useState<boolean>(true);
  const [selectedHistoryIncidentId, setSelectedHistoryIncidentId] = useState<string | null>(null);

  const {
    isConnected,
    isReconnecting,
    analysisState,
    activeStage,
    analysisResult: liveAnalysisResult,
    errorMessage,
    analyzeViaHttp,
  } = useAnalysisSocket();

  const handleAudioCaptured = async (audio: ValidatedAudio | null) => {
    setActiveAudio(audio);
    setActiveTimelineEventId(null);
    if (audio && audio.blob) {
      await analyzeViaHttp(audio.blob, "Primary User");
    }
  };

  const handleRunDemoScenario = async (scenarioId: string) => {
    setIsDemoLoading(true);
    setSelectedScenario(scenarioId);
    setActiveTimelineEventId(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = await fetch(`http://localhost:8000/api/scenarios/${scenarioId}`);
      if (res.ok) {
        const data: AnalysisResult = await res.json();
        setDemoResult(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsDemoLoading(false);
    }
  };

  const activeResult = mode === "DEMO" ? demoResult : liveAnalysisResult;
  const isAnalyzing = mode === "DEMO" ? isDemoLoading : analysisState === "ANALYZING";

  const handleSelectTimelineEvent = (eventId: string) => {
    setActiveTimelineEventId(eventId);
  };

  const handleSelectHistoryIncident = (incident: IncidentRecord) => {
    setSelectedHistoryIncidentId(incident.id);
    setShowIncidentReport(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top SOC Status Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide font-mono">VOICEGUARD // SOC DASHBOARD</h1>
            <p className="text-[11px] font-mono text-slate-400">Voice Impersonation & Deepfake Defense</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Fingerprint Toggle Button */}
          <button
            onClick={() => setShowFingerprint(!showFingerprint)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showFingerprint
                ? "bg-cyan-600 text-slate-950 border-cyan-400 font-bold"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>2D FINGERPRINT</span>
          </button>

          {/* History Toggle Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showHistory
                ? "bg-purple-600 text-white border-purple-400 shadow-sm"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>HISTORY</span>
          </button>

          {/* Incident Report Quick Toggle */}
          {activeResult && (
            <button
              onClick={() => setShowIncidentReport(!showIncidentReport)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showIncidentReport
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>INCIDENT REPORT</span>
            </button>
          )}

          {/* Live ↔ Demo Mode Selector */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
            <button
              onClick={() => setMode("LIVE")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                mode === "LIVE"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              LIVE MIC
            </button>
            <button
              onClick={() => {
                setMode("DEMO");
                if (!demoResult) handleRunDemoScenario(selectedScenario);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                mode === "DEMO"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              DEMO / ATTACK SIMULATOR
            </button>
          </div>

          {/* WebSocket Status Indicator */}
          {mode === "LIVE" && (
            <>
              {isReconnecting ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-950/60 border border-yellow-700/60 text-yellow-400 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>RECONNECTING</span>
                </div>
              ) : isConnected ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>STREAM: ACTIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>OFFLINE FALLBACK</span>
                </div>
              )}
            </>
          )}

          {mode === "DEMO" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/60 text-indigo-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DETERMINISTIC FIXTURES</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Analysis Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Error Alert if any */}
        {errorMessage && mode === "LIVE" && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <span className="font-semibold font-mono">Analysis Alert: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* PR-14: Attack History Registry Panel */}
        {showHistory && (
          <AttackHistory
            onSelectIncident={handleSelectHistoryIncident}
            activeIncidentId={selectedHistoryIncidentId}
          />
        )}

        {/* PR-13: Forensic Incident Report Modal / Panel */}
        {showIncidentReport && activeResult && (
          <IncidentReport
            analysis={activeResult}
            onClose={() => setShowIncidentReport(false)}
          />
        )}

        {/* Attack Simulator Launcher (In Demo Mode) */}
        {mode === "DEMO" && (
          <AttackSimulator
            onLaunchAttack={handleRunDemoScenario}
            isLaunching={isDemoLoading}
            activeScenarioId={selectedScenario}
          />
        )}

        {/* Primary Audio Capture & Integrated Visualizer Card (In Live Mode) */}
        {mode === "LIVE" && (
          <div className="w-full">
            <AudioCapture onAudioCaptured={handleAudioCaptured} />
          </div>
        )}

        {/* Real ML Analysis Panels (Symmetrical across Live & Demo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RiskMeter risk={activeResult?.risk ?? null} isAnalyzing={isAnalyzing} />
          <SpeakerCard speaker={activeResult?.speaker ?? null} isAnalyzing={isAnalyzing} />
          <AuthenticityCard authenticity={activeResult?.authenticity ?? null} isAnalyzing={isAnalyzing} />
        </div>

        {/* PR-15: 2D Voice Fingerprint PCA Scatter Map (D3.js) */}
        {showFingerprint && (
          <VoiceFingerprint scenarioId={mode === "DEMO" ? selectedScenario : undefined} />
        )}

        {/* PR-12: Active Defense Security Challenge Box */}
        {activeResult && (
          <SecurityChallenge analysis={activeResult} />
        )}

        {/* PR-11: Interactive Threat Timeline */}
        {activeResult && (
          <ThreatTimeline
            timeline={activeResult.timeline}
            activeEventId={activeTimelineEventId}
            onSelectEvent={handleSelectTimelineEvent}
            analysisMode={activeResult.mode}
          />
        )}

        {/* WHY? Explainability Panel */}
        {activeResult && (
          <div className="w-full">
            <WhyPanel analysis={activeResult} />
          </div>
        )}
      </main>
    </div>
  );
}
