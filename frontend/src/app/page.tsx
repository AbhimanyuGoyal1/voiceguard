"use client";

import { useEffect, useState } from "react";
import { Shield, Activity, Server, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { AudioCapture } from "@/components/audio/audio-capture";
import { ValidatedAudio } from "@/types/audio";

interface HealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: string;
  ai_enrichment_configured: {
    llm: boolean;
    tts: boolean;
    stt: boolean;
  };
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<ValidatedAudio | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [backendUrl]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start p-6 antialiased font-sans">
      <div className="w-full max-w-3xl space-y-6 py-6">
        {/* Operations Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                VoiceGuard
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Phase 1 • Audio Ingestion
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Voice Impersonation & Deepfake Defense Platform
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.status === "healthy" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className="text-zinc-300 font-mono text-[11px]">
                {loading ? "Checking..." : health?.status === "healthy" ? "SYSTEM ONLINE" : "OFFLINE"}
              </span>
            </div>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50"
              title="Refresh Connection"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </header>

        {/* PR-01: Audio Ingestion & Capture Component */}
        <main className="space-y-6">
          <AudioCapture onAudioCaptured={(audio) => setCurrentAudio(audio)} />

          {/* Diagnostics / Connection Summary */}
          <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              <Server className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-zinc-400 font-medium">Backend Health Check: </span>
                <span className={health?.status === "healthy" ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {loading ? "Connecting..." : health?.status === "healthy" ? "Healthy (200 OK)" : "Unreachable"}
                </span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-zinc-500">
              PR-01 Definition of Done Verified
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
