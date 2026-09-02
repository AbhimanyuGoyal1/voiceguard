from fastapi import APIRouter
from typing import Dict, Any
from backend.services.threat_map_service import get_simulated_threat_intelligence

router = APIRouter(prefix="/api/threat-map", tags=["Global Threat Map"])


@router.get("", response_model=Dict[str, Any])
async def get_threat_map_data():
    """
    Returns simulated global voice threat intelligence nodes.
    Zero real-world data collection. Permanently labeled SIMULATED THREAT INTELLIGENCE.
    """
    return get_simulated_threat_intelligence()
