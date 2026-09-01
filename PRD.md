# PRD.md — VoiceGuard Product Definition

## 1. Vision

VoiceGuard is a web-based AI voice-security and deepfake-defense platform demonstrating how a security system can detect and respond to voice impersonation attacks, particularly AI-generated and cloned voices.

The core question is not:

> **"Who is speaking?"**

It is:

> **"Can this voice be trusted?"**

VoiceGuard combines speaker identity verification with audio authenticity detection so that a convincing voice clone does not automatically pass an identity check.

The product is designed as a **2-day hackathon demonstration**, not as a production telecommunications security system.

---

# 2. Target Users

### Primary

Hackathon judges and technical evaluators experiencing a live or guided demonstration.

The product should therefore prioritize:

* immediate visual comprehension
* impressive but meaningful interaction
* technical credibility
* reliable demonstrations
* clear evidence
* visible system state

### Secondary

A security operator monitoring inbound calls for impersonation risk.

This persona exists primarily to guide:

* terminology
* dashboard structure
* UX decisions
* product framing

No production telecom integration is required for this build.

---

# 3. Problem

Voice cloning has made:

> "It sounds like them."

an unreliable trust signal.

Traditional voice-authentication systems primarily answer:

> "Does this voice match the enrolled speaker?"

That creates a weakness.

An attacker can generate a synthetic voice that closely matches a legitimate speaker.

Therefore:

```text
Speaker Match
      ≠
Authentic Voice
```

VoiceGuard addresses both questions independently.

---

# 4. Solution

VoiceGuard combines two independent ML signals:

```text
                AUDIO
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Speaker Verification   Authenticity
    ECAPA-TDNN           Detection
        │                   │
        └─────────┬─────────┘
                  ▼
             Risk Engine
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     Risk Score          Evidence
        │                   │
        └─────────┬─────────┘
                  ▼
            Threat State
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    Challenge   Timeline   Incident
```

The system then provides:

* explainable evidence
* active challenge-response defense
* attack simulation
* incident intelligence
* interactive visualizations
* deterministic Demo Mode

The ML signals are independent inputs.

The **Risk Engine** is responsible for the final security assessment.

The LLM, where available, is never authoritative.

---

# 5. Core Product Principle

VoiceGuard is fundamentally an **evidence-over-verdict** system.

The product should not simply say:

> `THREAT: 94`

It should show:

```text
THREAT DETECTED

Risk                    94
Confidence              High

Speaker Match           96%
Authenticity            91% Synthetic

Evidence
├── Strong speaker similarity
├── Synthetic-audio indicators
└── Challenge response failed
```

The user should be able to understand **why** the system reached its conclusion.

---

# 6. Feature Tiers

Features are prioritized for the 2-day build.

Implementation order is defined by `PHASES.md`.

---

## Tier 1 — Must Be Real and Rock-Solid

These form the demo-critical spine.

### 1. Live Threat Dashboard

Central command interface showing:

* current threat state
* risk score
* confidence
* active analysis
* speaker identity result
* authenticity result
* evidence
* system status

---

### 2. Speaker Verification

Real pretrained speaker verification.

Primary model:

**ECAPA-TDNN**

Responsibilities:

* speaker embedding generation
* enrolled speaker comparison
* similarity calculation
* thresholding/calibration

Enrolled speaker embeddings should be cached/precomputed where practical.

---

### 3. Deepfake / Authenticity Detection

Real pretrained anti-spoof/deepfake detection.

Potential model family:

* AASIST
* RawNet2
* another suitable pretrained anti-spoof model

Responsibilities:

* determine genuine vs synthetic characteristics
* produce a calibrated model signal
* expose evidence for downstream risk assessment

No large model training from scratch is planned.

---

### 4. Risk Score / Risk Engine

Combines validated signals into an actionable risk assessment.

Potential inputs:

* speaker similarity
* authenticity score
* audio anomalies
* challenge result
* other validated signals

The Risk Engine must:

* be deterministic
* use documented thresholds
* distinguish risk from confidence
* handle missing signals
* expose evidence
* remain independent of the LLM

---

### 5. Live Waveform + Spectrogram

Real-time audio visualization using browser audio capabilities.

The visualization should communicate:

* audio capture
* signal activity
* frequency characteristics
* analysis progress

It must not exist merely as decoration.

---

### 6. Explainable Detection — "WHY?"

Every significant threat decision should provide an evidence breakdown.

Example:

```text
WHY WAS THIS FLAGGED?

✓ Speaker similarity: HIGH
⚠ Synthetic indicators: HIGH
⚠ Challenge response: FAILED

Conclusion:
Voice strongly resembles enrolled speaker,
but authenticity signals indicate likely synthesis.
```

The explanation is generated from structured evidence.

It must not invent evidence.

---

### 7. Attack Simulator

Allows the user to trigger controlled attack scenarios.

Primary demonstration:

```text
Legitimate speaker
      ↓
Attack simulation
      ↓
AI voice clone
      ↓
VoiceGuard analysis
      ↓
Threat escalation
```

Attack assets may be pre-generated.

