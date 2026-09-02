"use client";

import { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneOff, UserCheck, ShieldAlert, Sparkles, Volume2, Mic, Activity } from "lucide-react";

interface CallSimulatorProps {
  onAcceptCall: (scenarioId: string) => Promise<void>;
  isAnalyzing: boolean;
}

export function CallSimulator({ onAcceptCall, isAnalyzing }: CallSimulatorProps) {
  const [callState, setCallState] = useState<"IDLE" | "INCOMING" | "CONNECTED" | "ENDED">("IDLE");
  const [activeCallScenario, setActiveCallScenario] = useState<string>("ai_voice_clone");
  const [callerName, setCallerName] = useState<string>("Primary User (Claimed)");
  const [callDuration, setCallDuration] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (callState === "CONNECTED") {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const handleTriggerIncoming = (scenarioId: string, name: string) => {
    setActiveCallScenario(scenarioId);
    setCallerName(name);
    setCallState("INCOMING");
  };

  const handleAccept = async () => {
    setCallState("CONNECTED");
    await onAcceptCall(activeCallScenario);
  };

  const handleHangup = () => {
    setCallState("ENDED");
    setTimeout(() => setCallState("IDLE"), 1200);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="rounded-2xl border border-emerald-900/60 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              TELEPHONY CALL SIMULATOR // SOC LIVE INTERCEPTION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Simulates live incoming telephony streams feeding directly into VoiceGuard ML analysis
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          SIP / VOIP INTERCEPTOR
        </span>
      </div>

      {/* Call Scenario Preset Buttons (When IDLE or ENDED) */}
      {callState === "IDLE" || callState === "ENDED" ? (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400">Select Incoming Telephony Simulation:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                id: "ai_voice_clone",
                label: "Targeted Clone Call",
                caller: "Primary User (Cloned)",
                desc: "Attacker using cloned voice of executive Primary User",
                style: "hover:border-red-500",
              },
              {
                id: "genuine_voice",
                label: "Genuine Caller Call",
                caller: "Primary User (Authentic)",
                desc: "Authorized primary user verifying identity",
                style: "hover:border-emerald-500",
              },
              {
                id: "replay_attack",
                label: "Replay Transmission",
                caller: "Recorded Primary User",
                desc: "Attacker replaying past voicemail authorization",
                style: "hover:border-orange-500",
              },
              {
                id: "unknown_speaker",
                label: "Unknown Stranger Call",
                caller: "Unenrolled Caller",
                desc: "Impostor stranger attempting account recovery",
                style: "hover:border-yellow-500",
              },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => handleTriggerIncoming(c.id, c.caller)}
                className={`p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 text-left transition-all cursor-pointer ${c.style} hover:bg-slate-900/60`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-200">{c.label}</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-400">{c.caller}</div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Incoming Call Presentation Modal / Banner */}
      {callState === "INCOMING" && (
        <div className="p-6 rounded-2xl border border-emerald-500/50 bg-emerald-950/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                INCOMING TELEPHONY STREAM...
              </div>
              <div className="text-base font-bold font-mono text-slate-100">{callerName}</div>
              <div className="text-xs font-mono text-slate-400">Origin: +1 (555) 019-4820 // SIP Trunk #04</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>ACCEPT CALL & ANALYZE</span>
            </button>
            <button
              onClick={handleHangup}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 text-red-400" />
              <span>DECLINE</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Call In-Progress Bar */}
      {callState === "CONNECTED" && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-xs font-mono font-bold text-slate-200">
                ACTIVE CALL: {callerName} <span className="text-emerald-400">[{formatDuration(callDuration)}]</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Telephony audio actively piped into VoiceGuard Risk Engine & Spectrogram Pipeline
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>16kHz Mono Stream</span>
            </span>

            <button
              onClick={handleHangup}
              className="px-4 py-1.5 rounded-lg bg-red-950/80 border border-red-500/50 hover:bg-red-900/80 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>END CALL</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
