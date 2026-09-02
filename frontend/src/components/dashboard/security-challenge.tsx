"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, KeyRound, Mic, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { AnalysisResult } from "@/types/analysis";

interface SecurityChallengeProps {
  analysis: AnalysisResult | null;
  onChallengeComplete?: (passed: boolean) => void;
}

export function SecurityChallenge({ analysis, onChallengeComplete }: SecurityChallengeProps) {
  const [challenge, setChallenge] = useState<{ id: string; phrase: string; phonetic_complexity: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{ status: "PASS" | "FAIL"; verdict: string; recommendation: string } | null>(null);

  const riskScore = analysis?.risk.score ?? 0;
  const isHighRisk = riskScore >= 50;

  useEffect(() => {
    // Fetch deterministic security challenge
    async function loadChallenge() {
      try {
        const res = await fetch("http://localhost:8000/api/challenge/next?index=0");
        if (res.ok) {
          const data = await res.json();
          setChallenge(data);
        }
      } catch {
        setChallenge({
          id: "chal_01",
          phrase: "Blue mountains remember seven.",
          phonetic_complexity: "High",
        });
      }
    }
    loadChallenge();
  }, []);

  if (!isHighRisk && !challengeResult) return null;

  const handleSimulateChallengeResponse = async (simulatePass: boolean) => {
    if (!analysis) return;
    setIsVerifying(true);

    try {
      await new Promise((r) => setTimeout(r, 450));
      // In simulate pass: genuine speaker dynamics (spk: 92%, synth: 8%)
      // In simulate fail: deepfake dynamics (spk: 95%, synth: 88%)
      const reqPayload = simulatePass
        ? { speaker_match_score: 92.0, synthetic_probability: 8.0 }
        : { speaker_match_score: analysis.speaker.match_score, synthetic_probability: analysis.authenticity.synthetic_probability };

      const res = await fetch("http://localhost:8000/api/challenge/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqPayload),
      });

      if (res.ok) {
        const result = await res.json();
        setChallengeResult(result);
        if (onChallengeComplete) {
          onChallengeComplete(result.status === "PASS");
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-yellow-700/60 bg-slate-900/90 backdrop-blur-md p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase flex items-center gap-2">
              ACTIVE DEFENSE // CALLER VERIFICATION REQUIRED
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Elevated threat level detected ({riskScore}/100) — Dynamic acoustic challenge triggered
            </p>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-yellow-950/60 border border-yellow-700/60 text-yellow-400 font-semibold">
          CHALLENGE-RESPONSE
        </span>
      </div>

      {/* Challenge Phrase Box */}
      {challenge && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Security Verification Phrase</span>
            <span className="text-slate-500">{challenge.phonetic_complexity}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-yellow-600/30 text-center">
            <span className="text-base font-bold font-mono text-yellow-300 tracking-wide">
              "{challenge.phrase}"
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans">
            Caller must read the exact phrase aloud. Acoustic phonetics are cross-evaluated for neural vocoder latency and vocal identity.
          </p>
        </div>
      )}

      {/* Verification Result Banner */}
      {challengeResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            challengeResult.status === "PASS"
              ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/50 bg-red-950/30 text-red-300"
          }`}
        >
          {challengeResult.status === "PASS" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase">{challengeResult.verdict}</div>
            <div className="text-xs font-sans text-slate-300">{challengeResult.recommendation}</div>
          </div>
        </div>
      )}

      {/* Interactive Verification Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <button
          onClick={() => handleSimulateChallengeResponse(true)}
          disabled={isVerifying}
          className="px-4 py-2 rounded-xl bg-emerald-950/70 border border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PASS RESPONSE</span>
        </button>

        <button
          onClick={() => handleSimulateChallengeResponse(false)}
          disabled={isVerifying}
          className="px-4 py-2 rounded-xl bg-red-950/70 border border-red-600/50 hover:bg-red-900/60 text-red-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          <span>FAIL RESPONSE</span>
        </button>
      </div>
    </div>
  );
}
