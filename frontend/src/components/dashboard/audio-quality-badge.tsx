"use client";

import React from "react";
import { AudioQualitySignal } from "@/types/analysis";
import { Activity, AlertTriangle, CheckCircle2, Volume2, ShieldAlert, Sparkles } from "lucide-react";

interface AudioQualityBadgeProps {
  quality?: AudioQualitySignal | null;
  isAnalyzing?: boolean;
}

export function AudioQualityBadge({ quality, isAnalyzing }: AudioQualityBadgeProps) {
  if (isAnalyzing) {
    return (
      <div className="p-3.5 rounded-xl border border-white/5 bg-[#0A0F1D]/60 backdrop-blur-md flex items-center justify-between gap-3 animate-pulse">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Measuring acoustic signal health & SNR...</span>
        </div>
      </div>
    );
  }

  if (!quality) return null;

  const { quality_score, rating, snr_db, clipping_pct, is_degraded, is_noisy, is_clipped, recommendation } = quality;

  // Visual style tokens based on quality rating
  const getRatingStyle = () => {
    switch (rating) {
      case "EXCELLENT":
        return {
          pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          bar: "bg-emerald-500",
          dot: "bg-emerald-400",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case "GOOD":
        return {
          pill: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          bar: "bg-cyan-500",
          dot: "bg-cyan-400",
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case "FAIR":
        return {
          pill: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          bar: "bg-amber-500",
          dot: "bg-amber-400",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "DEGRADED":
      default:
        return {
          pill: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          bar: "bg-rose-500",
          dot: "bg-rose-400",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
        };
    }
  };

  const style = getRatingStyle();

  return (
    <div className="space-y-2">
      <div className="p-3.5 rounded-xl border border-white/10 bg-[#0A0F1D]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Rating & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono font-medium text-slate-300">Acoustic Signal:</span>
          </div>

          <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${style.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
            {style.icon}
            <span>{rating}</span>
            <span className="text-[11px] opacity-75">({quality_score}%)</span>
          </div>
        </div>

        {/* Right: Technical Telemetry (SNR & Clipping) */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SNR:</span>
            <span className={`font-semibold ${snr_db < 10 ? "text-rose-400" : snr_db < 15 ? "text-amber-400" : "text-emerald-400"}`}>
              {snr_db} dB
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Clip:</span>
            <span className={`font-semibold ${clipping_pct > 0.5 ? "text-rose-400" : "text-slate-300"}`}>
              {clipping_pct}%
            </span>
          </div>

          {/* Miniature Quality Meter Bar */}
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden hidden sm:block border border-white/5">
            <div
              className={`h-full ${style.bar} transition-all duration-500`}
              style={{ width: `${quality_score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Warning Banner when Signal Quality is Degraded */}
      {is_degraded && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-200">
              Low Acoustic Signal Quality (Degraded)
            </p>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              {recommendation || "High ambient noise or distortion detected. Authenticity confidence has been lowered. Speak closer to the microphone for definitive forensic verification."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
