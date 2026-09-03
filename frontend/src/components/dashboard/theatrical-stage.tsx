"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, Activity, Lock, Search, Radio, KeyRound } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { VoiceLibraryScenario } from "@/lib/voice-library";

export type CinematicAct =
  | "ACT1_RINGING"
  | "ACT2_VOICE_STREAM"
  | "ACT3_INVESTIGATION"
  | "ACT4_REVEAL"
  | "ACT5_EVIDENCE"
  | "ACT6_CHALLENGE"
  | "ACT7_INCIDENT";

interface TheatricalStageProps {
  scenario: VoiceLibraryScenario | null;
  callState: "IDLE" | "INCOMING" | "CONNECTED" | "ANALYZING" | "ENDED";
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  onAdvanceToChallenge?: () => void;
  onAdvanceToIncident?: () => void;
}

export function TheatricalStage({
  scenario,
  callState,
  isAnalyzing,
  analysisResult,
  onAdvanceToChallenge,
  onAdvanceToIncident,
}: TheatricalStageProps) {
  const [investigationStep, setInvestigationStep] = useState<number>(0);
  const [revealUnlocked, setRevealUnlocked] = useState<boolean>(false);

  // Staged suspense timing for ACT 3 & ACT 4
  useEffect(() => {
    if (isAnalyzing) {
      setRevealUnlocked(false);
      setInvestigationStep(1);
      const t1 = setTimeout(() => setInvestigationStep(2), 700);
      const t2 = setTimeout(() => setInvestigationStep(3), 1400);
      const t3 = setTimeout(() => setInvestigationStep(4), 2100);
      const t4 = setTimeout(() => setInvestigationStep(5), 2800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else if (analysisResult) {
      // Pause before dramatic reveal
      const revealTimer = setTimeout(() => {
        setRevealUnlocked(true);
      }, 400);
      return () => clearTimeout(revealTimer);
    } else {
      setInvestigationStep(0);
      setRevealUnlocked(false);
    }
  }, [isAnalyzing, analysisResult]);

  if (!scenario && !analysisResult) return null;

  const isClone = analysisResult?.risk.level === "CRITICAL";
  const isReplay = analysisResult?.risk.level === "HIGH";
  const isMismatch =
    analysisResult?.speaker.status === "MISMATCH" ||
    (analysisResult?.speaker.match_score !== undefined && analysisResult.speaker.match_score < 50);
  const isThreat = isClone || isReplay;

  const getTheatricalVerdict = () => {
    if (isClone) {
      return {
        badge: "SECURITY INCIDENT TRIGGERED",
        badgeStyle: "text-red-400 bg-red-950/80 border-red-500/40",
        title: "THREAT DETECTED: AI VOICE CLONE",
        titleColor: "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]",
        cardBorder:
          "border-red-500/60 bg-gradient-to-b from-red-950/50 via-slate-950 to-slate-950 shadow-[0_0_60px_rgba(239,68,68,0.25)]",
        glowBar: "bg-gradient-to-r from-transparent via-red-500 to-transparent",
        desc: "The caller voice acoustically matches enrolled identity 'Primary User', but exhibits high synthetic deepfake probability with neural vocoder spectral artifacts.",
        action: "TERMINATE",
        actionColor: "text-red-500",
      };
    }
    if (isReplay) {
      return {
        badge: "SUSPICIOUS ACTIVITY FLAGGED",
        badgeStyle: "text-orange-400 bg-orange-950/80 border-orange-500/40",
        title: "THREAT DETECTED: SUSPICIOUS TRANSMISSION",
        titleColor: "text-orange-400 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]",
        cardBorder:
          "border-orange-500/60 bg-gradient-to-b from-orange-950/50 via-slate-950 to-slate-950 shadow-[0_0_60px_rgba(249,115,22,0.25)]",
        glowBar: "bg-gradient-to-r from-transparent via-orange-500 to-transparent",
        desc: "Anomalous audio transmission detected with elevated spectral and acoustic irregularity indicators.",
        action: "CHALLENGE",
        actionColor: "text-orange-400",
      };
    }
    if (isMismatch) {
      return {
        badge: "UNAUTHORIZED IDENTITY DETECTED",
        badgeStyle: "text-amber-400 bg-amber-950/80 border-amber-500/40",
        title: "IDENTITY UNVERIFIED: CALLER MISMATCH",
        titleColor: "text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]",
        cardBorder:
          "border-amber-500/50 bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 shadow-[0_0_45px_rgba(245,158,11,0.2)]",
        glowBar: "bg-gradient-to-r from-transparent via-amber-400 to-transparent",
        desc: "Acoustic embedding does NOT match authorized enrolled identity 'Primary User'. Caller identity is unverified. Additional authentication required.",
        action: "CHALLENGE",
        actionColor: "text-amber-400",
      };
    }
    return {
      badge: "IDENTITY & AUTHENTICITY CONFIRMED",
      badgeStyle: "text-emerald-400 bg-emerald-950/80 border-emerald-500/40",
      title: "CALL VERIFIED: AUTHENTIC PRIMARY USER",
      titleColor: "text-emerald-400",
      cardBorder:
        "border-emerald-500/50 bg-gradient-to-b from-emerald-950/40 via-slate-950 to-slate-950 shadow-[0_0_45px_rgba(16,185,129,0.18)]",
      glowBar: "bg-gradient-to-r from-transparent via-emerald-400 to-transparent",
      desc: "Acoustic signature matches enrolled Primary User with organic wideband vocal harmonics.",
      action: "ALLOW",
      actionColor: "text-emerald-400",
    };
  };

  const verdict = getTheatricalVerdict();

  return (
    <div className="w-full space-y-6">
      {/* ACT 3: SOMETHING IS WRONG — SILENT PROGRESSIVE INVESTIGATION */}
      {isAnalyzing && (
        <div className="relative rounded-3xl border border-cyan-900/60 bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-950 p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Subtle Ambient Scan Line */}
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 font-mono text-xs uppercase tracking-widest">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              <span>ACT 3 // SILENT INVESTIGATION IN PROGRESS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-100 uppercase">
              VoiceGuard Intercept Active
            </h2>
            <p className="text-sm font-mono text-slate-400 max-w-xl mx-auto">
              Extracting acoustic characteristics from audio stream without disrupting caller audio session...
            </p>

            {/* Deliberate Step-by-Step Pacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2">
              <div
                className={`p-3.5 rounded-xl border font-mono text-xs transition-all duration-500 ${
                  investigationStep >= 1
                    ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200"
                    : "border-slate-800/60 bg-slate-950/40 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>VOICE SIGNATURE EXTRACTION</span>
                  <span>{investigationStep >= 1 ? "192-d TENSOR" : "PENDING"}</span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border font-mono text-xs transition-all duration-500 ${
                  investigationStep >= 2
                    ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200"
                    : "border-slate-800/60 bg-slate-950/40 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>SPEAKER VERIFICATION (ECAPA)</span>
                  <span>{investigationStep >= 2 ? "MATCHING..." : "QUEUED"}</span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border font-mono text-xs transition-all duration-500 ${
                  investigationStep >= 3
                    ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200"
                    : "border-slate-800/60 bg-slate-950/40 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>SPECTRAL ROLL-OFF & VOCODER</span>
                  <span>{investigationStep >= 3 ? "SCANNING..." : "QUEUED"}</span>
                </div>
              </div>

              <div
                className={`p-3.5 rounded-xl border font-mono text-xs transition-all duration-500 ${
                  investigationStep >= 4
                    ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200"
                    : "border-slate-800/60 bg-slate-950/40 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>MULTI-SIGNAL RISK CORRELATION</span>
                  <span>{investigationStep >= 4 ? "COMPUTING..." : "QUEUED"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACT 4: THE REVEAL — DRAMATIC TITLE CARD MOMENT */}
      {revealUnlocked && analysisResult && (
        <div
          className={`relative rounded-3xl p-8 sm:p-10 border transition-all duration-700 backdrop-blur-2xl overflow-hidden ${verdict.cardBorder}`}
        >
          {/* Top glowing ambient highlight */}
          <div className={`absolute inset-x-0 top-0 h-1 ${verdict.glowBar}`} />

          <div className="max-w-4xl mx-auto space-y-6 text-center">
            {/* Theatrical Subtitle Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-xs uppercase tracking-widest font-bold">
              <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 border ${verdict.badgeStyle}`}>
                {isThreat ? (
                  <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                ) : isMismatch ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {verdict.badge}
              </span>
            </div>

            {/* Huge Cinematic Title */}
            <div>
              <h1 className={`text-3xl sm:text-5xl font-black font-mono tracking-tight uppercase ${verdict.titleColor}`}>
                {verdict.title}
              </h1>
              <p className="text-sm sm:text-base font-mono text-slate-300 mt-2 max-w-2xl mx-auto">
                {verdict.desc}
              </p>
            </div>

            {/* Crucial Core Metrics Strip (From Real Pipeline) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Speaker Match</div>
                <div className="text-2xl font-mono font-bold text-slate-100 tabular-nums">
                  {analysisResult.speaker.match_score.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{analysisResult.speaker.status}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Synthetic Risk</div>
                <div
                  className={`text-2xl font-mono font-bold tabular-nums ${
                    analysisResult.authenticity.synthetic_probability >= 50 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {analysisResult.authenticity.synthetic_probability.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{analysisResult.authenticity.classification}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Authoritative Risk</div>
                <div
                  className={`text-2xl font-mono font-bold tabular-nums ${
                    isThreat ? "text-red-500" : isMismatch ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {analysisResult.risk.score}/100
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">LEVEL: {analysisResult.risk.level}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase">Security Action</div>
                <div className={`text-2xl font-mono font-bold ${verdict.actionColor}`}>
                  {verdict.action}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">POLICY ENFORCED</div>
              </div>
            </div>

            {/* Theatrical Tagline */}
            <div className="pt-2 text-xs font-mono text-slate-400 italic">
              "You heard the voice. VoiceGuard detected the synthetic clone."
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
