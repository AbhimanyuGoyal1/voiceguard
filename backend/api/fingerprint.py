from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
import numpy as np

from backend.services.fingerprint_service import project_embeddings_pca_2d
from ml.speaker import speaker_verifier

router = APIRouter(prefix="/api/fingerprint", tags=["Voice Fingerprint"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_voice_fingerprint(
    scenario_id: Optional[str] = Query(None, description="Optional active scenario context"),
    enrolled_identity: Optional[str] = Query("Primary User", description="Target enrolled identity"),
):
    """
    Returns 2D PCA projected acoustic coordinates for the voice fingerprint cluster map.
    """
    # Retrieve cached enrolled reference embedding or generate reference baseline
    enrolled_emb = speaker_verifier.get_enrolled_embedding(enrolled_identity)
    if enrolled_emb is None:
        t = np.linspace(0, 1.0, 16000, endpoint=False)
        dummy = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)
        enrolled_emb = speaker_verifier.enroll_speaker(enrolled_identity, dummy)

    # Determine current embedding location depending on active scenario
    current_emb = None
    current_label = "Current Session Audio"
    current_type = "current"

    if scenario_id == "ai_voice_clone":
        # Perturbed clone vector
        rng = np.random.default_rng(99)
        current_emb = enrolled_emb + rng.normal(0.15, 0.12, size=enrolled_emb.shape).astype(np.float32)
        current_label = "AI Voice Clone (Current)"
        current_type = "synthetic"
    elif scenario_id == "unknown_speaker":
        # Impostor vector
        rng = np.random.default_rng(88)
        current_emb = rng.normal(0.5, 0.4, size=enrolled_emb.shape).astype(np.float32)
        current_label = "Unknown Speaker (Current)"
        current_type = "impostor"
    elif scenario_id == "genuine_voice":
        # Genuine vector
        rng = np.random.default_rng(77)
        current_emb = enrolled_emb + rng.normal(0, 0.05, size=enrolled_emb.shape).astype(np.float32)
        current_label = "Genuine Audio (Current)"
        current_type = "genuine"

    return project_embeddings_pca_2d(
        enrolled_emb=enrolled_emb,
        current_emb=current_emb,
        current_label=current_label,
        current_type=current_type,
    )
