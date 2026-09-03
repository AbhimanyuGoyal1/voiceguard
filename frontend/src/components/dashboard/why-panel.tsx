"use client";

import { useState } from "react";
import { AnalysisResult } from "@/types/analysis";
import { HelpCircle, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2, Layers } from "lucide-react";

interface WhyPanelProps {
  analysis: AnalysisResult | null;
}

export function WhyPanel({ analysis }: WhyPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);

  if (!analysis) return null;

  const speaker = analysis.speaker;
  const auth = analysis.authenticity;
  const risk = analysis.risk;
  const ev = analysis.evidence;

  // Determine explainability factors directly from computed results
  const isCloneAttack = auth.synthetic_probability >= 70 && speaker.match_score >= 70;
  const isSyntheticImpostor = auth.synthetic_probability >= 70 && speaker.match_score < 70;
  const isUnknownHuman = auth.synthetic_probability < 50 && speaker.match_score < 50;

  const getVerdictHeadline = () => {
    if (isCloneAttack) {
      return {
        title: "CRITICAL: AI Voice Clone Attack",
        desc: `The voice matches enrolled identity '${speaker.enrolled_identity}' (${speaker.match_score}% match), but exhibits high synthetic speech probability (${auth.synthetic_probability}%). This pattern confirms a targeted neural voice cloning attempt.`,
        color: "text-red-400 bg-red-950/40 border-red-500/40",
      };
    } else if (isSyntheticImpostor) {
      return {
        title: "HIGH THREAT: Synthetic Audio Spoof",
        desc: `High synthetic probability (${auth.synthetic_probability}%) with neural vocoder spectral artifacts (${ev.spectral_anomaly}%). Impostor voice does not match enrolled user.`,
        color: "text-orange-400 bg-orange-950/40 border-orange-500/40",
      };
    } else if (isUnknownHuman) {
      return {
        title: "MODERATE RISK: Unverified Organic Speaker",
        desc: `Natural human vocal characteristics detected (${auth.human_probability}% human), but identity match is low (${speaker.match_score}%). Unauthorized caller.`,
        color: "text-yellow-400 bg-yellow-950/40 border-yellow-500/40",
      };
    } else {
      return {
        title: "VERIFIED: Genuine Enrolled Speaker",
        desc: `Acoustic voiceprint matches enrolled identity '${speaker.enrolled_identity}' (${speaker.match_score}%) with organic harmonic frequencies (${auth.human_probability}% human).`,
        color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/40",
      };
    }
  };

  const verdict = getVerdictHeadline();

  const factors = [
    {
      id: "speaker",
      name: "Speaker Verification (ECAPA-TDNN)",
      value: `${speaker.match_score}%`,
      status: speaker.status,
      weight: "30% Weight",
      detail: `Cosine similarity against enrolled reference voice '${speaker.enrolled_identity}'.`,
    },
    {
      id: "authenticity",
      name: "Anti-Spoof Synthetic Detection (AASIST)",
      value: `${auth.synthetic_probability}%`,
      status: auth.classification,
      weight: "50% Weight",
      detail: "Deepfake / TTS acoustic anomaly analysis across high-frequency bands.",
    },
    {
      id: "spectral",
      name: "Spectral Anomaly Roll-off",
      value: `${ev.spectral_anomaly}%`,
      status: ev.spectral_anomaly > 50 ? "ABNORMAL" : "NORMAL",
      weight: "10% Weight",
      detail: "Neural vocoder high-frequency steep cutoff (>7kHz harmonic drop-off).",
    },
    {
      id: "prosody",
      name: "Prosody & Pitch Regularity",
      value: `${ev.prosody_anomaly}%`,
      status: ev.prosody_anomaly > 50 ? "UNNATURAL" : "ORGANIC",
      weight: "10% Weight",
      detail: "Frame-to-frame energy distribution variance and robotic pitch consistency.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-300">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 transition-colors border-b border-slate-800 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              WHY WAS THIS FLAGGED? — Forensic Evidence Breakdown
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Deterministic evidence tracing from ML signals to risk decision
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono px-2.5 py-1 rounded border font-semibold ${verdict.color}`}>
            {verdict.title.split(":")[0]}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-6 space-y-6">
          {/* Key Insight Highlight: Identity ≠ Authenticity */}
          <div className={`p-4 rounded-xl border ${verdict.color}`}>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              {risk.level === "CRITICAL" ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {verdict.title}
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans mt-1">
              {verdict.desc}
            </p>
          </div>

          {/* Computed Signal Attribution Grid */}
          <div>
            <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Authoritative Signal Contributions
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {factors.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFactor(selectedFactor === f.id ? null : f.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedFactor === f.id
                      ? "border-cyan-500 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-semibold text-slate-300">{f.name}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{f.value}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mb-2">
                    <span>{f.status}</span>
                    <span className="text-slate-400">{f.weight}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
