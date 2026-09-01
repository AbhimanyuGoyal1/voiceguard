# DEMO.md — VoiceGuard Golden Path

## 1. Purpose

This document defines the canonical VoiceGuard hackathon demonstration.

The demo should communicate one core idea:

> **A familiar voice is not automatically a trustworthy voice.**

VoiceGuard combines speaker identity verification with audio authenticity detection to determine whether a voice should be trusted.

The demo is designed for a **~90–180 second guided presentation**.

The golden path must be deterministic, rehearsable, and resilient to external-service failures.

---

# 2. Demo Rules

The demo must:

* use the real VoiceGuard dashboard
* use the same analysis pipeline for Live Mode and Demo Mode
* visibly distinguish Live Mode from Demo Mode
* never fabricate ML results
* never present simulated threat intelligence as real
* never require an external AI API
* never require live TTS/STT
* never depend on network availability
* never rely on randomness for the primary demo
* recover gracefully from degraded states

The presenter should never need to debug or configure infrastructure during the demo.

---

# 3. Recommended Demo Environment

Before presenting:

### Required

* Frontend running
* Backend running
* ML models loaded
* Browser microphone permission granted
* Enrolled reference speaker available
* Demo fixtures verified
* SQLite available
* Browser tab opened to VoiceGuard dashboard

### Optional

* LLM API key
* Internet connection
* additional visual features

The demo must remain fully functional without optional services.

---

# 4. Starting State

The dashboard opens in:

```text
DEMO MODE
SYSTEM READY
```

The interface should show:

```text
VOICEGUARD
VOICE SECURITY OPERATIONS CENTER

SYSTEM STATUS
● ONLINE

MODE
DEMO

THREAT LEVEL
MONITORING
```

The main dashboard contains:

* Risk Score
* Speaker Verification
* Audio Authenticity
* Live Waveform
* Spectrogram
* WHY? evidence panel
* Threat Timeline
* Attack Simulator
* Incident/response area

Tier 3/4 panels may be collapsed initially if necessary to keep the primary narrative clear.

---

# 5. Golden Path

## Scene 1 — Establish the Problem

**Presenter action:** Open the dashboard.

**Narrative:**

> "VoiceGuard isn't trying to answer just 'who is speaking?' It asks a more important security question: can this voice actually be trusted?"

Show the dashboard in monitoring state.

Highlight:

```text
Speaker Identity
+
Audio Authenticity
=
Impersonation Risk
```

---

# 6. Scene 2 — Genuine Voice

**Scenario:** `GENUINE_VOICE`

**Presenter action:**

Launch:

```text
ATTACK SIMULATOR
→ Genuine Voice
→ RUN SCENARIO
```

The dashboard should animate through:

```text
VOICE DETECTED
      ↓
AUDIO ANALYSIS
      ↓
SPEAKER VERIFICATION
      ↓
AUTHENTICITY CHECK
      ↓
RISK CALCULATION
      ↓
VERIFIED
```

Expected conceptual result:

```text
Speaker Match
HIGH

Authenticity
GENUINE

Risk
LOW
```

The actual numbers come from the deterministic fixture.

The waveform and spectrogram should visibly correspond to the scenario.

The timeline should populate with the analysis events.

---

# 7. Scene 3 — Introduce the Attack

Transition to:

```text
ATTACK SIMULATOR
```

Select:

```text
AI VOICE CLONE
```

Narrative:

> "Now we're going to make the attack interesting. The attacker has cloned the enrolled person's voice."

Trigger:

```text
LAUNCH ATTACK
```

---

# 8. Scene 4 — The AI Clone

The dashboard should replay the analysis pipeline:

```text
VOICE DETECTED
      ↓
SPEAKER MATCH
      ↓
AUTHENTICITY ANALYSIS
      ↓
ANOMALIES DETECTED
      ↓
RISK ESCALATION
      ↓
THREAT CONFIRMED
```

The important visual moment is:

```text
Speaker Match:
HIGH

Authenticity:
LIKELY SYNTHETIC

Risk:
CRITICAL / HIGH
```

The point is that **speaker identity alone looks convincing**.

The authenticity detector exposes the problem.

---

# 9. Scene 5 — WHY?

Click:

```text
WHY?
```

The evidence panel expands.

It should show the actual structured evidence available from the analysis.

