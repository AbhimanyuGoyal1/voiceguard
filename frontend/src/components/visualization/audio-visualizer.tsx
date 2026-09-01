"use client";

import { useState } from "react";
import { Activity, BarChart2, Radio } from "lucide-react";
import { ValidatedAudio } from "@/types/audio";
import { LiveWaveform, VisualizationState } from "./live-waveform";
import { StaticWaveform } from "./static-waveform";
import { Spectrogram } from "./spectrogram";

interface AudioVisualizerProps {
  state: VisualizationState;
  analyser?: AnalyserNode | null;
  audio?: ValidatedAudio | null;
  currentTime?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export function AudioVisualizer({
  state,
  analyser,
  audio,
  currentTime = 0,
  onSeek,
  className = "",
}: AudioVisualizerProps) {
  const [viewMode, setViewMode] = useState<"dual" | "waveform" | "spectrogram">("dual");

  return (
    <div className={`w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-4 ${className}`}>
      {/* Visualizer Panel Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              Forensic Audio Signal Analysis
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {state}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Oscilloscopic time-domain and Short-Time Fourier Transform (STFT) spectral analysis
            </p>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setViewMode("dual")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === "dual" ? "bg-zinc-800 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setViewMode("waveform")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === "waveform" ? "bg-zinc-800 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Waveform
          </button>
          <button
            onClick={() => setViewMode("spectrogram")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === "spectrogram" ? "bg-zinc-800 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Spectrogram
          </button>
        </div>
      </div>

      {/* Visualizer Display Area */}
      <div className="space-y-3">
        {/* Waveform View */}
        {(viewMode === "dual" || viewMode === "waveform") && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-cyan-400" />
                Time-Domain Oscilloscope (Amplitude)
              </span>
              <span>{audio ? `${audio.metadata.duration}s PCM` : state === "RECORDING" ? "Live Stream" : "Standby"}</span>
            </div>
            {audio ? (
              <StaticWaveform
                audioBuffer={audio.audioBuffer}
                currentTime={currentTime}
                onSeek={onSeek}
                height={90}
              />
            ) : (
              <LiveWaveform
                analyser={analyser || null}
                state={state}
                height={90}
              />
            )}
          </div>
        )}

        {/* Spectrogram View */}
        {(viewMode === "dual" || viewMode === "spectrogram") && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-3 w-3 text-purple-400" />
                Frequency Spectrum / STFT Spectrogram (0 - 8 kHz)
              </span>
              <span>{audio ? "Full FFT Resolution" : state === "RECORDING" ? "Real-Time FFT" : "Standby"}</span>
            </div>
            <Spectrogram
              audioBuffer={audio?.audioBuffer || null}
              analyser={analyser || null}
              height={110}
            />
          </div>
        )}
      </div>
    </div>
  );
}
