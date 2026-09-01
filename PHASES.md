# PHASES.md — Complete PR-by-PR Roadmap

This is the **single source of truth for what gets built and in what order**.

Each PR is designed to be handed to an agent as one self-contained unit of work.

> **Do not skip ahead into a later PR's scope.**
>
> **Do not merge PRs together unless explicitly marked mergeable.**
>
> **Do not start the next PR merely because the current PR finished early.**

---

# 0. Agent Execution Contract

Before starting any PR, the agent MUST:

1. Read `RULES.md`.
2. Read `MEMORY.md`.
3. Read `tasks/CURRENT.md`.
4. Read this PR's section in `PHASES.md`.
5. Read only the relevant supporting documentation.
6. Inspect the existing implementation before modifying it.
7. Implement **only the current PR's scope**.
8. Follow the PR's Definition of Done.
9. Run the testing/verification required by this PR.
10. Update `MEMORY.md` with meaningful discoveries.
11. Update `tasks/CURRENT.md` and `tasks/BACKLOG.md` as required by `RULES.md`.
12. Stop when the Definition of Done is satisfied.

If the agent discovers work belonging to a future PR:

> **Do not implement it.**

Record it in `tasks/BACKLOG.md` if necessary.

---

# 1. PR / Branch Convention

PR number and branch name correspond directly.

```text
PR-00 → pr-00-project-scaffolding
PR-01 → pr-01-audio-capture
PR-04 → pr-04-speaker-verification
```

Every PR must follow the Git workflow defined in `RULES.md`.

Agents must never:

* push directly to `main`
* merge their own PR
* force-push shared branches
* combine unrelated PR scopes

---

# 2. Priority System

Feature tiers correspond to `PRD.md`.

```text
T1 > T2 > T3 > T4
```

If time runs short:

1. Protect T1.
2. Finish Demo Mode.
3. Harden the Golden Path.
4. Only then continue to T2/T3/T4.

**PR count does not equal feature count.**

Several PRs may implement one feature, and some PRs exist purely for infrastructure or hardening.

---

# 3. Dependency Graph

```text
PR-00 Foundation
      │
      ├── PR-01 Audio Capture
      │       │
      │       └── PR-02 Visualization
      │
      └── PR-03 Backend Audio Pipeline
              │
              ├── PR-04 Speaker Verification
              │
              └── PR-05 Anti-Spoof Detection
                      │
                      └── PR-06 Risk Engine
                              │
                              ├── PR-07 Threat Dashboard
                              │       │
                              │       └── PR-08 WHY?
                              │
                              └── PR-09 Demo Engine
                                      │
                                      ├── PR-10 Attack Simulator
                                      ├── PR-11 Threat Timeline
                                      ├── PR-12 Security Challenge
                                      ├── PR-13 Incident Report
                                      ├── PR-14 Attack History
                                      ├── PR-15 Voice Fingerprint
                                      ├── PR-16 Threat Map
                                      ├── PR-17 AI Analyst
                                      └── PR-18 Call Simulator

PR-19 Resilience
      │
      └── PR-20 Golden Path / Final Polish
```

---

# Phase 0 — Foundation

## PR-00: Project Scaffolding

**Tier:** T1 Infrastructure
**Test:** `[TEST: skip]`

### Scope

Create the initial monorepo:

```text
/
├── frontend/
├── backend/
├── ml/
├── docs/
├── tasks/
├── RULES.md
├── PRD.md
├── PHASES.md
├── MEMORY.md
└── README.md
```

### Frontend

Initialize:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

Initialize:

* Python
* FastAPI
* chosen package/environment manager

The agent must record the package-management decision in `docs/DECISIONS.md`.

### ML

Create `/ml` for model loading and inference utilities.

ML code should remain separated from API routing.

### Configuration

Create `.env.example` files.

Optional variables may include:

```text
LLM_API_KEY=
TTS_API_KEY=
STT_API_KEY=
```

These must be explicitly documented as optional.

The application must function without them.

### Backend health check

Create:

```text
GET /health
```

Frontend must display the actual backend health state.

### Database

Use SQLite for the hackathon.

Do not introduce Supabase/Postgres.

### Definition of Done

A fresh checkout can run:

```text
frontend
backend
```

independently.

The frontend successfully displays:

> Backend: Healthy

based on the real `/health` endpoint.

---

# Phase 1 — Audio Foundation

## PR-01: Audio Capture & Upload

**Tier:** T1
**Test:** `[TEST: skip]`

### Scope

Implement browser audio capture.

Support:

* microphone permission
* recording
* stop
* re-record
* upload
* drag/drop or file picker

### Validation

Handle explicitly:

* microphone permission denied
* no microphone/device
* unsupported format
* empty audio
* silence-only audio
* audio shorter than approximately 1–2 seconds

Errors must be specific.

