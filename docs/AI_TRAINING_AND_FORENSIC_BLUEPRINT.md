# VoiceGuard: AI Model Training, Forensic Calibration & Loophole Remediation Blueprint

> **Document Version**: 1.0.0  
> **Target Audience**: Future AI Development Agents, ML Research Engineers, Security Auditors  
> **Repository**: `voiceguard` | Core Biometric Threat Detection Engine  
> **Date**: September 2026  

---

## 1. Executive Summary & The Golden Rule

VoiceGuard is an active biometric security system engineered to defend voice-authenticated channels (banking IVRs, identity verification hotlines, call centers, emergency dispatch, and access control) against AI voice cloning, deepfakes, synthetic speech injection, and acoustic replay attacks.

### 🌟 The Foundational Tenet: "Zero False Positives for Real Humans"
```
                ┌─────────────────────────────────────────────────────────┐
                │               INCOMING AUDIO STREAM                     │
                └───────────────────────────┬─────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐               ┌─────────────────────────────┐
     │  SIGNAL 1: AUTHENTICITY     │               │  SIGNAL 2: IDENTITY         │
     │  (Biological vs Algorithmic)│               │  (Authorized vs Stranger)   │
     │  - Vocal fold turbulence    │               │  - ECAPA-TDNN 192-d vectors │
     │  - Spectral micro-flux      │               │  - Formant distances        │
     │  - Vocoder brick-wall drops │               │  - Cosine distance metric   │
     └──────────────┬──────────────┘               └──────────────┬──────────────┘
                    │                                             │
                    └───────────────────────┬─────────────────────┘
                                            ▼
                    ┌─────────────────────────────────────────────┐
                    │               RISK ENGINE                   │
                    │   Evaluates threat context & escalations    │
                    └─────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **The Golden Rule**: The system must **NEVER** classify an authentic living human being as AI, synthetic, or deepfake, regardless of their gender, native accent, pitch, age, volume, background room acoustics, or lossy codec compression (e.g. WhatsApp, telephony, Bluetooth).

- **Authenticity is Universal**: Every human has biological lungs, larynx, vocal cords, and articulators that obey fluid dynamics and acoustic physics.
- **Identity is Personal**: Whether a human is the enrolled account owner ("Primary User") or an unauthorized guest/stranger is strictly an **Identity** decision, never an **Authenticity** failure.

---

## 2. Decoupled Architecture: Authenticity vs Identity

VoiceGuard strictly decouples **Authenticity (What generated the sound?)** from **Identity (Who is speaking?)**:

| Real-World Scenario | Authenticity Layer | Speaker Verification Layer | Final System Verdict | Risk Score & Action |
| :--- | :---: | :---: | :---: | :---: |
| **Enrolled Primary User** speaking naturally | `AUTHENTIC` (97% Human) | `MATCHED` (>95%) | 🟢 **Authorized Caller** | `0–5 / 100 [LOW]` — Grant Access |
| **Friend / Family / Stranger** speaking naturally | `AUTHENTIC` (97% Human) | `MISMATCH` (<45%) | 🟡 **Unverified Human** | `15–25 / 100 [LOW/MOD]` — Challenge Identity (NOT Deepfake) |
| **Targeted AI Clone** (cloned after Primary User) | `SYNTHETIC` (88% AI) | `MATCHED` or `UNCERTAIN` | 🚨 **Critical Impersonation** | `85–95 / 100 [CRITICAL]` — Terminate Session |
| **Google Translate / Generic TTS** voice | `SYNTHETIC` (88% AI) | `MISMATCH` (0%) | 🔴 **Synthetic Injection** | `85–90 / 100 [CRITICAL]` — Deny Authorization |
| **Loudspeaker Replay** of recorded user voice | `SYNTHETIC` / `SUSPICIOUS` | `MATCHED` (>90%) | 🔴 **Acoustic Replay** | `80–90 / 100 [CRITICAL]` — Challenge Liveness |

---

## 3. Acoustic Physics: Biological Human vs Algorithmic AI

### 3.1 Biological Human Vocal Mechanics
1. **Aspiration Turbulence**: When air passes through the human glottis and oral tract, biological tissue friction introduces wideband micro-turbulence. This manifests as:
   - Spectral Flatness $\in [0.12, 0.40]$
   - Smooth harmonic roll-off extending past $6\text{ kHz}$ to $8\text{ kHz}$ (no mathematical zero-cutoffs).
2. **Dynamic Spectral Flux**: As the tongue, lips, and velum articulate different phonemes, the spectral power distribution shifts dynamically across frames:
   - Volume-Normalized Spectral Flux $\in [0.45, 0.85]$.
3. **Biological Period Jitter & Shimmer**: Human vocal fold tissue cannot sustain absolute mathematical frequency lock:
   - Fundamental Frequency Period Jitter: $0.4\% - 1.8\%$.
   - Glottal Amplitude Shimmer: $1.2\% - 3.5\%$.
4. **Natural Intonation Contours**: Spoken human statements follow linguistic pitch declination (sentences start higher and pitch naturally slopes downward towards terminal punctuation):
   - Intonation Variance ($\sigma_{f0} / \mu_{f0}$) $\ge 0.20$.

### 3.2 Synthetic AI Mechanics (TTS, Vocoders & Clones)
1. **Neural Vocoder Bandwidth Cutoff**: Most neural vocoders (HiFi-GAN, MelGAN, WaveGlow, BigVGAN) are trained on Mel-spectrograms with an 80-band filterbank capped at 7.6 kHz or 8.0 kHz. This creates an unnatural vertical brick-wall cutoff at the frequency boundary.
2. **Artificial Harmonic Rigidity**: Direct neural synthesis renders hyper-clean harmonic peaks without human aspiration turbulence:
   - Synthetic Spectral Flatness $< 0.035$ (often $< 0.015$).
3. **Static Frame Transition (Low Flux)**: Concatenative and neural TTS models (e.g., Google Translate, legacy TTS) render steady-state vowels with identical spectral energy across consecutive frames:
   - Volume-Normalized Spectral Flux $< 0.15$.
4. **Robotic Pitch Regularity**: Non-expressive TTS engines exhibit flat intonation contours without biological breath pauses or emotional inflection:
   - Intonation Variance $< 0.18$.

---

## 4. Known Loopholes & Attack Vectors Matrix

This matrix documents every potential failure mode, the attack vector that exploits it, and the permanent mitigation strategy:

| # | Vulnerability / Loophole | Attacker Exploit Strategy | Danger / Risk | Permanent Architectural Fix |
| :-: | :--- | :--- | :--- | :--- |
| **L-01** | **Acoustic Replay Noise Masking** | Attacker plays an AI voice clone or TTS through a smartphone loudspeaker into a room microphone. | Environmental room noise and microphone hiss inflate high-frequency energy ($>6\text{kHz}$), bypassing simple high-frequency cutoff checks. | Combine high-frequency energy with **Volume-Normalized Spectral Flux** and **Loudspeaker Resonance Peak Detection** (resonance peaks typically between $2.5\text{ kHz} - 4.5\text{ kHz}$). |
| **L-02** | **Lossy Codec Compression Masking** | Attacker transmits synthetic audio via WhatsApp (Opus) or GSM/VoLTE (AMR-WB). | Lossy compression quantizes high frequencies and introduces coding artifacts that can confuse raw FFT models. | Use multi-band filterbanks (LFCC / CQCC) and compute relative energy ratios between lower speech formants ($300\text{ Hz} - 3.4\text{ kHz}$) and upper bands. |
| **L-03** | **Monotone / Scripted Human False Positives** | A real human reads a formal legal text or script in a tired, calm, or monotone voice. | A detector relying solely on pitch variance might flag the monotone human as synthetic TTS. | Require **conjunction of anomalies**: Never flag synthetic speech unless *both* vocal tract turbulence (flatness/flux) AND prosody are abnormal. |
| **L-04** | **Whispered Voice False Positives** | A human whispers due to privacy or illness. | Whispering lacks periodic glottal pulse ($f_0$), resulting in no measurable pitch track. | Check for speech presence vs voiced glottal mode: If the signal is unvoiced whisper, bypass pitch intonation and evaluate wideband oral formant decay instead. |
| **L-05** | **Ultra-High-Fidelity Diffusion Vocoders** | Attacker uses modern 48kHz flow-matching or diffusion vocoders (e.g., ElevenLabs v3, CosyVoice, F5-TTS) that do not truncate at 8kHz. | Standard vocoder frequency cutoff checks fail because the model generates frequencies up to 24kHz. | Measure **phase coherence and instantaneous group delay**. Neural models struggle with phase-frequency continuity across sub-bands. |
| **L-06** | **Sub-2-Second Audio Snippets** | Audio input is shorter than 1.5 seconds (e.g., single words like *"Yes"*, *"Hello"*). | Insufficient temporal duration to extract reliable pitch intonation or temporal frame deltas. | Flag `PARTIAL_ANALYSIS`, request a longer phrase, or issue a dynamic security challenge (PR-04 active defense). |
| **L-07** | **Container Header Mismatches (WebM / Opus)** | WhatsApp or browser media recordings save WebM/Opus files without standard seek tables or standard MIME types. | Browser `decodeAudioData` crashes or backend `soundfile` rejects the file as unrecognized. | Employ **PyAV resilient stream decoding** that decodes packet-by-packet and gracefully tolerates trailing metadata packets. |

---

## 5. Dataset Curation Protocol for Training Future AI Models

To train or fine-tune next-generation deep learning models (e.g., AASIST, RawNet3, Whisper-based probes), follow this standardized data collection protocol:

```
dataset_root/
├── train/
│   ├── genuine/          # Diverse authentic human speech (Class 0)
│   ├── synthetic/        # Direct AI generated/cloned speech (Class 1)
│   └── replay/           # Re-recorded loudspeaker attacks (Class 2)
├── val/
└── test/
```

### 5.1 Class 0: Genuine Biological Human Speech (Minimum: 10,000 samples)
- **Demographic Balance**:
  - Minimum 40% male, 40% female, 10% senior citizens (>60y), 10% non-native accents.
  - Languages: English, Hindi, Spanish, Mandarin, regional dialects.
- **Acoustic Environments**:
  - 30% Studio / Quiet Room (high SNR > 30 dB).
  - 30% Typical Office / Home Room (moderate reverberation, SNR 15–25 dB).
  - 20% Ambient Noise (traffic, background chatter, air conditioner, SNR 5–15 dB).
  - 20% Mobile & WhatsApp Compressed (Opus 16kbps–32kbps, AMR-WB 12.65kbps).
- **Speaking Styles**:
  - Conversational / Spontaneous speech.
  - Structured reading (monotone news/script reading).
  - High emotional speech (hurried, stressed, whispering).

### 5.2 Class 1: Synthetic & Cloned Speech (Minimum: 10,000 samples)
- **Model Diversity**:
  - Neural TTS: ElevenLabs (Flash & Multilingual v2), OpenAI TTS (Alloy, Echo, Shimmer), Cartesia, Google Cloud TTS, Microsoft Azure Speech.
  - Open-Source Engines: XTTS-v2, Tortoise-TTS, VITS, Bark, Coqui TTS, Piper, ChatTTS.
  - Voice Conversion: Retrieval-based Voice Conversion (RVC v2), So-VITS-SVC 4.0, FreeVC.
  - Historical Concatenative / Formant Engines: eSpeak, Festival (for baseline coverage).

### 5.3 Class 2: Acoustic Replay Attacks (Minimum: 5,000 samples)
- Record genuine and synthetic speech played back through:
  - Budget smartphone speakers (iPhone, Samsung, Xiaomi).
  - Laptop speakers (MacBook, Dell).
  - Budget Bluetooth portable speakers (JBL, Boat).
  - Captured at distances of 10cm, 30cm, and 100cm in small rooms, large rooms, and cars.

---

## 6. Recommended AI Model Architectures & Loss Functions

### 6.1 Anti-Spoofing & Deepfake Detection Engine
1. **Primary Model: AASIST (Audio Anti-Spoofing using Integrated Spectro-Temporal Graph Attention Networks)**:
   - **Input**: Raw time-domain waveforms normalized to 16 kHz (no precomputed spectrograms).
   - **Mechanism**: Graph neural network that models relationships across temporal domains and spectral sub-bands simultaneously.
   - **Advantage**: Detects both time-domain phase discontinuities and frequency-domain vocoder artifacts without manual feature crafting.
2. **Alternative / Ensemble: Whisper Encoder + Linear Probe**:
   - Pass raw audio through a frozen `whisper-base.en` encoder.
   - Train an attentive pooling layer + multi-layer perceptron on the intermediate representations.
   - Whisper representations capture acoustic phonetics while being robust to background noise.

### 6.2 Loss Functions for Anti-Spoofing
Use **Focal Loss** combined with **Supervised Contrastive Loss (SupCon)**:
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{Focal}} + \lambda \mathcal{L}_{\text{SupCon}}$$

- **Focal Loss**: Prevents easy examples from dominating gradients; forces the model to focus on hard, subtle boundary cases (e.g., high-fidelity diffusion vocoders vs. monotone humans).
- **SupCon**: Pulls embeddings of all genuine human voices close together in latent space, while pushing synthetic and replay clusters far away, regardless of speaker identity.

### 6.3 Speaker Verification Engine (ECAPA-TDNN)
1. **Architecture**: 192-dimensional ECAPA-TDNN with Squeeze-and-Excitation residual blocks.
2. **Loss Function**: **Additive Angular Margin Softmax (AAM-Softmax / ArcFace)**:
   $$\mathcal{L}_{\text{AAM}} = -\log \frac{e^{s(\cos(\theta_{y} + m))}}{e^{s(\cos(\theta_{y} + m))} + \sum_{j \neq y} e^{s \cos \theta_j}}$$
   - Enforces an angular margin $m \approx 0.2$ between speaker identities, ensuring high intra-speaker compactness and inter-speaker separation.

---

## 7. Feature Engineering Formulas (DSP Fallbacks & Verification)

When running offline without GPU deep learning, use these verified mathematical feature extraction routines:

### 7.1 Volume-Normalized Spectral Flux
Measures the frame-to-frame rate of spectral shape change, independent of recording volume:
```python
def compute_normalized_spectral_flux(audio: np.ndarray, sr: int = 16000) -> float:
    # 1. Normalize peak amplitude
    norm_audio = audio / (np.max(np.abs(audio)) + 1e-9)
    # 2. Spectrogram (512-point FFT, 50% overlap)
    f, t, Sxx = scipy.signal.spectrogram(norm_audio, fs=sr, nperseg=512, noverlap=256)
    if Sxx.shape[1] < 3:
        return 0.50
    # 3. Normalize each frame column by its Euclidean norm
    col_norms = np.linalg.norm(Sxx, axis=0, keepdims=True) + 1e-9
    norm_Sxx = Sxx / col_norms
    # 4. Frame difference
    diff_spec = np.diff(norm_Sxx, axis=1)
    return float(np.mean(np.sqrt(np.sum(diff_spec**2, axis=0))))
