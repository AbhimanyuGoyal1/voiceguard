# ML.md — VoiceGuard Machine Learning Specification

## 1. Purpose

VoiceGuard uses machine learning to answer two separate questions:

1. **Who does this voice sound like?**

   * Speaker verification / identity similarity
2. **Does this audio appear genuine?**

   * Anti-spoof / synthetic voice detection

These signals are intentionally independent.

The ML layer provides **evidence** to the Risk Engine. It does not make the final security decision.

```text
Audio
  │
  ├───────────────┐
  ▼               ▼
Speaker ML      Anti-Spoof ML
  │               │
  ▼               ▼
Similarity     Authenticity
  │               │
  └───────┬───────┘
          ▼
     Risk Engine
```

---

# 2. ML Philosophy

This is a **2-day hackathon project**, not an ML research project.

Priorities:

1. Reliable pretrained inference
2. Deterministic processing
3. Fast inference
4. Explainable outputs
5. Graceful failure
6. Reproducible demo behavior

Do NOT spend the hackathon training large models from scratch.

---

# 3. Models

## 3.1 Speaker Verification

Primary model:

**ECAPA-TDNN**

Preferred implementation/checkpoint:

**SpeechBrain pretrained speaker-recognition model**

Example family:

```text
speechbrain/spkrec-ecapa-voxceleb
```

The exact checkpoint and library version must be recorded in `DECISIONS.md` once integration is finalized.

Purpose:

```text
audio → speaker embedding
```

The resulting embeddings are compared using cosine similarity.

---

# 4. Speaker Enrollment

VoiceGuard requires an enrolled reference voice for speaker comparison.

Enrollment flow:

```text
Reference Audio
      ↓
Validation
      ↓
Preprocessing
      ↓
ECAPA-TDNN
      ↓
Speaker Embedding
      ↓
Cache / Persist
```

The enrolled embedding should be calculated once and reused.

Do not repeatedly run enrollment inference for every comparison.

---

# 5. Speaker Comparison

For a new audio clip:

```text
Comparison Audio
      ↓
Preprocessing
      ↓
ECAPA-TDNN
      ↓
Comparison Embedding
      ↓
Cosine Similarity
      ↓
Speaker Match Score
```

Conceptually:

```text
similarity =
cosine(enrolled_embedding, comparison_embedding)
```

The raw similarity and application-level score should remain distinguishable internally.

Do not pretend that a cosine similarity value is automatically a calibrated probability.

---

# 6. Speaker Match Score

The frontend may display a normalized:

```text
Speaker Match: 0–100
```

However, this must be an explicitly defined mapping from the model's similarity output.

The mapping must be:

* deterministic
* documented
* tested
* version-controlled

Example conceptual pipeline:

```text
Raw Similarity
      ↓
Calibration / Threshold Mapping
      ↓
0–100 Application Score
```

The exact mapping must be determined experimentally after the model is integrated.

Do not choose thresholds merely to make the demo look impressive.

---

# 7. Speaker Verification Thresholds

The system should distinguish between:

```text
MATCH
UNCERTAIN
MISMATCH
```

Thresholds must be based on observed validation data rather than arbitrary UI requirements.

Final thresholds should be recorded here after evaluation.

```text
MATCH:      TBD
UNCERTAIN:  TBD
MISMATCH:   TBD
```

These values must not be invented before model evaluation.

---

# 8. Anti-Spoof / Deepfake Detection

VoiceGuard requires a pretrained anti-spoofing model capable of distinguishing genuine speech from synthetic/manipulated speech.

Candidate model families include:

* AASIST
* RawNet2
* another suitable pretrained ASVspoof model

The final model must be selected based on:

* pretrained checkpoint availability
* compatibility with our Python environment
* inference speed
* ease of integration
* model size
* suitability for synthetic speech detection
* licensing
* hackathon reliability

The final selection must be recorded in `DECISIONS.md`.

---

