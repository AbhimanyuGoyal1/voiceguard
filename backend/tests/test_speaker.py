import pytest
import numpy as np
from ml.speaker.similarity import compute_cosine_similarity, calibrate_speaker_similarity
from ml.speaker.ecapa_verifier import SpeakerVerificationEngine


def test_cosine_similarity_identical_vectors():
    vec = np.array([1.0, 2.0, 3.0, 4.0, 5.0], dtype=np.float32)
    sim = compute_cosine_similarity(vec, vec)
    assert pytest.approx(sim, 1e-4) == 1.0


def test_cosine_similarity_orthogonal_vectors():
    vec_a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    vec_b = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    sim = compute_cosine_similarity(vec_a, vec_b)
    assert pytest.approx(sim, 1e-4) == 0.0


def test_cosine_similarity_opposite_vectors():
    vec_a = np.array([1.0, 2.0, 3.0], dtype=np.float32)
    vec_b = np.array([-1.0, -2.0, -3.0], dtype=np.float32)
    sim = compute_cosine_similarity(vec_a, vec_b)
    assert pytest.approx(sim, 1e-4) == -1.0


def test_calibrate_speaker_similarity_high_match():
    # 0.85 raw similarity -> clearly high score (MATCHED)
    score, status = calibrate_speaker_similarity(0.85, threshold_match=0.65, threshold_uncertain=0.40)
    assert status == "MATCHED"
    assert score >= 80.0
    assert score <= 100.0


def test_calibrate_speaker_similarity_uncertain():
    # 0.50 raw similarity -> UNCERTAIN
    score, status = calibrate_speaker_similarity(0.50, threshold_match=0.65, threshold_uncertain=0.40)
    assert status == "UNCERTAIN"
    assert score >= 50.0
    assert score < 80.0


def test_calibrate_speaker_similarity_mismatch():
    # 0.20 raw similarity -> MISMATCH
    score, status = calibrate_speaker_similarity(0.20, threshold_match=0.65, threshold_uncertain=0.40)
    assert status == "MISMATCH"
    assert score < 50.0


def test_speaker_verifier_enrollment_and_comparison():
    engine = SpeakerVerificationEngine()
    
    # Generate two distinct synthetic audio waveforms (Speaker A vs Speaker B)
    t = np.linspace(0, 2.0, 32000, endpoint=False)
    speaker_a_sample1 = (0.5 * np.sin(2 * np.pi * 440 * t) + 0.2 * np.sin(2 * np.pi * 880 * t)).astype(np.float32)
    speaker_a_sample2 = (0.45 * np.sin(2 * np.pi * 440 * t) + 0.18 * np.sin(2 * np.pi * 880 * t)).astype(np.float32)
    speaker_b_sample = (0.5 * np.sin(2 * np.pi * 1200 * t) + 0.3 * np.sin(2 * np.pi * 2400 * t)).astype(np.float32)

    # Enroll Speaker A
    emb_enrolled = engine.enroll_speaker("speaker_alice", speaker_a_sample1)
    assert emb_enrolled is not None
    assert len(emb_enrolled) == 192

    # Verify same speaker (Alice sample 2)
    res_same = engine.verify_speaker(speaker_a_sample2, enrolled_speaker_id="speaker_alice")
    assert res_same["is_mock"] is False
    assert res_same["status"] in ["MATCHED", "UNCERTAIN"]
    assert res_same["match_score"] > 70.0

    # Verify different speaker (Bob sample)
    res_diff = engine.verify_speaker(speaker_b_sample, enrolled_speaker_id="speaker_alice")
    assert res_diff["is_mock"] is False
    assert res_diff["match_score"] < res_same["match_score"]
