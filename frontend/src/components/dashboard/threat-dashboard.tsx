"use client";

import { useState } from "react";
import { AudioCapture } from "@/components/audio/audio-capture";
import { RiskMeter } from "@/components/dashboard/risk-meter";
import { SpeakerCard } from "@/components/dashboard/speaker-card";
import { AuthenticityCard } from "@/components/dashboard/authenticity-card";
import { useAnalysisSocket } from "@/hooks/use-analysis-socket";
import { ValidatedAudio } from "@/types/audio";
import { Activity, Radio, Cpu, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export function ThreatDashboard() {
  const [activeAudio, setActiveAudio] = useState<ValidatedAudio | null>(null);

  const {
    isConnected,
    isReconnecting,
    analysisState,
    activeStage,
    analysisResult,
    errorMessage,
    analyzeViaHttp,
  } = useAnalysisSocket();

  const handleAudioCaptured = async (audio: ValidatedAudio | null) => {
    setActiveAudio(audio);
    if (audio && audio.blob) {
      await analyzeViaHttp(audio.blob, "Primary User");
    }
  };

  const isAnalyzing = analysisState === "ANALYZING";

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
          {/* WebSocket Live Stream Connection Badge */}
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

          <div className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/60 text-cyan-400 font-semibold">
            LIVE MODE
          </div>
        </div>
      </header>

      {/* Main Analysis Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <span className="font-semibold font-mono">Analysis Alert: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Primary Audio Capture & Integrated Visualizer Card */}
        <div className="w-full">
          <AudioCapture onAudioCaptured={handleAudioCaptured} />
        </div>

        {/* Secondary Row: Real ML Analysis Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RiskMeter risk={analysisResult?.risk ?? null} isAnalyzing={isAnalyzing} />
          <SpeakerCard speaker={analysisResult?.speaker ?? null} isAnalyzing={isAnalyzing} />
          <AuthenticityCard authenticity={analysisResult?.authenticity ?? null} isAnalyzing={isAnalyzing} />
        </div>

        {/* Forensic Evidence Summary & Timeline Events */}
        {analysisResult && (
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-mono tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Forensic Evidence Summary
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Session: {analysisResult.session_id}
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {analysisResult.evidence.summary}
            </p>

            {/* Timeline Events List */}
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-mono text-slate-400 tracking-wider uppercase">Event Stream</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysisResult.timeline.map((evt) => (
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
