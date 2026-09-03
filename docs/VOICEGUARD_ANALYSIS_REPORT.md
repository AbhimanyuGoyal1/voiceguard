# VoiceGuard: Architecture, Flow & Feature Achievement Analysis

> Comprehensive assessment of the VoiceGuard codebase, data flow, ML pipelines, feature tiers, and production achievement status.

---

## 1. Executive Summary & Vision

### The Core Problem
Traditional biometric voice authentication systems primarily answer one question:
> **"Who is speaking?"** (Speaker identity verification)

With modern generative voice synthesis and neural voice cloning (e.g., ElevenLabs, Bark, OpenVoice, Tortoise), an attacker can easily generate synthetic speech that acoustic verifiers match with high confidence to an enrolled executive or user. In biometric security:
$$\text{Speaker Match} \neq \text{Authentic Voice}$$

### The Solution: "Can This Voice Be Trusted?"
VoiceGuard decouples **Speaker Verification** from **Authenticity Detection** (anti-spoof / deepfake detection) and processes them independently through an authoritative, deterministic **Risk Engine**.

Key Principles:
- **Evidence Over Verdict**: Rather than displaying an arbitrary risk score, the system reveals detailed acoustic signal factor attribution.
- **Zero API Dependency for Core Demo**: Baseline security operations (microphone capture, STFT spectrogram, speaker verification, anti-spoof detection, risk scoring, explainability, active defense challenge, incident reports) run 100% offline.
- **Truth in Presentation**: Simulated telemetry and fallback modes are strictly labeled (e.g., `SIMULATED THREAT INTELLIGENCE`, `PARTIAL_ANALYSIS`, `OFFLINE FALLBACK`).

---

## 2. End-to-End System Architecture & Data Flow

VoiceGuard is built around **one unified analysis pipeline state**, rather than fragmented micro-tools. The dashboard, call simulator, attack launcher, timeline, reports, and AI security analyst all consume the same contract.

```
                            AUDIO INPUT
            (Microphone Web Audio / File Upload / SIP Stream)
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Audio Preprocessor   │
                    │ 16kHz Mono / RMS / FFT│
                    └───────────┬───────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
      Speaker Verification             Authenticity Detection
  [ECAPA-TDNN 192-d Embedding]        [Acoustic DSP / AASIST]
  (Cosine similarity to profile)     (Vocoder cutoff & jitter)
               │                                 │
               └────────────────┬────────────────┘
                                ▼
                     ┌─────────────────────┐
                     │     Risk Engine     │
                     │  Authoritative Rule │
                     │  Impersonation Boost│
                     └──────────┬──────────┘
                                │
                                ▼
                     AnalysisResult Contract
                                │
    ┌──────────────┬────────────┼────────────┬──────────────┐
    ▼              ▼            ▼            ▼              ▼
Live SOC        "WHY?"       Active       Incident      AI Security
Dashboard    Explainability  Challenge     Report         Analyst
(WebSocket)     Panel        Response     (Forensics)    (Deterministic)
    │              │            │            │              │
    └──────────────┴────────────┼────────────┴──────────────┘
                                ▼
                    Observability & Intelligence
           (2D PCA Fingerprint • Global Threat Map • History)
```

### End-to-End Processing Steps:
1. **Audio Capture & Client Validation** (`frontend/src/components/audio/audio-capture.tsx`): Captures microphone streams or uploaded files (`WAV`, `MP3`, `WebM`, `OGG`, `FLAC`), runs energy/duration checks, and computes real-time FFT frequency bars and STFT spectrograms.
2. **Ingestion & Preprocessing** (`backend/services/audio_preprocessor.py`): Resamples to 16kHz mono, computes RMS energy, peak amplitude, and checks for silence.
3. **Parallel ML Inference** (`backend/services/pipeline.py`):
   - **Speaker Verification** (`ml/speaker/ecapa_verifier.py`): Extracts 192-d embeddings and computes cosine similarity against the enrolled voice profile.
   - **Authenticity Detection** (`ml/antispoof/detector.py`): Analyzes neural vocoder cutoff above 7.5 kHz, frame-to-frame RMS energy variance, and sample jitter.
4. **Authoritative Risk Scoring** (`backend/services/risk_engine.py`):
   - Combines signals: $50\%$ Synthetic $+ 20\%$ Anomalies $+ 30\%$ Speaker Mismatch.
   - **Impersonation Boost**: When `Synthetic >= 70%` and `Match >= 70%`, risk escalates immediately into `CRITICAL` ($>85$).
5. **Streaming & Observability**: Real-time event streaming over WebSocket (`/ws/analyze`), deterministic explainability signal breakdown, dynamic active challenge modulation, and 2D PCA embedding projection.

---

## 3. Feature Achievement Scorecard (Roadmap vs Implementation)

All 21 PR branches (`PR-00` through `PR-20`) across all 6 phases have been implemented, tested, and merged into `main`.

