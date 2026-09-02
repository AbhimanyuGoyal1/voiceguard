"use client";

import { useState, useEffect } from "react";
import { History, ShieldAlert, CheckCircle2, AlertTriangle, Filter, RefreshCw, ChevronRight, Eye } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

export interface IncidentRecord {
  id: string;
  timestamp: string;
  mode: string;
  attack_type: string;
  threat_severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  risk_score: number;
  speaker_match_score: number;
  speaker_status: string;
  enrolled_identity: string;
  synthetic_probability: number;
  authenticity_classification: string;
  summary: string;
  is_partial: boolean;
}

interface AttackHistoryProps {
  onSelectIncident?: (incident: IncidentRecord) => void;
  activeIncidentId?: string | null;
}

export function AttackHistory({ onSelectIncident, activeIncidentId }: AttackHistoryProps) {
  const [history, setHistory] = useState<IncidentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const url =
        filterSeverity === "ALL"
          ? "http://localhost:8000/api/history"
          : `http://localhost:8000/api/history?severity=${filterSeverity}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [filterSeverity]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              ATTACK HISTORY // FORENSIC INCIDENT REGISTRY
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Audit log of past voice analysis & detected deepfake attack attempts
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 bg-slate-950/80 p-0.5 text-xs font-mono">
            {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterSeverity(lvl)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterSeverity === lvl
                    ? "bg-purple-600 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={loadHistory}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {history.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No incident records found matching filter.
          </div>
        ) : (
          history.map((item) => {
            const isSelected = activeIncidentId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectIncident && onSelectIncident(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "border-purple-500 bg-purple-950/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    : "border-slate-800/80 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(
                      item.threat_severity
                    )}`}
                  >
                    {item.threat_severity}
                  </span>

                  <div>
                    <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                      <span>{item.id}</span>
                      <span className="text-slate-500 font-normal">| {item.attack_type}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Speaker Match: {item.speaker_match_score}% | Synth: {item.synthetic_probability}% | Risk:{" "}
                      <span className="text-slate-200 font-bold">{item.risk_score}/100</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
