"use client";

import { SpeakerVerificationSignal } from "@/types/analysis";
import { UserCheck, UserX, UserSearch, Fingerprint } from "lucide-react";

interface SpeakerCardProps {
  speaker: SpeakerVerificationSignal | null;
  isAnalyzing: boolean;
}

export function SpeakerCard({ speaker, isAnalyzing }: SpeakerCardProps) {
  const matchScore = speaker?.match_score ?? 0;
  const status = speaker?.status ?? "NOT_ENROLLED";
  const identity = speaker?.enrolled_identity ?? "Primary User";

  const getStatusBadge = () => {
    switch (status) {
      case "MATCHED":
        return {
          icon: <UserCheck className="w-4 h-4 text-emerald-400" />,
          label: "MATCHED",
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
          barColor: "bg-emerald-400",
          glow: "border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        };
      case "MISMATCH":
        return {
          icon: <UserX className="w-4 h-4 text-red-400" />,
          label: "MISMATCH",
          color: "text-red-400 bg-red-950/40 border-red-500/30",
          barColor: "bg-red-500",
          glow: "border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
        };
      case "NOT_ENROLLED":
        return {
          icon: <UserSearch className="w-4 h-4 text-slate-400" />,
          label: "AUTO-ENROLLED",
          color: "text-slate-400 bg-slate-800/40 border-slate-700/30",
          barColor: "bg-slate-500",
          glow: "border-white/10",
        };
      default:
        return {
          icon: <UserSearch className="w-4 h-4 text-yellow-400" />,
          label: "UNCERTAIN",
          color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/30",
          barColor: "bg-yellow-500",
          glow: "border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className={`p-5 rounded-2xl border bg-[#0A0F1D]/90 backdrop-blur-md transition-all duration-300 ${badge.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Speaker Verification
          </h4>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.color}`}
        >
          {badge.icon}
          {isAnalyzing ? "EXTRACTING..." : badge.label}
        </span>
      </div>

      <div className="space-y-3 mt-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Target Identity:</span>
            <span className="text-slate-200 font-bold">{identity}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Embedding Match Score:</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {isAnalyzing ? "--" : `${matchScore.toFixed(1)}%`}
            </span>
          </div>

          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
            <div
              className={`h-full ${badge.barColor} transition-all duration-500`}
              style={{ width: `${isAnalyzing ? 40 : Math.min(100, Math.max(0, matchScore))}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] font-mono text-slate-500 flex justify-between px-1">
          <span>ECAPA-TDNN 192-d Cosine</span>
          <span>Threshold: &ge;65.0%</span>
        </div>
      </div>
    </div>
  );
}