| Tier | PR | Feature / Component | Primary Files | Status | Reality / Mode |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **T1** | PR-00 | Project Scaffolding | `backend/main.py`, `frontend/package.json` | **100% Complete** | Monorepo structure, FastAPI + Next.js App Router |
| **T1** | PR-01 | Audio Capture & Upload | `audio-capture.tsx`, `use-audio-recorder.ts` | **100% Complete** | Web Audio API capture, file validation, playback |
| **T1** | PR-02 | Waveform & Spectrogram | `spectrogram.tsx`, `audio-visualizer.tsx` | **100% Complete** | Real-time oscilloscope, FFT bars, STFT forensic canvas |
| **T1** | PR-03 | Audio Ingestion Pipeline | `audio_preprocessor.py`, `/api/analyze` | **100% Complete** | 16kHz mono normalization, structured error responses |
| **T1** | PR-04 | Speaker Verification | `ecapa_verifier.py`, `similarity.py` | **100% Complete** | SpeechBrain ECAPA-TDNN (192-d) + FFT fallback |
| **T1** | PR-05 | Anti-Spoof Detection | `detector.py`, `calibration.py` | **100% Complete** | Vocoder roll-off, prosody variance, jitter analysis |
| **T1** | PR-06 | Authoritative Risk Engine | `risk_engine.py` | **100% Complete** | Multi-signal weighting, impersonation escalation rule |
| **T1** | PR-07 | Live Threat Dashboard | `threat-dashboard.tsx`, `websocket.py` | **100% Complete** | WebSocket streaming, reconnect backoff, SOC UI |
| **T1** | PR-08 | Explainable "WHY?" Panel | `why-panel.tsx`, `explainability.py` | **100% Complete** | Structured signal attribution (weights, impact) |
| **T1** | PR-09 | Demo Mode & Scenario Engine | `scenario_engine.py`, `/api/scenarios` | **100% Complete** | 4 canonical fixtures (Genuine, Clone, Replay, Unknown) |
| **T1** | PR-10 | Attack Simulator Launcher | `attack-simulator.tsx` | **100% Complete** | Threat vector trigger, pipeline progression |
| **T2** | PR-11 | Interactive Threat Timeline | `threat-timeline.tsx` | **100% Complete** | Chronological event stepper with severity indicators |
| **T2** | PR-12 | Active Security Challenge | `security-challenge.tsx`, `challenge_service.py` | **100% Complete** | Dynamic phonetic phrase verification & risk modulation |
| **T2** | PR-13 | Forensic Incident Report | `incident-report.tsx` | **100% Complete** | Structured audit report with print/PDF styling |
| **T2** | PR-14 | Attack History Registry | `attack-history.tsx`, `history_service.py` | **100% Complete** | SQLite persistence with fallback seed fixtures |
| **T3** | PR-15 | 2D Voice Fingerprint Map | `voice-fingerprint.tsx`, `fingerprint_service.py` | **100% Complete** | Real 2D SVD PCA projection on interactive D3.js canvas |
| **T3** | PR-16 | Global Threat Map | `global-threat-map.tsx`, `threat_map_service.py` | **100% Complete** | Interactive geo nodes, badged `SIMULATED THREAT INTELLIGENCE` |
| **T4** | PR-17 | AI Security Analyst | `ai-security-analyst.tsx`, `analyst_service.py` | **100% Complete** | Deterministic fallback + LLM client with $\le 3.0$s timeout |
| **T4** | PR-18 | Telephony Call Simulator | `call-simulator.tsx` | **100% Complete** | Incoming SIP/VoIP simulation piped into live analysis |
| **Infra**| PR-19 | Resilience & Degradation | `pipeline.py`, `test_resilience.py` | **100% Complete** | `PARTIAL_ANALYSIS`, isolated failure tolerance |
| **Infra**| PR-20 | Golden Path Rehearsal | Rehearsal suite & polish | **100% Complete** | End-to-end verified across live & demo flows |

---

## 4. Technical Deep-Dive: Real Code vs Fallbacks / Simulated

Following the Golden Rule in `RULES.md`, VoiceGuard maintains transparency regarding what is calculated live versus what is precomputed:

### 1. Speaker Verification
- **Code**: `ml/speaker/ecapa_verifier.py`
- **Implementation**: Real SpeechBrain ECAPA-TDNN model (`speechbrain/spkrec-ecapa-voxceleb`) that generates 192-dimensional embeddings. If offline or if speechbrain is not installed, it falls back to a mathematical acoustic spectral projection (`_compute_feature_projection`), guaranteeing that cosine comparison logic never crashes.

### 2. Deepfake / Anti-Spoof Detection
- **Code**: `ml/antispoof/detector.py`
- **Implementation**: Instead of relying on a fragile multi-gigabyte neural weight checkpoint that could fail on diverse host environments, it calculates **Forensic Digital Signal Processing (DSP)** metrics:
  1. *Spectral Anomaly*: Energy drop above 7.5 kHz (neural vocoder cutoff).
  2. *Prosody Anomaly*: Inter-frame energy variance (unnatural pitch/energy stability).
  3. *Temporal Discontinuity*: Sample first-difference mean (jitter and phase discontinuities).

### 3. Risk Engine & Explainability
- **Code**: `backend/services/risk_engine.py` & `backend/services/explainability.py`
- **Implementation**: 100% deterministic mathematical scoring and rule-based forensic reasoning. No hallucinations, with complete signal weight traceability.

### 4. 2D Voice Fingerprint PCA Map
- **Code**: `backend/services/fingerprint_service.py` & `frontend/src/components/dashboard/voice-fingerprint.tsx`
- **Implementation**: Real Singular Value Decomposition (`np.linalg.svd`) projecting high-dimensional embeddings to the first 2 principal components, rendered dynamically on a D3.js coordinate canvas.

### 5. AI Security Analyst
- **Code**: `backend/services/analyst_service.py`
- **Implementation**: Employs a deterministic forensic briefing generator by default. If an LLM API key is provided, it attempts enrichment with a strict $\le 3.0\text{s}$ timeout before automatically defaulting back to the deterministic briefing.

---

## 5. Local Setup & Execution Guide

### 1. Backend (FastAPI + Python)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
- WebSocket: `ws://localhost:8000/ws/analyze`

### 2. Frontend (Next.js + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
- Application URL: `http://localhost:3000`

### 3. Automated Test Suite
```bash
pytest backend/tests
```
