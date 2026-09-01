# SECURITY.md — VoiceGuard Security & Resilience Specification

## 1. Security Objective

VoiceGuard is a **hackathon demonstration of voice impersonation defense**.

Its security model is based on one principle:

> **Identity match is not sufficient evidence of authenticity.**

VoiceGuard therefore evaluates two independent signals:

1. **Speaker identity** — does the voice resemble the enrolled speaker?
2. **Audio authenticity** — does the audio appear genuine or synthetic/manipulated?

These signals are combined by a deterministic risk engine.

The system must never represent an ML result, simulated result, fallback result, or external-service response as something it did not actually produce.

---

# 2. Security Boundaries

The system is divided into the following trust boundaries:

```text
Browser
   │
   │ Audio / WebSocket
   ▼
FastAPI Backend
   │
   ├── Audio Preprocessing
   │
   ├── Speaker Verification
   │
   ├── Anti-Spoof Detection
   │
   └── Risk Engine
          │
          ▼
       Decision
          │
          ├── Evidence
          ├── Timeline
          └── Incident
```

Optional services:

```text
LLM
TTS
STT
Database persistence
```

must never become required security dependencies for the core analysis path.

---

# 3. Core Security Rules

## Rule 1 — Never fabricate ML results

If a model has not run, the system must not display a plausible-looking confidence value.

Invalid:

```text
Speaker Match: 94%
```

when speaker verification did not execute.

Valid:

```text
Speaker Verification
UNAVAILABLE

Model inference failed.
```

or:

```text
Speaker Verification
DEMO FIXTURE
94%
```

when operating in deterministic Demo Mode.

---

## Rule 2 — Never fabricate threat intelligence

The Global Threat Map uses simulated data unless a legitimate real data source is explicitly integrated.

The UI must permanently display:

```text
SIMULATED THREAT INTELLIGENCE
```

when simulated data is being shown.

---

## Rule 3 — LLM has no security authority

The LLM may explain an existing decision.

It may not:

* calculate the authoritative risk score
* override the risk engine
* approve a caller
* block a caller
* change ML confidence values
* invent evidence
* create security decisions

The correct architecture is:

```text
ML
 ↓
Risk Engine
 ↓
Structured Decision
 ↓
LLM
 ↓
Human-readable Explanation
```

Never:

```text
Audio
 ↓
LLM
 ↓
Security Decision
```

---

# 4. External API Independence

Core VoiceGuard must operate with:

```text
LLM_API_KEY = unset
TTS_API_KEY = unset
STT_API_KEY = unset
```

The following must therefore work without external AI APIs:

* microphone capture
* audio upload
* waveform
* spectrogram
* speaker verification
* anti-spoof detection
* risk engine
* evidence breakdown
* timeline
* Demo Mode
* attack simulator
* security challenge
* incident report
* attack history

External services are enrichment only.

---

# 5. External API Failure Policy

External APIs must fail closed from the perspective of security decisions.

### LLM

Timeout:

```text
> 3 seconds
```

Action:

```text
Use deterministic explanation fallback.
```

The UI must display:

```text
ANALYST: DETERMINISTIC FALLBACK
```

The LLM must never block the core decision.

---

### TTS

TTS must not be required during the demo.

If unavailable:

```text
TTS UNAVAILABLE

Use the provided demo audio or microphone input.
```

---

### STT

STT must not be required for the core security decision.

If unavailable:

```text
TRANSCRIPTION UNAVAILABLE
```

Audio analysis must continue.

---

# 6. Audio Input Security

Audio is untrusted input.

Never assume uploaded or recorded audio is valid.

Validate:

* file existence
* file size
* codec
* container format
* sample rate
* number of channels
* duration
* decoded sample count
* numerical validity
* silence/near-silence

Reject invalid input before ML inference.

---

# 7. Minimum Audio Requirements

Very short clips can produce unreliable speaker embeddings.

The system should enforce a minimum duration appropriate to the selected models.

Target:

```text
Minimum: approximately 1–2 seconds
Recommended: 3–5 seconds
```

The exact threshold must be recorded in `ML.md` once model requirements are finalized.

If audio is too short:

```text
AUDIO TOO SHORT

Please provide at least [configured duration]
of usable speech.
```

Do not attempt to produce a confident security decision from insufficient audio.

---

# 8. Silence Detection

Silence-only recordings must not be sent through the normal analysis pipeline.

If detected:

```text
NO USABLE SPEECH DETECTED

The recording contains insufficient audio activity.

Please speak and try again.
```

Demo Mode must remain available.

---

# 9. Microphone Permission Failures

If microphone access is denied:

