# CURRENT.md — Current Agent Task

> This file is the immediate source of truth for what the next agent should work on.
> `PHASES.md` defines the roadmap; this file defines the current work.

## Project Status

**Project:** VoiceGuard
**Stage:** Phase 1 — Core Voice Analysis
**Current PR:** PR-07
**Current Branch:** `pr-07-threat-dashboard`

---

## Current Task

### PR-07 — Live Threat Dashboard

**Tier:** T1 — Core Voice Analysis
**Test:** `[TEST: skip]`

Implement real-time audio visualization using Web Audio API and Canvas.

### Scope

* **Live Waveform:** Real-time oscilloscope / time-domain canvas responding smoothly to microphone amplitude.
* **Captured Waveform:** Static waveform rendering from decoded `AudioBuffer` with interactive playhead/scrubbing.
* **Spectrogram / Frequency Visualizer:** Real-time frequency bar/waterfall FFT visualizer during recording and offline spectrogram generation from `AudioBuffer`.
* **State Support:** Clean state transitions across:
  - `IDLE`
  - `RECORDING`
  - `ANALYZING`
  - `COMPLETE`
* Reusable modular visualization components designed for the upcoming main security operations dashboard.

---

## Definition of Done

PR-02 is complete when:

* [ ] Live microphone input visibly drives the real-time waveform and frequency visualizer.
* [ ] Completed recording or uploaded file produces a high-resolution waveform and spectrogram.
* [ ] Visualizations support `IDLE`, `RECORDING`, `ANALYZING`, and `COMPLETE` states.
* [ ] Visualizers are modular and reusable for the dashboard in PR-07.
* [ ] `npm run build` succeeds without lint or type errors.
* [ ] `MEMORY.md` is updated.
* [ ] `CURRENT.md` is updated for PR-03.
* [ ] PR branch pushed and execution stops for review.

---

## Files Expected to Change

Primarily:

```text
/frontend/src/components/visualization/live-waveform.tsx
/frontend/src/components/visualization/spectrogram.tsx
/frontend/src/components/visualization/audio-visualizer.tsx
/frontend/src/components/audio/audio-capture.tsx
/frontend/src/app/page.tsx
/MEMORY.md
/tasks/CURRENT.md
```

---

## Next PR

After PR-02 is completed and reviewed:

**PR-03 — Backend Audio Ingestion + Preprocessing**
Branch: `pr-03-audio-pipeline`
