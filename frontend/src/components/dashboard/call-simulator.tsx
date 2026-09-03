"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneCall, PhoneOff, Volume2, Activity, Shuffle, Sparkles, ShieldAlert, ShieldCheck, MapPin, Radio, Lock } from "lucide-react";
import { VOICE_LIBRARY, VoiceLibraryScenario } from "@/lib/voice-library";
import { ValidatedAudio } from "@/types/audio";
import { validateAudioBlob } from "@/lib/audio-validator";

interface CallSimulatorProps {
  onAudioStreamReady: (audio: ValidatedAudio) => Promise<void>;
  isAnalyzing: boolean;
  onCallStateChange?: (state: "IDLE" | "INCOMING" | "CONNECTED" | "ANALYZING" | "ENDED", scenario: VoiceLibraryScenario | null) => void;
}

export function CallSimulator({ onAudioStreamReady, isAnalyzing, onCallStateChange }: CallSimulatorProps) {
  const [callState, setCallState] = useState<"IDLE" | "INCOMING" | "CONNECTED" | "ENDED">("IDLE");
  const [activeScenario, setActiveScenario] = useState<VoiceLibraryScenario>(VOICE_LIBRARY[2]); // Default to clone_01
  const [callDuration, setCallDuration] = useState<number>(0);
  const [audioPlaybackActive, setAudioPlaybackActive] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

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

  const handleTriggerIncoming = (scenario: VoiceLibraryScenario) => {
    setActiveScenario(scenario);
    setCallState("INCOMING");
    if (onCallStateChange) onCallStateChange("INCOMING", scenario);
  };

  const handleRandomIncoming = () => {
    const randIdx = Math.floor(Math.random() * VOICE_LIBRARY.length);
    handleTriggerIncoming(VOICE_LIBRARY[randIdx]);
  };

  const handleAccept = async () => {
    setCallState("CONNECTED");
    setAudioPlaybackActive(true);
    if (onCallStateChange) onCallStateChange("CONNECTED", activeScenario);

    try {
      // 1. Fetch real recording from the Voice Library
      const res = await fetch(activeScenario.audioUrl);
      const audioBlob = await res.blob();

      // 2. Play actual voice recording audibly through the speakers
      if (audioElementRef.current) {
        audioElementRef.current.src = activeScenario.audioUrl;
        audioElementRef.current.play().catch(() => {});
      }

      // 3. Convert & validate into standard 16-bit PCM WAV
      const validation = await validateAudioBlob(audioBlob, "upload", activeScenario.audioUrl.split("/").pop());
      if (validation.success) {
        // 4. Send the exact voice audio into VoiceGuard's real ML pipeline
        await onAudioStreamReady(validation.data);
      }
    } catch (err) {
      console.error("Failed to load voice recording:", err);
    }
  };

  const handleHangup = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setAudioPlaybackActive(false);
    setCallState("ENDED");
    if (onCallStateChange) onCallStateChange("ENDED", activeScenario);
    setTimeout(() => {
      setCallState("IDLE");
      if (onCallStateChange) onCallStateChange("IDLE", null);
    }, 1200);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="rounded-2xl border border-emerald-950 bg-slate-950/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      <audio ref={audioElementRef} onEnded={() => setAudioPlaybackActive(false)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              TELEPHONY INTERCEPTION // LIVE CALL PRESENTATION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Listen to the incoming voice recording — VoiceGuard silently intercepts & analyzes the audio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callState === "IDLE" && (
            <button
              onClick={handleRandomIncoming}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/60 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
              <span>SIMULATE RANDOM CALL</span>
            </button>
          )}

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            VOIP INTERCEPTOR ACTIVE
          </span>
        </div>
      </div>

      {/* Preset Call Cards (When IDLE or ENDED) */}
      {(callState === "IDLE" || callState === "ENDED") && (
        <div className="space-y-3">
          <div className="text-xs font-mono text-slate-400">Select Voice Library Recording:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {VOICE_LIBRARY.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleTriggerIncoming(scenario)}
                className={`p-3.5 rounded-xl border border-slate-900 bg-slate-950/70 text-left transition-all cursor-pointer hover:bg-slate-900/60 ${
                  scenario.category === "CLONE"
                    ? "hover:border-red-500/80"
                    : scenario.category === "REPLAY"
                    ? "hover:border-orange-500/80"
                    : "hover:border-emerald-500/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold text-slate-200 truncate">{scenario.title}</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">{scenario.callerNumber}</div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ACT 1: Incoming Call Presentation (Cinematic Ringing Experience) */}
      {callState === "INCOMING" && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-bounce">
              <PhoneCall className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>INCOMING TELEPHONY STREAM...</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">{activeScenario.callerLabel}</div>
              <div className="text-xs font-mono text-slate-300 flex items-center gap-2 mt-1">
                <span>{activeScenario.callerNumber}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {activeScenario.locationInfo}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>ANSWER CALL</span>
            </button>
            <button
              onClick={handleHangup}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4 text-red-400" />
              <span>DECLINE</span>
            </button>
          </div>
        </div>
      )}

      {/* ACT 2: Active Call Audio In Progress */}
      {callState === "CONNECTED" && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-xs font-mono font-bold text-slate-200">
                ACTIVE CALL: {activeScenario.callerLabel}{" "}
                <span className="text-emerald-400 font-mono">[{formatDuration(callDuration)}]</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Playing authentic recording from Voice Library</span>
                {audioPlaybackActive && (
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" /> [VOICE PLAYING]
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Silent Intercept Active</span>
            </span>

            <button
              onClick={handleHangup}
              className="px-4 py-1.5 rounded-lg bg-red-950/80 border border-red-500/50 hover:bg-red-900/80 text-red-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>HANG UP</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
