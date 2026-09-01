"use client";

import { useState, useRef, DragEvent, useEffect } from "react";
import { Mic, Square, Upload, AlertTriangle, FileAudio, CheckCircle2, RefreshCw } from "lucide-react";
import { ValidatedAudio, AudioValidationError } from "@/types/audio";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { AudioPlayer } from "./audio-player";
import { AudioVisualizer } from "@/components/visualization/audio-visualizer";

interface AudioCaptureProps {
  onAudioCaptured?: (audio: ValidatedAudio | null) => void;
}

export function AudioCapture({ onAudioCaptured }: AudioCaptureProps) {
  const [activeTab, setActiveTab] = useState<"mic" | "upload">("mic");
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    isRecording,
    recordingTime,
    audioData,
    error,
    isValidating,
    audioLevel,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
    handleFileUpload,
  } = useAudioRecorder();

  useEffect(() => {
    if (onAudioCaptured) {
      onAudioCaptured(audioData);
    }
  }, [audioData, onAudioCaptured]);

  const handleReset = () => {
    resetRecording();
    setCurrentTime(0);
    if (onAudioCaptured) onAudioCaptured(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const vizState = isRecording
    ? "RECORDING"
    : isValidating
    ? "ANALYZING"
    : audioData
    ? "COMPLETE"
    : "IDLE";

  return (
    <div className="w-full space-y-6">
      {/* Audio Visualizer Stage (PR-02) */}
      <AudioVisualizer
        state={vizState}
        analyser={analyserNode}
        audio={audioData}
        currentTime={currentTime}
        onSeek={(t) => setCurrentTime(t)}
      />

      {/* Audio Ingestion & Capture Controls */}
      <div className="w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md rounded-2xl p-6 shadow-xl space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <Mic className="h-4 w-4 text-cyan-400" />
              Audio Ingestion & Forensic Capture
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Capture live microphone audio or upload a forensic voice sample (WAV, MP3, WebM, OGG, FLAC)
            </p>
          </div>

          {!audioData && (
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("mic")}
                disabled={isRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "mic"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Microphone
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                disabled={isRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "upload"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Upload File
              </button>
            </div>
          )}
        </div>

        {/* Main Interactive Stage */}
        {!audioData ? (
          activeTab === "mic" ? (
            /* Microphone Stage */
            <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-6">
              <div className="relative">
                {/* Pulsing ring when recording */}
                {isRecording && (
                  <div
                    className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"
                    style={{
                      transform: `scale(${1 + audioLevel * 0.8})`,
                      transition: "transform 0.1s ease-out",
                    }}
                  />
                )}

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isRecording
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse"
                      : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-cyan-500/20 hover:scale-105 active:scale-95"
                  }`}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? (
                    <Square className="h-7 w-7 fill-current" />
                  ) : (
                    <Mic className="h-8 w-8 stroke-[2.2]" />
                  )}
                </button>
              </div>

              {/* Recording Feedback / VU Meter */}
              <div className="text-center space-y-2">
                <div className="text-sm font-semibold tracking-wide">
                  {isRecording ? (
                    <span className="text-rose-400 flex items-center justify-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      Recording in progress: {formatTimer(recordingTime)}
                    </span>
                  ) : (
                    <span className="text-zinc-300">Click to Begin Voice Capture</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 max-w-sm">
                  {isRecording
                    ? "Speak clearly for at least 2 seconds. Click the square button when finished."
                    : "Ensure your microphone is connected. Minimum recommended duration is 2-5 seconds."}
                </p>

                {/* Real-time VU bar */}
                {isRecording && (
                  <div className="w-48 mx-auto mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                      style={{ width: `${Math.min(100, Math.max(5, audioLevel * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload Stage */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 bg-zinc-950/60 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                isDragging
                  ? "border-cyan-400 bg-cyan-950/20"
                  : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/90"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                accept="audio/*,.wav,.mp3,.ogg,.webm,.m4a,.flac"
                className="hidden"
              />
              <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                Drop audio sample here or <span className="text-cyan-400 underline underline-offset-2">browse files</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Supports WAV, MP3, WebM, OGG, FLAC (Minimum 1.5s duration)
              </p>
            </div>
          )
        ) : (
          /* Validated Audio Review Stage */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Audio Captured & Validated Successfully
              </span>
              <span className="font-mono text-zinc-400 uppercase text-[10px]">
                Source: {audioData.source}
              </span>
            </div>

            <AudioPlayer audio={audioData} onReset={handleReset} />
          </div>
        )}

        {/* Validation in progress */}
        {isValidating && (
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-400 py-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Decoding and validating audio stream via Web Audio API...</span>
          </div>
        )}

        {/* Error Card */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{error.title}</span>
            </div>
            <p className="text-xs text-zinc-400">{error.message}</p>
            {error.actionHint && (
              <div className="text-[11px] text-amber-300/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-1">
                💡 <span className="font-semibold">Action:</span> {error.actionHint}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
