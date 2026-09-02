"use client";

import { useState, useEffect } from "react";
import { Bot, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, RefreshCw, Cpu, MessageSquare } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

interface AnalystBriefing {
  provider: string;
  is_fallback: boolean;
  is_llm: boolean;
  model_name: string;
  executive_summary: string;
  forensic_reasoning: string[];
  recommended_action: string;
  confidence: number;
}

interface AiSecurityAnalystProps {
  analysis: AnalysisResult | null;
}

export function AiSecurityAnalyst({ analysis }: AiSecurityAnalystProps) {
  const [briefing, setBriefing] = useState<AnalystBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forceTimeout, setForceTimeout] = useState(false);

  const fetchBriefing = async () => {
    if (!analysis) return;
    setIsLoading(true);
    try {
      const url = `http://localhost:8000/api/analyst/explain?force_timeout=${forceTimeout}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      });

      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [analysis?.session_id, analysis?.risk.score, forceTimeout]);

  if (!analysis) return null;

  return (
    <div className="rounded-2xl border border-indigo-900/70 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              AI SECURITY ANALYST // FORENSIC BRIEFING
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Natural language explanation layer for Risk Engine decisions (Max 3.0s latency)
            </p>
          </div>
        </div>

        {/* Fallback Mode & Provider Badges */}
        <div className="flex items-center gap-2.5">
          {briefing?.is_fallback && (
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>DETERMINISTIC FALLBACK</span>
            </span>
          )}

          <button
            onClick={() => {
              setForceTimeout(!forceTimeout);
            }}
            className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer ${
              forceTimeout
                ? "bg-amber-950/80 border-amber-500/70 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Forced 3.0s Timeout to test deterministic fallback"
          >
            {forceTimeout ? "FORCED TIMEOUT: ON" : "TIMEOUT TEST"}
          </button>

          <button
            onClick={fetchBriefing}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Regenerate Briefing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Briefing Content */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>Generating AI Security Analyst briefing...</span>
        </div>
      ) : briefing ? (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl border border-indigo-900/50 bg-indigo-950/20 space-y-1.5">
            <div className="text-xs font-mono font-bold text-indigo-300 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Executive Threat Summary
            </div>
            <p className="text-xs font-sans text-slate-200 leading-relaxed">
              {briefing.executive_summary}
            </p>
          </div>

          {/* Forensic Reasoning Points */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">
              Forensic Reasoning & Signal Decomposition
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-slate-300">
              {briefing.forensic_reasoning.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Remediation Action */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1.5">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">
              Remediation Directive
            </div>
            <p className="text-xs font-mono text-emerald-400 font-semibold">
              {briefing.recommended_action}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
