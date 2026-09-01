"use client";

import { useEffect, useRef } from "react";

interface StaticWaveformProps {
  audioBuffer: AudioBuffer;
  currentTime?: number;
  onSeek?: (time: number) => void;
  height?: number;
  className?: string;
}

export function StaticWaveform({
  audioBuffer,
  currentTime = 0,
  onSeek,
  height = 96,
  className = "",
}: StaticWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    const amp = h / 2;

    ctx.clearRect(0, 0, width, h);

    // Grid
    ctx.strokeStyle = "rgba(39, 39, 42, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, amp);
    ctx.lineTo(width, amp);
    ctx.stroke();

    // Draw waveform bars
    const playheadX = duration > 0 ? (currentTime / duration) * width : 0;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = channelData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const y1 = Math.max(0, (1 + min) * amp);
      const y2 = Math.min(h, (1 + max) * amp);
      const barHeight = Math.max(1.5, y2 - y1);

      if (i <= playheadX) {
        ctx.fillStyle = "#06b6d4"; // cyan-500 (played)
      } else {
        ctx.fillStyle = "#3f3f46"; // zinc-700 (unplayed)
      }

      ctx.fillRect(i, y1, 1, barHeight);
    }

    // Playhead line
    if (playheadX > 0 && playheadX <= width) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [audioBuffer, currentTime]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !audioBuffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    onSeek(pct * audioBuffer.duration);
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800/80 ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        onClick={handleClick}
        className="w-full h-full block cursor-pointer"
      />
      <div className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-zinc-400">
        Captured Waveform <span className="text-cyan-400 font-semibold">• Click to Scrub</span>
      </div>
    </div>
  );
}
