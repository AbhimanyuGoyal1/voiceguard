# VoiceGuard

An interactive AI-powered voice-security platform that identifies speakers, detects synthetic/cloned voices, calculates impersonation risk, explains its evidence, challenges suspicious callers, simulates attacks, maintains incident intelligence, and provides an AI security analyst — through a real-time web interface.

Built as a **hackathon demo with a 2-day build window**.

> **Read `RULES.md` before touching any code.**

---

## Agent Onboarding

Read these at the start of every new agent session.

### 1. `RULES.md`

**How you must behave.**

Contains:

* Git / PR workflow
* testing policy
* scope discipline
* ML integrity rules
* API/dependency rules
* Demo Mode rules
* security rules
* agent context discipline

**Read every session.**

### 2. `MEMORY.md`

**What is currently known about the project.**

Contains important:

* architecture discoveries
* decisions
* known bugs
* failed approaches
* implementation notes

**Read every session.**

### 3. `tasks/CURRENT.md`

**What you are working on right now.**

This defines the current PR and its immediate scope.

**Do not work outside this scope.**

### 4. `PRD.md`

**What VoiceGuard is and why we are building it.**

Read when product context is required.

### 5. `PHASES.md`

**The complete PR-by-PR implementation roadmap.**

Your current PR's Definition of Done is defined here.

### 6. Relevant documentation

Only read the documentation relevant to the layer you are touching:

* `docs/ARCHITECTURE.md`
* `docs/ML.md`
* `docs/UI_UX.md`
* `docs/DEMO.md`
* `docs/SECURITY.md`

**Do not read every document for every task.**

### 7. `docs/DECISIONS.md`

Check this before changing or "fixing" an architectural decision that looks unusual.

It may be intentional.

### 8. `tasks/BACKLOG.md`

Contains work that is not currently assigned.

Do not pull backlog items into the current PR.

---

# Golden Rule

> **Core VoiceGuard must work with zero dependency on external AI APIs.**

The demo-critical system includes:

* microphone capture
* audio processing
* waveform
* spectrogram
* speaker verification
* anti-spoof / deepfake detection
* risk engine
* explainable detection
* threat timeline
* attack simulator
* Demo Mode
* security challenge
* incident reports
* attack history

These must not require an external AI API key for their baseline functionality.

LLM, TTS, and STT are **optional enrichment**.

They must have deterministic or precomputed fallbacks and must never become single points of failure.

See `RULES.md` for the complete policy.

---

# Product Truth

VoiceGuard must always distinguish between:

* real inference
* simulated data
* precomputed results
* Demo Mode
* partial analysis
* degraded services

The system must never present simulated or fabricated results as genuine live analysis.

If a model is not actually running, the UI must say so.

If analysis is incomplete, the UI must communicate that.

If threat intelligence is simulated, the UI must label it as simulated.

---

# Demo Mode

Demo Mode is a **first-class feature**.

It provides deterministic, pre-baked scenarios that remain available regardless of:

* external API availability
* network problems
* ML service failures
* database failures
* microphone availability

Current planned scenarios:

1. **Genuine Voice**
2. **AI Voice Clone**
3. **Replay Attack**
4. **Unknown Speaker**

The exact implementation and scenario data are defined in `PRD.md`, `PHASES.md`, and `docs/DEMO.md`.

---

# Golden Path

The Golden Path is the primary hackathon demonstration.

The intended experience is:

```text
Genuine Call
     ↓
VoiceGuard Analysis
     ↓
Attack Simulator
     ↓
AI Voice Clone
     ↓
Speaker Verification
     ↓
Authenticity Detection
     ↓
Risk Escalation
     ↓
Threat Detected
     ↓
WHY?
     ↓
Evidence Breakdown
     ↓
Security Challenge
     ↓
Challenge Failure
     ↓
Risk Escalation
     ↓
Incident Created
     ↓
Incident Report
     ↓
AI Security Analyst
```

The Golden Path has priority over secondary features.

Any change affecting it must preserve or improve its reliability.

---

# Architecture

VoiceGuard is built around **one shared analysis pipeline**, not 15 independent systems.

```text
                    VOICE INPUT
                        │
                        ▼
                ┌───────────────┐
                │ Audio Pipeline│
                └───────┬───────┘
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
                        ▼
                 Threat State
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Timeline      Evidence      Incident
          │             │             │
          ▼             ▼             ▼
       History      Challenge      Reports
                        │
                        ▼
                   AI Analyst
```

The dashboard, call simulator, attack simulator, timeline, reports, and analyst all consume the same underlying analysis state wherever practical.

---

# Technology Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* D3.js
* Web Audio API
* WebSockets

## Backend

* Python
* FastAPI
* WebSockets

## ML

* pretrained ECAPA-TDNN for speaker verification
* pretrained anti-spoof/deepfake detection model
* PyTorch
* audio feature extraction

**No large model training from scratch is planned for the hackathon.**

ML effort should focus on:

* inference
* integration
* calibration
* thresholding
* evaluation
* reliability

## Data

SQLite is the default hackathon persistence layer.

PostgreSQL/Supabase may be considered later if time remains.

Database availability must not be a single point of failure for the Golden Path.

## Demo

Deterministic Demo Mode with pre-baked scenarios.

---

# External Services

External services may provide optional enrichment:

### LLM

Used only for explaining decisions already made by the Risk Engine.

### TTS

Used for generating attack samples during development.

Attack audio should be pre-generated for the live demo.

### STT

Used for optional transcription functionality.

Demo scenarios may use precomputed transcripts.

### Important

No live external service is allowed to become a requirement for the core demonstration.

---

# Reliability Philosophy

VoiceGuard should fail gracefully.

Examples:

```text
ML service unavailable
        ↓
PARTIAL_ANALYSIS
```

```text
LLM unavailable
        ↓
DETERMINISTIC ANALYST
```

```text
Database unavailable
        ↓
Session continues
```

```text
PDF generation fails
        ↓
On-screen incident report remains available
```

```text
WebSocket disconnects
        ↓
RECONNECTING
```

Failures should affect only the functionality that actually depends on the failed component.

---

# Implementation Philosophy

We are building for a **2-day hackathon**, not a production enterprise deployment.

Prioritize:

1. Golden Path reliability
2. Core ML functionality
3. Interactive UI
4. Demo resilience
5. Technical credibility
6. Feature completeness
7. Polish

Avoid:

* unnecessary infrastructure
* speculative abstractions
* unnecessary dependencies
* unrelated refactoring
* live API dependencies
* decorative complexity with no product value

**15 features do not mean 15 independent systems.**

Build one strong analysis engine and build the experiences around it.

---

# Current Status

`tasks/CURRENT.md` is the authoritative source for the **current task**.

`MEMORY.md` is the authoritative source for **what is actually known about the current codebase**.

`PHASES.md` is the authoritative source for **what is planned**.

Do not assume planned functionality has been implemented.

When in doubt:

```text
CURRENT.md → What am I doing?
MEMORY.md  → What actually exists?
PRD.md     → What are we building?
PHASES.md  → What comes next?
RULES.md   → How must I behave?
DECISIONS.md → Why is it built this way?
```

---

# Final Principle

> **Build less infrastructure, more product.**
>
> **Make the critical intelligence real.**
>
> **Make everything else resilient, transparent, and convincing.**
>
> **Never fake what the system actually knows.**