```
- **Threshold**: Real Human $> 0.40$; Direct AI Clone / Replay $< 0.15$.

### 7.2 Spectral Flatness (Wiener Entropy)
Measures the ratio of geometric mean to arithmetic mean of power spectral density:
```python
def compute_spectral_flatness(audio: np.ndarray) -> float:
    fft_mag = np.abs(np.fft.rfft(audio))
    geometric_mean = np.exp(np.mean(np.log(fft_mag + 1e-9)))
    arithmetic_mean = np.mean(fft_mag) + 1e-9
    return float(geometric_mean / arithmetic_mean)
```
- **Threshold**: Real Human $> 0.10$; Neural Vocoder $< 0.035$.

### 7.3 High-Frequency Energy Ratio
Measures energy presence above neural vocoder cutoff ($f > 6\text{ kHz}$):
```python
def compute_hf_energy_ratio(audio: np.ndarray, sr: int = 16000) -> float:
    fft_mag = np.abs(np.fft.rfft(audio))
    freqs = np.fft.rfftfreq(len(audio), 1.0 / sr)
    total_energy = np.sum(fft_mag**2) + 1e-9
    hf_energy = np.sum(fft_mag[freqs > 6000]**2)
    return float(hf_energy / total_energy)
```
- **Threshold**: Normal Human $\in [0.0001, 0.0015]$; Vocoder Cutoff $< 0.00005$; Loudspeaker Replay Screech $> 0.005$.

---

## 8. Verification & Regression Testing Protocol

Every future model, weight update, or calibration tweak must pass this regression matrix before deployment:

### 8.1 Automated Test Execution Command
```bash
./venv/bin/pytest backend/tests -v
```

### 8.2 Mandatory Acceptance Criteria
1. **Human False Positive Rate (FPR)**: Must be **$0.0\%$** across the genuine test suite. No authentic human voice may produce $\text{synthetic\_probability} > 40\%$.
2. **Synthetic Detection Rate (Recall)**: Must be **$\ge 99.0\%$** on direct AI clones, speech synthesis, and replay attacks ($\text{synthetic\_probability} \ge 80\%$).
3. **Cross-Session Speaker Similarity (Enrolled vs Unseen Human)**:
   - Same person (different recordings): $\text{cosine similarity} \ge 0.90$ ($\text{MATCHED}$).
   - Different person (stranger human): $\text{cosine similarity} < 0.65$ ($\text{MISMATCH}$).
4. **Latency Budget**: Full pipeline analysis must execute in under **500 milliseconds** on CPU for a 5-second audio sample.

---

## 9. Developer Checklist for Training with New Samples

When you obtain new audio recordings from users or attack datasets:

- [ ] **Step 1**: Place clean WAV/MP3/MPEG files into `ml/data/training/genuine` or `ml/data/training/synthetic`.
- [ ] **Step 2**: Normalize all files to 16,000 Hz, single-channel mono float32 using `backend.services.audio_preprocessor`.
- [ ] **Step 3**: Run feature extraction inspection script:
  ```bash
  ./venv/bin/python3 -c "
  from backend.services.audio_preprocessor import decode_and_validate_audio
  from ml.antispoof import antispoof_detector
  # Validate against threshold benchmarks
  "
  ```
- [ ] **Step 4**: Check that the minimum, mean, and maximum spectral flux across all genuine files remain $> 0.35$.
- [ ] **Step 5**: Update unit test suite in `backend/tests/test_scenarios.py` to include the new audio file as a permanent regression fixture.
- [ ] **Step 6**: Verify `pytest` passes 100% cleanly.
