# ARCHITECTURE.md — Planned System Architecture

> **Status:** Planned architecture — nothing in this document should be interpreted as already implemented unless `MEMORY.md` explicitly confirms it.
>
> **Last updated:** 2026-09-01

---

## 1. Architecture Goal

VoiceGuard is a web-based, real-time voice-security platform designed for a hackathon demonstration.

The architecture is optimized for:

1. **Demo reliability**
2. **Low development/debugging overhead**
3. **Zero required external AI APIs**
4. **Clear separation between audio processing, ML inference, security decisions, and presentation**
5. **Real-time UI updates**
6. **Deterministic Demo Mode**
7. **Graceful degradation when individual components fail**

The system should be modular enough that ML components can be replaced without rewriting the dashboard, and the frontend should not need to know whether an analysis came from live ML inference or Demo Mode fixtures.

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────────┐
                         │        BROWSER          │
                         │                         │
                         │  Next.js / React / TS   │
                         │                         │
                         │  ┌───────────────────┐  │
                         │  │ Voice Capture     │  │
                         │  │ File Upload       │  │
                         │  │ Waveform          │  │
                         │  │ Spectrogram       │  │
                         │  │ Threat Dashboard  │  │
                         │  │ Timeline          │  │
                         │  │ Attack Simulator  │  │
                         │  │ Reports           │  │
                         │  └─────────┬─────────┘  │
                         └────────────┼────────────┘
                                      │
                              HTTP / WebSocket
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │       FASTAPI           │
                         │                         │
                         │ API + WebSocket layer   │
                         │                         │
                         │  ┌───────────────────┐  │
                         │  │ Session Manager   │  │
                         │  │ Audio Ingestion   │  │
                         │  │ Analysis Pipeline │  │
                         │  │ Demo Engine       │  │
                         │  └─────────┬─────────┘  │
                         └────────────┼────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   AUDIO PREPROCESSING   │
                         │                         │
                         │ decode                  │
                         │ validate                │
                         │ resample                │
                         │ normalize               │
                         │ feature preparation    │
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                ┌──────────────────┐      ┌──────────────────┐
                │ SPEAKER ML       │      │ ANTI-SPOOF ML   │
                │                  │      │                  │
                │ ECAPA-TDNN       │      │ Pretrained       │
                │                  │      │ anti-spoof model │
                │                  │      │                  │
                │ Embedding        │      │ Authenticity     │
                │ similarity       │      │ probability      │
                └────────┬─────────┘      └────────┬─────────┘
                         │                         │
                         └────────────┬────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │       RISK ENGINE       │
                         │                         │
                         │ Speaker similarity     │
                         │ Synthetic probability  │
                         │ Audio anomalies        │
                         │                         │
                         │ → 0–100 risk score      │
                         │ → severity              │
                         │ → structured evidence  │
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴─────────────┐
                         ▼                          ▼
                ┌──────────────────┐       ┌──────────────────┐
                │ EVIDENCE / WHY   │       │ SECURITY ACTIONS │
                │                  │       │                  │
                │ Evidence         │       │ Challenge        │
                │ explanation      │       │ Attack response  │
                │ signal breakdown │       │ Incident         │
                └────────┬─────────┘       └────────┬─────────┘
                         │                          │
                         └────────────┬─────────────┘
                                      ▼
                         ┌─────────────────────────┐
                         │     INCIDENT LAYER      │
                         │                         │
                         │ Timeline                │
                         │ Reports                 │
                         │ Attack history          │
                         │ SQLite persistence      │
                         └─────────────────────────┘
```

---

# 3. Repository Architecture

The planned repository structure is:

```text
voiceguard/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── ...
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── ...
│   └── tests/
│
├── ml/
│   ├── models/
│   ├── inference/
│   ├── preprocessing/
│   ├── calibration/
│   └── ...
│
├── docs/
├── tasks/
│
├── README.md
├── RULES.md
├── PRD.md
├── PHASES.md
└── MEMORY.md
```

The exact internal file structure may evolve during implementation, but the major separation should remain.

---

# 4. Frontend

## Technology

Planned frontend stack:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* D3.js
* Web Audio API
* WebSockets

## Responsibilities

The frontend owns:

* Microphone permission and capture
* File upload
* Audio visualization
* Dashboard rendering
* UI state transitions
* Demo/Live mode controls
* Attack Simulator controls
* Timeline interaction
* Incident report presentation
* Voice fingerprint visualization
* Global threat map visualization
* Security challenge interface
* Optional AI Analyst presentation

The frontend **does not own security decisions**.

It receives structured analysis results from the backend and renders them.

---

# 5. Backend

## Technology

Planned backend:

* Python
* FastAPI
* WebSockets
* SQLite

## Responsibilities

The backend acts as the orchestration layer.

It is responsible for:

* Receiving audio
* Validating requests
* Managing analysis sessions
* Audio preprocessing
* Calling ML inference
* Running the risk engine
* Producing structured evidence
* Managing Demo Mode
* Sending real-time state updates
* Handling security challenge evaluation
* Generating incident data
* Persisting attack history
* Managing degradation states

The backend should not contain frontend presentation logic.

---

# 6. ML Layer

ML is intentionally kept separate from API routing.

```text
backend
   │
   └── analysis service
          │
          ▼
         ml/
          │
          ├── preprocessing
          ├── speaker verification
          ├── anti-spoof inference
          └── calibration
