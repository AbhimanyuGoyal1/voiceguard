"use client";

import { useEffect, useState } from "react";
import { Shield, Activity, Server, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 antialiased font-sans">
      <div className="w-full max-w-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                VoiceGuard
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Phase 0
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Voice Impersonation & Deepfake Defense System
              </p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50"
            title="Refresh Status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>

        {/* Status Indicator Card */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="h-5 w-5 text-zinc-400" />
            <div>
              <div className="text-xs text-zinc-400 font-medium">Backend Connection</div>
              <div className="text-sm font-semibold tracking-wide flex items-center gap-1.5 mt-0.5">
                {loading ? (
                  <span className="text-zinc-400 animate-pulse">Checking status...</span>
                ) : health?.status === "healthy" ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    Backend: Healthy
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
                    Backend: Unreachable
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            {loading ? (
              <Activity className="h-5 w-5 text-zinc-500 animate-spin" />
            ) : health?.status === "healthy" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400" />
            )}
          </div>
        </div>

        {/* Backend Info / Diagnostics */}
        {health && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
              System Diagnostics
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500 block">Service</span>
                <span className="font-mono text-zinc-200 mt-0.5 block">{health.service}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500 block">Database</span>
                <span className="font-mono text-zinc-200 mt-0.5 block capitalize">{health.database}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500 block">Environment</span>
                <span className="font-mono text-zinc-200 mt-0.5 block">{health.environment}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60">
                <span className="text-zinc-500 block">AI Enrichment</span>
                <span className="font-mono text-cyan-400 mt-0.5 block">
                  {health.ai_enrichment_configured.llm ? "Custom LLM" : "Deterministic (Zero Key)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Could not reach backend at <code className="font-mono">{backendUrl}</code>. Ensure the FastAPI server is running.</span>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 text-[11px] text-zinc-500">
          PR-00 Scaffolding Complete • Ready for Phase 1 Audio Capture
        </div>
      </div>
    </div>
  );
}
