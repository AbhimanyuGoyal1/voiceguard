"use client";

import { useState, useRef } from "react";
import { ShieldAlert, Play, Sparkles, AlertTriangle, Radio, RefreshCw, Volume2, Flame } from "lucide-react";
import { VOICE_LIBRARY, VoiceLibraryScenario } from "@/lib/voice-library";
import { ValidatedAudio } from "@/types/audio";
import { validateAudioBlob } from "@/lib/audio-validator";

interface AttackSimulatorProps {
  onLaunchAttackAudio: (audio: ValidatedAudio, scenario: VoiceLibraryScenario) => Promise<void>;
  isLaunching: boolean;
}

export function AttackSimulator({ onLaunchAttackAudio, isLaunching }: AttackSimulatorProps) {
  const [selectedId, setSelectedId] = useState<string>("clone_01");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedScenario =
    VOICE_LIBRARY.find((s) => s.id === selectedId) || VOICE_LIBRARY[2];

  const handleLaunch = async () => {
    setIsPlayingAudio(true);
    try {
      // 1. Play real attack audio through speakers so the audience hears the attack
      if (audioRef.current) {
        audioRef.current.src = selectedScenario.audioUrl;
        audioRef.current.play().catch(() => {});
      }

      // 2. Fetch binary audio stream from Voice Library
      const res = await fetch(selectedScenario.audioUrl);
      const audioBlob = await res.blob();

      // 3. Convert & validate into standard 16-bit PCM WAV
      const validation = await validateAudioBlob(
        audioBlob,
        "upload",
        selectedScenario.audioUrl.split("/").pop()
      );

      if (validation.success) {
        // 4. Pipe real audio through canonical backend ML inference & Risk Engine
        await onLaunchAttackAudio(validation.data, selectedScenario);
      }
    } catch (err) {
      console.error("Attack simulator audio launch failed:", err);
    }
  };

  const getThreatBadgeStyle = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "text-red-400 border-red-500/40 bg-red-950/40";
      case "HIGH":
        return "text-orange-400 border-orange-500/40 bg-orange-950/40";
      default:
        return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-950 bg-slate-950/90 backdrop-blur-md p-6 shadow-2xl space-y-5">
      <audio ref={audioRef} onEnded={() => setIsPlayingAudio(false)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Flame className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              ATTACK SIMULATOR // REAL VOICE VECTOR INJECTION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Select an attack vector from the Voice Library — audience hears the voice first before detection reveals it
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlayingAudio && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 font-semibold flex items-center gap-1.5 animate-pulse">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              VOICE PLAYING
            </span>
          )}
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            ACTUAL AUDIO INGESTION
          </span>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {VOICE_LIBRARY.map((s) => {
          const isSelected = s.id === selectedId;
          const badgeStyle = getThreatBadgeStyle(s.expectedThreat);
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50"
                  : "border-slate-900 bg-slate-950/50 hover:border-slate-800 hover:bg-slate-900/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-slate-200 truncate">{s.title}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 ${badgeStyle}`}>
                  {s.expectedThreat}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">{s.description}</p>
              <div className="text-[10px] font-mono text-slate-500">{s.callerNumber}</div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-2">
            <span>Selected Voice:</span>
            <span className="text-indigo-400 font-bold">{selectedScenario.title}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getThreatBadgeStyle(
                selectedScenario.expectedThreat
              )}`}
            >
              {selectedScenario.category}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Source recording: <span className="font-mono text-cyan-400">{selectedScenario.audioUrl}</span>
          </p>
        </div>

        <button
          onClick={handleLaunch}
          disabled={isLaunching}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLaunching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>INTERCEPTING & ANALYZING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY AUDIO & LAUNCH ATTACK</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
