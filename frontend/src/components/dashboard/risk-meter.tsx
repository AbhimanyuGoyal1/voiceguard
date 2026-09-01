"use client";

import { RiskAssessment } from "@/types/analysis";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface RiskMeterProps {
  risk: RiskAssessment | null;
  isAnalyzing: boolean;
}

export function RiskMeter({ risk, isAnalyzing }: RiskMeterProps) {
  const score = risk?.score ?? 0;
  const level = risk?.level ?? "LOW";
  const confidence = risk?.confidence ?? 1.0;
  const isPartial = risk?.is_partial ?? false;

  const getSeverityColor = (lvl: string) => {
    switch (lvl) {
      case "CRITICAL":
        return {
          text: "text-red-500",
          border: "border-red-500/40",
          bg: "bg-red-950/30",
          glow: "shadow-[0_0_25px_rgba(239,68,68,0.25)]",
          bar: "bg-red-500",
        };
      case "HIGH":
        return {
          text: "text-orange-500",
          border: "border-orange-500/40",
          bg: "bg-orange-950/30",
          glow: "shadow-[0_0_25px_rgba(249,115,22,0.25)]",
          bar: "bg-orange-500",
        };
      case "MODERATE":
        return {
          text: "text-yellow-500",
          border: "border-yellow-500/40",
          bg: "bg-yellow-950/30",
          glow: "shadow-[0_0_25px_rgba(234,179,8,0.25)]",
          bar: "bg-yellow-500",
        };
      default:
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-950/30",
          glow: "shadow-[0_0_25px_rgba(52,211,153,0.2)]",
          bar: "bg-emerald-400",
        };
    }
  };

  const style = getSeverityColor(level);

  return (
    <div
      className={`relative p-6 rounded-2xl border bg-slate-900/90 backdrop-blur-md transition-all duration-500 ${style.border} ${style.glow}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {level === "CRITICAL" || level === "HIGH" ? (
            <ShieldAlert className={`w-6 h-6 ${style.text} animate-pulse`} />
          ) : (
            <ShieldCheck className={`w-6 h-6 ${style.text}`} />
          )}
          <h3 className="text-sm font-mono tracking-wider text-slate-300 uppercase">
            Threat Assessment
          </h3>
        </div>
        {isPartial && (
          <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-yellow-900/60 border border-yellow-700/60 text-yellow-300">
            <AlertTriangle className="w-3 h-3" /> PARTIAL
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        {/* Score & Gauge */}
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-5xl font-extrabold font-mono tracking-tight transition-all duration-300 ${style.text}`}
            >
              {isAnalyzing ? "--" : score}
            </span>
            <span className="text-sm font-mono text-slate-500">/100</span>
          </div>

          <div className="mt-2 text-xs font-mono font-semibold tracking-wider uppercase">
            Status: <span className={style.text}>{isAnalyzing ? "EVALUATING..." : level}</span>
          </div>
        </div>

        {/* Confidence & Severity Indicator */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Threat Severity</span>
            <span className={style.text}>{level}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${style.bar}`}
              style={{ width: `${isAnalyzing ? 50 : score}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>Confidence: {Math.round(confidence * 100)}%</span>
            <span>Band: {level}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
