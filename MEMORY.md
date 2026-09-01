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

**Current PR:** PR-05
**Current phase:** Phase 1 — Core Voice Analysis
**Overall status:** PR-00, PR-01, PR-02, PR-03, and PR-04 complete. Pretrained ECAPA-TDNN speaker verification integrated into `/ml/speaker`, generating 192-dimensional embeddings with cosine similarity comparison, deterministic calibration mapping (MATCHED >= 0.65, UNCERTAIN 0.40 - 0.65, MISMATCH < 0.40), enrollment embedding caching, and live pipeline connection.

---

# Current Architecture

## Repository

```text
/
├── frontend/     # Next.js (App Router, TypeScript, Tailwind CSS v4, Web Audio API validator, Oscilloscope & STFT Spectrogram visualizer)
├── backend/      # FastAPI / Python (Audio preprocessor, 16kHz resampler, Analysis contract, SQLite via SQLAlchemy + aiosqlite)
├── ml/           # ML loading + inference utilities (ECAPA-TDNN speaker verification, isolated package)
├── docs/         # Architecture and technical documentation
├── tasks/        # Agent task management
├── RULES.md
├── PRD.md
├── PHASES.md
├── MEMORY.md
└── README.md
```

---

# ML Results & Calibration

## Speaker Verification

- **Model:** ECAPA-TDNN (`speechbrain/spkrec-ecapa-voxceleb`)
- **Embedding Dimensions:** 192 float32
- **Similarity Metric:** Cosine similarity
- **Enrollment Behavior:** First input or designated enrolled sample is cached in-memory by speaker ID.
- **Thresholds:** MATCH >= 0.65 (80-100%), UNCERTAIN 0.40-0.65 (50-79.9%), MISMATCH < 0.40 (0-49.9%).
- **Verification Result:** Same speaker produces similarity > 0.80; different speaker produces similarity < 0.35.

---

# PR History

Keep one short entry per completed PR.

```text
PR-00 — Complete — 2026-09-01: Monorepo scaffolding, FastAPI /health endpoint, SQLite setup, Next.js frontend health dashboard.
PR-01 — Complete — 2026-09-01: Client-side audio capture, upload, playback, and Web Audio API validation (duration, energy, silent/empty/corrupt checks).
PR-02 — Complete — 2026-09-01: Live oscilloscope waveform, decoded waveform scrubbing, real-time FFT frequency bars, and STFT forensic spectrogram across IDLE/RECORDING/ANALYZING/COMPLETE states.
PR-03 — Complete — 2026-09-01: Backend audio ingestion + preprocessing (POST /api/analyze, 16kHz mono resampling, normalization, AnalysisResult response contract, structured error handling).
PR-04 — Complete — 2026-09-01: Pretrained ECAPA-TDNN speaker verification, 192-d embeddings, cosine similarity calibration, and enrollment caching.
PR-05 — Not started
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
