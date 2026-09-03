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

    # Decode audio using soundfile (supports WAV, FLAC, OGG, MP3, etc.) with resilient stream trimming and PyAV fallback
    try:
        audio_io = io.BytesIO(file_bytes)
        data, orig_sr = sf.read(audio_io, dtype="float32", always_2d=True)
    except Exception as sf_err:
        # Resilient recovery for container mismatches / trailing metadata (Loophole L-07)
        recovered = False
        # If file has trailing OEM metadata (e.g. oppoMark or comma-separated waveform peak arrays)
        trim_candidates = []
        for marker in [b'oppoMark', b'//oppoMark']:
            pos = file_bytes.find(marker)
            if pos != -1 and pos > 1000:
                trim_candidates.append(pos)
        
        # Regex search for trailing comma-separated waveform numbers (e.g. 0,0,3,1040,...)
        import re
        num_match = re.search(rb'\d+,\d+,\d+,\d+', file_bytes)
        if num_match and num_match.start() > 1000:
            trim_candidates.append(num_match.start())

        for cut in sorted(set(trim_candidates)):
            try:
                data, orig_sr = sf.read(io.BytesIO(file_bytes[:cut]), dtype="float32", always_2d=True)
                recovered = True
                break
            except Exception:
                continue

        if not recovered:
            try:
                import av
                container = av.open(io.BytesIO(file_bytes))
                frames = []
                try:
                    for frame in container.decode(audio=0):
                        frames.append(frame.to_ndarray())
                except Exception:
                    # Retain all successfully decoded frames if trailing stream metadata triggers an error
                    pass

                if not frames:
                    raise ValueError("No audio frames found in stream")
                raw_data = np.concatenate(frames, axis=1)
                orig_sr = container.streams.audio[0].rate
                data = raw_data.T.astype(np.float32)
                peak = float(np.max(np.abs(data))) if data.size > 0 else 0.0
                if peak > 2.0:
                    data = data / 32768.0
                elif peak > 1.0:
                    data = data / peak
                recovered = True
            except Exception:
                pass

        if not recovered:
            raise AudioProcessingError(
                error_code="UNSUPPORTED_FORMAT",
                message=f"Could not decode audio data: {str(sf_err)}",
                action_hint="Ensure audio is an uncorrupted WAV, WebM, OGG, MP3, AAC, or FLAC file.",
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
