"use client";

import { useState } from "react";
import { FileText, Download, ShieldAlert, CheckCircle2, AlertTriangle, Printer, Copy, Check, ExternalLink, X } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

interface IncidentReportProps {
  analysis: AnalysisResult | null;
  onClose?: () => void;
}

export function IncidentReport({ analysis, onClose }: IncidentReportProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!analysis) return null;

  const incidentId = `INC-${analysis.session_id.replace("session_", "").replace("demo_session_", "").slice(0, 8).toUpperCase()}`;
  const timestamp = new Date(analysis.timestamp).toUTCString();

  const risk = analysis.risk;
  const speaker = analysis.speaker;
  const auth = analysis.authenticity;
  const ev = analysis.evidence;

  const threatType =
    risk.level === "CRITICAL" && auth.synthetic_probability >= 70 && speaker.match_score >= 70
      ? "Targeted AI Voice Clone Attack (Deepfake Impersonation)"
      : auth.synthetic_probability >= 70
      ? "Synthetic Audio Injection (Vocoder Spoof)"
      : speaker.match_score < 50
      ? "Unauthorized Speaker / Identity Mismatch"
      : "Authentic Caller / No Threat Detected";

  const recommendedAction =
    risk.level === "CRITICAL"
      ? "IMMEDIATE BLOCK: Terminate active audio session. Add caller voiceprint to high-risk blacklist and trigger multi-factor out-of-band identity verification."
      : risk.level === "HIGH"
      ? "HOLD & ESCALATE: Require active biometric security challenge verification before allowing transaction authorization."
      : risk.level === "MODERATE"
      ? "STEP-UP VERIFICATION: Request secondary identity verification credentials."
      : "APPROVE: Caller voiceprint verified authentic against enrolled profile.";

  const handleCopySummary = () => {
    const text = `VOICEGUARD FORENSIC INCIDENT REPORT\nIncident ID: ${incidentId}\nTimestamp: ${timestamp}\nThreat Type: ${threatType}\nRisk Score: ${risk.score}/100 (${risk.level})\nSpeaker Match: ${speaker.match_score}%\nAuthenticity: ${auth.classification} (${auth.synthetic_probability}% synthetic)\nRecommended Action: ${recommendedAction}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 200);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-6 shadow-2xl space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-mono tracking-wide text-slate-100 uppercase">
                FORENSIC INCIDENT REPORT
              </h3>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {incidentId}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Deterministic security audit log & cryptographic evidence record
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY"}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </div>

      {/* Grid: Incident Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Incident Timestamp</div>
          <div className="text-xs font-mono font-semibold text-slate-200 mt-1">{timestamp}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Threat Severity</div>
          <div
            className={`text-xs font-mono font-bold mt-1 ${
              risk.level === "CRITICAL"
                ? "text-red-400"
                : risk.level === "HIGH"
                ? "text-orange-400"
                : risk.level === "MODERATE"
                ? "text-yellow-400"
                : "text-emerald-400"
            }`}
          >
            {risk.level} ({risk.score}/100)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Enrolled Speaker Profile</div>
          <div className="text-xs font-mono font-semibold text-slate-200 mt-1">
            {speaker.enrolled_identity || "Primary User"} ({speaker.match_score}%)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-[11px] font-mono text-slate-500 uppercase">Authenticity Classification</div>
          <div className="text-xs font-mono font-semibold text-slate-200 mt-1">
            {auth.classification} ({auth.synthetic_probability}% Synth)
          </div>
        </div>
      </div>

      {/* Threat Classification & Executive Summary */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase">Threat Classification</div>
        <div className="text-sm font-semibold font-mono text-cyan-300">{threatType}</div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed mt-1">
          {ev.summary}
        </p>
      </div>

      {/* Acoustic Forensic Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Signal Evidence */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Acoustic Artifact Evidence</div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Speaker Similarity (ECAPA-TDNN):</span>
              <span className="text-slate-200 font-bold">{speaker.match_score}% [{speaker.status}]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">Deepfake Probability (AASIST):</span>
              <span className="text-slate-200 font-bold">{auth.synthetic_probability}% [{auth.classification}]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400">High-Frequency Spectral Cutoff:</span>
              <span className="text-slate-200 font-bold">{ev.spectral_anomaly}% anomaly</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="text-slate-400">Prosody & Frame Variance:</span>
              <span className="text-slate-200 font-bold">{ev.prosody_anomaly}% anomaly</span>
            </div>
          </div>
        </div>

        {/* Actionable Security Recommendation */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Authoritative Remediation Guidance</div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-sans text-slate-200 leading-relaxed">
            {recommendedAction}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Defense Integrity: Zero external AI dependencies utilized. Authoritative decision verified mathematically.
          </div>
        </div>
      </div>
    </div>
  );
}
