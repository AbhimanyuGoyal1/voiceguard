"use client";

import { AuthenticitySignal } from "@/types/analysis";
import { Bot, CheckCircle2, AlertOctagon, Cpu } from "lucide-react";

interface AuthenticityCardProps {
  authenticity: AuthenticitySignal | null;
  isAnalyzing: boolean;
}

export function AuthenticityCard({ authenticity, isAnalyzing }: AuthenticityCardProps) {
  const synthProb = authenticity?.synthetic_probability ?? 0;
  const humanProb = authenticity?.human_probability ?? 100;
  const classification = authenticity?.classification ?? "AUTHENTIC";

  const getVerdictStyle = () => {
    switch (classification) {
      case "SYNTHETIC":
        return {
          icon: <AlertOctagon className="w-4 h-4 text-red-500" />,
          label: "SYNTHETIC / CLONE",
          color: "text-red-400 bg-red-950/40 border-red-500/40",
          barColor: "bg-red-500",
          glow: "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
        };
      case "SUSPICIOUS":
        return {
          icon: <Bot className="w-4 h-4 text-yellow-500" />,
          label: "SUSPICIOUS ARTIFACTS",
          color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/40",
          barColor: "bg-yellow-500",
          glow: "border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]",
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: "GENUINE HUMAN",
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/40",
          barColor: "bg-emerald-400",
          glow: "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
        };
    }
  };

  const style = getVerdictStyle();

  return (
    <div className={`p-5 rounded-2xl border bg-[#0A0F1D]/90 backdrop-blur-md transition-all duration-300 ${style.glow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Authenticity & Anti-Spoof
          </h4>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${style.color}`}
        >
          {style.icon}
          {isAnalyzing ? "SCANNING..." : style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Human Voice</div>
          <div className="text-xl font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
            {isAnalyzing ? "--" : `${humanProb.toFixed(1)}%`}
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${isAnalyzing ? 50 : humanProb}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Deepfake / Synth</div>
          <div className="text-xl font-mono font-bold text-red-400 tabular-nums mt-0.5">
            {isAnalyzing ? "--" : `${synthProb.toFixed(1)}%`}
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-500"
              style={{ width: `${isAnalyzing ? 50 : synthProb}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-slate-500 flex justify-between px-1 mt-3">
        <span>AASIST Forensic Spectral Roll-off</span>
        <span>Cutoff &gt;7.5kHz Anomaly</span>
      </div>
    </div>
  );
}
