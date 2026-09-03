# CURRENT.md — Current Agent Task

> This file is the immediate source of truth for what the next agent should work on.
> `PHASES.md` defines the roadmap; this file defines the current work.

## Project Status

**Project:** VoiceGuard
**Stage:** Complete — Production / Hackathon Ready
**Current PR:** PR-22 (Complete & Ready for Review)
**Current Branch:** `pr-22-genuine-aasist-model`

---

## Completed Task

### PR-22 — Integrate Genuine AASIST-L Anti-Spoof Model

**Tier:** T1
**Status:** Complete & Ready for Review

Replaced the handcrafted `"AASIST-Forensic"` DSP heuristic with the genuine published **AASIST-L** (Audio Anti-Spoofing using Integrated Spectro-Temporal Graph Attention Networks - Lightweight) PyTorch model (Jung & Tak et al., NAVER Corp. / Interspeech 2022).

1. **Model Architecture & Pretrained Checkpoint:**
   - Architecture: Learnable SincNet filterbank (70 filters) + residual Max-Feature-Map (MFM) convolution blocks + dual-branch Spectro-Temporal Graph Attention Network (GAT) with master node pooling.
   - Weights: Official `AASIST-L.pth` checkpoint (~426 KB, 85,000 parameters) trained on ASVspoof 2019 Logical Access.
   - License: MIT License (NAVER Corp.).
2. **Preprocessing & Input Windowing:**
   - Fixed-length $64{,}600$-sample window ($\sim 4.0375\,\text{s}$ at $16\,\text{kHz}$).
   - Short audio ($< 64{,}600$ samples): Circular repetition / tiling conforming to official AASIST evaluation protocol.
   - Long audio ($\ge 64{,}600$ samples): Multi-window sliding segmentation with 50% hop, averaging softmax probability outputs across windows.
3. **Probability Contract & Calibration:**
   - Model outputs 2 unnormalized logits `[spoof, bona-fide]`.
   - Softmax conversion yields raw spoof and bona-fide probabilities.
   - Calibrated into `synthetic_probability` ($0.0 - 100.0\%$), `human_probability` ($0.0 - 100.0\%$), and classification (`AUTHENTIC`, `SUSPICIOUS`, `SYNTHETIC`).
4. **Health & Safe Degradation:**
   - Model is lazily loaded and cached via thread-safe singleton lock.
   - Gracefully handles missing weights or runtime exceptions by raising `RuntimeError`, allowing the pipeline to enter explicit `PARTIAL_ANALYSIS` rather than crashing or faking signals.
5. **Acoustic Reality & Limitations Disclosed:**
   - Like all ASVspoof 2019 models, genuine AASIST-L detects classic neural vocoders and synthesis with high accuracy, but exhibits domain shift on modern diffusion/flow-matching TTS (e.g. ElevenLabs).
   - Truthful security posture is preserved: caller authentication is protected by ECAPA-TDNN (`MISMATCH` $\to$ `IDENTITY UNVERIFIED // CHALLENGE`), never allowing unauthorized callers access.

---

## Definition of Done

* [x] Official AASIST-L PyTorch architecture and weights integrated in `ml/antispoof/models/aasist.py` and `ml/models/weights/AASIST-L.pth`.
* [x] Handcrafted DSP heuristic completely replaced in `ml/antispoof/detector.py`.
* [x] Audio windowing ($64{,}600$ samples) with circular padding and multi-window sliding aggregation implemented.
* [x] Output probabilities mapped directly from model logits `[spoof, bona-fide]` via Softmax.
* [x] Safe degradation and model caching implemented.
* [x] 8 focused anti-spoof unit/integration tests passing in `backend/tests/test_antispoof.py`.
* [x] Full backend test suite passing (`53 passed, 1 warning in 4.39s`).
* [x] Frontend Turbopack build and static page generation passing (`0 errors`).
* [x] Real demo audio evaluation matrix completed.
* [x] `docs/ML.md`, `docs/DECISIONS.md`, and `MEMORY.md` updated.
* [x] Branch `pr-22-genuine-aasist-model` ready for user review.
