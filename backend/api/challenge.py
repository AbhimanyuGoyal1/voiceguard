from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional

from backend.services.challenge_service import get_security_challenge, evaluate_challenge_response

router = APIRouter(prefix="/api/challenge", tags=["Security Challenge"])


class ChallengeEvaluationRequest(BaseModel):
    speaker_match_score: float
    synthetic_probability: float
    enrolled_identity: Optional[str] = "Primary User"


@router.get("/next")
async def get_next_challenge(index: Optional[int] = Query(0, description="Deterministic challenge index")):
    """Returns a deterministic phrase from the fixed security challenge pool."""
    return get_security_challenge(challenge_index=index)


@router.post("/evaluate")
async def evaluate_challenge(req: ChallengeEvaluationRequest):
    """
    Evaluates challenge response integrity using Speaker Verification & Anti-Spoof criteria.
    """
    return evaluate_challenge_response(
        speaker_match_score=req.speaker_match_score,
        synthetic_probability=req.synthetic_probability,
    )
