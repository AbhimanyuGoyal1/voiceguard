# MEMORY.md — Living Project Memory

Read this file at the beginning of every coding session.

This file records the **current reality of the project** — what is actually implemented, important discoveries, decisions that affect future work, known problems, and demo-critical information.

Do not use this file as a roadmap.
Planned work belongs in `PHASES.md`.
Current task belongs in `tasks/CURRENT.md`.
Unplanned future work belongs in `tasks/BACKLOG.md`.

Keep entries short, factual, and dated.

---

# Current Status

**Last updated:** 2026-09-01

**Current PR:** PR-00
**Current phase:** Phase 0 — Foundation
**Overall status:** Nothing implemented yet.

After each PR, update this section to reflect what is **actually working**, not what is planned.

---

# Current Architecture

## Repository

```text
/
├── frontend/     # Next.js / React / TypeScript
├── backend/      # FastAPI / Python
├── ml/           # ML loading + inference utilities
├── docs/         # Architecture and technical documentation
├── tasks/        # Agent task management
├── RULES.md
├── PRD.md
├── PHASES.md
├── MEMORY.md
└── README.md
```

Update this structure if it changes.

## Frontend

Planned/implemented stack:

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* D3.js
* Web Audio API
* WebSockets

Record major implementation changes here as they actually happen.

## Backend

* FastAPI
* Python
* WebSockets
* Audio preprocessing
* ML inference orchestration

## ML

* Speaker verification: pretrained ECAPA-TDNN
* Authenticity detection: pretrained anti-spoof model
* No model training from scratch

Record the exact checkpoints and inference implementation after they are selected.

## Data

* SQLite for the hackathon build.
* Database is non-critical to the Golden Path.
* If SQLite becomes unavailable, the application must degrade rather than crash.

---

# Core Product Architecture

VoiceGuard evaluates two primary independent signals:

```text
Audio
  │
  ├───────────────┐
  ▼               ▼
Speaker         Authenticity
Verification    Detection
  │               │
  └───────┬───────┘
          ▼
     Risk Engine
          │
          ▼
    Explainable Result
          │
    ┌─────┴─────┐
    ▼           ▼
Active       Incident
Defense      Intelligence
```

The core security decision belongs to the deterministic Risk Engine.

**The LLM must never make the security decision.**

---

# Core API Contract

`POST /api/analyze` is the central analysis contract.

PR-03 establishes the contract.

Later ML PRs replace individual mocked fields with real inference.

Do not change the contract casually.

If the contract changes:

1. Update `docs/ARCHITECTURE.md`.
2. Update affected frontend/backend code.
3. Record the reason in `docs/DECISIONS.md`.
4. Record the change here.

---

# Mode Architecture

VoiceGuard has two primary modes:

```text
LIVE MODE
    ↓
Real microphone/upload
    ↓
Real backend
    ↓
Real ML
```

and:

```text
DEMO MODE
    ↓
Deterministic fixtures
    ↓
Same analysis contract
    ↓
Same dashboard pipeline
```

The dashboard must not need separate UI logic merely because the source is Demo Mode.

Demo Mode must remain deterministic.

---

# Key Decisions

These decisions are currently established:

* Web application instead of mobile application.
* Pretrained ECAPA-TDNN instead of training a speaker model from scratch.
* Pretrained anti-spoof model instead of training an anti-spoof model from scratch.
* SQLite instead of Postgres/Supabase for the hackathon.
* 2D embedding projection instead of a 3D Three.js voice fingerprint.
* Core VoiceGuard must work without external AI API keys.
* LLM/TTS/STT are optional enrichment only.
* LLM explanations cannot influence security decisions.
* Threat-map data must be explicitly labeled simulated unless backed by legitimate live data.
* Demo Mode must be deterministic.
* PDF generation must never block on-screen incident reporting.
* Database failure must never prevent the Golden Path.
* External API failure must never prevent the Golden Path.

Full reasoning belongs in `docs/DECISIONS.md`.

---

# ML Results & Calibration

## Speaker Verification

**Status:** Not implemented.

After PR-04 record:

* exact model/checkpoint
* embedding dimensions
* similarity metric
* enrollment behavior
* threshold(s)
* observed genuine-speaker similarity
* observed impostor similarity
* inference latency
* known limitations