Example structure:

```text
WHY WAS THIS FLAGGED?

01  Speaker similarity
    High match

02  Synthetic probability
    Elevated

03  Spectral anomalies
    Detected

04  Prosody irregularity
    Detected

05  Temporal artifacts
    Detected
```

Only implemented signals may appear as real evidence.

Unavailable signals must be labeled accordingly.

The explanation should be deterministic and generated from the evidence.

Example narrative:

> "The voice closely matches the enrolled speaker, but the audio exhibits characteristics associated with synthetic generation. Identity matches; authenticity does not."

---

# 10. Scene 6 — Active Defense

If the risk level is sufficiently high, display:

```text
CALLER VERIFICATION REQUIRED
```

Trigger:

```text
ISSUE SECURITY CHALLENGE
```

The system selects a phrase from the fixed challenge pool.

Example:

```text
SECURITY CHALLENGE

Please repeat:

"Blue mountains remember seven."
```

The response is then processed through the same speaker/authenticity pipeline.

---

# 11. Scene 7 — Challenge Failure

For the golden demo, use the deterministic failing response fixture.

Expected result:

```text
CHALLENGE FAILED

Speaker Integrity
FAILED

Authenticity
SUSPICIOUS

Threat Status
BLOCKED
```

Narrative:

> "The attacker may have cloned the voice, but they can't reliably satisfy the additional verification layer."

The exact displayed result must come from the fixture.

---

# 12. Scene 8 — Threat Timeline

Expand the timeline.

Show the progression:

```text
Voice detected
     ↓
Speaker identified
     ↓
Authenticity analysis started
     ↓
Synthetic indicators detected
     ↓
Risk escalated
     ↓
Verification challenge issued
     ↓
Challenge failed
     ↓
Threat confirmed
     ↓
Session blocked
```

Clicking a timeline event should update the corresponding dashboard state.

This provides a visual explanation of **how the decision evolved**, rather than only showing the final score.

---

# 13. Scene 9 — Incident Report

Open:

```text
INCIDENT REPORT
```

Display:

```text
Incident ID
Threat Type
Speaker Match
Authenticity
Risk Score
Risk Level
Evidence
Challenge Result
Recommended Action
Timeline
```

Narrative:

> "Instead of simply saying 'this is fake,' VoiceGuard leaves behind an explainable incident record."

PDF export may be demonstrated if stable.

It is not part of the critical golden path.

---

# 14. Scene 10 — Attack History

Open:

```text
ATTACK HISTORY
```

Show that the previous attack has been recorded.

Example:

```text
CRITICAL   AI VOICE CLONE
HIGH       REPLAY ATTACK
LOW        GENUINE VOICE
```

Selecting an incident opens the corresponding report.

---

# 15. Optional Visual Features

If implemented and stable, briefly show:

### Voice Fingerprint

Display the 2D embedding projection.

Point out:

> "These points represent speaker embeddings. Similar voices cluster together, while the comparison voice moves away from the enrolled speaker."

The visualization must use real embedding relationships.

---

### Global Threat Map

Display the map only with a clearly visible:

```text
SIMULATED THREAT INTELLIGENCE
```

Never describe simulated activity as real-world threat intelligence.

---

# 16. Optional AI Analyst

If the LLM service is available:

Open:

```text
AI SECURITY ANALYST
```

Provide the structured incident data.

The analyst explains the already-computed decision.

It must not change:

* risk score
* threat level
* speaker match
* authenticity result
* blocking decision

If the LLM fails or exceeds the timeout:

```text
ANALYST: FALLBACK
```

The deterministic explanation is displayed instead.

This failure must not interrupt the demo.

---

# 17. Live Mode Demonstration

If time permits after the deterministic golden path:

Switch:

```text
DEMO → LIVE
```

Record a short genuine clip.

The dashboard should perform:

```text
MIC
 ↓
AUDIO CAPTURE
 ↓
PREPROCESSING
 ↓
ECAPA-TDNN
 ↓
ANTI-SPOOF MODEL
 ↓
RISK ENGINE
 ↓
LIVE DASHBOARD
```

The presenter may briefly show:

* live waveform
* spectrogram
* speaker similarity
* authenticity result
* risk score
* WHY? panel

Live Mode is a bonus after the deterministic demo path is secured.

---

# 18. Demo Scenarios