```text
MICROPHONE ACCESS DENIED

VoiceGuard cannot access your microphone.

Allow microphone access or upload
a prerecorded clip.

[ TRY AGAIN ]
[ UPLOAD AUDIO ]
[ DEMO MODE ]
```

Never repeatedly request permission without user action.

---

# 10. No Microphone Device

If no input device exists:

```text
NO AUDIO DEVICE DETECTED

No microphone was found.

You can upload an audio file or use Demo Mode.
```

The application must remain usable.

---

# 11. Audio Preprocessing

All audio entering ML inference must pass through a controlled preprocessing pipeline.

Conceptually:

```text
Input Audio
     ↓
Decode
     ↓
Validate
     ↓
Convert to expected format
     ↓
Resample
     ↓
Normalize
     ↓
Optional channel conversion
     ↓
ML inference
```

Preprocessing must be deterministic.

The target sample rate and preprocessing parameters must be recorded in `ML.md`.

---

# 12. Speaker Verification Security

Speaker verification produces an identity similarity signal.

It does NOT prove that the audio is genuine.

Therefore:

```text
HIGH SPEAKER MATCH
```

must never automatically imply:

```text
TRUSTED
```

Example:

```text
Speaker Match: 96%
Authenticity: 8% human / 92% synthetic

RESULT:
LIKELY VOICE IMPERSONATION
```

This distinction is fundamental to VoiceGuard.

---

# 13. Anti-Spoof Security

The anti-spoof model determines whether the audio exhibits characteristics associated with synthetic/manipulated speech.

Its raw output must be converted into the application's defined probability/confidence representation.

The mapping must be:

* deterministic
* documented
* testable
* consistent

Raw model output must never be arbitrarily changed merely to produce a more impressive demo result.

---

# 14. Risk Engine Security

The risk engine is the authoritative decision component.

Only structured evidence from trusted internal components may enter it.

Conceptually:

```text
Speaker Similarity
        +
Synthetic Probability
        +
Audio Anomalies
        ↓
Risk Engine
        ↓
0–100 Risk Score
        ↓
Risk Level
```

Risk bands:

```text
0–25     LOW
26–50    MODERATE
51–75    HIGH
76–100   CRITICAL
```

The exact formula must be documented and version-controlled.

The UI must never independently calculate or modify the authoritative risk score.

---

# 15. Partial Analysis

A failed signal must never be silently substituted with a fake successful result.

Example:

```text
Speaker Verification       ✓ COMPLETE
Authenticity Detection     ✗ FAILED
Risk Engine                ⚠ PARTIAL
```

The backend should mark the analysis:

```text
PARTIAL_ANALYSIS
```

The frontend must visibly communicate the degraded state.

Example:

```text
⚠ PARTIAL ANALYSIS

Authenticity analysis is unavailable.

Risk assessment has reduced confidence.
```

A partial result must not appear equivalent to a complete result.

---

# 16. Model Failure

Possible failures include:

* model checkpoint missing
* model loading failure
* insufficient memory
* inference exception
* inference timeout
* incompatible audio
* corrupted model state

Expected behavior:

```text
Model failure
     ↓
Structured error
     ↓
PARTIAL_ANALYSIS
     ↓
UI indicates unavailable signal
```

Never crash the entire dashboard because one model failed.

---

# 17. Model Loading

Models should be loaded once where practical.

Do not reload large models for every request.

Recommended architecture:

```text
Application startup
        ↓
Load model
        ↓
Keep model in memory
        ↓
Handle inference requests
```

If a model cannot load, the backend should expose its degraded state through health/status information.

---

# 18. WebSocket Security & Resilience

The WebSocket connection is responsible for analysis-state updates.

Expected lifecycle:

```text
CONNECTING
    ↓
CONNECTED
    ↓
RECORDING
    ↓
ANALYZING
    ↓
PARTIAL RESULT
    ↓
FINAL RESULT
```

If disconnected:

```text
CONNECTED
    ↓
DISCONNECTED
    ↓
RECONNECTING
    ↓
CONNECTED
```

Use reconnect-with-backoff.

Never silently continue displaying live-looking information when the connection has been lost.

The UI must show:

```text
↻ RECONNECTING
```

---

# 19. Stale Data Protection

Live data must not be mistaken for current data.

When the backend connection is lost:

* freeze existing values
* mark them as stale
* show connection state
* stop presenting them as live

Example:

```text
LAST ANALYSIS
2.8s AGO

⚠ CONNECTION LOST
```

---

# 20. Demo Mode Security

Demo Mode is intentionally deterministic.

The four scenarios are:

```text
1. Genuine Voice
2. AI Voice Clone
3. Replay Attack
4. Unknown Speaker
```

