"use client";

import { useState } from "react";
import { TimelineEvent, AnalysisResult } from "@/types/analysis";
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, Info, ArrowRight, CornerDownRight, Play } from "lucide-react";

interface ThreatTimelineProps {
  timeline: TimelineEvent[];
  activeEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  analysisMode: "LIVE" | "DEMO";
}

export function ThreatTimeline({
  timeline,
  activeEventId,
  onSelectEvent,
  analysisMode,
}: ThreatTimelineProps) {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  if (!timeline || timeline.length === 0) return null;

  const getEventStyle = (level: string, isSelected: boolean) => {
    switch (level) {
      case "CRITICAL":
        return {
          dot: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse",
          border: isSelected ? "border-red-500 bg-red-950/40" : "border-red-900/60 bg-red-950/20 hover:border-red-600",
          text: "text-red-400",
          icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
        };
      case "WARN":
        return {
          dot: "bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]",
          border: isSelected ? "border-yellow-500 bg-yellow-950/40" : "border-yellow-900/60 bg-yellow-950/20 hover:border-yellow-600",
          text: "text-yellow-400",
          icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
        };
      default:
        return {
          dot: "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]",
          border: isSelected ? "border-cyan-500 bg-cyan-950/40" : "border-slate-800 bg-slate-950/50 hover:border-slate-700",
          text: "text-cyan-400",
          icon: <Info className="w-4 h-4 text-cyan-400" />,
        };
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              FORENSIC THREAT TIMELINE // STATE PROGRESSION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Interactive chronological event reconstruction — Click an event to inspect state
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
          {timeline.length} Events Recorded
        </span>
      </div>

      {/* Horizontal / Stepped Timeline Progression */}
      <div className="relative pt-3 pb-2">
        <div className="absolute top-7 left-6 right-6 h-0.5 bg-gradient-to-r from-cyan-500 via-yellow-500 to-red-500 opacity-40 z-0" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {timeline.map((evt, idx) => {
            const isSelected = activeEventId === evt.id || (activeEventId === null && idx === timeline.length - 1);
            const style = getEventStyle(evt.level, isSelected);

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt.id)}
                onMouseEnter={() => setHoveredEventId(evt.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${style.border}`}
              >
                {/* Step indicator dot */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    STEP 0{idx + 1}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                </div>

                <div className="flex items-start gap-2 mb-1">
                  {style.icon}
                  <div className="text-xs font-mono font-bold text-slate-200 line-clamp-1">{evt.label}</div>
                </div>

                {evt.details && (
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2 mt-1">
                    {evt.details}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>{evt.type}</span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    INSPECT <CornerDownRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
