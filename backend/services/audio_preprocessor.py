import io
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
from typing import Tuple, Dict, Any


TARGET_SAMPLE_RATE = 16000  # 16 kHz standard for ECAPA-TDNN and AASIST models
MIN_AUDIO_DURATION_SECONDS = 1.0
MAX_AUDIO_DURATION_SECONDS = 60.0
MIN_RMS_THRESHOLD = 0.003
MIN_PEAK_THRESHOLD = 0.015


class AudioProcessingError(Exception):
    def __init__(self, error_code: str, message: str, action_hint: str = None):
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.action_hint = action_hint


def decode_and_validate_audio(file_bytes: bytes, filename: str = "audio.wav") -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Decodes raw audio bytes (WAV, MP3, OGG, FLAC, WebM/OGG containers),
    converts to mono, resamples to 16kHz float32, and normalizes amplitude.
    
    Returns:
        (processed_audio_tensor: np.ndarray, metadata: Dict[str, Any])
    """
    if not file_bytes or len(file_bytes) == 0:
        raise AudioProcessingError(
            error_code="EMPTY_AUDIO",
            message="The uploaded audio payload is 0 bytes.",
            action_hint="Check your recording or select a valid audio file.",
        )

    # Decode audio using soundfile (supports WAV, FLAC, OGG, etc.)
    try:
        audio_io = io.BytesIO(file_bytes)
        data, orig_sr = sf.read(audio_io, dtype="float32", always_2d=True)
    except Exception as e:
        err_msg = str(e).lower()
        if file_bytes.startswith(b"\x1a\x45\xdf\xa3") or "webm" in filename.lower() or "matroska" in err_msg:
            raise AudioProcessingError(
                error_code="UNSUPPORTED_CONTAINER_WEBM",
                message="WebM Opus audio container requires client-side PCM WAV transcoding.",
                action_hint="Transcode audio to 16-bit linear PCM WAV before transmitting.",
            )
        raise AudioProcessingError(
            error_code="UNSUPPORTED_FORMAT",
            message=f"Could not decode audio data: {str(e)}",
            action_hint="Ensure audio is an uncorrupted WAV, OGG, MP3, or FLAC file.",
        )

    # 1. Convert to Mono (average channels if multi-channel)
    if data.shape[1] > 1:
        mono_data = np.mean(data, axis=1)
    else:
        mono_data = data[:, 0]

    # 2. Check duration
    duration = len(mono_data) / float(orig_sr)
    if duration < MIN_AUDIO_DURATION_SECONDS:
        raise AudioProcessingError(
            error_code="AUDIO_TOO_SHORT",
            message=f"Audio duration is {duration:.2f}s, which is below the minimum required duration ({MIN_AUDIO_DURATION_SECONDS:.1f}s).",
            action_hint="Provide at least 1.5 - 2.0 seconds of speech.",
        )

    if duration > MAX_AUDIO_DURATION_SECONDS:
        # Trim to max duration for safety
        mono_data = mono_data[: int(MAX_AUDIO_DURATION_SECONDS * orig_sr)]
        duration = MAX_AUDIO_DURATION_SECONDS

    # 3. Energy / Silence Check
    peak = float(np.max(np.abs(mono_data))) if len(mono_data) > 0 else 0.0
    rms = float(np.sqrt(np.mean(mono_data**2))) if len(mono_data) > 0 else 0.0

    if rms < MIN_RMS_THRESHOLD or peak < MIN_PEAK_THRESHOLD:
        raise AudioProcessingError(
            error_code="SILENT_AUDIO",
            message=f"Audio signal is near-silent or muted (RMS: {rms:.4f}, Peak: {peak:.4f}).",
            action_hint="Check microphone levels or audio track content.",
        )

    # 4. Resample to 16,000 Hz if necessary
    if orig_sr != TARGET_SAMPLE_RATE:
        # Use polyphase resample for high quality conversion
        gcd = np.gcd(TARGET_SAMPLE_RATE, orig_sr)
        up = TARGET_SAMPLE_RATE // gcd
        down = orig_sr // gcd
        resampled_data = resample_poly(mono_data, up, down).astype(np.float32)
    else:
        resampled_data = mono_data.astype(np.float32)

    # 5. Peak Normalization (prevent clipping and standardize ML tensor volume)
    resampled_peak = float(np.max(np.abs(resampled_data))) if len(resampled_data) > 0 else 1.0
    if resampled_peak > 0:
        normalized_data = (resampled_data / resampled_peak) * 0.95
    else:
        normalized_data = resampled_data

    metadata = {
        "duration_seconds": round(duration, 3),
        "original_sample_rate": orig_sr,
        "target_sample_rate": TARGET_SAMPLE_RATE,
        "channels": 1,
        "rms_energy": round(rms, 4),
        "peak_amplitude": round(peak, 4),
        "is_silent": False,
    }

    return normalized_data, metadata