VoiceGuard contains four deterministic scenarios.

## Scenario 1 — Genuine Voice

Purpose:

Establish the normal trusted case.

Expected characteristics:

```text
Speaker: MATCH
Authenticity: GENUINE
Risk: LOW
```

---

## Scenario 2 — AI Voice Clone

Purpose:

Demonstrate the core differentiator.

Expected characteristics:

```text
Speaker: HIGH MATCH
Authenticity: SYNTHETIC
Risk: HIGH / CRITICAL
```

This is the **primary attack scenario**.

---

## Scenario 3 — Replay Attack

Purpose:

Demonstrate that VoiceGuard is not limited to AI-generated speech.

Expected characteristics:

```text
Speaker: potentially matching
Authenticity: suspicious / replay indicators
Risk: elevated
```

Exact values come from the fixture.

---

## Scenario 4 — Unknown Speaker

Purpose:

Demonstrate identity mismatch without requiring synthetic audio.

Expected characteristics:

```text
Speaker: MISMATCH
Authenticity: potentially genuine
Risk: elevated
```

This demonstrates that VoiceGuard considers multiple independent signals.

---

# 19. Primary Judge Narrative

The entire demo should reinforce this progression:

```text
NORMAL VOICE
     ↓
VOICE CLONED
     ↓
IDENTITY STILL MATCHES
     ↓
AUTHENTICITY DOES NOT
     ↓
RISK ENGINE CONNECTS THE SIGNALS
     ↓
SYSTEM EXPLAINS WHY
     ↓
ACTIVE CHALLENGE
     ↓
ATTACK FAILS
     ↓
INCIDENT RECORDED
```

The key moment is:

> **"The speaker verification system says this sounds like the person. The authenticity system says something is wrong."**

That is the reason VoiceGuard exists.

---

# 20. What Judges Should Notice

The presenter should intentionally point out:

### 1. Two independent signals

Identity and authenticity are separate.

### 2. Explainability

The risk score can be traced back to evidence.

### 3. Active defense

VoiceGuard does not stop at detection.

### 4. Deterministic Demo Mode

The complete attack can be demonstrated without depending on external APIs.

### 5. Graceful degradation

The system visibly knows when evidence is unavailable.

### 6. Real ML underneath

Live Mode uses actual pretrained models rather than fabricated results.

---

# 21. Failure-Safe Demo Procedure

If Live Mode fails during presentation:

```text
Switch → DEMO MODE
```

Do not debug during the presentation.

If an external API fails:

```text
Continue using deterministic fallback.
```

If the database fails:

```text
Continue the live analysis.
```

If a model fails:

```text
Show PARTIAL_ANALYSIS
→ switch to Demo Mode if necessary.
```

The demo must never depend on recovering a failed external service.

---

# 22. Golden Path Definition

The canonical golden path is:

```text
START
 ↓
Dashboard
 ↓
Genuine Voice
 ↓
AI Voice Clone
 ↓
Risk Escalation
 ↓
WHY?
 ↓
Security Challenge
 ↓
Challenge Failure
 ↓
Threat Confirmed
 ↓
Incident Report
 ↓
Attack History
 ↓
END
```

This is the path that must be rehearsed and hardened before presentation.

---

# 23. Golden Path Success Criteria

The golden path is considered ready only when:

* [ ] It completes from beginning to end without unexpected interaction.
* [ ] Demo Mode is deterministic.
* [ ] All Tier 1 dashboard components work.
* [ ] AI Voice Clone scenario clearly demonstrates the core differentiator.
* [ ] WHY? traces back to actual fixture/evidence values.
* [ ] Security Challenge works.
* [ ] Incident Report works.
* [ ] Attack History works.
* [ ] No external AI API is required.
* [ ] No fabricated ML result is displayed as real.
* [ ] Simulated threat intelligence is visibly labeled.
* [ ] Every major transition is visually clear.
* [ ] The entire path has been successfully rehearsed at least twice.

---

# 24. Demo Philosophy

The demo is not intended to prove that VoiceGuard is production-ready.

It is intended to prove that the architecture can:

**detect → explain → challenge → respond → record**

to a voice impersonation attack.

The presentation should make the judges remember one thing:

> **A cloned voice can fool identity verification. VoiceGuard checks whether the voice itself can be trusted.**