Never display a generic:

> Something went wrong.

### Important

No backend calls.

The output of this PR is a validated audio Blob/object held in frontend state.

### Definition of Done

User can:

```text
Record → Stop → Review → Re-record
```

or:

```text
Upload → Validate → Review
```

Invalid audio produces the correct user-facing error.

---

# PR-02: Live Waveform + Spectrogram

**Tier:** T1
**Test:** `[TEST: skip]`

### Scope

Implement:

* real-time waveform
* captured waveform
* spectrogram
* visualization state

Use:

* Web Audio API
* `AnalyserNode`
* Canvas and/or D3

The visualization must support:

```text
IDLE
RECORDING
ANALYZING
COMPLETE
```

### Definition of Done

Live microphone input visibly affects the waveform.

A completed recording produces a spectrogram.

Visualization components are reusable by the dashboard.

---

# Phase 1 — Core Voice Analysis

## PR-03: Backend Audio Ingestion + Preprocessing

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Create:

```text
POST /api/analyze
```

Accept audio and perform:

* decoding
* validation
* resampling
* normalization

Target sample format must be documented in `docs/ARCHITECTURE.md`.

### Response Contract

Define the complete analysis response structure.

It should support future fields for:

* speaker verification
* authenticity
* risk
* evidence
* confidence
* timeline
* degraded states

Initially, ML fields may be mocked **only to establish the contract**.

Mock values must never be presented in the UI as real inference.

### Errors

Return structured errors:

```text
INVALID_AUDIO
UNSUPPORTED_FORMAT
AUDIO_TOO_SHORT
EMPTY_AUDIO
PROCESSING_ERROR
```

Do not expose raw exceptions.

### Definition of Done

Valid audio produces the complete response contract.

Invalid audio produces the correct structured error.

Unit tests cover validation and the happy path.

---

# PR-04: Speaker Verification

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Integrate pretrained ECAPA-TDNN.

No model training from scratch.

Implement:

* enrollment
* embedding generation
* embedding storage
* embedding caching
* comparison
* cosine similarity
* calibrated 0–100 speaker-match value

The enrolled speaker embedding should not be recomputed unnecessarily.

### Definition of Done

Same speaker:

> clearly high similarity

Different speaker:

> clearly lower similarity

Embedding/similarity math has deterministic unit tests using fixed vectors.

---

# PR-05: Anti-Spoof / Deepfake Detection

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Benchmark suitable pretrained anti-spoof models.

Select one and document:

* model
* reason for selection
* limitations
* inference requirements

Possible candidates include:

* AASIST
* RawNet2

Implement:

```text
audio
 ↓
model
 ↓
raw output
 ↓
calibration
 ↓
synthetic probability
 ↓
authenticity classification
```

### Failure handling

Model load/inference failure must produce:

```text
PARTIAL_ANALYSIS
```

rather than crashing the API.

### Definition of Done

Genuine and synthetic/TTS clips produce meaningfully different model outputs.

Calibration is unit-tested.

Failure → `PARTIAL_ANALYSIS` is tested.

---

# PR-06: Risk Engine

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Create the deterministic Risk Engine.

Inputs:

* speaker similarity
* synthetic probability
* validated additional signals
* challenge result when available

Risk bands:

```text
0–25    LOW
26–50   MODERATE
51–75   HIGH
76–100  CRITICAL
```

### Important

The formula must be:

* deterministic
* documented
* testable
* explainable

Document it in:

```text
docs/SECURITY.md
```

### Partial Analysis

If a required signal is unavailable:

```text
Risk: PARTIAL
Confidence: Reduced
```

Do not create false precision.

### Definition of Done

Tests cover:

* LOW
* MODERATE
* HIGH
* CRITICAL
* partial analysis
* boundary values

---

# PR-07: Live Threat Dashboard

**Tier:** T1
**Test:** `[TEST: skip]`

### Scope

Assemble the main dashboard.

Required panels:

* speaker identity
* authenticity
* risk score
* waveform
* spectrogram
* analysis state
* system status

Connect to real backend analysis.

### WebSocket

Implement analysis-state streaming:

```text
RECORDING
    ↓
ANALYZING
    ↓
PARTIAL_RESULT
    ↓
FINAL_RESULT
```

Implement reconnect-with-backoff.

On disconnect:

> RECONNECTING

must be visible.

Never silently display stale results as current.

### Definition of Done

Live microphone analysis updates the dashboard using actual backend results.

State transitions are visible and match `docs/UI_UX.md`.

---

# PR-08: Explainable Detection — "WHY?"

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Create the WHY panel.

It must explain the decision using **actual available evidence**.

Core evidence should include signals genuinely produced by the pipeline, such as:

* speaker similarity
* synthetic probability

Additional evidence such as:

* spectral anomalies
* prosody
* pitch irregularity
* temporal artifacts