```

This separation allows the models to be tested independently from FastAPI.

## Speaker Verification

Planned model:

**Pretrained ECAPA-TDNN**

Primary output:

```text
speaker_embedding
```

The embedding is compared against an enrolled speaker embedding.

The resulting similarity is converted into the application's speaker-match representation.

Enrolled embeddings should be cached and reused.

They should not be recomputed for every comparison.

## Anti-Spoof Detection

A pretrained anti-spoof/deepfake detection model will be selected during the relevant implementation phase.

The model should provide evidence for:

* synthetic likelihood
* human/genuine likelihood
* authenticity classification

The final model choice must be documented in:

`docs/ML.md`

and

`docs/DECISIONS.md`

---

# 7. Audio Pipeline

The planned live analysis pipeline is:

```text
Browser audio
     │
     ▼
Upload / WebSocket transport
     │
     ▼
Input validation
     │
     ├── invalid → structured error
     │
     ▼
Audio decoding
     │
     ▼
Resampling
     │
     ▼
Normalization
     │
     ▼
Model-specific preprocessing
     │
     ├───────────────┐
     ▼               ▼
Speaker ML      Anti-Spoof ML
     │               │
     └───────┬───────┘
             ▼
        Risk Engine
             │
             ▼
      Evidence Result
             │
             ▼
       Dashboard/UI
```

The exact sample rate and preprocessing requirements will be determined by the selected model checkpoints and recorded in `ML.md`.

---

# 8. Core Analysis Contract

`POST /api/analyze` is the planned core analysis contract.

PR-03 will establish the initial response shape.

Later ML phases replace individual mocked fields with real outputs without changing the overall contract unnecessarily.

The conceptual response contains:

```text
AnalysisResult
├── session
│   ├── id
│   ├── mode
│   └── state
│
├── speaker
│   ├── match_score
│   ├── enrolled_identity
│   └── confidence
│
├── authenticity
│   ├── classification
│   ├── synthetic_probability
│   └── human_probability
│
├── risk
│   ├── score
│   ├── level
│   └── confidence
│
├── evidence
│   ├── spectral_anomaly
│   ├── prosody_anomaly
│   ├── pitch_irregularity
│   ├── temporal_artifacts
│   └── speaker_similarity
│
├── timeline
│   └── events[]
│
└── degradation
    ├── status
    └── reason
```

The exact schema is finalized during PR-03.

Agents must not independently invent incompatible response formats after the contract is established.

---

# 9. WebSocket Architecture

WebSockets are used for real-time analysis-state updates.

Conceptual state progression:

```text
IDLE
  ↓
RECORDING
  ↓
UPLOADING
  ↓
ANALYZING
  ↓
PARTIAL_ANALYSIS
  ↓
COMPLETE
```

Failure states may branch from any appropriate stage:

```text
ERROR
RECONNECTING
DEGRADED
```

The frontend must visibly represent these states.

A dropped WebSocket connection must never result in silently frozen information.

The frontend should attempt reconnection with backoff and display a visible reconnecting state.

---

# 10. Risk Engine

The Risk Engine is the authoritative security decision layer.

It consumes structured evidence from the analysis pipeline.

Conceptually:

```text
speaker similarity
        +
synthetic probability
        +
audio anomaly signals
        │
        ▼
   RISK ENGINE
        │
        ├── risk score
        ├── severity
        ├── confidence
        └── evidence
