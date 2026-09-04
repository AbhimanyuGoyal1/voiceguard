"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, CheckCircle, AlertTriangle, ShieldCheck, Cpu, RefreshCw, Volume2, Play, Check } from "lucide-react";

export interface CaptureRecord {
  capture_id: string;
  sequence: number;
  filename: string;
  rel_path: string;
  result_file: string;
  timestamp: string;
  duration_seconds: number;
  risk_score: number;
  risk_level: string;
  verdict: string;
  synthetic_probability: number;
  user_ground_truth: "genuine" | "synthetic" | null;
}

interface CapturesManagerProps {
  onRecalibrated?: () => void;
}

export function CapturesManager({ onRecalibrated }: CapturesManagerProps) {
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [labelingId, setLabelingId] = useState<string | null>(null);
  const [recalibrating, setRecalibrating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchCaptures = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/captures");
      if (res.ok) {
        const data: CaptureRecord[] = await res.json();
        setCaptures(data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaptures();
    const interval = setInterval(fetchCaptures, 3000);
    return () => clearInterval(interval);
  }, [fetchCaptures]);

  const handleLabel = async (captureId: string, label: "human" | "ai") => {
    setLabelingId(captureId);
    setStatusMsg(null);
    try {
      const res = await fetch(`http://localhost:8000/api/captures/${captureId}/label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, auto_recalibrate: true }),
      });
      if (res.ok) {
        setStatusMsg(`Capture ${captureId} successfully labeled as ${label.toUpperCase()} and calibrated!`);
        await fetchCaptures();
        if (onRecalibrated) onRecalibrated();
      }
    } catch (e) {
      setStatusMsg("Failed to label capture.");
    } finally {
      setLabelingId(null);
    }
  };

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    setStatusMsg(null);
    try {
      const res = await fetch("http://localhost:8000/api/captures/recalibrate", {
        method: "POST",
      });
      if (res.ok) {
        setStatusMsg("Model baseline successfully recalibrated across active samples!");
        if (onRecalibrated) onRecalibrated();
      }
    } catch {
      setStatusMsg("Failed to recalibrate model.");
    } finally {
      setRecalibrating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            Live Microphone Calibration Queue
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recordings from your microphone are saved one-by-one to <code className="text-cyan-300 bg-cyan-950/40 px-1 py-0.5 rounded">audiosamples/captures/</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCaptures}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleRecalibrate}
            disabled={recalibrating}
            className="px-3 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Cpu className={`w-3.5 h-3.5 ${recalibrating ? "animate-spin" : ""}`} />
            Recalibrate Model
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-xs text-cyan-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* List of Captures */}
      {captures.length === 0 ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-white/10 rounded-xl bg-slate-950/40">
          <Mic className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-mono text-slate-400">NO MICROPHONE TEST RECORDINGS ARCHIVED YET</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Switch to the <strong>Upload & Live Mic</strong> tab above, click the microphone button, and speak.
            Every recording and its detailed acoustic analysis will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-slate-950/50">
          {captures.map((cap) => {
            const isSynth = cap.verdict === "SYNTHETIC" || cap.risk_score > 50;
            const isPlaying = activePlayingId === cap.capture_id;

            return (
              <div
                key={cap.capture_id}
                className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Left: ID & Audio info */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                    #{String(cap.sequence).padStart(3, "0")}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-200">{cap.filename}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({cap.duration_seconds.toFixed(1)}s)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Verdict: <strong className={isSynth ? "text-rose-400" : "text-emerald-400"}>{cap.verdict}</strong></span>
                      <span>•</span>
                      <span>Risk: <strong className="text-slate-300">{cap.risk_score}/100</strong></span>
                      <span>•</span>
                      <span>Synth: <strong className="text-slate-300">{cap.synthetic_probability.toFixed(1)}%</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Audio listen & Ground truth labeling */}
                <div className="flex items-center gap-2">
                  {/* Play audio */}
                  <audio
                    id={`audio_${cap.capture_id}`}
                    src={`http://localhost:8000/api/captures/${cap.capture_id}/audio`}
                    onEnded={() => setActivePlayingId(null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById(`audio_${cap.capture_id}`) as HTMLAudioElement;
                      if (el) {
                        if (isPlaying) {
                          el.pause();
                          setActivePlayingId(null);
                        } else {
                          el.play();
                          setActivePlayingId(cap.capture_id);
                        }
                      }
                    }}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs transition-colors cursor-pointer"
                    title="Play recorded audio"
                  >
                    {isPlaying ? <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  {/* Ground Truth Status / Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => handleLabel(cap.capture_id, "human")}
                      disabled={labelingId === cap.capture_id}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        cap.user_ground_truth === "genuine"
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      }`}
                    >
                      {cap.user_ground_truth === "genuine" ? "✓ Human" : "Human"}
                    </button>
                    <button
                      onClick={() => handleLabel(cap.capture_id, "ai")}
                      disabled={labelingId === cap.capture_id}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                        cap.user_ground_truth === "synthetic"
                          ? "bg-rose-500 text-white font-bold shadow-sm"
                          : "text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                      }`}
                    >
                      {cap.user_ground_truth === "synthetic" ? "✓ AI / Synth" : "AI"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
