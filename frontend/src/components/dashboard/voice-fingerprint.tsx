"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Fingerprint, RefreshCw, Sparkles, Crosshair, HelpCircle } from "lucide-react";

export interface FingerprintPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  type: "enrolled" | "genuine" | "synthetic" | "impostor" | "current";
  identity: string;
}

interface VoiceFingerprintProps {
  scenarioId?: string;
  refreshTrigger?: number;
}

export function VoiceFingerprint({ scenarioId, refreshTrigger }: VoiceFingerprintProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [points, setPoints] = useState<FingerprintPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<FingerprintPoint | null>(null);

  const fetchProjection = async () => {
    setIsLoading(true);
    try {
      const url = scenarioId
        ? `http://localhost:8000/api/fingerprint?scenario_id=${scenarioId}`
        : "http://localhost:8000/api/fingerprint";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPoints(data);
      }
    } catch {
      // Fallback local PCA representation
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjection();
  }, [scenarioId, refreshTrigger]);

  // D3 2D Scatter Projection Visualization
  useEffect(() => {
    if (!svgRef.current || points.length === 0) return;

    const width = 500;
    const height = 320;
    const margin = { top: 20, right: 20, bottom: 30, left: 30 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const xScale = d3
      .scaleLinear()
      .domain([-100, 100])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([-100, 100])
      .range([height - margin.bottom, margin.top]);

    // Grid lines
    const gGrid = svg.append("g").attr("class", "grid-lines").attr("opacity", 0.15);

    gGrid
      .append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "4 4");

    gGrid
      .append("line")
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("stroke", "#94a3b8")
      .attr("stroke-dasharray", "4 4");

    // Color palette per cluster type
    const getColor = (type: string) => {
      switch (type) {
        case "enrolled":
          return "#22d3ee"; // Cyan
        case "genuine":
          return "#10b981"; // Emerald
        case "synthetic":
          return "#ef4444"; // Red
        case "impostor":
          return "#f59e0b"; // Amber
        default:
          return "#a855f7"; // Purple for current
      }
    };

    // Render points
    const gPoints = svg.append("g").attr("class", "points");

    gPoints
      .selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => (d.type === "enrolled" ? 8 : d.type === "current" ? 9 : 5.5))
      .attr("fill", (d) => getColor(d.type))
      .attr("stroke", (d) => (d.type === "current" || d.type === "enrolled" ? "#ffffff" : "#0f172a"))
      .attr("stroke-width", (d) => (d.type === "current" || d.type === "enrolled" ? 2 : 1))
      .attr("opacity", 0.9)
      .style("cursor", "pointer")
      .on("click", (_, d) => setSelectedPoint(d))
      .append("title")
      .text((d) => `${d.label} (${d.identity})\n[PCA: ${d.x}, ${d.y}]`);

    // Render point labels for enrolled & current
    gPoints
      .selectAll("text")
      .data(points.filter((p) => p.type === "enrolled" || p.type === "current"))
      .enter()
      .append("text")
      .attr("x", (d) => xScale(d.x) + 12)
      .attr("y", (d) => yScale(d.y) + 4)
      .text((d) => (d.type === "enrolled" ? "Enrolled Base" : "Target Input"))
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("fill", (d) => getColor(d.type))
      .attr("font-weight", "bold");
  }, [points]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              VOICE FINGERPRINT // 2D PCA ACOUSTIC PROJECTION
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Dimensionality-reduced 192-d speaker embedding space (D3.js)
            </p>
          </div>
        </div>

        <button
          onClick={fetchProjection}
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
          title="Recalculate Projection"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 2D Projection D3 SVG Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2 relative bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 flex items-center justify-center min-h-[320px]">
          <svg ref={svgRef} className="w-full h-full max-h-[320px]" />
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Cluster Legend & Point Inspector */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">Embedding Clusters</div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Enrolled Voiceprint</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Genuine Samples (Tight)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-300">Synthetic Clones (Offset)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">Impostor Human (Distant)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-white" />
                <span className="text-slate-300 font-bold">Target Audio Vector</span>
              </div>
            </div>
          </div>

          {/* Selected Point Metadata */}
          {selectedPoint && (
            <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 text-xs font-mono space-y-1">
              <div className="font-bold text-cyan-300">{selectedPoint.label}</div>
              <div className="text-slate-400">Identity: {selectedPoint.identity}</div>
              <div className="text-slate-500 text-[11px]">
                PCA Coordinates: [{selectedPoint.x}, {selectedPoint.y}]
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
