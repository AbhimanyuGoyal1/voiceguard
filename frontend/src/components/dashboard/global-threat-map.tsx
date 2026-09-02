"use client";

import { useEffect, useState } from "react";
import { Globe2, ShieldAlert, AlertTriangle, Radio, RefreshCw, Layers, ShieldCheck } from "lucide-react";

export interface ThreatNode {
  id: string;
  region: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  attack_type: string;
  target_sector: string;
  incident_volume_24h: number;
  severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  status: "ACTIVE_CAMPAIGN" | "MITIGATED" | "MONITORING";
}

export function GlobalThreatMap() {
  const [threatNodes, setThreatNodes] = useState<ThreatNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ThreatNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchThreatMap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/threat-map");
      if (res.ok) {
        const data = await res.json();
        setThreatNodes(data.threat_nodes || []);
        if (data.threat_nodes && data.threat_nodes.length > 0) {
          setSelectedNode(data.threat_nodes[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatMap();
  }, []);

  // Map latitude/longitude to flat projection coordinates [0..100%]
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: `${x}%`, y: `${y}%` };
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "text-red-400 border-red-500/40 bg-red-950/40";
      case "HIGH":
        return "text-orange-400 border-orange-500/40 bg-orange-950/40";
      case "MODERATE":
        return "text-yellow-400 border-yellow-500/40 bg-yellow-950/40";
      default:
        return "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Top Header with MANDATORY SIMULATED THREAT INTELLIGENCE Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              GLOBAL THREAT MAP // VOICE ATTACK TELEMETRY
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Interactive geographic cluster overview of synthetic voice campaigns
            </p>
          </div>
        </div>

        {/* MANDATORY SIMULATED NOTICE PER RULES.MD */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/60 text-amber-300 font-mono text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            SIMULATED THREAT INTELLIGENCE
          </span>

          <button
            onClick={fetchThreatMap}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Refresh Threat Nodes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Interactive Map Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Flat World Coordinate Canvas */}
        <div className="lg:col-span-2 relative bg-slate-950/90 rounded-xl border border-slate-800/90 min-h-[300px] h-72 overflow-hidden flex items-center justify-center p-4">
          {/* Subtle World Map Silhouette Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Continents Outline (Geometric Vector Backdrop) */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 500">
            <path
              d="M150,120 Q220,100 280,140 Q320,200 290,260 Q200,280 160,220 Z M250,300 Q320,320 310,420 Q240,460 210,380 Z M480,100 Q580,80 620,150 Q560,220 490,180 Z M490,240 Q580,240 590,380 Q520,440 460,340 Z M650,120 Q880,90 920,220 Q780,260 680,200 Z M760,320 Q860,330 840,420 Q760,440 730,370 Z"
              fill="#38bdf8"
            />
          </svg>

          {/* Interactive Geographic Threat Pulse Pins */}
          {threatNodes.map((node) => {
            const { x, y } = projectCoords(node.lat, node.lng);
            const isSelected = selectedNode?.id === node.id;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ left: x, top: y }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                title={`${node.city}, ${node.country} - ${node.attack_type}`}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`absolute w-6 h-6 rounded-full opacity-60 animate-ping ${
                      node.severity === "CRITICAL"
                        ? "bg-red-500"
                        : node.severity === "HIGH"
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    }`}
                  />
                  <span
                    className={`relative w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                      isSelected
                        ? "bg-white ring-2 ring-cyan-400 scale-125"
                        : node.severity === "CRITICAL"
                        ? "bg-red-500"
                        : node.severity === "HIGH"
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Threat Node Inspector */}
        <div className="space-y-3">
          {selectedNode ? (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {selectedNode.city}, {selectedNode.country}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{selectedNode.region}</div>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(selectedNode.severity)}`}>
                  {selectedNode.severity}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Attack Vector: </span>
                  <span className="text-cyan-300 font-semibold">{selectedNode.attack_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Sector: </span>
                  <span className="text-slate-300">{selectedNode.target_sector}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-2">
                  <span className="text-slate-500">24h Impersonation Vol:</span>
                  <span className="text-slate-200 font-bold">{selectedNode.incident_volume_24h} incidents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Campaign Status:</span>
                  <span className="text-amber-400 font-bold">{selectedNode.status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/60 text-center text-xs font-mono text-slate-500">
              Select a threat hotspot node on the map to inspect campaign telemetry.
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-500 p-2 text-center">
            * Purely contextual visualization. Geographic telemetry does not alter local voice risk scores.
          </div>
        </div>
      </div>
    </div>
  );
}