Each scenario has predefined:

* input
* expected analysis
* risk score
* evidence
* timeline
* outcome

Same scenario:

```text
input → output
```

must always produce the same result.

No random values should be introduced into the core scenario output.

---

# 21. Demo Data Transparency

Demo data must never be presented as live ML inference.

The application must clearly show:

```text
◆ DEMO MODE
```

or:

```text
DEMO FIXTURE
```

where appropriate.

This is especially important for:

* ML outputs
* threat intelligence
* simulated attacks
* simulated geographic activity

---

# 22. Database Resilience

SQLite is persistence, not a dependency for live analysis.

If SQLite fails:

```text
ML analysis → continues
Risk engine → continues
Dashboard → continues
History persistence → unavailable
```

The UI may display:

```text
DATABASE OFFLINE

Current analysis remains available.
History will not persist.
```

The database must never prevent the golden-path demo.

---

# 23. Incident Report Security

Incident reports must be generated from structured analysis results.

They must not invent:

* scores
* evidence
* timestamps
* threat types
* identities
* recommendations

PDF generation is secondary.

Correct behavior:

```text
Analysis
   ↓
On-screen report
   ↓
PDF export
```

If PDF generation fails:

```text
REPORT READY

PDF export unavailable.
```

The on-screen report remains usable.

---

# 24. Security Challenge

The challenge-response mechanism is an active-defense demonstration.

Challenge phrases must come from a fixed approved pool.

Do not generate security-critical challenge content through an LLM during the demo.

The challenge result is determined by explicit verification logic.

Example:

```text
Challenge issued
       ↓
Response captured
       ↓
Speaker verification
       +
Authenticity detection
       ↓
Challenge integrity
       ↓
PASS / FAIL
```

---

# 25. Attack Simulator

The Attack Simulator is a controlled demonstration environment.

It must not perform attacks against external systems.

It operates entirely against VoiceGuard's own analysis pipeline and fixtures.

Supported scenarios:

```text
Genuine Voice
AI Voice Clone
Replay Attack
Unknown Speaker
```

The simulator must not require real-world targets.

---

# 26. Global Threat Map

Unless backed by legitimate real-time data, the map is simulated.

Required visible label:

```text
SIMULATED THREAT INTELLIGENCE
```

Simulated geographic data must never influence the actual VoiceGuard risk score.

The map is purely contextual visualization.

---

# 27. LLM Data Boundary

If an LLM is enabled, it receives structured analysis information.

Allowed:

```text
risk_score
risk_level
speaker_match
synthetic_probability
evidence
timeline
recommended_action
```

Not required:

```text
raw audio
microphone stream
authentication secrets
API keys
private credentials
```

The LLM should receive the minimum information necessary to produce its explanation.

---

# 28. Secrets Management

Never commit:

* API keys
* tokens
* passwords
* private credentials
* `.env` files containing secrets

Repository configuration should use:

```text
.env.example
```

with placeholders.

Example:

```text
LLM_API_KEY=
TTS_API_KEY=
STT_API_KEY=
```

These services remain optional.

---

# 29. Frontend Security

Never trust values originating solely from the browser.

The backend is authoritative for:

* ML results
* risk scores
* evidence
* challenge results
* incident severity

The frontend is responsible for presentation and interaction.

It must not be possible for a UI-only modification to silently change the authoritative analysis result.

---

# 30. Backend Input Handling

Backend endpoints must validate incoming data.

Never assume:

* correct content type
* correct file extension
* correct audio codec
* reasonable file size
* valid numerical values
* valid scenario identifiers

Return structured errors.

Example:

```json
{
  "error": {
    "code": "AUDIO_TOO_SHORT",
    "message": "Audio duration is below the minimum threshold."
  }
}
```

Do not expose raw stack traces to the frontend.

---

# 31. Error Classification

Errors should fall into predictable categories.

```text
INPUT_ERROR
MODEL_ERROR
INFERENCE_ERROR
PARTIAL_ANALYSIS
CONNECTION_ERROR
DATABASE_ERROR
EXTERNAL_SERVICE_ERROR
INTERNAL_ERROR
```

Each category should map to an appropriate UI state.

---

# 32. Security Logging

Important system events should be represented as structured timeline events.

Examples:

```text
AUDIO_RECEIVED
PREPROCESSING_STARTED
SPEAKER_ANALYSIS_STARTED
SPEAKER_ANALYSIS_COMPLETED
AUTHENTICITY_ANALYSIS_STARTED
AUTHENTICITY_ANALYSIS_COMPLETED
ANOMALY_DETECTED
RISK_CALCULATED
THREAT_CONFIRMED
CHALLENGE_ISSUED
CHALLENGE_FAILED
SESSION_BLOCKED
```

