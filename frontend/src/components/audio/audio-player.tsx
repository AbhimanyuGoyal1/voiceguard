"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { ValidatedAudio } from "@/types/audio";

interface AudioPlayerProps {
  audio: ValidatedAudio;
  onReset?: () => void;
}

export function AudioPlayer({ audio, onReset }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);

    const el = audioRef.current;
    if (!el) return;

    el.currentTime = 0;
    el.pause();

    const handleTimeUpdate = () => {
      setCurrentTime(el.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    el.addEventListener("timeupdate", handleTimeUpdate);
    el.addEventListener("ended", handleEnded);

    return () => {
      el.removeEventListener("timeupdate", handleTimeUpdate);
      el.removeEventListener("ended", handleEnded);
    };
  }, [audio.url, audio.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? "0" : ""}${s}.${ms}`;
  };

  return (
    <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
      <audio ref={audioRef} src={audio.url} preload="auto" />

      {/* Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={togglePlay}
            className="h-10 w-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-cyan-500/20"
            title={isPlaying ? "Pause Audio" : "Play Audio"}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
          <div>
            <div className="text-xs font-semibold text-zinc-200 truncate max-w-[200px] sm:max-w-xs">
              {audio.filename}
            </div>
            <div className="text-[11px] font-mono text-zinc-400">
              {formatTime(currentTime)} / {formatTime(audio.metadata.duration)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onReset && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              Re-record / Replace
            </button>
          )}
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={audio.metadata.duration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
        />
      </div>

      {/* Audio Signal Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-900 text-[11px]">
        <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/40">
          <span className="text-zinc-500 block">Sample Rate</span>
          <span className="font-mono text-zinc-300">{audio.metadata.sampleRate} Hz</span>
        </div>
        <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/40">
          <span className="text-zinc-500 block">Channels</span>
          <span className="font-mono text-zinc-300">
            {audio.metadata.channels === 1 ? "Mono (1ch)" : `Stereo (${audio.metadata.channels}ch)`}
          </span>
        </div>
        <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/40">
          <span className="text-zinc-500 block">RMS Energy</span>
          <span className="font-mono text-cyan-400">{audio.metadata.rmsLevel}</span>
        </div>
        <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/40">
          <span className="text-zinc-500 block">Peak Amplitude</span>
          <span className="font-mono text-cyan-400">{(audio.metadata.peakLevel * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
