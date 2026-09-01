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

**Current PR:** PR-04
**Current phase:** Phase 1 — Core Voice Analysis
**Overall status:** PR-00, PR-01, PR-02, and PR-03 complete. Backend audio ingestion pipeline (`POST /api/analyze`), audio preprocessor (decoding, mono conversion, 16kHz resampling, peak normalization, duration & silence validation), complete Pydantic `AnalysisResult` contract, and structured error responses fully implemented and tested with 100% pytest pass rate.

---

# Current Architecture

## Repository

```text
/
├── frontend/     # Next.js (App Router, TypeScript, Tailwind CSS v4, Web Audio API validator, Oscilloscope & STFT Spectrogram visualizer)
├── backend/      # FastAPI / Python (Audio preprocessor, 16kHz resampler, Analysis contract, SQLite via SQLAlchemy + aiosqlite)
├── ml/           # ML loading + inference utilities (isolated package)
├── docs/         # Architecture and technical documentation
├── tasks/        # Agent task management
├── RULES.md
├── PRD.md
├── PHASES.md
├── MEMORY.md
└── README.md
```

---

# PR History

Keep one short entry per completed PR.

```text
PR-00 — Complete — 2026-09-01: Monorepo scaffolding, FastAPI /health endpoint, SQLite setup, Next.js frontend health dashboard.
PR-01 — Complete — 2026-09-01: Client-side audio capture, upload, playback, and Web Audio API validation (duration, energy, silent/empty/corrupt checks).
PR-02 — Complete — 2026-09-01: Live oscilloscope waveform, decoded waveform scrubbing, real-time FFT frequency bars, and STFT forensic spectrogram across IDLE/RECORDING/ANALYZING/COMPLETE states.
PR-03 — Complete — 2026-09-01: Backend audio ingestion + preprocessing (POST /api/analyze, 16kHz mono resampling, normalization, AnalysisResult response contract, structured error handling).
PR-04 — Not started
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
