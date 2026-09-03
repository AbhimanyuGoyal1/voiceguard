"use client";

import { RiskAssessment } from "@/types/analysis";
import { ShieldAlert, ShieldCheck, AlertTriangle, Radio } from "lucide-react";

interface RiskMeterProps {
  risk: RiskAssessment | null;
  isAnalyzing: boolean;
}

export function RiskMeter({ risk, isAnalyzing }: RiskMeterProps) {
  const score = risk?.score ?? 0;
  const level = risk?.level ?? "LOW";
  const confidence = risk?.confidence ?? 1.0;
  const isPartial = risk?.is_partial ?? false;

  const getSeverityTheme = (lvl: string) => {
    switch (lvl) {
      case "CRITICAL":
        return {
          textColor: "text-[#FF2A54]",
          borderColor: "border-[#FF2A54]/40",
          glowShadow: "shadow-[0_0_30px_rgba(255,42,84,0.25)]",
          gradientId: "grad-critical",
          badgeBg: "bg-[#FF2A54]/15 border-[#FF2A54]/40 text-[#FF2A54]",
          action: "BLOCK CALL",
          actionColor: "text-red-400 bg-red-950/60 border-red-500/40",
        };
      case "HIGH":
        return {
          textColor: "text-[#FF7A00]",
          borderColor: "border-[#FF7A00]/40",
          glowShadow: "shadow-[0_0_25px_rgba(255,122,0,0.25)]",
          gradientId: "grad-high",
          badgeBg: "bg-[#FF7A00]/15 border-[#FF7A00]/40 text-[#FF7A00]",
          action: "CHALLENGE CALL",
          actionColor: "text-orange-400 bg-orange-950/60 border-orange-500/40",
        };
      case "MODERATE":
        return {
          textColor: "text-[#FFB800]",
          borderColor: "border-[#FFB800]/40",
          glowShadow: "shadow-[0_0_25px_rgba(255,184,0,0.2)]",
          gradientId: "grad-mod",
          badgeBg: "bg-[#FFB800]/15 border-[#FFB800]/40 text-[#FFB800]",
          action: "MONITOR CALL",
          actionColor: "text-yellow-400 bg-yellow-950/60 border-yellow-500/40",
        };
      default:
        return {
          textColor: "text-[#00E599]",
          borderColor: "border-[#00E599]/40",
          glowShadow: "shadow-[0_0_25px_rgba(0,229,153,0.2)]",
          gradientId: "grad-safe",
          badgeBg: "bg-[#00E599]/15 border-[#00E599]/40 text-[#00E599]",
          action: "ALLOW CALL",
          actionColor: "text-emerald-400 bg-emerald-950/60 border-emerald-500/40",
        };
    }
  };

  const theme = getSeverityTheme(level);

  // SVG Gauge calculations
  // Semi-circle arc: radius = 70, circumference = pi * r ≈ 219.91
  const radius = 70;
  const circumference = Math.PI * radius;
  const displayScore = isAnalyzing ? 50 : Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  return (
    <div
      className={`relative p-5 rounded-2xl border bg-[#0A0F1D]/90 backdrop-blur-md transition-all duration-300 ${theme.borderColor} ${theme.glowShadow}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {level === "CRITICAL" || level === "HIGH" ? (
            <ShieldAlert className={`w-5 h-5 ${theme.textColor}`} />
          ) : (
            <ShieldCheck className={`w-5 h-5 ${theme.textColor}`} />
          )}
          <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            Threat Score HUD
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isPartial && (
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-950/60 border border-yellow-600/50 text-yellow-300">
              <AlertTriangle className="w-3 h-3" /> PARTIAL
            </span>
          )}
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badgeBg} flex items-center gap-1.5`}
          >
            <span className={`w-1.5 h-1.5 rounded-full bg-current ${level === "CRITICAL" ? "animate-ping" : ""}`} />
            {isAnalyzing ? "CALCULATING..." : level}
          </span>
        </div>
      </div>

      {/* Radial HUD Gauge Surface */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
          <svg
            viewBox="0 0 160 90"
            className="w-full h-full transform transition-all duration-500"
          >
            <defs>
              <linearGradient id="grad-safe" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00E599" />
                <stop offset="100%" stopColor="#00F2FE" />
              </linearGradient>
              <linearGradient id="grad-mod" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFB800" />
                <stop offset="100%" stopColor="#FF7A00" />
              </linearGradient>
              <linearGradient id="grad-high" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#FF2A54" />
              </linearGradient>
              <linearGradient id="grad-critical" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF2A54" />
                <stop offset="100%" stopColor="#FF0040" />
              </linearGradient>
            </defs>

            {/* Background Arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke="#1e293b"
              strokeWidth="11"
              strokeLinecap="round"
            />

            {/* Animated Threat Score Arc */}
            <path
              d="M 10 80 A 70 70 0 0 1 150 80"
              fill="none"
              stroke={`url(#${theme.gradientId})`}
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Metric Text */}
          <div className="absolute bottom-0 flex flex-col items-center text-center">
            <span
              className={`text-4xl font-extrabold font-mono tracking-tight tabular-nums ${theme.textColor}`}
            >
              {isAnalyzing ? "--" : score}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              RISK INDEX
            </span>
          </div>
        </div>

        {/* Scale Indicators (0 ... 50 ... 100) */}
        <div className="w-48 flex justify-between text-[10px] font-mono text-slate-500 px-2 mt-0.5">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Forensic Telemetry Strip */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <span className="text-slate-400 text-[10px] block">CONFIDENCE</span>
          <span className="text-slate-200 font-bold">
            {isAnalyzing ? "--" : `${(confidence * 100).toFixed(0)}%`}
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <span className="text-slate-400 text-[10px] block">SECURITY ACTION</span>
          <span className={`font-bold text-[11px] ${theme.textColor}`}>
            {theme.action}
          </span>
        </div>
      </div>
    </div>
  );
}