may only be displayed if those signals are actually computed.

### Prohibited

Do not invent percentages for signals that are not implemented.

Do not manufacture evidence merely to make the UI look more sophisticated.

### Explanation

Use deterministic templates.

No LLM.

Example:

```text
WHY WAS THIS FLAGGED?

Speaker similarity: HIGH
Authenticity: LIKELY SYNTHETIC

The voice closely matches the enrolled speaker,
but the audio contains strong synthetic indicators.
```

### Definition of Done

Every displayed evidence value traces back to a real computed value or an explicitly labeled fixture.

Template generation is unit-tested.

---

# Cut-Line Checkpoint

At this point, the project has its core real-time security system.

If behind schedule:

> **Stop adding feature scope.**

Proceed immediately to:

**PR-09 → PR-19 → PR-20**

A hardened Tier-1 system with deterministic Demo Mode is more valuable than unfinished visual features.

---

# Phase 2 — Demo Mode + Attack Simulation

## PR-09: Demo Mode + Scenario Engine

**Tier:** T1
**Test:** `[TEST: required]`

### Scope

Create four deterministic scenarios:

1. Genuine Voice
2. AI Voice Clone
3. Replay Attack
4. Unknown Speaker

Each scenario contains:

* audio fixture
* transcript where applicable
* expected speaker result
* expected authenticity result
* expected risk
* evidence
* timeline events

### Critical Architecture Rule

Demo Mode must use the **same dashboard/WebSocket contract as Live Mode**.

The frontend must not know whether the source is:

```text
LIVE
```

or:

```text
DEMO
```

### Determinism

Same scenario input must produce identical:

* scores
* evidence
* timeline
* state transitions

No uncontrolled randomness.

### Definition of Done

All four scenarios reproduce their expected output exactly on repeated runs.

Live ↔ Demo switching does not require a page reload.

---

# PR-10: Attack Simulator

**Tier:** T1
**Test:** `[TEST: skip]`

### Scope

Create an interactive attack launcher.

Scenarios:

* Genuine
* AI Clone
* Replay
* Unknown

Primary action:

> **LAUNCH ATTACK**

The action feeds the scenario engine from PR-09.

### Definition of Done

Launching a scenario drives the dashboard through the full analysis sequence.

No parallel analysis pipeline is created.

---

# PR-11: Threat Timeline

**Tier:** T2
**Test:** `[TEST: skip]`

### Scope

Interactive timeline containing events such as:

```text
VOICE DETECTED
SPEAKER ANALYSIS
AUTHENTICITY ANALYSIS
ANOMALY DETECTED
RISK UPDATED
THREAT CLASSIFIED
ACTION TAKEN
```

Timeline should support:

* clicking events
* scrubbing
* state reconstruction

### Definition of Done

Timeline works for both Live and Demo Mode.

Selecting a point changes the relevant dashboard state.

---

# Phase 3 — Active Defense + Security Operations

## PR-12: Security Challenge

**Tier:** T2
**Test:** `[TEST: required]`

### Scope

When risk exceeds the configured threshold:

```text
CALLER VERIFICATION REQUIRED
```

appears.

Challenge phrases come from a fixed pool.

For deterministic scenarios, challenge selection must be deterministic.

Do not introduce uncontrolled randomness into Demo Mode.

The response is processed through the same:

```text
Speaker Verification
+
Authenticity Detection
```

pipeline.

### Definition of Done

Genuine response:

> PASS

Synthetic/mismatched fixture:

> FAIL

Pass/fail threshold is unit-tested.

---

# PR-13: Incident Report

**Tier:** T2
**Test:** `[TEST: skip]`

### Scope

Generate a structured on-screen report containing:

* incident ID
* timestamp
* threat type
* speaker match
* authenticity
* risk
* confidence
* evidence
* challenge result
* recommended action

### PDF

PDF export is secondary.

If PDF generation fails:

> The on-screen report must remain completely functional.

### Definition of Done

Works for:

* Live threat
* Demo threat

Demo Mode PDF export works.

---

# PR-14: Attack History

**Tier:** T2
**Test:** `[TEST: skip]`

### Scope

Persist analyses in SQLite.

Store:

* ID
* timestamp
* severity
* attack type
* risk
* summary

Provide:

* list
* filtering where useful
* click-through
* incident detail reuse

### Failure behavior

SQLite failure must not crash VoiceGuard.

History persistence may degrade to session-only behavior.

### Definition of Done

Multiple scenarios populate history.

History survives page refresh when backend persistence is available.

---

# Phase 4 — Visual Depth

## PR-15: Voice Fingerprint

**Tier:** T3
**Test:** `[TEST: skip]`

### Scope

Create a 2D embedding projection.

Use:

* PCA
* or another appropriate lightweight projection

Visualize:

* enrolled speaker
* genuine samples
* impostor samples
* synthetic samples
* current sample

Use D3.

No 3D Three.js visualization.

### Definition of Done

Visualization represents actual embedding relationships.

A genuine match should appear closer to the enrolled representation than an impostor where the underlying data supports that distinction.

---

# PR-16: Global Threat Map

**Tier:** T3
**Test:** `[TEST: skip]`

### Scope

Create an interactive world map.

Data is simulated.

The UI must permanently and visibly display:

> **SIMULATED THREAT INTELLIGENCE**

Never imply the data is live global intelligence.

### Definition of Done

Map renders.

Countries/incidents can be interacted with.

Simulation label is always visible.

---

# Phase 5 — Stretch Features

These are built only after T1–T3 functionality is complete and rehearsed.

---

# PR-17: AI Security Analyst

**Tier:** T4
**Test:** `[TEST: required]`

### Scope

Optional LLM explanation layer.

Input:

```text
Structured analysis
Structured evidence
Incident information
```

Never send:

* raw authority
* hidden security decisions
* unrestricted decision-making instructions

The LLM explains the Risk Engine's decision.

It does not make the decision.

### Timeout

Maximum live wait:

```text
3 seconds
```

If timeout/failure occurs:

```text
LLM
 ↓
Deterministic explanation
```

Fallback must be visibly labeled.

### Definition of Done

With API key:

> analyst works.

Without API key:

> deterministic analyst works.

Forced timeout:

> deterministic fallback works.

No API failure crashes the dashboard.

---

# PR-18: Call / Conversation Simulator

**Tier:** T4
**Test:** `[TEST: skip]`

### Scope

Create an incoming-call presentation layer:

```text
INCOMING CALL
      ↓
ACCEPT
      ↓
CALL EXPERIENCE
      ↓
VOICEGUARD ANALYSIS
```

It must reuse the existing:

* Demo Engine
* Analysis State
* Risk Engine
* Timeline
* Challenge
* Incident system

It must **not** create a separate security pipeline.

### Definition of Done

A call scenario can be launched and analyzed through the existing pipeline.

---

# Phase 6 — Demo Hardening

## PR-19: Error Handling + Resilience

**Tier:** T1 Protection
**Test:** `[TEST: required]`

This PR is mandatory.

### Test every important degradation state

At minimum:

```text
Microphone denied
No microphone
Invalid audio
Audio too short
Silence-only audio
ML model unavailable
ML inference failure
Partial analysis
WebSocket disconnect
Database unavailable
LLM unavailable
LLM timeout
PDF generation failure
```

### UI

Every degraded state must have a visible status.

Examples:

```text
LIVE
DEMO MODE
PARTIAL ANALYSIS
RECONNECTING
LLM OFFLINE
DEGRADED
```

No silent failures.

### Definition of Done

Every documented degradation state has been manually triggered.

No scenario crashes the application.

Testable failure conditions have automated coverage.

---

# PR-20: Golden Path Rehearsal + Final Polish

**Tier:** T1
**Test:** `[TEST: skip]`

This is the final demo preparation PR.

### Golden Path

Run:

```text
GENUINE CALL
      ↓
ANALYSIS
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
EVIDENCE
      ↓
SECURITY CHALLENGE
      ↓
CHALLENGE FAILURE
      ↓
RISK ESCALATION
      ↓
INCIDENT
      ↓
REPORT
      ↓
ANALYST
```

### Polish

Fix only:

* broken transitions
* timing issues
* confusing copy
* visual glitches
* obvious performance problems
* Golden Path reliability issues

Do not introduce new features.

### Performance

Check against PRD targets:

```text
<2s → first meaningful analysis result
<4s → full risk score
```

### Definition of Done

Golden Path runs successfully:

> **twice consecutively**

with no manual intervention beyond the documented scenario triggers.

---

# Final Priority Rule

If time runs out:

```text
                    PRIORITY

                       T1
                       │
              ┌────────┴────────┐
              │                 │
          Core ML          Demo Mode
              │                 │
              └────────┬────────┘
                       │
                   Hardening
                       │
                       ▼
                       T2
                       │
                       ▼
                       T3
                       │
                       ▼
                       T4
```

Never sacrifice a T1 feature to build a T3 or T4 feature.

In particular:

> **A reliable Demo Mode + real speaker/authenticity ML + explainable Risk Engine is more valuable than an unfinished collection of flashy features.**

---

# Definition of a Successful Hackathon Build

VoiceGuard succeeds if a judge can watch the Golden Path and understand, without needing a technical explanation:

```text
A voice can sound exactly like someone
without actually being that person.

VoiceGuard checks both identity
and authenticity before deciding whether
the voice should be trusted.
```

The system should then demonstrate that decision with:

**real evidence → visible reasoning → active defense → incident intelligence.**
