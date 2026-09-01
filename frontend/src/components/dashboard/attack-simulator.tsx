"use client";

import { useState } from "react";
import { ShieldAlert, Play, Sparkles, AlertTriangle, Radio, RefreshCw, CheckCircle2 } from "lucide-react";

export interface ScenarioOption {
  id: string;
  name: string;
  threatLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  badge: string;
  description: string;
  targetIdentity: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: "genuine_voice",
    name: "Genuine Voice",
    threatLevel: "LOW",
    badge: "AUTHENTIC",
    description: "Authorized primary user speaking natural speech with organic harmonics.",
    targetIdentity: "Primary User",
  },
  {
    id: "ai_voice_clone",
    name: "AI Voice Clone",
    threatLevel: "CRITICAL",
    badge: "DEEPFAKE CLONE",
    description: "Targeted neural voice clone with >95% speaker match and high synthetic probability.",
    targetIdentity: "Primary User (Cloned)",
  },
  {
    id: "replay_attack",
    name: "Replay Attack",
    threatLevel: "HIGH",
    badge: "TRANSMISSION REPLAY",
    description: "Recorded genuine speech replayed over speakers exhibiting channel reverberation.",
    targetIdentity: "Primary User",
  },
  {
    id: "unknown_speaker",
    name: "Unknown Speaker",
    threatLevel: "MODERATE",
    badge: "IMPOSTOR STRANGER",
    description: "Organic biological voice from an unauthorized, un-enrolled human.",
    targetIdentity: "Unknown Impostor",
  },
];

interface AttackSimulatorProps {
  onLaunchAttack: (scenarioId: string) => Promise<void>;
  isLaunching: boolean;
  activeScenarioId: string;
}

export function AttackSimulator({ onLaunchAttack, isLaunching, activeScenarioId }: AttackSimulatorProps) {
  const [selectedId, setSelectedId] = useState<string>(activeScenarioId);

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  const handleLaunch = async () => {
    await onLaunchAttack(selectedId);
  };

  const getThreatBadgeStyle = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "text-red-400 border-red-500/40 bg-red-950/40";
      case "HIGH":
        return "text-orange-400 border-orange-500/40 bg-orange-950/40";
      case "MODERATE":
        return "text-yellow-400 border-yellow-500/40 bg-yellow-950/40";
      default:
        return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-900/60 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase">
              ATTACK SIMULATOR // THREAT VECTOR INJECTION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Interactive scenario launcher feeding the canonical defense pipeline
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          DEMO ENVIRONMENT
        </span>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {SCENARIOS.map((s) => {
          const isSelected = selectedId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-slate-200">{s.name}</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getThreatBadgeStyle(s.threatLevel)}`}>
                  {s.threatLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2">
                {s.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Launcher Action Bar */}
      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-slate-400">
            Selected Vector: <span className="text-indigo-300 font-semibold">{selectedScenario.name}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
            Target Identity: <span className="text-slate-300">{selectedScenario.targetIdentity}</span>
          </div>
        </div>

        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLaunching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>SIMULATING ATTACK...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH ATTACK</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
