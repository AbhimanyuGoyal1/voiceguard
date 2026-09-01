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