Logs should help diagnose the demo without exposing secrets.

---

# 33. Observability

The Threat Timeline should double as a lightweight observability surface.

For technical judges, the system should make it possible to see:

```text
what happened
when it happened
which component produced it
what evidence was available
what decision followed
```

This is preferable to exposing raw backend logs during the demo.

---

# 34. Privacy

VoiceGuard should minimize unnecessary retention of audio.

For the hackathon build:

* audio should be processed only as required
* persistent storage of raw audio should not be assumed
* embeddings should be treated as sensitive analysis artifacts
* demo data should be clearly separated from live user data where practical

Do not send raw audio to optional external APIs unless explicitly required and documented.

---

# 35. Security Claims

VoiceGuard must not claim to provide perfect deepfake detection.

The UI and demo narrative should use language such as:

```text
LIKELY SYNTHETIC
SUSPICIOUS
HIGH RISK
DETECTED ARTIFACTS
MODEL CONFIDENCE
```

Avoid absolute claims such as:

```text
100% FAKE
IMPOSSIBLE TO SPOOF
GUARANTEED HUMAN
PERFECT DETECTION
```

The system demonstrates defense against voice impersonation; it does not prove universal detection capability.

---

# 36. Demo Safety

The golden-path demo must remain functional even if:

* microphone access fails
* a model fails
* WebSocket disconnects
* SQLite becomes unavailable
* LLM is unavailable
* TTS is unavailable
* STT is unavailable
* internet access disappears

Demo Mode must remain available locally.

The goal is:

```text
External dependency failure
          ↓
Graceful degradation
          ↓
Golden path survives
```

---

# 37. Degradation State Matrix

| Failure               | Core Analysis             | UI State                    | Demo Survives |
| --------------------- | ------------------------- | --------------------------- | ------------- |
| Mic denied            | Upload/Demo available     | `MIC DENIED`                | Yes           |
| No microphone         | Upload/Demo available     | `NO DEVICE`                 | Yes           |
| Invalid audio         | Reject input              | `INPUT ERROR`               | Yes           |
| Speaker model failure | Partial                   | `PARTIAL ANALYSIS`          | Yes           |
| Anti-spoof failure    | Partial                   | `PARTIAL ANALYSIS`          | Yes           |
| WebSocket failure     | Reconnect                 | `RECONNECTING`              | Yes           |
| SQLite failure        | In-memory operation       | `DATABASE OFFLINE`          | Yes           |
| LLM timeout           | Deterministic explanation | `ANALYST FALLBACK`          | Yes           |
| TTS failure           | Existing audio/input      | `TTS UNAVAILABLE`           | Yes           |
| STT failure           | Audio analysis continues  | `TRANSCRIPTION UNAVAILABLE` | Yes           |
| No API keys           | Core remains functional   | `OPTIONAL SERVICE OFFLINE`  | Yes           |

---

# 38. Security Testing Requirements

Before demo readiness, test:

### Audio

* valid audio
* too-short audio
* empty audio
* silence
* unsupported format
* malformed input

### ML

* successful speaker inference
* successful anti-spoof inference
* model loading failure
* inference exception
* inference timeout

### Risk

* LOW
* MODERATE
* HIGH
* CRITICAL
* partial-analysis scoring

### Connectivity

* WebSocket disconnect
* reconnect
* stale-state handling

### Persistence

* SQLite unavailable
* history unavailable
* report still works

### External services

* no API key
* API timeout
* API error
* deterministic fallback

Every degradation path must produce a deliberate UI state rather than an unhandled crash.

---

# 39. Security Decision Hierarchy

When components disagree, authority is ordered as follows:

```text
1. Validated ML outputs
2. Risk Engine
3. Structured Evidence
4. Deterministic Explanation
5. Optional LLM explanation
6. UI presentation
```

The UI and LLM cannot override upstream security decisions.

---

# 40. Final Security Principle

VoiceGuard should demonstrate not merely that it can detect an attack, but that it behaves responsibly when its evidence is incomplete.

The desired security behavior is:

```text
GOOD SIGNALS
    ↓
CONFIDENT DECISION

CONFLICTING SIGNALS
    ↓
INVESTIGATE

MISSING SIGNAL
    ↓
PARTIAL ANALYSIS

SYSTEM FAILURE
    ↓
DEGRADE GRACEFULLY

NO EXTERNAL SERVICES
    ↓
CORE STILL WORKS
```

**VoiceGuard must prefer an honest "I don't know" over a fabricated confident answer.**
