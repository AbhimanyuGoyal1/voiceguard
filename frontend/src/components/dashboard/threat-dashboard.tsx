"use client";

import { useState } from "react";
import { AudioCapture } from "@/components/audio/audio-capture";
import { RiskMeter } from "@/components/dashboard/risk-meter";
import { SpeakerCard } from "@/components/dashboard/speaker-card";
import { AuthenticityCard } from "@/components/dashboard/authenticity-card";
import { WhyPanel } from "@/components/dashboard/why-panel";
import { useAnalysisSocket } from "@/hooks/use-analysis-socket";
import { ValidatedAudio } from "@/types/audio";
import { AnalysisResult } from "@/types/analysis";
import { Activity, Radio, Cpu, RefreshCw, AlertCircle, CheckCircle2, Play, Sparkles } from "lucide-react";

export function ThreatDashboard() {
  const [mode, setMode] = useState<"LIVE" | "DEMO">("LIVE");
  const [activeAudio, setActiveAudio] = useState<ValidatedAudio | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>("genuine_voice");
  const [demoResult, setDemoResult] = useState<AnalysisResult | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);

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
    if (audio && audio.blob) {
      await analyzeViaHttp(audio.blob, "Primary User");
    }
  };

  const handleRunDemoScenario = async (scenarioId: string) => {
    setIsDemoLoading(true);
    try {
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

        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Live ↔ Demo Mode Selector */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
            <button
              onClick={() => setMode("LIVE")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
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
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                mode === "DEMO"
                  ? "bg-cyan-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              DEMO MODE
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

        {/* Demo Mode Scenario Selector Bar */}
        {mode === "DEMO" && (
          <div className="p-4 rounded-2xl border border-indigo-900/60 bg-indigo-950/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-200">
                  Select Demo Attack Scenario
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Reproducible, deterministic evaluation fixtures
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "genuine_voice", name: "1. Genuine Voice", color: "hover:border-emerald-500" },
                { id: "ai_voice_clone", name: "2. AI Voice Clone", color: "hover:border-red-500" },
                { id: "replay_attack", name: "3. Replay Attack", color: "hover:border-orange-500" },
                { id: "unknown_speaker", name: "4. Unknown Speaker", color: "hover:border-yellow-500" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenario(s.id);
                    handleRunDemoScenario(s.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                    selectedScenario === s.id
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30"
                      : `bg-slate-900 border-slate-800 text-slate-300 ${s.color}`
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Primary Audio Capture & Integrated Visualizer Card (In Live Mode) */}
        {mode === "LIVE" && (
          <div className="w-full">
            <AudioCapture onAudioCaptured={handleAudioCaptured} />
          </div>
        )}

        {/* Secondary Row: Real ML Analysis Panels (Works symmetrically for Live & Demo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RiskMeter risk={activeResult?.risk ?? null} isAnalyzing={isAnalyzing} />
          <SpeakerCard speaker={activeResult?.speaker ?? null} isAnalyzing={isAnalyzing} />
          <AuthenticityCard authenticity={activeResult?.authenticity ?? null} isAnalyzing={isAnalyzing} />
        </div>

        {/* WHY? Explainability Panel */}
        {activeResult && (
          <div className="w-full">
            <WhyPanel analysis={activeResult} />
          </div>
        )}

        {/* Forensic Timeline Events */}
        {activeResult && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-mono tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Analysis Event Stream
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Mode: {activeResult.mode} // Session: {activeResult.session_id}
              </span>
            </div>

            {/* Timeline Events List */}
            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeResult.timeline.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs font-mono"
                  >
                    <span
                      className={`w-2 h-2 mt-1 rounded-full ${
                        evt.level === "CRITICAL"
                          ? "bg-red-500 animate-ping"
                          : evt.level === "WARN"
                          ? "bg-yellow-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-slate-200 font-semibold">{evt.label}</div>
                      {evt.details && <div className="text-slate-500 text-[11px]">{evt.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
