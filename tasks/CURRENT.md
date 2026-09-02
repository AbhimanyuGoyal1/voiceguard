# CURRENT.md — Current Agent Task

> This file is the immediate source of truth for what the next agent should work on.
> `PHASES.md` defines the roadmap; this file defines the current work.

## Project Status

**Project:** VoiceGuard
**Stage:** Complete — Production / Hackathon Ready
**Current PR:** PR-20 (Complete)
**Current Branch:** `pr-20-golden-path-rehearsal`

---

## Current Task

### PR-20 — Golden Path Rehearsal + Final Polish

**Tier:** T1
**Status:** Complete & Rehearsed

All 20 Pull Requests (PR-00 through PR-20) across all 6 phases are complete, tested, and verified. The system runs completely offline without requiring external AI API keys, featuring the complete SOC threat dashboard, oscilloscope/spectrogram visualizers, ECAPA-TDNN speaker verification, AASIST anti-spoofing, explainability reasoning, scenario launcher, active defense challenge, forensic reporting, attack registry, 2D D3 voice fingerprinting, threat map telemetry, and telephony simulator.

### Scope

* **WebSocket Streaming (`/ws/analyze`):**
  - Real-time analysis progression stream: `RECORDING` → `ANALYZING` → `PARTIAL_RESULT` → `FINAL_RESULT`.
  - Client-side reconnect-with-backoff.
  - Visible `RECONNECTING` and degraded indicators without displaying stale data.
* **Main SOC Dashboard Panels:**
  - **Global Header:** Online state, Live/Demo mode badge, WebSocket connection status.
  - **Risk Score Meter:** Gauge/radial progress, threat level badge (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), confidence score.
  - **Speaker Identity Card:** Enrolled identity, similarity percentage, match badge (`MATCHED`, `UNCERTAIN`, `MISMATCH`).
  - **Authenticity Card:** Human % vs Synthetic %, classification (`AUTHENTIC`, `SUSPICIOUS`, `SYNTHETIC`).
  - **Audio Visualizer:** Oscilloscope waveform, STFT spectrogram, dual-view toggles.
  - **Pipeline State & Status Card:** Active state indicators, live processing logs.
  - **Threat Timeline Preview:** Chronological analysis events.
* Connect live microphone recording and file upload to the backend API & WebSocket flow.

---

## Definition of Done

PR-07 is complete when:

* [ ] Live microphone capture or upload runs real backend analysis and renders real inference results.
* [ ] WebSocket streaming `/ws/analyze` streams live progress updates (`RECORDING` → `ANALYZING` → `FINAL_RESULT`).
* [ ] Reconnect-with-backoff handles WebSocket dropouts with a visible `RECONNECTING` badge.
* [ ] Dashboard UI satisfies `docs/UI_UX.md` cybersecurity SOC aesthetic.
* [ ] `npm run build` succeeds without lint or type errors.
* [ ] `MEMORY.md` is updated.
* [ ] `CURRENT.md` is updated for PR-08.
* [ ] PR branch pushed and execution stops for review.

---

## Files Expected to Change

Primarily:

```text
/backend/api/websocket.py
/backend/main.py
/frontend/src/types/analysis.ts
/frontend/src/hooks/use-analysis-socket.ts
/frontend/src/components/dashboard/threat-dashboard.tsx
/frontend/src/components/dashboard/risk-meter.tsx
/frontend/src/components/dashboard/speaker-card.tsx
/frontend/src/components/dashboard/authenticity-card.tsx
/frontend/src/app/page.tsx
/MEMORY.md
/tasks/CURRENT.md
```

---

## Next PR

After PR-07 is completed and reviewed:

**PR-08 — Explainable Detection — "WHY?"**
Branch: `pr-08-why-panel`
