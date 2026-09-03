"use client";

import { useState, useRef, DragEvent, useEffect, useCallback } from "react";
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
  const prevAudioRef = useRef<ValidatedAudio | null>(null);

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

  // Notify parent only when audioData reference or actual blob changes
  useEffect(() => {
    if (audioData !== prevAudioRef.current) {
      prevAudioRef.current = audioData;
      if (onAudioCaptured) {
        onAudioCaptured(audioData);
      }
    }
  }, [audioData, onAudioCaptured]);

  const handleReset = () => {
    resetRecording();
    setCurrentTime(0);
    prevAudioRef.current = null;
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

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("mic")}
              disabled={isRecording}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "mic"
                  ? "bg-zinc-800 text-cyan-400 shadow-sm"
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
                  ? "bg-zinc-800 text-cyan-400 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              File Upload
            </button>
          </div>
        </div>

        {/* Dynamic Capture Surface */}
        {activeTab === "mic" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            {/* Record / Stop Button & Pulse Ring */}
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <div className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
              )}

              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isValidating}
                className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 scale-105"
                    : "bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-cyan-500/20 hover:scale-105"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-7 w-7 fill-current" />
                    <span className="text-[10px] font-bold mt-1 font-mono">STOP</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-7 w-7" />
                    <span className="text-[10px] font-bold mt-1 font-mono">RECORD</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Timer & Decibel VU meter */}
            <div className="text-center space-y-2">
              <div className="font-mono text-2xl font-bold tracking-wider text-zinc-100">
                {formatTimer(recordingTime)}
              </div>
              <p className="text-xs text-zinc-400">
                {isRecording
                  ? "Capturing forensic audio stream... Speak naturally into your microphone."
                  : "Click to start recording voice input (min 1.0s, recommended 3-5s)."}
              </p>

              {/* Audio VU level indicator */}
              {isRecording && (
                <div className="w-48 h-2 bg-zinc-950 rounded-full overflow-hidden mx-auto border border-zinc-800">
                  <div className="h-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-red-500 w-full animate-pulse transition-all duration-150" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Drag & Drop File Upload Surface */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-cyan-500 bg-cyan-500/5"
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.wav,.mp3,.webm,.ogg,.flac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-200">
                  Click to upload or drag & drop audio sample
                </p>
                <p className="text-xs text-zinc-500 font-mono">
                  WAV, MP3, WebM, OGG, FLAC (16kHz recommended, max 25MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Progress Indicator */}
        {isValidating && (
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-3">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span>Validating audio sample and computing time-domain waveforms...</span>
          </div>
        )}

        {/* Validation Error Feedback Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold font-mono">{error.title}</div>
              <p className="text-zinc-300">{error.message}</p>
              {error.actionHint && (
                <p className="text-red-400 font-mono text-[11px] mt-1">Hint: {error.actionHint}</p>
              )}
            </div>
          </div>
        )}

        {/* Captured Audio Review Player (PR-01) */}
        {audioData && !isValidating && (
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Validated Forensic Sample Ready
              </span>
              <button
                onClick={handleReset}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Re-record
              </button>
            </div>
            <AudioPlayer audio={audioData} onReset={handleReset} />
          </div>
        )}
      </div>
    </div>
  );
}
