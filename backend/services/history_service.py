from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone

from backend.models.incident import IncidentHistoryModel
from backend.schemas.analysis import AnalysisResult


async def record_incident_analysis(db: Optional[AsyncSession], analysis: AnalysisResult) -> Optional[IncidentHistoryModel]:
    """
    Persists an analysis result as an incident audit record.
    If database persistence fails or db is None, fails gracefully without raising exceptions.
    """
    if db is None:
        return None

    try:
        risk = analysis.risk
        speaker = analysis.speaker
        auth = analysis.authenticity
        ev = analysis.evidence

        threat_type = (
            "Targeted AI Voice Clone Attack"
            if risk.level == "CRITICAL" and auth.synthetic_probability >= 70 and speaker.match_score >= 70
            else "Synthetic Audio Injection"
            if auth.synthetic_probability >= 70
            else "Unauthorized Stranger Impersonation"
            if speaker.match_score < 50
            else "Authentic Voice Session"
        )

        incident_id = f"INC-{analysis.session_id.replace('session_', '').replace('demo_session_', '')[:8].upper()}"

        record = IncidentHistoryModel(
            id=incident_id,
            timestamp=analysis.timestamp,
            mode=analysis.mode,
            attack_type=threat_type,
            threat_severity=risk.level,
            risk_score=risk.score,
            speaker_match_score=speaker.match_score,
            speaker_status=speaker.status,
            enrolled_identity=speaker.enrolled_identity or "Primary User",
            synthetic_probability=auth.synthetic_probability,
            authenticity_classification=auth.classification,
            summary=ev.summary,
            is_partial=risk.is_partial,
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record
    except Exception:
        # SQLite failure must never crash VoiceGuard
        await db.rollback()
        return None


async def get_incident_history(
    db: Optional[AsyncSession],
    limit: int = 50,
    severity: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Retrieves recorded incident history from SQLite.
    Returns fallback mock fixtures if database is offline.
    """
    if db is not None:
        try:
            query = select(IncidentHistoryModel).order_by(desc(IncidentHistoryModel.timestamp)).limit(limit)
            if severity:
                query = query.filter(IncidentHistoryModel.threat_severity == severity.upper())
            res = await db.execute(query)
            rows = res.scalars().all()
            if rows:
                return [
                    {
                        "id": r.id,
                        "timestamp": r.timestamp,
                        "mode": r.mode,
                        "attack_type": r.attack_type,
                        "threat_severity": r.threat_severity,
                        "risk_score": r.risk_score,
                        "speaker_match_score": r.speaker_match_score,
                        "speaker_status": r.speaker_status,
                        "enrolled_identity": r.enrolled_identity,
                        "synthetic_probability": r.synthetic_probability,
                        "authenticity_classification": r.authenticity_classification,
                        "summary": r.summary,
                        "is_partial": r.is_partial,
                    }
                    for r in rows
                ]
        except Exception:
            pass

    # Default fallback seeded demo history if DB is empty or offline
    now_iso = datetime.now(timezone.utc).isoformat()
    return [
        {
            "id": "INC-CLONE01",
            "timestamp": now_iso,
            "mode": "DEMO",
            "attack_type": "Targeted AI Voice Clone Attack",
            "threat_severity": "CRITICAL",
            "risk_score": 92,
            "speaker_match_score": 96.4,
            "speaker_status": "MATCHED",
            "enrolled_identity": "Primary User",
            "synthetic_probability": 91.8,
            "authenticity_classification": "SYNTHETIC",
            "summary": "Targeted deepfake clone attempt matching Primary User.",
            "is_partial": False,
        },
        {
            "id": "INC-REPLAY02",
            "timestamp": now_iso,
            "mode": "DEMO",
            "attack_type": "Replay Transmission Attack",
            "threat_severity": "HIGH",
            "risk_score": 64,
            "speaker_match_score": 89.0,
            "speaker_status": "MATCHED",
            "enrolled_identity": "Primary User",
            "synthetic_probability": 68.0,
            "authenticity_classification": "SUSPICIOUS",
            "summary": "Acoustic playback resonance detected in voice stream.",
            "is_partial": False,
        },
        {
            "id": "INC-GENUINE03",
            "timestamp": now_iso,
            "mode": "DEMO",
            "attack_type": "Authentic Voice Session",
            "threat_severity": "LOW",
            "risk_score": 8,
            "speaker_match_score": 94.2,
            "speaker_status": "MATCHED",
            "enrolled_identity": "Primary User",
            "synthetic_probability": 6.5,
            "authenticity_classification": "AUTHENTIC",
            "summary": "Verified organic speech for Primary User.",
            "is_partial": False,
        },
    ]
