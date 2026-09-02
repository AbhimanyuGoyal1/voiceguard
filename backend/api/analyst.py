from fastapi import APIRouter, Query
from typing import Dict, Any, Optional

from backend.schemas.analysis import AnalysisResult
from backend.services.analyst_service import generate_ai_analyst_briefing, generate_deterministic_analyst_briefing
from backend.services.scenario_engine import get_scenario_fixture

router = APIRouter(prefix="/api/analyst", tags=["AI Security Analyst"])


@router.post("/explain")
async def explain_analysis(
    analysis: AnalysisResult,
    force_timeout: bool = Query(False, description="Force timeout to test deterministic fallback"),
):
    """
    Generates AI Security Analyst explanation for the provided AnalysisResult.
    Falls back gracefully to deterministic explanation within <= 3.0s.
    """
    return await generate_ai_analyst_briefing(analysis, timeout_seconds=3.0, force_timeout=force_timeout)


@router.get("/scenario/{scenario_id}")
async def explain_scenario(
    scenario_id: str,
    force_timeout: bool = Query(False, description="Force timeout to test deterministic fallback"),
):
    """
    Convenience endpoint for obtaining analyst briefings for demo scenarios.
    """
    fixture = get_scenario_fixture(scenario_id)
    return await generate_ai_analyst_briefing(fixture, timeout_seconds=3.0, force_timeout=force_timeout)
