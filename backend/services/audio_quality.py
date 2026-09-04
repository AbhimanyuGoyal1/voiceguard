"""
VoiceGuard Audio Signal Quality & Integrity Assessment Engine.
Computes Signal-to-Noise Ratio (SNR), digital clipping/saturation ratio,
spectral dynamic range, and overall voice quality index.
Provides confidence penalty and degradation flags for noisy/distorted audio.
"""

import numpy as np
from typing import Dict, Any


def assess_audio_quality(audio_tensor: np.ndarray, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Assesses acoustic signal health of 1D float32 audio normalized to [-1.0, 1.0].
    
    Returns:
        {
            "quality_score": float (0-100),
            "rating": "EXCELLENT" | "GOOD" | "FAIR" | "DEGRADED",
            "snr_db": float,
            "clipping_pct": float,
            "is_noisy": bool,
            "is_clipped": bool,
            "is_degraded": bool,
            "confidence_multiplier": float (0.60 - 1.0),
            "recommendation": str,
        }
    """
    if audio_tensor is None or len(audio_tensor) == 0:
        return {
            "quality_score": 0.0,
            "rating": "DEGRADED",
            "snr_db": 0.0,
            "clipping_pct": 0.0,
            "is_noisy": True,
            "is_clipped": False,
            "is_degraded": True,
            "confidence_multiplier": 0.50,
            "recommendation": "Audio payload is empty or unreadable.",
        }

    y = np.nan_to_num(audio_tensor.astype(np.float32), nan=0.0, posinf=0.0, neginf=0.0)
    sr = int(sample_rate) if sample_rate and sample_rate > 0 else 16000
    total_samples = len(y)

    # 1. Digital Clipping & Saturation Analysis
    # Samples reaching >= 0.992 of full scale (flat peaks)
    clipped_samples = int(np.sum(np.abs(y) >= 0.992))
    clipping_pct = round(float(clipped_samples / total_samples * 100.0), 2)
    is_clipped = bool(clipping_pct >= 0.50)  # > 0.5% samples clipped indicates severe distortion

    # 2. Spectral Flatness (Wiener entropy) to quantify broadband noise floor
    fft_mag = np.abs(np.fft.rfft(y)) + 1e-12
    log_mean = float(np.mean(np.log(fft_mag)))
    arith_mean = float(np.mean(fft_mag))
    spectral_flatness = float(np.exp(log_mean) / arith_mean)

    # 3. Dynamic SNR (Signal-to-Noise Ratio) Estimation
    # Frame-level RMS energy tracking across 25ms frames with 10ms hop
    frame_len = int(0.025 * sr)
    hop_len = int(0.010 * sr)
    num_frames = (total_samples - frame_len) // hop_len

    if num_frames >= 8:
        frame_rms = np.sqrt(np.array([
            np.mean(y[i * hop_len : i * hop_len + frame_len] ** 2)
            for i in range(num_frames)
        ]))
        
        # Pause frames: true ambient silence (RMS < 0.020)
        pause_rms = frame_rms[frame_rms < 0.020]
        speech_rms = float(np.percentile(frame_rms, 85)) + 1e-9

        if len(pause_rms) >= 4:
            p_noise = float(np.mean(pause_rms ** 2)) + 1e-11
            p_speech = speech_rms ** 2
            snr_db = float(10.0 * np.log10(p_speech / p_noise))
        else:
            # Continuous speech or pure tone with no pauses
            if spectral_flatness < 0.30:
                snr_db = 28.0 - (spectral_flatness * 18.0)
            elif spectral_flatness < 0.48:
                snr_db = 22.0 - ((spectral_flatness - 0.30) * 35.0)
            else:
                snr_db = max(2.0, 15.0 - ((spectral_flatness - 0.48) * 45.0))
    else:
        snr_db = 22.0

    snr_db = round(float(np.clip(snr_db, 0.0, 42.0)), 1)
    is_noisy = bool(snr_db < 10.0 or (spectral_flatness > 0.65 and snr_db < 14.0))

    # 4. Overall Voice Quality Index (0 - 100)
    # SNR Contribution: 4 dB = 0 pts, 22 dB = 100 pts
    snr_pts = float(np.clip((snr_db - 4.0) / 18.0 * 100.0, 0.0, 100.0))
    
    # Clipping Penalty: -25 pts per 1% clipping
    clip_penalty = float(np.clip(clipping_pct * 25.0, 0.0, 60.0))
    
    # Low energy penalty if recording is a whisper or microphone is too far
    overall_rms = float(np.sqrt(np.mean(y ** 2)))
    level_penalty = 0.0
    if overall_rms < 0.02:
        level_penalty = 20.0

    raw_quality = snr_pts - clip_penalty - level_penalty
    quality_score = round(float(np.clip(raw_quality, 5.0, 99.0)), 1)

    # 5. Rating Classification
    if is_clipped or is_noisy or quality_score < 38.0:
        rating = "DEGRADED"
        confidence_multiplier = 0.65
        if is_clipped and is_noisy:
            recommendation = f"Severe microphone clipping ({clipping_pct}%) and high ambient noise (SNR: {snr_db}dB). Speak farther from mic in a quiet space."
        elif is_clipped:
            recommendation = f"Severe microphone clipping ({clipping_pct}%). Reduce input gain or speak farther from mic."
        elif is_noisy:
            recommendation = f"High background ambient noise (SNR: {snr_db}dB). Move to a quieter room or speak closer to mic."
        else:
            recommendation = "Low input volume or degraded acoustic clarity. Speak clearly into the microphone."
    elif quality_score >= 75.0:
        rating = "EXCELLENT"
        confidence_multiplier = 1.0
        recommendation = "Optimal signal quality. Clear acoustic fidelity with zero clipping."
    elif quality_score >= 55.0:
        rating = "GOOD"
        confidence_multiplier = 0.95
        recommendation = "Good signal quality. Normal room acoustics detected."
    else:
        rating = "FAIR"
        confidence_multiplier = 0.82
        recommendation = "Moderate background noise or room acoustics detected. Results valid but inspect evidence."

    is_degraded = bool(rating == "DEGRADED")

    return {
        "quality_score": quality_score,
        "rating": rating,
        "snr_db": snr_db,
        "clipping_pct": clipping_pct,
        "is_noisy": is_noisy,
        "is_clipped": is_clipped,
        "is_degraded": is_degraded,
        "confidence_multiplier": confidence_multiplier,
        "recommendation": recommendation,
    }