```

Risk levels:

```text
0–25     LOW
26–50    MODERATE
51–75    HIGH
76–100   CRITICAL
```

The exact scoring formula must be explicitly documented in:

`docs/SECURITY.md`

The formula should be implemented as a deterministic, testable function.

The LLM must never replace or override this engine.

---

# 11. Partial Analysis

Partial analysis is a first-class system state.

Example:

```text
Speaker verification      SUCCESS
Anti-spoof inference      TIMEOUT
                         ↓
                 PARTIAL_ANALYSIS
```

The system must not silently present this as a complete analysis.

Instead:

* Mark the result as partial
* Reduce/qualify confidence as appropriate
* Explain which signal is unavailable
* Display a visible degraded-state indicator

This principle applies throughout the system.

---

# 12. Demo Mode Architecture

Demo Mode is not a separate dashboard implementation.

It feeds deterministic fixture data through the same presentation pipeline used by Live Mode.

```text
                  ┌───────────────┐
                  │   LIVE MODE   │
                  └───────┬───────┘
                          │
                          ▼
                    Analysis Event
                          ▲
                          │
                  ┌───────┴───────┐
                  │   DEMO MODE   │
                  └───────────────┘
```

Demo scenarios:

1. Genuine Voice
2. AI Voice Clone
3. Replay Attack
4. Unknown Speaker

Each scenario has deterministic fixture data.

The same scenario must produce the same result every time.

The frontend must not have separate rendering logic for Demo Mode versus Live Mode.

---

# 13. Attack Simulator

The Attack Simulator is a presentation/control layer over the Demo Mode scenario engine.

It should not create a second analysis pipeline.

Conceptually:

```text
Attack Simulator
       │
       ▼
Scenario Engine
       │
       ▼
Existing Analysis Pipeline
       │
       ▼
Dashboard
```

Launching an attack should visibly drive the same dashboard state transitions that a real analysis would produce.

---

# 14. Security Challenge

The Security Challenge is an active-defense layer.

When risk reaches the appropriate threshold:

```text
HIGH / CRITICAL RISK
        │
        ▼
CALLER VERIFICATION REQUIRED
        │
        ▼
Fixed challenge phrase
        │
        ▼
Caller response
        │
        ▼
Existing analysis pipeline
        │
        ▼
PASS / FAIL
```

Challenge phrases come from a fixed pool.

They should not require live LLM generation.

---

# 15. Incident Layer

Confirmed threats produce structured incident information.

An incident can contain:

* Incident ID
* Timestamp
* Threat type
* Speaker match
* Authenticity result
* Risk score
* Evidence
* Timeline
* Recommended action
* Challenge result

This structured incident object is reused by:

* Incident Report
* Attack History
* Threat Timeline
* AI Security Analyst

The AI Analyst receives structured incident information rather than raw audio.

---

# 16. SQLite

SQLite is the planned datastore for the hackathon build.

It is primarily used for:

* Enrolled speaker metadata/embeddings where appropriate
* Attack history
* Incident records
* Potential demo/session persistence where useful

SQLite is **not a hard dependency for the live analysis path**.

If SQLite becomes unavailable:

```text
Live analysis       → continues
Risk engine         → continues
Demo Mode           → continues
Dashboard           → continues
History persistence → may degrade
```

Database failure must not collapse the demo.

---

# 17. External AI Services

External AI services are optional enrichment.

Potential services:

* LLM
* TTS
* STT

None are required for the core VoiceGuard security pipeline.

The system must function with:

```text
LLM_API_KEY = unset
TTS_API_KEY = unset
STT_API_KEY = unset
```

The AI Security Analyst is the main optional external-AI feature.

If the LLM fails or exceeds the defined timeout:

```text
LLM
 │
 ├── success → AI explanation
 │
 └── timeout/error
          ↓
 deterministic explanation
```

The fallback must be visibly labelled.

---

# 18. Frontend State Model

The UI should have a central analysis/session state rather than independent components inventing their own interpretation of system status.

Conceptually:

```text
mode
 ├── LIVE
 └── DEMO

analysis_state
 ├── IDLE
 ├── RECORDING
 ├── ANALYZING
 ├── PARTIAL_ANALYSIS
 ├── COMPLETE
 ├── ERROR
 └── RECONNECTING

risk_level
 ├── LOW
 ├── MODERATE
 ├── HIGH
 └── CRITICAL
```

Components should derive their visual state from this shared information.

---

# 19. UI Communication Layer

Every major backend state should have a corresponding visual state.

Examples:

```text
ANALYZING
→ active waveform
→ processing indicator
→ analysis panels transitioning

PARTIAL_ANALYSIS
→ warning/degraded badge
→ unavailable signal clearly identified

CRITICAL
→ threat escalation
→ security action available
→ timeline event generated

