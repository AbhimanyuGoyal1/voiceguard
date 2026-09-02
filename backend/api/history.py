from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from backend.database import get_db
from backend.services.history_service import get_incident_history

router = APIRouter(prefix="/api/history", tags=["Attack History"])


@router.get("", response_model=List[Dict[str, Any]])
async def list_incident_history(
    limit: int = Query(50, description="Max history items to retrieve"),
    severity: Optional[str] = Query(None, description="Optional severity filter (LOW, MODERATE, HIGH, CRITICAL)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns recorded attack and analysis incident history.
    """
    return await get_incident_history(db=db, limit=limit, severity=severity)
