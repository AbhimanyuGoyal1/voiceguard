"use client";

import { AuthenticitySignal } from "@/types/analysis";
import { Bot, CheckCircle2, AlertOctagon } from "lucide-react";

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
          icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
          label: "SYNTHETIC / CLONE",
          color: "text-red-400 bg-red-950/40 border-red-500/40",
          barColor: "bg-red-500",
        };
      case "SUSPICIOUS":
        return {
          icon: <Bot className="w-5 h-5 text-yellow-500" />,
          label: "SUSPICIOUS ARTIFACTS",
          color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/40",
          barColor: "bg-yellow-500",
        };
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          label: "GENUINE HUMAN",
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/40",
          barColor: "bg-emerald-400",
        };
    }
  };

  const style = getVerdictStyle();

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {style.icon}
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Authenticity & Anti-Spoof (AASIST)
          </h4>
        </div>
        <span
          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${style.color}`}
        >
          {isAnalyzing ? "SCANNING..." : style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">Synthetic Probability</div>
          <div className="text-xl font-bold font-mono text-red-400">
            {isAnalyzing ? "--" : `${synthProb}%`}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400">Human Probability</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {isAnalyzing ? "--" : `${humanProb}%`}
          </div>
        </div>
      </div>

      {/* Dual Balance Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 flex overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-700"
          style={{ width: `${isAnalyzing ? 50 : humanProb}%` }}
        />
        <div
          className="h-full bg-red-500 transition-all duration-700"
          style={{ width: `${isAnalyzing ? 50 : synthProb}%` }}
        />
      </div>
    </div>
  );
}
