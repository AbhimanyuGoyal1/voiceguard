# Architecture Decisions Record (ADR)

## ADR-001: Monorepo Architecture & Tech Stack Scaffolding
- **Status:** Accepted (PR-00)
- **Date:** 2026-09-01
- **Context:** VoiceGuard requires a clean separation of concerns between the presentation layer, real-time backend orchestration, ML inference logic, and persistence.
- **Decision:**
  - **Frontend:** Next.js (App Router, TypeScript) with Tailwind CSS v4, Lucide icons, and shadcn/ui.
  - **Backend:** FastAPI (Python 3.14 / async) with Uvicorn for asynchronous API serving and WebSocket streaming.
  - **ML Utilities:** Isolated in `/ml` module, separated from FastAPI web routing logic.
  - **Dependency Management:** Python virtual environment (`venv`) with `requirements.txt` for standard, reproducible, minimal-overhead hackathon operation on Windows/Unix.
  - **Persistence:** SQLite via SQLAlchemy + `aiosqlite` (async). SQLite chosen to eliminate database setup friction while ensuring the Golden Path is resilient against DB outages.
  - **Zero-Key Philosophy:** Core product operates with 0 external API keys. Optional keys for LLM/TTS/STT enrichment are handled gracefully with local deterministic fallbacks.

## ADR-002: Python Package Management Approach
- **Status:** Accepted (PR-00)
- **Date:** 2026-09-01
- **Context:** `PHASES.md` PR-00 requires recording the chosen Python dependency-management approach.
- **Decision:** We use standard Python `venv` + `requirements.txt`.
- **Rationale:** Highly portable across Windows and Linux environments without requiring third-party tools like Poetry or Conda. Keeps hackathon installation deterministic and straightforward with `pip install -r backend/requirements.txt`.

## ADR-003: Pretrained ECAPA-TDNN for Speaker Verification
- **Status:** Accepted (PR-04)
- **Date:** 2026-09-01
- **Context:** VoiceGuard requires a fast, accurate, pretrained speaker recognition model for identity verification without training from scratch.
- **Decision:** Use SpeechBrain's pretrained ECAPA-TDNN model (`speechbrain/spkrec-ecapa-voxceleb`) producing 192-dimensional embeddings compared via cosine similarity.
- **Rationale:** State-of-the-art speaker embedding performance on VoxCeleb, runs locally on CPU/GPU without external API dependencies, and enables embedding caching for reference voiceprints. Raw cosine similarity is calibrated: `>= 0.65` -> `MATCHED`, `0.40 - 0.65` -> `UNCERTAIN`, `< 0.40` -> `MISMATCH`.

## ADR-004: Genuine Pretrained AASIST-L Neural Anti-Spoof Model
- **Status:** Accepted (PR-22)
- **Date:** 2026-09-03
- **Context:** VoiceGuard requires authentic audio deepfake and synthetic speech detection without training models from scratch, moving beyond handcrafted DSP heuristics.
- **Decision:** Integrate the genuine pretrained AASIST-L (Audio Anti-Spoofing using Integrated Spectro-Temporal Graph Attention Networks - Lightweight) PyTorch model (Jung & Tak et al., NAVER Corp. / Interspeech 2022) with checkpoint weights trained on ASVspoof 2019 Logical Access (`AASIST-L.pth`, 85k parameters, ~426 KB).
- **Rationale:** Genuine peer-reviewed deep learning countermeasure featuring a learnable SincNet filterbank and spectro-temporal graph attention with Max-Feature-Map pooling. Executes 100% locally on CPU without external API dependencies (~114ms latency). Audio shorter than 64,600 samples (~4.04s at 16kHz) is circularly padded; longer audio is segmented using multi-window sliding aggregation with 50% overlap. Conforms to the VoiceGuard probability contract (`synthetic_probability`, `human_probability`, `classification`).
- **Limitation Disclosed:** Trained on ASVspoof 2019; like all 2019 academic benchmark models, it exhibits domain shift when evaluating modern commercial diffusion-based TTS (such as ElevenLabs). In such cases, multi-modal identity defense is preserved through ECAPA-TDNN speaker verification (`MISMATCH` -> `CHALLENGE`).

## ADR-005: Deterministic Authoritative Risk Engine
-**Status:** Accepted (PR-06)
-**Date:** 2026-09-01
-**Context:** Security decisions require a deterministic, testable, explainable mathematical formulation independent of probabilistic LLMs.
-**Decision:** The authoritative Risk Engine combines `SyntheticProbability * 0.50`, `AcousticAnomalies * 0.20`, and `SpeakerMismatch * 0.30`. If both speaker match and synthetic probability are >= 70%, an impersonation boost escalates risk into `CRITICAL`. Failed security challenges escalate risk by +35. Missing signals trigger explicit `PARTIAL_ANALYSIS` (confidence <= 0.6).
-**Rationale:** Ensures absolute determinism, explainable evidence generation, and guarantees that synthetic speech matching an enrolled user triggers a high-severity alert.
