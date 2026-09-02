from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from datetime import datetime, timezone
from backend.database import Base


class IncidentHistoryModel(Base):
    __tablename__ = "incident_history"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(String(64), default=lambda: datetime.now(timezone.utc).isoformat(), index=True)
    mode = Column(String(16), default="LIVE")  # LIVE | DEMO
    attack_type = Column(String(128), nullable=False)
    threat_severity = Column(String(32), nullable=False, index=True)  # LOW, MODERATE, HIGH, CRITICAL
    risk_score = Column(Integer, nullable=False)
    speaker_match_score = Column(Float, nullable=False)
    speaker_status = Column(String(32), nullable=False)
    enrolled_identity = Column(String(64), default="Primary User")
    synthetic_probability = Column(Float, nullable=False)
    authenticity_classification = Column(String(32), nullable=False)
    summary = Column(Text, nullable=False)
    is_partial = Column(Boolean, default=False)