# 9. No Training From Scratch

Do not train ECAPA-TDNN or the anti-spoof model from scratch.

Allowed:

* pretrained checkpoints
* inference
* preprocessing
* threshold calibration
* score normalization
* lightweight evaluation
* fixture generation

Not planned:

* large-scale model training
* custom neural architecture development
* extensive dataset collection
* distributed training
* hyperparameter optimization

---

# 10. Anti-Spoof Output

The anti-spoof model's raw output may be:

* logits
* scores
* class probabilities
* embeddings
* other model-specific outputs

VoiceGuard must convert this into a stable application-level representation.

Target representation:

```text
human_probability
synthetic_probability
authenticity_label
```

Example:

```text
{
  "human_probability": 0.08,
  "synthetic_probability": 0.92,
  "label": "LIKELY_SYNTHETIC"
}
```

These values must originate from actual model inference or an explicitly labeled Demo Mode fixture.

---

# 11. Calibration

Raw ML confidence is not automatically meaningful application confidence.

Calibration must therefore be treated as a separate step:

```text
Raw Model Output
       ↓
Calibration
       ↓
Application Probability
       ↓
Risk Engine
```

Calibration must be:

* deterministic
* documented
* reproducible
* tested

Potential approaches may include:

* threshold mapping
* logistic calibration
* min/max normalization where appropriate
* temperature scaling if justified

Do not use arbitrary transformations solely to create visually pleasing numbers.

---

# 12. Audio Preprocessing

Both ML pipelines must receive audio in the format expected by their respective models.

General pipeline:

```text
Input
 ↓
Decode
 ↓
Validate
 ↓
Mono conversion where required
 ↓
Resample
 ↓
Normalize
 ↓
Model-specific preprocessing
 ↓
Inference
```

Model-specific preprocessing requirements must be documented once the final checkpoints are selected.

---

# 13. Input Requirements

The frontend and backend must reject unusable audio before expensive inference.

Check:

* duration
* sample rate
* channel count
* decoded sample count
* file size
* codec
* silence
* NaN / infinite samples
* corrupted audio

Target recording duration:

```text
Minimum: ~1–2 seconds
Recommended: 3–5 seconds
```

The exact minimum should be configured rather than scattered throughout the codebase.

---

# 14. Short Audio Handling

Speaker verification becomes less reliable with very short speech.

If the clip is below the configured minimum:

```text
AUDIO_TOO_SHORT
```

must be returned.

Do not produce a normal speaker score from an invalid input.

---

# 15. Silence Handling

Silence-only or near-silence input should be rejected before ML inference.

Return:

```text
NO_USABLE_SPEECH
```

The frontend should offer:

```text
TRY AGAIN
UPLOAD AUDIO
DEMO MODE
```

---

# 16. Inference Architecture

ML code must remain separated from FastAPI routing.

Recommended structure:

```text
/ml
    /models
    /preprocessing
    /speaker
    /antispoof
    /calibration
    /evaluation
```

The backend should call ML services/modules rather than containing model implementation directly inside API routes.

Conceptually:

```text
FastAPI
   ↓
Analysis Service
   ↓
ML Modules
   ├── SpeakerVerifier
   └── AntiSpoofDetector
```

---

# 17. Model Lifecycle

Large models should be loaded once and reused.

Preferred:

```text
Application Startup
       ↓
Load Models
       ↓
Keep in Memory
       ↓
Inference Requests
```

Avoid:

```text
Request
 ↓
Load model
 ↓
Infer
 ↓
Unload
```

for every request.

This would unnecessarily increase latency.

---

# 18. Model Load Failure

If a model cannot load:

```text
MODEL_LOAD_ERROR
```

The application must not crash.

The affected signal becomes unavailable.

Example:

```text
Speaker Verification       ✓
Authenticity Detection     ✗
Risk Assessment             ⚠ PARTIAL
```

The frontend must visibly indicate the degraded state.

---

# 19. Inference Failure

