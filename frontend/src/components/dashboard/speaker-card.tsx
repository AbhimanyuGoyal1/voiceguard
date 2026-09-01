"use client";

import { SpeakerVerificationSignal } from "@/types/analysis";
import { UserCheck, UserX, UserSearch } from "lucide-react";

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
          icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
          label: "MATCHED",
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
        };
      case "MISMATCH":
        return {
          icon: <UserX className="w-5 h-5 text-red-400" />,
          label: "MISMATCH",
          color: "text-red-400 bg-red-950/40 border-red-500/30",
        };
      case "NOT_ENROLLED":
        return {
          icon: <UserSearch className="w-5 h-5 text-slate-400" />,
          label: "AUTO-ENROLLED",
          color: "text-slate-400 bg-slate-800/40 border-slate-700/30",
        };
      default:
        return {
          icon: <UserSearch className="w-5 h-5 text-yellow-400" />,
          label: "UNCERTAIN",
          color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/30",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {badge.icon}
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Speaker Verification (ECAPA-TDNN)
          </h4>
        </div>
        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${badge.color}`}
        >
          {isAnalyzing ? "EXTRACTING..." : badge.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <div className="text-xs text-slate-500 font-mono">Enrolled Identity</div>
          <div className="text-sm font-semibold text-slate-200">{identity}</div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {isAnalyzing ? "--" : `${matchScore}%`}
          </div>
          <div className="text-[11px] font-mono text-slate-500">Acoustic Similarity</div>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
          style={{ width: `${isAnalyzing ? 50 : matchScore}%` }}
        />
      </div>
    </div>
  );
}
