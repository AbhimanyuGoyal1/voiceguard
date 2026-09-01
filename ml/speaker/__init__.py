"""Speaker Verification ML Package."""

from ml.speaker.similarity import compute_cosine_similarity, calibrate_speaker_similarity
from ml.speaker.ecapa_verifier import SpeakerVerificationEngine, speaker_verifier

__all__ = [
    "compute_cosine_similarity",
    "calibrate_speaker_similarity",
    "SpeakerVerificationEngine",
    "speaker_verifier",
]
