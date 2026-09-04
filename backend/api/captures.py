import os
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

from backend.services.capture_archiver import (
    list_captures,
    label_capture,
    add_capture_to_training_config,
    CAPTURES_DIR,
)
from ml.antispoof.calibration_service import run_explicit_calibration

router = APIRouter(prefix="/api/captures", tags=["Capture & Calibration"])


class LabelRequest(BaseModel):
    label: Literal["genuine", "synthetic", "human", "ai"] = Field(
        ..., description="Ground truth label for this audio capture"
    )
    auto_recalibrate: bool = Field(
        True, description="Whether to immediately update training config and baseline"
    )


@router.get("", response_model=List[Dict[str, Any]])
def get_all_captures():
    """Returns all archived test audio captures and their labels."""
    return list_captures()


@router.get("/{capture_id}/audio")
def get_capture_audio(capture_id: str):
    """Streams the recorded capture audio file."""
    captures = list_captures()
    entry = next((c for c in captures if c.get("capture_id") == capture_id), None)
    if not entry:
        raise HTTPException(status_code=404, detail="Capture not found")

    file_path = os.path.join(CAPTURES_DIR, entry["filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file missing on disk")

    ext = os.path.splitext(entry["filename"])[1].lower()
    media_type = "audio/wav"
    if ext in [".mp3", ".mpeg"]:
        media_type = "audio/mpeg"
    elif ext == ".webm":
        media_type = "audio/webm"
    elif ext == ".ogg":
        media_type = "audio/ogg"

    return FileResponse(file_path, media_type=media_type, filename=entry["filename"])


@router.post("/{capture_id}/label")
def submit_ground_truth(capture_id: str, req: LabelRequest):
    """
    Labels a capture as genuine (human) or synthetic (AI),
    adds it to training_config.json, and optionally recalibrates the model.
    """
    try:
        norm_label = "genuine" if req.label in ["genuine", "human"] else "synthetic"
        res = label_capture(capture_id, norm_label)

        calib_res = None
        if req.auto_recalibrate:
            add_capture_to_training_config(capture_id)
            calib_res = run_explicit_calibration()

        return {
            "status": "SUCCESS",
            "capture_id": capture_id,
            "ground_truth": norm_label,
            "calibration": calib_res,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calibration error: {str(e)}")


@router.post("/recalibrate")
def run_recalibration():
    """Manually triggers model calibration across all active training samples."""
    try:
        res = run_explicit_calibration()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recalibration failed: {str(e)}")