DEMO MODE
→ persistent DEMO MODE indicator

SIMULATED THREAT INTELLIGENCE
→ explicit map label
```

Visual polish must never conceal system uncertainty.

---

# 20. Voice Fingerprint

The planned Voice Fingerprint visualization is a **2D embedding projection**.

It will use actual speaker embeddings where available.

Conceptually:

```text
ECAPA embeddings
       │
       ▼
 PCA / t-SNE
       │
       ▼
 2D coordinates
       │
       ▼
 D3 visualization
```

The visualization should communicate relative embedding distances.

A 3D Three.js voice fingerprint is intentionally not part of the planned architecture.

See `docs/DECISIONS.md`.

---

# 21. Global Threat Map

The Global Threat Map is a visualization layer.

Unless a legitimate threat-intelligence source is introduced, its data is simulated.

The UI must explicitly state:

> **Simulated Threat Intelligence**

It must never imply that simulated values represent real-world attack activity.

---

# 22. AI Security Analyst

The AI Analyst is an optional interpretation layer.

Architecture:

```text
Risk Engine
     │
     ▼
Structured Evidence
     │
     ├───────────────┐
     ▼               ▼
 Deterministic      LLM
 Explanation
     │               │
     └───────┬───────┘
             ▼
        Analyst Output
```

The LLM:

* Does not receive raw audio
* Does not calculate the security decision
* Does not change the risk score
* Does not override the Risk Engine
* Only explains structured evidence

A deterministic fallback always exists.

---

# 23. PDF Reports

PDF generation is secondary to the on-screen incident report.

The architecture must therefore be:

```text
Analysis
   │
   ▼
Incident object
   │
   ├──→ On-screen report
   │
   └──→ PDF export
```

If PDF generation fails:

```text
On-screen report → remains available
PDF              → shows export failure/retry state
```

PDF generation must never block incident creation.

---

# 24. Dependency Philosophy

The architecture follows a strict dependency hierarchy.

### Critical

These must be available:

```text
Browser
FastAPI
Local ML models
Risk Engine
Demo fixtures
```

### Non-critical

These may fail without collapsing VoiceGuard:

```text
SQLite persistence
LLM
TTS
STT
PDF export
Global threat data
```

No optional dependency may become an accidental hard dependency.

---

# 25. Performance Targets

For live 3–5 second audio clips:

```text
First partial result    < 2 seconds target
Full risk result        < 4 seconds target
```

These are targets, not guarantees before benchmarking.

Actual measured performance must be recorded in:

`MEMORY.md`

after the relevant implementation phases.

Optimization priorities include:

* Cached enrolled embeddings
* Efficient model loading
* Avoiding repeated preprocessing
* Avoiding unnecessary network calls
* Keeping the demo path deterministic
* Avoiding unnecessary database operations during live analysis

---

# 26. Architectural Rules for Agents

Agents implementing this architecture must follow these principles:

1. Do not move security decisions into the frontend.
2. Do not let the LLM make security decisions.
3. Do not make external AI APIs mandatory.
4. Do not create a separate pipeline for Demo Mode.
5. Do not create a separate pipeline for the Call Simulator.
6. Do not fabricate ML outputs.
7. Do not silently convert degraded states into successful states.
8. Do not replace SQLite with Postgres/Supabase without an explicit architectural decision.
9. Do not introduce additional infrastructure unless the current architecture genuinely requires it.
10. Do not change an established API contract without documenting the change.
11. Do not add a dependency without following the dependency rule in `RULES.md`.
12. Do not optimize for production-scale infrastructure at the expense of hackathon reliability.

---

# 27. Architecture Evolution

This document describes the **planned architecture**.

It is expected to change as implementation reveals practical constraints.

When an architectural decision changes:

1. The change must be made within the relevant PR scope.
2. `docs/DECISIONS.md` must record why it changed.
3. This file must be updated in the same PR.
4. `MEMORY.md` must record the resulting architecture if it affects future work.

The architecture documented here must always describe the latest **intended and actually supported** system design, while `MEMORY.md` records what has actually been built.

---

## Final Architectural Principle

> **Keep the security spine local, deterministic, testable, and independent. Everything else is an enhancement around it.**

If the LLM disappears, VoiceGuard works.

If the database disappears, VoiceGuard works.

If TTS/STT disappear, VoiceGuard works.

If an optional visualization fails, VoiceGuard works.

If an individual ML signal fails, VoiceGuard degrades explicitly rather than pretending.

**The dashboard should never be more confident than the evidence underneath it.**