Any inference exception must be converted into a structured failure.

Never expose raw Python exceptions or stack traces to the user.

Example:

```text
{
  "status": "PARTIAL_ANALYSIS",
  "signals": {
    "speaker": {
      "status": "complete"
    },
    "authenticity": {
      "status": "error",
      "error_code": "INFERENCE_FAILED"
    }
  }
}
```

---

# 20. Inference Timeout

Inference must have a defined timeout.

If one model exceeds its allowed inference window:

```text
MODEL_TIMEOUT
```

The system enters:

```text
PARTIAL_ANALYSIS
```

Do not fabricate the missing signal.

The timeout value should be finalized after measuring actual inference performance.

---

# 21. Partial Analysis

Partial analysis is a first-class ML state.

Possible states:

```text
NOT_STARTED
PROCESSING
COMPLETE
FAILED
TIMEOUT
PARTIAL
```

Example:

```text
Speaker ML:
COMPLETE

Anti-Spoof ML:
TIMEOUT

Overall:
PARTIAL_ANALYSIS
```

The Risk Engine must know which signals are actually available.

---

# 22. Risk Engine Boundary

ML models provide evidence.

The Risk Engine decides how that evidence contributes to risk.

```text
ML
 ↓
Structured Evidence
 ↓
Risk Engine
```

ML modules must not:

* directly set `risk_score`
* directly set `risk_level`
* block a caller
* approve a caller
* generate incident severity independently

---

# 23. Evidence Extraction

Where the selected models provide useful measurable indicators, preserve them as structured evidence.

Potential evidence categories:

```text
speaker_similarity
synthetic_probability
spectral_anomaly
prosody_anomaly
pitch_irregularity
temporal_artifacts
```

Only evidence actually computed by the system may be displayed as real evidence.

If a signal is not implemented yet:

```text
NOT_AVAILABLE
```

must be preferable to a fabricated percentage.

---

# 24. Explainability Contract

The ML layer should expose enough structured information for the WHY? panel.

Example:

```text
{
  "speaker_similarity": 0.94,
  "synthetic_probability": 0.91,
  "signals_available": [
    "speaker_similarity",
    "synthetic_probability"
  ]
}
```

The explanation layer converts these values into human-readable reasoning.

The ML layer itself does not generate marketing copy.

---

# 25. Embeddings

Speaker embeddings are treated as sensitive analysis artifacts.

They may be used for:

* enrollment
* comparison
* 2D fingerprint visualization
* cached analysis

Do not expose unnecessary raw embeddings through public API responses.

If the frontend requires a visualization, provide only the minimum derived representation necessary.

---

# 26. Voice Fingerprint

The Voice Fingerprint feature uses a **2D projection**, not a 3D visualization.

Possible methods:

```text
PCA
t-SNE
```

Preferred approach for the hackathon:

* use PCA first because it is deterministic and cheap
* use t-SNE only if there is a strong visualization reason

The visualization must represent real embedding relationships.

It must not generate random coordinates simply to create attractive clusters.

---

# 27. Demo Mode and ML

Demo Mode does not need to execute live ML inference.

It uses deterministic fixtures.

However, Demo Mode must pass through the same application contracts used by Live Mode:

```text
Demo Fixture
     ↓
Analysis Response Contract
     ↓
Dashboard
     ↓
Risk / Evidence / Timeline UI
```

The frontend must not contain a separate fake dashboard implementation.

---

# 28. Live Mode vs Demo Mode

### Live Mode

```text
Microphone / Upload
        ↓
Preprocessing
        ↓
Real ML
        ↓
Risk Engine
        ↓
Dashboard
```

### Demo Mode

```text
Fixed Scenario
        ↓
Deterministic Fixture
        ↓
Same Response Contract
        ↓
Risk Engine / Dashboard
```

Both modes should produce structurally equivalent analysis objects.

---

# 29. Determinism

Where possible, ML preprocessing and postprocessing must be deterministic.

