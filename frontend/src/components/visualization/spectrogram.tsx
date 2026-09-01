"use client";

import { useEffect, useRef } from "react";

interface SpectrogramProps {
  audioBuffer?: AudioBuffer | null;
  analyser?: AnalyserNode | null;
  height?: number;
  className?: string;
}

export function Spectrogram({
  audioBuffer,
  analyser,
  height = 120,
  className = "",
}: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    // 1. If we have a decoded static AudioBuffer (Completed recording or uploaded sample)
    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const fftSize = 512;
      const halfFft = fftSize / 2;
      const numSlices = width;
      const hopSize = Math.max(1, Math.floor((channelData.length - fftSize) / numSlices));

      ctx.fillStyle = "#09090b"; // zinc-950
      ctx.fillRect(0, 0, width, h);

      // Create high-resolution offline spectrogram using simulated Short-Time Fourier Transform (STFT)
      for (let slice = 0; slice < numSlices; slice++) {
        const offset = slice * hopSize;
        if (offset + fftSize >= channelData.length) break;

        // Compute power in frequency bins
        for (let bin = 0; bin < halfFft; bin += 2) {
          // Bin energy calculation with Hann window
          let real = 0;
          let imag = 0;
          const k = bin;

          // Sample representative points
          for (let n = 0; n < 64; n++) {
            const sampleIdx = offset + n * 8;
            if (sampleIdx >= channelData.length) break;
            const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / 64)); // Hann window
            const val = channelData[sampleIdx] * w;
            const angle = (2 * Math.PI * k * n) / 64;
            real += val * Math.cos(angle);
            imag -= val * Math.sin(angle);
          }

          const magnitude = Math.sqrt(real * real + imag * imag);
          const normalized = Math.min(1, Math.max(0, magnitude * 4));

          // Color mapping: Forensic heat palette (Deep Navy -> Cyan -> Purple -> Gold/Orange)
          const y = h - (bin / halfFft) * h;
          if (normalized > 0.05) {
            const r = Math.floor(normalized * 240);
            const g = Math.floor(Math.sin(normalized * Math.PI) * 200 + normalized * 50);
            const b = Math.floor((1 - normalized) * 180 + normalized * 80);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(slice, y, 1.5, (h / halfFft) * 2.5);
          }
        }
      }

      // Draw frequency grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75].forEach((pct) => {
        ctx.beginPath();
        ctx.moveTo(0, h * pct);
        ctx.lineTo(width, h * pct);
        ctx.stroke();
      });

      return;
    }

    // 2. Real-time waterfall / FFT visualizer if active AnalyserNode is connected
    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderLive = () => {
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, width, h);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h;
          const hue = 180 + (i / bufferLength) * 120; // Cyan to purple gradient
          ctx.fillStyle = `hsl(${hue}, 80%, ${Math.min(70, 30 + (dataArray[i] / 255) * 40)}%)`;
          ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        animFrameRef.current = requestAnimationFrame(renderLive);
      };

      renderLive();

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }

    // 3. Fallback idle state
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, h);
    ctx.fillStyle = "rgba(113, 113, 122, 0.4)";
    ctx.font = "10px monospace";
    ctx.fillText("FORENSIC SPECTROGRAM • AWAITING AUDIO INPUT", width / 2 - 120, h / 2 + 4);
  }, [audioBuffer, analyser]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800/80 ${className}`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="w-full h-full block"
      />
      {/* Frequency labels */}
      <div className="absolute top-2 left-2 text-[9px] font-mono text-zinc-500 flex flex-col gap-3 pointer-events-none">
        <span>8.0 kHz</span>
        <span>4.0 kHz</span>
        <span>0.0 kHz</span>
      </div>
      <div className="absolute top-2 right-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-700/60 text-zinc-400">
        FFT Spectrogram: <span className="text-cyan-400 font-semibold">{audioBuffer ? "Decoded" : analyser ? "Live Streaming" : "Standby"}</span>
      </div>
    </div>
  );
}