The live demo must not depend on external TTS availability.

---

### 8. Demo Mode

Four deterministic scenarios:

1. Genuine Voice
2. AI Voice Clone
3. Replay Attack
4. Unknown Speaker

Demo Mode must be available regardless of:

* microphone state
* ML service state
* database state
* external API availability

Identical scenario input must produce identical:

* scores
* evidence
* timeline
* state transitions

---

# 7. Tier 2 — Should Be Real, Graceful Degradation Allowed

## 9. Threat Timeline

Interactive event timeline showing meaningful system events.

Example:

```text
AUDIO_RECEIVED
        ↓
SPEAKER_ANALYSIS_STARTED
        ↓
AUTHENTICITY_ANALYSIS_STARTED
        ↓
SPEAKER_MATCH_UPDATED
        ↓
AUTHENTICITY_RESULT_RECEIVED
        ↓
RISK_RECALCULATED
        ↓
THREAT_CLASSIFIED
```

Where practical, this timeline should also function as a user-facing observability layer.

---

## 10. Security Challenge

Active-defense layer.

When suspicious activity is detected, VoiceGuard can request a challenge-response interaction.

The challenge result becomes another input to the Risk Engine.

Example:

```text
Threat detected
      ↓
Challenge issued
      ↓
Response received
      ↓
Response analyzed
      ↓
Risk recalculated
```

---

## 11. Incident Report

Create a structured incident report containing:

* incident ID
* timestamp
* threat classification
* risk score
* confidence
* speaker evidence
* authenticity evidence
* challenge result
* timeline
* relevant audio metadata

The on-screen report is mandatory.

PDF export is best-effort.

PDF failure must never prevent incident creation or display.

---

## 12. Attack History

Provide historical visibility into previous analyzed attacks/incidents.

The hackathon implementation may use:

* SQLite
* JSON fixtures
* in-memory state

Persistence must not become a demo-critical dependency.

---

# 8. Tier 3 — Visually Real, Data May Be Simulated/Simplified

## 13. Voice Fingerprint

Use a **2D embedding projection**, not a 3D visualization.

Display:

* enrolled speaker cluster
* genuine samples
* synthetic samples
* unknown speakers
* current sample

The visualization should communicate that speaker representations exist in an embedding space.

It must not imply that simulated points are real-world measurements when they are not.

---

## 14. Global Threat Map

Interactive geographic visualization showing simulated threat activity.

The UI must clearly state:

> **SIMULATED THREAT INTELLIGENCE**

No fabricated data may be presented as genuine global intelligence.

---

# 9. Tier 4 — Stretch Features

These are implemented only if the schedule in `PHASES.md` permits them.

## 15. AI Security Analyst

Optional LLM-powered explanation layer.

The analyst:

* receives structured results
* explains existing decisions
* summarizes evidence
* assists with incident interpretation

The analyst:

* does not determine risk
* does not override the Risk Engine
* does not classify threats independently

If the LLM fails or exceeds the defined timeout:

```text
LLM
 ↓
Deterministic Analyst
```

The fallback must remain functional.

---

## 16. Call / Conversation Simulator

Interactive representation of a call or conversation.

It should reuse the same underlying analysis pipeline rather than becoming an independent security system.

This feature may provide an alternative presentation layer over:

* audio
* transcript
* speaker state
* authenticity state
* risk
* challenge
* incident state

---

# 10. Shared Analysis Architecture

The 15 features must **not** become 15 independent systems.

VoiceGuard is built around one shared analysis state.

```text
                    AUDIO INPUT
                         │
                         ▼
                  AUDIO PIPELINE
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
       SPEAKER MODEL           ANTI-SPOOF MODEL
             │                       │
             └───────────┬───────────┘
                         ▼
                    RISK ENGINE
                         │
                         ▼
                   ANALYSIS STATE
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Dashboard         Timeline         Evidence
        │                │                │
        ├────────────────┼────────────────┤
        ▼                ▼                ▼
   Challenge         Incident          History
        │              Report
        │
        ▼
   Risk Update
```

All presentation layers should consume this shared state wherever practical.

---

# 11. Analysis States

VoiceGuard must explicitly represent system state.

Required states include:

* `ANALYZING`
* `COMPLETE`
* `PARTIAL_ANALYSIS`
* `THREAT_DETECTED`
* `VERIFICATION_REQUIRED`
* `DEGRADED_MODE`
* `DEMO_MODE`
* `RECONNECTING`
* `INVALID_AUDIO`
* `NO_MICROPHONE`
* `ERROR`

A failed component must not silently appear successful.

---

# 12. Partial Analysis

If one required signal is unavailable:

```text
Speaker Verification      ✓
Authenticity Detection    —
Risk Assessment           PARTIAL
Confidence                REDUCED
```

The system must not pretend that a full analysis occurred.

Missing signals must be communicated to the user and handled appropriately by the Risk Engine.

---

# 13. Golden Path

The primary hackathon demonstration is:

```text
GENUINE CALL
      ↓
VOICEGUARD ANALYSIS
      ↓
ATTACK SIMULATOR
      ↓
AI VOICE CLONE
      ↓
SPEAKER VERIFICATION
      ↓
AUTHENTICITY DETECTION
      ↓
RISK ESCALATION
      ↓
THREAT DETECTED
      ↓
WHY?
      ↓
EVIDENCE BREAKDOWN
      ↓
SECURITY CHALLENGE
      ↓
CHALLENGE FAILURE
      ↓
RISK ESCALATION
      ↓
INCIDENT CREATED
      ↓
INCIDENT REPORT
      ↓
AI SECURITY ANALYST
```

The Golden Path must be reliable enough to run repeatedly during judging.

It must not depend on fragile external services.

---

# 14. Non-Functional Requirements

## Latency

Target:

* `<2s` to first partial analysis result
* `<4s` to full risk score

Target input:

* 3–5 second live microphone clip

These are targets for the hackathon implementation, not production SLAs.

---

## Resilience

No single external dependency may prevent the Golden Path from completing.

Potential failure sources include:

* database
* LLM
* TTS
* STT
* WebSocket connection
* individual ML component

Each must degrade gracefully where practical.

---

## Determinism

Demo Mode must produce identical results for identical inputs.

This includes:

* risk scores
* evidence
* state transitions
* timeline events
* scenario outcomes

---

## Transparency

Any:

* fallback
* mock
* simulated result
* precomputed result
* degraded state
* unavailable model

must be visibly represented in the UI.

Never silently present degraded functionality as full functionality.

---

## Visual Bar

VoiceGuard should feel like:

> **Cybersecurity operations center × audio forensics laboratory**

Design direction:

* dark interface
* high information density
* strong hierarchy
* real-time state transitions
* audio visualizations
* interactive evidence
* meaningful animation
* responsive threat indicators

Every animation must communicate state, data, or user interaction.

---

# 15. External API Policy

Core VoiceGuard must operate without external AI API keys.

### Optional services

#### LLM

Explanation only.

#### TTS

Development/asset generation only where possible.

#### STT

Optional transcription.

Live external TTS/STT calls are not part of the Golden Path.

All optional external services require fallbacks.

---

# 16. Data & Persistence

Default hackathon persistence:

**SQLite**

Alternatives such as JSON fixtures or in-memory session state are acceptable where appropriate.

PostgreSQL/Supabase may be introduced only if there is sufficient time and a clear benefit.

Database availability must not determine whether the Golden Path works.

---

# 17. Out of Scope

Do not build:

* mobile application
* production telecom integration
* real global threat intelligence without a legitimate data source
* LLM-based security decisions
* live external TTS during the demo
* live external STT during the demo
* training large ML models from scratch
* unnecessary authentication/account systems
* blockchain
* unnecessary enterprise infrastructure

Do not introduce these features through scope creep.

---

# 18. Acceptance Criteria — Demo Ready

VoiceGuard is considered demo-ready when:

### Golden Path

The Golden Path runs from start to finish without human intervention other than triggering scenario transitions.

### Tier 1

All Tier 1 features are:

* implemented
* functional
* rehearsed
* sufficiently reliable for repeated demonstration

### Failure States

Every important fallback/degraded state has been intentionally triggered at least once during testing.

The system must:

* display the correct state
* recover where appropriate
* avoid crashing

### Product Truth

No fabricated ML numbers appear as real inference.

No fabricated threat-intelligence data appears as real intelligence.

All simulated, precomputed, mocked, or degraded states are appropriately labeled.

### External Dependencies

The Golden Path remains functional with external AI APIs unavailable.

### Performance

Live analysis aims for:

* `<2s` first meaningful result
* `<4s` full risk score

---

# 19. Source of Truth

The responsibilities of project documents are:

```text
RULES.md
    ↓
How agents must behave

PRD.md
    ↓
What VoiceGuard is

PHASES.md
    ↓
What gets built and when

tasks/CURRENT.md
    ↓
What the agent is doing right now

MEMORY.md
    ↓
What future agents need to remember

docs/ARCHITECTURE.md
    ↓
How the system is structured

docs/ML.md
    ↓
How ML is implemented and evaluated

docs/UI_UX.md
    ↓
How the interface should behave

docs/DEMO.md
    ↓
How the Golden Path is demonstrated

docs/SECURITY.md
    ↓
Security, privacy, and degradation behavior

docs/DECISIONS.md
    ↓
Why important architectural decisions were made

tasks/BACKLOG.md
    ↓
Known future work
```

If documents conflict:

1. `RULES.md` governs agent behavior.
2. `tasks/CURRENT.md` governs the current task scope.
3. `PHASES.md` governs implementation sequencing.
4. `PRD.md` governs product intent.
5. `docs/DECISIONS.md` governs recorded architectural decisions.

---

# 20. Product Principle

VoiceGuard should demonstrate a simple idea convincingly:

> **A voice can match the person you expect and still be fake.**

Therefore VoiceGuard does not blindly trust identity.

It combines:

**Who does this sound like?**

with:

**Does this audio appear genuine?**

and turns those signals into:

**Can we trust this voice?**
