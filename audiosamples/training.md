Absolutely. The implementation should use **only the explicitly provided samples A and B** from `audio/samples` as the current reference/training dataset. The other samples you tested should **not** silently become training data.

Use this prompt with your coding agent:

## Task: Implement Forensic Voice Features Using Only Explicitly Selected Training Samples

We need to improve the VoiceGuard voice-authenticity detection pipeline using the forensic findings from our current audio analysis.

### CRITICAL DATA RULE

**Do NOT use every file in `frontend/public/audio/samples/` for model training.**

For this implementation, only the two explicitly designated training/reference samples **A and B** may be used:

* Sample A: the file I will designate as `A`
* Sample B: the file I will designate as `B`

I will provide additional training samples later.

The following files, and any other existing demo/test samples, must **NOT** be automatically included in training:

* `user_natural_primary.wav`
* `genuine_primary_1.wav`
* `genuine_primary_2.wav`
* `ai_clone_attack_1.wav`
* `ai_clone_attack_2.wav`

Unless I explicitly designate one of them as A or B, treat them only as test/demo data.

Do not implement folder-wide globbing such as `*.wav` for training.

Create an explicit configuration/list for training samples so that future samples can be added deliberately.

---

# Objective

Add the following acoustic/forensic features to the existing VoiceGuard detection pipeline:

1. Spectral Flatness
2. Spectral Flux
3. High-frequency energy ratio
4. Pitch/intonation variance
5. Jitter
6. Temporal/energy variance

These features should become **additional evidence**, not replace the existing ML models.

The pipeline should ultimately combine:

* Existing anti-spoof model output
* Forensic acoustic features
* Speaker verification / ECAPA-TDNN result
* Existing confidence/scoring logic

Do not hard-code the final result to "AI" merely because one feature crosses a threshold.

---

# Forensic Feature Extraction

Create a clean reusable module, for example:

`ml/antispoof/forensic_features.py`

Implement a function similar to:

```python
extract_forensic_features(audio, sample_rate)
```

Return a structured dictionary/dataclass containing:

```text
duration_s
spectral_flatness
spectral_flux
hf_energy_ratio
pitch_mean_hz
pitch_std_hz
intonation_variance
jitter_pct
energy_variance
```

Handle:

* mono/stereo input
* silence
* very short audio
* invalid sample rates
* NaN/Inf values
* insufficient pitch frames

Do not crash when a feature cannot be reliably calculated. Return a sensible null/zero value plus an optional reliability flag.

---

# Features

## 1. Spectral Flatness

Calculate Wiener spectral flatness.

Conceptually:

```text
geometric_mean / arithmetic_mean
```

Do not blindly assume the previous observed ranges are universal.

The values we observed in our current experiments were approximately:

```text
Natural:
0.10 - 0.40

Synthetic:
often < 0.035
```

Treat these as **initial observations**, NOT scientifically universal thresholds.

---

## 2. Spectral Flux

Calculate normalized frame-to-frame spectral change.

The previous analysis found:

```text
Natural:
> approximately 0.40

Synthetic:
often < approximately 0.15
```

Again, these are initial empirical observations from our samples and must not be presented as universal forensic thresholds.

Make the implementation configurable.

---

## 3. High-Frequency Energy Ratio

Calculate the proportion of spectral energy above approximately 6 kHz.

Expose the frequency cutoff through configuration:

```python
HF_CUTOFF_HZ = 6000
```

The previous samples showed significantly reduced high-frequency energy in the synthetic sample.

Do not hard-code this as proof of synthetic speech because recording equipment, codecs, microphones and sample rate can also cause high-frequency loss.

---

## 4. Pitch / Intonation Variance

Estimate F0 over voiced frames.

Calculate:

```text
pitch_mean_hz
pitch_std_hz
intonation_variance = pitch_std / pitch_mean
```

The previous analysis observed very low pitch variation in one synthetic sample.

However, do NOT classify speech as synthetic solely because pitch variation is low.

Account for:

* monotone human speech
* short utterances
* gender differences
* microphone quality
* pitch-tracking failures

---

## 5. Jitter

Estimate cycle-to-cycle pitch variation.

Return:

```text
jitter_pct
```

The previous synthetic sample showed approximately zero jitter.

But the implementation must avoid treating `0` as automatically synthetic because pitch-tracking failure can also produce zero.

Include a reliability indicator such as:

```text
pitch_reliable
```

---

## 6. Energy Variance

Calculate temporal variation of frame-level RMS energy.

Return:

```text
energy_variance
```

This should be used as supporting evidence only.

---

# Feature Reliability

Each feature should ideally have a reliability/confidence value.

For example:

```json
{
    "spectral_flatness": {
        "value": 0.21,
        "reliable": true
    },
    "pitch_variance": {
        "value": 0.17,
        "reliable": true
    }
}
```

This is important because pitch and jitter are much less reliable on short or noisy recordings.

---

# Training Design

The two explicitly selected samples A and B should be used to establish the **initial empirical baseline/calibration**.

Do NOT train directly on every file in the samples directory.

Create an explicit configuration, for example:

```python
TRAINING_SAMPLES = [
    "A_FILENAME.wav",
    "B_FILENAME.wav"
]
```

or preferably a configuration file:

```json
{
    "training_samples": [
        "A_FILENAME.wav",
        "B_FILENAME.wav"
    ]
}
```

The implementation should make it easy for me to later add:

```text
C
D
E
...
```

without changing the detection code.

---

# Important distinction

Do NOT call these two samples a complete machine-learning training dataset.

At this stage they should primarily be used for:

* calibration
* feature normalization
* establishing an initial baseline
* validating the feature extraction pipeline

If the existing architecture has an actual trainable classifier, do not pretend that two samples constitute a robust ML training set.

Build the architecture so that additional labeled samples can later be incorporated properly.

---

# Scoring

Create a separate forensic score rather than replacing the existing anti-spoof classifier.

For example:

```text
forensic_score
```

should combine the available features using configurable weights.

Possible initial structure:

```text
spectral flatness
spectral flux
HF energy
pitch variation
jitter
energy variance
```

Use normalized feature scores rather than raw values.

Important:

**Do not use the previously observed thresholds as absolute scientific truth.**

Put thresholds and weights in configuration so they can be recalibrated after I provide more samples.

For example:

```python
FORENSIC_CONFIG = {
    "spectral_flatness": {
        "weight": ...
    },
    "spectral_flux": {
        "weight": ...
    },
    "hf_energy_ratio": {
        "weight": ...
    },
    "intonation_variance": {
        "weight": ...
    },
    "jitter": {
        "weight": ...
    },
    "energy_variance": {
        "weight": ...
    }
}
```

---

# Integration With Existing Detector

Inspect the existing:

```text
ml/antispoof/detector.py
ml/speaker/ecapa_verifier.py
ml/speaker/similarity.py
```

before modifying anything.

Preserve the existing APIs wherever possible.

The final detector should produce something conceptually like:

```json
{
    "classification": "AUTHENTIC",
    "human_probability": 0.95,
    "synthetic_probability": 0.05,

    "model_score": 0.XX,

    "forensic_score": 0.XX,

    "forensic_features": {
        "spectral_flatness": ...,
        "spectral_flux": ...,
        "hf_energy_ratio": ...,
        "intonation_variance": ...,
        "jitter_pct": ...,
        "energy_variance": ...
    },

    "speaker_similarity": 0.XX
}
```

Use the existing project's response format if one already exists rather than unnecessarily changing the frontend API.

---

# Frontend Compatibility

Do not break the existing frontend.

If the frontend already displays:

* Human %
* AI %
* Authentic/Synthetic
* Speaker similarity

keep those fields working.

If useful, expose the new forensic metrics so the demo can show an explanation such as:

```text
Forensic Analysis
✓ Spectral characteristics
✓ Temporal dynamics
✓ Pitch consistency
✓ High-frequency characteristics
```

But don't expose misleading statements such as:

> "This proves the voice is AI."

Use wording such as:

> "Multiple acoustic indicators are consistent with synthetic speech."

---

# Testing

After implementation, create/run tests using ONLY the explicitly configured A and B training/reference samples.

Then separately test the detector against existing samples as **evaluation/demo samples**, without allowing those samples to enter calibration/training.

Verify that:

1. No automatic folder-wide training occurs.
2. A and B are the only initial training/calibration inputs.
3. Existing demo files remain excluded.
4. Adding C/D/E later only requires updating the explicit configuration.
5. Feature extraction works for WAV files.
6. Short recordings do not crash.
7. Stereo recordings are handled.
8. Silence does not crash the detector.
9. Missing/invalid audio produces a controlled error.
10. Existing frontend/backend functionality remains intact.

---

# Before coding

First inspect the existing VoiceGuard architecture and identify:

* where audio enters the pipeline
* where anti-spoof inference occurs
* where speaker verification occurs
* where probabilities are generated
* where the frontend receives detection results
* the exact filenames currently designated as sample A and B

**Do not assume which files are A and B.**

If A and B are not explicitly identifiable from the existing project/configuration, stop and ask me which two files should be designated as A and B.

Do not modify unrelated parts of the project.
Do not delete existing samples.
Do not train on the entire `audio/samples` directory.
Do not silently include future files.
Keep the implementation modular so we can add more labeled samples later.