## Anti-Spoof Detection

**Status:** Not implemented.

After PR-05 record:

* exact model/checkpoint
* raw output format
* calibration method
* synthetic probability mapping
* classification thresholds
* genuine test observations
* synthetic test observations
* inference latency
* known limitations

Never record invented benchmark numbers.

---

# Risk Engine

**Status:** Not implemented.

After PR-06 record:

* exact scoring formula
* input weights
* thresholds
* boundary behavior
* partial-analysis behavior
* confidence calculation

The formula must remain deterministic and explainable.

---

# Known Bugs / Open Issues

*(None currently.)*

Record bugs using:

```text
[YYYY-MM-DD] [PR-XX]
Problem:
Impact:
Workaround:
Status:
```

Example:

```text
[2026-09-02] [PR-04]
Problem: ECAPA inference takes ~5.2s on the development machine.
Impact: Exceeds the <4s full-analysis target.
Workaround: Cache enrollment embeddings.
Status: Investigating.
```

Do not silently fix unrelated bugs while working on another PR.

---

# Failed Approaches

Record approaches that were actually attempted and abandoned.

Format:

```text
[YYYY-MM-DD] [PR-XX]
Attempt:
Why it failed:
Replacement:
```

Only record real attempts.

Do not fill this section with hypothetical warnings.

---

# External API / Service Decisions

The Golden Path must not depend on external AI APIs.

If an external service is introduced, record:

```text
Service:
Purpose:
Required or optional:
Timeout:
Fallback:
Observed latency:
Failure behavior:
```

Current status:

```text
LLM: Not implemented
TTS: Not implemented
STT: Not implemented
```

Any future external service must have a deterministic/local fallback where required by `RULES.md`.

---

# Performance Observations

Target:

```text
First partial analysis: <2 seconds
Full risk result:       <4 seconds
```

Record actual observations once live analysis exists.

Format:

```text
[YYYY-MM-DD] [PR-XX]

Environment:
Audio duration:
First result:
Final result:
Speaker inference:
Anti-spoof inference:
End-to-end:
Notes:
```

Never replace target numbers with observed numbers without recording the distinction.

---

# Demo Mode

## Current Status

Not implemented.

After PR-09, record:

* scenario names
* fixture locations
* expected outputs
* scenario-specific timing
* Golden Path ordering
* any changes made during rehearsal

Current planned scenarios:

1. Genuine Voice
2. AI Voice Clone
3. Replay Attack
4. Unknown Speaker

All demo scenarios must remain deterministic.

---

# Golden Path

**Status:** Not implemented.

The final Golden Path is expected to demonstrate:

```text
Genuine Voice
      ↓
Analysis
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
WHY?
      ↓
Security Challenge
      ↓
Challenge Failure
      ↓
Incident
      ↓
Report
      ↓
Optional AI Analyst
```

The exact final script belongs in `docs/DEMO.md`.

---

# Important Agent Notes

These are operational reminders discovered during development.

Keep this section short.

Examples:

* Enrollment embeddings are cached; do not recompute them during every comparison.
* Demo Mode uses the same dashboard pipeline as Live Mode.
* Never display mock ML values without a visible mock/fixture label.
* Never silently substitute simulated threat intelligence for real data.
* Never make the LLM authoritative over the Risk Engine.
* Never introduce a dependency merely because it makes implementation easier.

---

# PR History

Keep one short entry per completed PR.

```text
PR-00 — Not started
PR-01 — Not started
PR-02 — Not started
PR-03 — Not started
...
PR-20 — Not started
```

After completion:

```text
PR-00 — Complete — 2026-09-01
PR-01 — Complete — 2026-09-01
```

Add a one-line note only when something important needs to be remembered.

---

# Memory Maintenance Rules

1. **Facts over intentions.**
2. **Short over exhaustive.**
3. **Date important discoveries.**
4. **Never fabricate measurements, ML results, benchmarks, or test results.**
5. **Do not duplicate the PRD unnecessarily.**
6. **Do not turn MEMORY.md into a second roadmap.**
7. **Record decisions that future agents could otherwise accidentally reverse.**
8. **Record failed approaches so future agents don't repeat them.**
9. **Update this file at the end of every PR.**
10. **If something here becomes false, update or remove it immediately.**