Demo fixtures must be completely deterministic.

The following must never be randomized in Demo Mode:

* risk score
* speaker score
* authenticity score
* evidence
* timeline events
* incident classification

---

# 30. Evaluation Strategy

The hackathon does not require a publication-quality ML evaluation.

We do need enough evaluation to ensure the selected models behave sensibly.

Minimum evaluation:

### Speaker Verification

Test:

```text
same speaker → expected high similarity
different speaker → expected lower similarity
```

Use multiple clips where available.

### Anti-Spoof

Test:

```text
genuine speech → expected genuine
synthetic/TTS speech → expected synthetic
```

The goal is to validate the model pipeline and choose usable thresholds.

---

# 31. Calibration Notes

After PR-04 and PR-05, record actual results here.

### Speaker Model

```text
Model:
Checkpoint:
Embedding dimension:
Preprocessing:
Similarity metric:
MATCH threshold:
UNCERTAIN threshold:
Evaluation observations:
```

### Anti-Spoof Model

```text
Model:
Checkpoint:
Input format:
Raw output:
Calibration method:
Synthetic threshold:
Evaluation observations:
```

Do not leave invented values in this section.

---

# 32. Performance Targets

PRD target:

```text
First partial result: <2 seconds
Full risk result:     <4 seconds
```

These are targets, not assumptions.

Measure actual performance after integration.

Record:

```text
Model loading time:
Speaker inference:
Anti-spoof inference:
Preprocessing:
Risk calculation:
End-to-end:
```

If targets cannot be achieved, optimize before replacing working architecture.

---

# 33. Optimization Priority

If inference is too slow, optimize in this order:

1. Avoid repeated model loading
2. Cache enrolled speaker embedding
3. Avoid unnecessary audio conversions
4. Reduce unnecessary inference work
5. Profile model execution
6. Consider a lighter compatible checkpoint
7. Only then reconsider architecture

Do not prematurely optimize.

---

# 34. ML Dependencies

Every ML dependency must have a clear purpose.

Before introducing one, consider:

* package size
* installation time
* compatibility
* model availability
* licensing
* inference speed
* maintenance burden

A dependency must not be introduced merely because it is popular.

Any new dependency requires a one-line justification in the PR description or `DECISIONS.md`, as required by `RULES.md`.

---

# 35. Model Downloads

Large pretrained checkpoints should not be downloaded repeatedly.

Where supported:

* cache model files locally
* document the expected checkpoint
* ensure startup behavior is predictable

The demo environment should be prepared before the actual presentation.

Do not depend on downloading a large model during the golden-path demo.

---

# 36. Licensing

Before committing to a pretrained model/checkpoint, verify that its license permits the intended hackathon use.

Record the relevant model/license decision in:

```text
docs/DECISIONS.md
```

Do not assume that a publicly downloadable model is automatically unrestricted.

---

# 37. What ML Must Never Do

The ML layer must never:

* fabricate confidence values
* randomly generate embeddings
* randomly generate risk
* override the Risk Engine
* make final security decisions
* require an LLM
* require TTS
* require STT
* train models from scratch
* silently substitute missing inference with fake results

---

# 38. ML Failure Principle

The preferred behavior is:

```text
Reliable Evidence
      ↓
Use it

Insufficient Evidence
      ↓
Say so

Model Failure
      ↓
Partial Analysis

No ML Available
      ↓
Demo Mode / Explicit Unavailable State
```

Never:

```text
Model Failure
      ↓
Invent a convincing number
```

---

# 39. Final ML Contract

Every ML component must answer five questions:

```text
1. What model produced this?
2. What input did it receive?
3. What raw output did it produce?
4. How was that output transformed?
5. How confident are we that the result is usable?
```

If those answers cannot be established, the result must not be presented as trustworthy security evidence.

**VoiceGuard's ML layer exists to produce defensible evidence — not impressive-looking numbers.**
