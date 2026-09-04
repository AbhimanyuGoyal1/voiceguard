import os
import json
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional, Tuple
import numpy as np
import scipy.signal

# Default configuration path
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "training_config.json")


def load_forensic_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """Loads explicit calibration and forensic parameters configuration."""
    path = config_path or CONFIG_PATH
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "active_calibration_samples": [],
        "forensic_parameters": {
            "hf_cutoff_hz": 6000,
            "weights": {
                "spectral_flatness": 0.25,
                "spectral_flux": 0.25,
                "hf_energy_ratio": 0.20,
                "intonation_variance": 0.15,
                "jitter": 0.10,
                "energy_variance": 0.05,
            },
            "reference_ranges": {
                "spectral_flatness": {"natural_min": 0.08, "synthetic_threshold": 0.035},
                "spectral_flux": {"natural_min": 0.35, "synthetic_threshold": 0.15},
                "hf_energy_ratio": {"natural_min": 0.00008, "synthetic_cutoff": 0.00005},
                "intonation_variance": {"natural_min": 0.18, "synthetic_monotone": 0.05},
                "jitter_pct": {"natural_min": 0.40, "synthetic_zero": 0.10},
            },
        },
    }


@dataclass
class ForensicFeaturesResult:
    duration_s: float
    spectral_flatness: float
    spectral_flux: float
    hf_energy_ratio: float
    pitch_mean_hz: float
    pitch_std_hz: float
    intonation_variance: float
    jitter_pct: float
    energy_variance: float
    pitch_reliable: bool
    is_silent: bool
    forensic_score: float
    reliability: Dict[str, bool]
    formant_to_low_ratio: float = 0.30
    hf_to_mid_ratio: float = 0.001
    is_formant_depleted: bool = False
    rigid_harmonicity_fraction: float = 0.20

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def extract_forensic_features(
    audio: np.ndarray,
    sample_rate: int = 16000,
    config: Optional[Dict[str, Any]] = None,
) -> ForensicFeaturesResult:
    """
    Extracts acoustic forensic features differentiating organic human speech from AI synthesis.
    Features:
      1. Spectral Flatness (Wiener entropy)
      2. Volume-Normalized Spectral Flux
      3. High-Frequency Energy Ratio (>6kHz cutoff)
      4. Pitch / Intonation Variance (f0 stability)
      5. Jitter Percentage (cycle-to-cycle perturbation)
      6. Energy Variance (temporal syllabic dynamics)

    Robust against:
      - None / empty / very short inputs (<0.1s)
      - Silence / near-zero amplitude
      - Multi-channel audio (auto-downmixed to mono)
      - Invalid sample rates
      - NaN / Inf values
    """
    cfg = config or load_forensic_config()
    param_cfg = cfg.get("forensic_parameters", {})
    hf_cutoff = param_cfg.get("hf_cutoff_hz", 6000)
    weights = param_cfg.get("weights", {})
    ranges = param_cfg.get("reference_ranges", {})

    # 1. Validation & Preprocessing
    if audio is None or len(audio) == 0:
        return _empty_result(0.0, is_silent=True)

    # Ensure 1D float32
    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)
    audio = np.nan_to_num(audio.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)

    sr = int(sample_rate) if sample_rate and sample_rate > 0 else 16000
    duration_s = float(len(audio) / sr)

    # Silence check
    peak = float(np.max(np.abs(audio)))
    rms = float(np.sqrt(np.mean(audio**2)))
    if peak < 1e-4 or rms < 1e-5 or duration_s < 0.1:
        return _empty_result(duration_s, is_silent=True)

    norm_audio = audio / (peak + 1e-9)

    # 2. Spectral Flatness (Wiener Entropy) & High-Frequency Energy Ratio
    fft_mag = np.abs(np.fft.rfft(norm_audio))
    freqs = np.fft.rfftfreq(len(norm_audio), 1.0 / sr)
    total_energy = float(np.sum(fft_mag**2)) + 1e-9

    hf_mask = freqs > hf_cutoff
    hf_energy = float(np.sum(fft_mag[hf_mask] ** 2) / total_energy) if np.any(hf_mask) else 0.0

    # Vocal tract formant & sub-band energy distribution
    low_mask = (freqs >= 0) & (freqs < 500)
    mid_formant_mask = (freqs >= 500) & (freqs < 3000)
    hf_band_mask = (freqs >= 6000) & (freqs < 8000)

    low_energy = float(np.sum(fft_mag[low_mask] ** 2) / total_energy) if np.any(low_mask) else 0.0
    mid_energy = float(np.sum(fft_mag[mid_formant_mask] ** 2) / total_energy) if np.any(mid_formant_mask) else 0.0
    hf_band_energy = float(np.sum(fft_mag[hf_band_mask] ** 2) / total_energy) if np.any(hf_band_mask) else 0.0

    formant_to_low_ratio = float(mid_energy / (low_energy + 1e-12))
    hf_to_mid_ratio = float(hf_band_energy / (mid_energy + 1e-12))

    # Formant cavity depletion detection:
    # In organic biological voice, formant energy (500-3000Hz) constitutes 15%-60% of vocal power (ratio > 0.20).
    # AI vocoders and synthesized assistants (like Gemini/TTS) have hollow formant energy (<0.065) with elevated HF ratio.
    is_formant_depleted = bool(
        (low_energy > 0.93 and formant_to_low_ratio < 0.065)
        or (formant_to_low_ratio < 0.08 and hf_to_mid_ratio > 0.02)
    )

    # Wiener entropy: exp(mean(log(mag))) / mean(mag)
    log_mean = float(np.mean(np.log(fft_mag + 1e-9)))
    arith_mean = float(np.mean(fft_mag)) + 1e-9
    spectral_flatness = float(np.exp(log_mean) / arith_mean)
    spectral_flatness = float(np.nan_to_num(spectral_flatness, nan=0.0))

    # 3. Volume-Normalized Spectral Flux
    nperseg = min(512, len(norm_audio))
    noverlap = nperseg // 2
    try:
        f_spec, t_spec, Sxx = scipy.signal.spectrogram(norm_audio, fs=sr, nperseg=nperseg, noverlap=noverlap)
        if Sxx.shape[1] > 2:
            col_norms = np.linalg.norm(Sxx, axis=0, keepdims=True) + 1e-9
            norm_Sxx = Sxx / col_norms
            diff_spec = np.diff(norm_Sxx, axis=1)
            spectral_flux = float(np.mean(np.sqrt(np.sum(diff_spec**2, axis=0))))
        else:
            spectral_flux = 0.50
    except Exception:
        spectral_flux = 0.50

    # 4. Pitch, Intonation Variance & Jitter
    frame_len, hop_len = int(0.040 * sr), int(0.020 * sr)
    pitches = []
    high_harm_count = 0
    total_voiced = 0
    if len(norm_audio) >= frame_len:
        for i in range(0, len(norm_audio) - frame_len, hop_len):
            chunk = norm_audio[i : i + frame_len]
            if np.sqrt(np.mean(chunk**2)) > 0.02:
                corr = np.correlate(chunk, chunk, mode="full")[frame_len - 1 :]
                min_lag = max(1, int(sr / 450))  # Max 450Hz
                max_lag = max(min_lag + 1, int(sr / 65))   # Min 65Hz
                if max_lag < len(corr):
                    p_idx = np.argmax(corr[min_lag:max_lag]) + min_lag
                    if corr[0] > 0:
                        norm_c = float(corr[p_idx] / corr[0])
                        total_voiced += 1
                        if norm_c > 0.65:
                            high_harm_count += 1
                        if norm_c > 0.35:
                            pitches.append(float(sr / p_idx))

    rigid_harmonicity_fraction = float(high_harm_count / total_voiced) if total_voiced > 0 else 0.0

    pitch_reliable = len(pitches) >= 8 and duration_s >= 0.8
    if len(pitches) >= 3:
        pitch_mean_hz = float(np.mean(pitches))
        pitch_std_hz = float(np.std(pitches))
        intonation_var = float(pitch_std_hz / (pitch_mean_hz + 1e-6))
        jitter_pct = float(np.mean(np.abs(np.diff(pitches))) / (pitch_mean_hz + 1e-6) * 100.0)
    else:
        pitch_mean_hz = 0.0
        pitch_std_hz = 0.0
        intonation_var = 0.0
        jitter_pct = 0.0

    # 5. Temporal Energy Variance (RMS across 25ms frames)
    frame_size_e = int(0.025 * sr)
    hop_size_e = int(0.010 * sr)
    num_e_frames = (len(norm_audio) - frame_size_e) // hop_size_e
    if num_e_frames > 5:
        frame_energies = [
            np.sqrt(np.mean(norm_audio[i * hop_size_e : i * hop_size_e + frame_size_e] ** 2))
            for i in range(num_e_frames)
        ]
        energy_variance = float(np.var(frame_energies))
    else:
        energy_variance = 0.0

    # 6. Normalized Forensic Anomaly Scoring (0.0 = completely natural, 100.0 = highly synthetic)
    synth_thresh_flatness = ranges.get("spectral_flatness", {}).get("synthetic_threshold", 0.035)
    synth_thresh_flux = ranges.get("spectral_flux", {}).get("synthetic_threshold", 0.15)
    synth_thresh_hf = ranges.get("hf_energy_ratio", {}).get("synthetic_cutoff", 0.00005)

    # Flatness anomaly: high when flatness is unnaturally low (<0.035, vocoder cutoff)
    # OR unnaturally high (>0.51, neural vocoder diffusion/hiss artifacts, e.g. Sample B at 0.58)
    if spectral_flatness < synth_thresh_flatness:
        score_flatness = min(100.0, max(0.0, (synth_thresh_flatness - spectral_flatness) / synth_thresh_flatness * 100.0))
    elif spectral_flatness > 0.51:
        score_flatness = min(95.0, 75.0 + (spectral_flatness - 0.51) * 150.0)
    else:
        score_flatness = 0.0

    # Flux anomaly: high when frame-to-frame change is stationary (<0.15)
    if spectral_flux < synth_thresh_flux:
        score_flux = min(100.0, max(0.0, (synth_thresh_flux - spectral_flux) / synth_thresh_flux * 100.0))
    else:
        score_flux = 0.0

    # HF cutoff anomaly: vocoder brick-wall drop (< 0.00005) OR replay/conversion screech (> 0.005)
    if hf_energy < synth_thresh_hf:
        score_hf = 88.0  # Vocoder brick-wall cutoff: frequencies above 6kHz completely missing
    elif hf_energy > ranges.get("hf_energy_ratio", {}).get("replay_screech", 0.005):
        # In musical songs, cymbals/drums naturally emit high frequencies with clean flatness (<0.50) and natural singing vibrato.
        # Genuine AI vocoder screech features flat noise (>0.52), conversion flutter (>30% with flatness >0.49),
        # formant depletion (<0.040), artificial multi-band formant boost (>0.80), or robotic rigid harmonicity.
        is_ai_screech = (
            spectral_flatness > 0.52
            or (jitter_pct > 30.0 and spectral_flatness > 0.49)
            or is_formant_depleted
            or (formant_to_low_ratio > 0.80)
            or (rigid_harmonicity_fraction > 0.50 and jitter_pct < 8.0 and hf_energy > 0.003)
        )
        if is_ai_screech:
            score_hf = min(98.0, 80.0 + (hf_energy - 0.005) * 400.0)
        else:
            score_hf = 0.0
    else:
        score_hf = 0.0

    # Intonation anomaly: only applied if pitch is reliable
    if pitch_reliable:
        synth_monotone = ranges.get("intonation_variance", {}).get("synthetic_monotone", 0.05)
        if intonation_var < synth_monotone:
            score_intonation = min(100.0, (synth_monotone - intonation_var) / synth_monotone * 100.0)
        elif pitch_std_hz > 80.0 and (spectral_flatness > 0.50 or formant_to_low_ratio < 0.040 or formant_to_low_ratio > 0.80):
            # Neural voice conversion pitch tracking instability / octave hopping accompanied by vocoder artifacts
            score_intonation = 80.0
        else:
            score_intonation = 0.0

        synth_jitter_zero = ranges.get("jitter_pct", {}).get("synthetic_zero", 0.10)
        if jitter_pct < synth_jitter_zero:
            score_jitter = 80.0
        elif jitter_pct > 30.0 and (spectral_flatness > 0.49 or formant_to_low_ratio > 0.80 or is_formant_depleted):
            # Neural voice conversion synthesis flutter with vocoder hiss or formant distortion
            score_jitter = min(95.0, 75.0 + (jitter_pct - 30.0) * 2.0)
        else:
            score_jitter = 0.0
    else:
        score_intonation = 0.0
        score_jitter = 0.0

    score_energy = 0.0

    # Weighted forensic composite score
    w_flat = weights.get("spectral_flatness", 0.25)
    w_flux = weights.get("spectral_flux", 0.25)
    w_hf = weights.get("hf_energy_ratio", 0.20)
    w_into = weights.get("intonation_variance", 0.15) if pitch_reliable else 0.0
    w_jit = weights.get("jitter", 0.10) if pitch_reliable else 0.0
    w_eng = weights.get("energy_variance", 0.05)

    sum_w = w_flat + w_flux + w_hf + w_into + w_jit + w_eng
    if sum_w > 0:
        forensic_score = (
            score_flatness * w_flat
            + score_flux * w_flux
            + score_hf * w_hf
            + score_intonation * w_into
            + score_jitter * w_jit
            + score_energy * w_eng
        ) / sum_w
    else:
        forensic_score = 0.0

    # If severe formant depletion is confirmed (AI vocoder signature), clamp anomaly score
    if is_formant_depleted:
        forensic_score = max(forensic_score, 82.0)

    reliability = {
        "spectral_flatness": True,
        "spectral_flux": duration_s >= 0.2,
        "hf_energy_ratio": duration_s >= 0.2,
        "pitch_variance": pitch_reliable,
        "jitter": pitch_reliable,
        "energy_variance": duration_s >= 0.2,
    }

    return ForensicFeaturesResult(
        duration_s=round(duration_s, 2),
        spectral_flatness=round(spectral_flatness, 6),
        spectral_flux=round(spectral_flux, 4),
        hf_energy_ratio=round(hf_energy, 6),
        pitch_mean_hz=round(pitch_mean_hz, 1),
        pitch_std_hz=round(pitch_std_hz, 1),
        intonation_variance=round(intonation_var, 4),
        jitter_pct=round(jitter_pct, 2),
        energy_variance=round(energy_variance, 6),
        pitch_reliable=pitch_reliable,
        is_silent=False,
        forensic_score=round(forensic_score, 1),
        reliability=reliability,
        formant_to_low_ratio=round(formant_to_low_ratio, 4),
        hf_to_mid_ratio=round(hf_to_mid_ratio, 4),
        is_formant_depleted=is_formant_depleted,
        rigid_harmonicity_fraction=round(rigid_harmonicity_fraction, 4),
    )


def _empty_result(duration_s: float, is_silent: bool) -> ForensicFeaturesResult:
    return ForensicFeaturesResult(
        duration_s=round(duration_s, 2),
        spectral_flatness=0.0,
        spectral_flux=0.0,
        hf_energy_ratio=0.0,
        pitch_mean_hz=0.0,
        pitch_std_hz=0.0,
        intonation_variance=0.0,
        jitter_pct=0.0,
        energy_variance=0.0,
        pitch_reliable=False,
        is_silent=is_silent,
        forensic_score=0.0,
        reliability={
            "spectral_flatness": False,
            "spectral_flux": False,
            "hf_energy_ratio": False,
            "pitch_variance": False,
            "jitter": False,
            "energy_variance": False,
        },
        formant_to_low_ratio=0.0,
        hf_to_mid_ratio=0.0,
        is_formant_depleted=False,
        rigid_harmonicity_fraction=0.0,
    )
