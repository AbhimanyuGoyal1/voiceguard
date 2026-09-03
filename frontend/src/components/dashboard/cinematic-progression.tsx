"use client";

import { useState, useEffect } from "react";
import { Cpu, CheckCircle2, ShieldAlert, AlertTriangle, Fingerprint, Activity, Radio, Lock } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

export type AnalysisStage =
  | "IDLE"
  | "VOICE_CAPTURED"
  | "EXTRACTING_SIGNATURE"
  | "SPEAKER_VERIFICATION"
  | "AUTHENTICITY_ANALYSIS"
  | "ACOUSTIC_EVIDENCE"
  | "RISK_EVALUATION"
  | "REVEAL_VERDICT";

interface CinematicProgressionProps {
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  onRevealComplete?: () => void;
}

export function CinematicProgression({ isAnalyzing, analysisResult }: CinematicProgressionProps) {
  const [currentStage, setCurrentStage] = useState<AnalysisStage>("IDLE");
  const [suspicionText, setSuspicionText] = useState<string>("");

  useEffect(() => {
    if (!isAnalyzing && !analysisResult) {
      setCurrentStage("IDLE");
      setSuspicionText("");
      return;
    }

    if (isAnalyzing) {
      setCurrentStage("VOICE_CAPTURED");
      setSuspicionText("Intercepting 16kHz audio stream from VoIP bridge...");

      const t1 = setTimeout(() => {
        setCurrentStage("EXTRACTING_SIGNATURE");
        setSuspicionText("Extracting 192-d ECAPA-TDNN acoustic embeddings...");
      }, 600);

      const t2 = setTimeout(() => {
        setCurrentStage("SPEAKER_VERIFICATION");
        setSuspicionText("Comparing vector cosine distance against enrolled primary identity...");
      }, 1200);

      const t3 = setTimeout(() => {
        setCurrentStage("AUTHENTICITY_ANALYSIS");
        setSuspicionText("Analyzing high-frequency spectral roll-off and neural vocoder artifacts...");
      }, 1800);

      const t4 = setTimeout(() => {
        setCurrentStage("ACOUSTIC_EVIDENCE");
        setSuspicionText("Evaluating acoustic temporal continuity and phase anomalies...");
      }, 2400);

      const t5 = setTimeout(() => {
        setCurrentStage("RISK_EVALUATION");
        setSuspicionText("Computing authoritative multi-signal risk matrix...");
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }

    if (!isAnalyzing && analysisResult) {
      setCurrentStage("REVEAL_VERDICT");
      const isHigh = analysisResult.risk.level === "CRITICAL" || analysisResult.risk.level === "HIGH";
      if (isHigh) {
        setSuspicionText("THREAT DETECTED: Speaker identity matched, but acoustic authenticity is synthetic!");
      } else {
        setSuspicionText("IDENTITY VERIFIED: Organic vocal dynamics and valid enrolled voiceprint.");
      }
    }
  }, [isAnalyzing, analysisResult]);

  if (currentStage === "IDLE") return null;

  const isComplete = currentStage === "REVEAL_VERDICT" && analysisResult !== null;
  const isCritical = analysisResult?.risk.level === "CRITICAL";
  const isHigh = analysisResult?.risk.level === "HIGH";

  return (
    <div className={`p-5 rounded-2xl border bg-slate-950/90 backdrop-blur-md transition-all duration-300 ${
      isComplete && (isCritical || isHigh)
        ? "border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
        : isComplete
        ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        : "border-cyan-500/30"
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Stage Title & Suspicion Narrative */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isComplete ? (
              isCritical || isHigh ? (
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )
            ) : (
              <Activity className="w-5 h-5 text-cyan-400 animate-spin" />
            )}
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              {isComplete
                ? isCritical
                  ? "ACT 4 // THE REVEAL: AI VOICE CLONE ATTACK DETECTED"
                  : isHigh
                  ? "ACT 4 // THE REVEAL: REPLAY TRANSMISSION DETECTED"
                  : "ACT 4 // THE REVEAL: AUTHENTIC USER VERIFIED"
                : `ACT 3 // VOICEGUARD ANALYSIS: ${currentStage.replace(/_/g, " ")}`}
            </span>
          </div>

          <p className="text-xs font-mono text-slate-300">
            {suspicionText}
          </p>
        </div>

        {/* Analysis Pipeline Step Indicators */}
        <div className="flex items-center gap-2">
          {[
            { id: "VOICE_CAPTURED", label: "CAPTURE" },
            { id: "SPEAKER_VERIFICATION", label: "SPEAKER" },
            { id: "AUTHENTICITY_ANALYSIS", label: "AUTHENTICITY" },
            { id: "ACOUSTIC_EVIDENCE", label: "EVIDENCE" },
            { id: "RISK_EVALUATION", label: "RISK" },
          ].map((st) => {
            const isPassed =
              currentStage === "REVEAL_VERDICT" ||
              (currentStage === "RISK_EVALUATION" && st.id !== "REVEAL_VERDICT") ||
              (currentStage === "ACOUSTIC_EVIDENCE" && ["VOICE_CAPTURED", "SPEAKER_VERIFICATION", "AUTHENTICITY_ANALYSIS", "ACOUSTIC_EVIDENCE"].includes(st.id)) ||
              (currentStage === "AUTHENTICITY_ANALYSIS" && ["VOICE_CAPTURED", "SPEAKER_VERIFICATION", "AUTHENTICITY_ANALYSIS"].includes(st.id)) ||
              (currentStage === "SPEAKER_VERIFICATION" && ["VOICE_CAPTURED", "SPEAKER_VERIFICATION"].includes(st.id)) ||
              currentStage === st.id;

            return (
              <div
                key={st.id}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                  isPassed
                    ? isComplete && (isCritical || isHigh)
                      ? "bg-red-950/80 border border-red-500/50 text-red-300"
                      : "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
                    : "bg-slate-900 border border-slate-800 text-slate-500"
                }`}
              >
                {st.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
