from fastapi import APIRouter, HTTPException
from typing import List, Dict
from backend.schemas.analysis import AnalysisResult
from backend.services.scenario_engine import get_scenario_fixture, list_available_scenarios

router = APIRouter(prefix="/api/scenarios", tags=["Demo Scenarios"])


@router.get("", response_model=List[Dict[str, str]])
async def get_scenarios():
    """Returns list of four canonical demo scenarios."""
    return list_available_scenarios()


@router.get("/{scenario_id}", response_model=AnalysisResult)
async def get_scenario_result(scenario_id: str):
    """
    Returns deterministic AnalysisResult fixture for given scenario.
    Valid scenarios: 'genuine_voice', 'ai_voice_clone', 'replay_attack', 'unknown_speaker'
    """
    valid_ids = {"genuine_voice", "ai_voice_clone", "replay_attack", "unknown_speaker"}
    if scenario_id not in valid_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_id}' not found. Valid scenarios: {sorted(list(valid_ids))}",
        )

    return get_scenario_fixture(scenario_id)
