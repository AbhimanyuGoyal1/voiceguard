"use client";

import { useEffect, useRef } from "react";

export type VisualizationState = "IDLE" | "RECORDING" | "ANALYZING" | "COMPLETE";

interface LiveWaveformProps {
  analyser: AnalyserNode | null;
  state: VisualizationState;
  height?: number;
  className?: string;
}

export function LiveWaveform({
  analyser,
  state,
  height = 96,
  className = "",
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width > 0 ? rect.width : 800;
    const displayHeight = height;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    let phase = 0;

    const render = () => {
      const width = displayWidth;
      const h = displayHeight;

      ctx.clearRect(0, 0, width, h);

      // Background grid lines for technical operations center feel
      ctx.strokeStyle = "rgba(39, 39, 42, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();

      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      if (state === "COMPLETE") {
        // Draw static baseline grid once and do NOT loop rAF
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(width, h / 2);
        ctx.strokeStyle = "rgba(16, 185, 129, 0.6)"; // emerald-500 static line
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return;
      }

      if (state === "RECORDING" && analyser) {
        // Real-time Oscilloscope Time Domain Data
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#06b6d4"; // cyan-500
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(6, 182, 212, 0.6)";

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // 0.0 to 2.0
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, h / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (state === "ANALYZING") {
        // Dynamic scanning radar sweep waveform
        phase += 0.08;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#a855f7"; // purple-500
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(168, 85, 247, 0.7)";

        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI); // taper edges
          const y =
            h / 2 +
            Math.sin(normX * 18 + phase) * 20 * envelope +
            Math.cos(normX * 36 - phase * 1.5) * 8 * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (state === "IDLE") {
        // Calm subtle standby wave
        phase += 0.02;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(113, 113, 122, 0.6)"; // zinc-500
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const y = h / 2 + Math.sin(normX * 8 + phase) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyser, state, height]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800/80 ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="w-full h-full block"
      />
      {/* State label badge */}
      <div className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-zinc-400">
        Live Oscilloscope: <span className="text-cyan-400 font-semibold">{state}</span>
      </div>
    </div>
  );
}
