"""
VoiceGuard Live Audio Capture & Calibration Archiver.
Persists every incoming microphone and test audio stream along with its complete
forensic analysis result to enable iterative labeling, calibration, and training.
"""

import os
import json
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import soundfile as sf
import numpy as np

CAPTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "audiosamples", "captures"))
MANIFEST_FILE = os.path.join(CAPTURES_DIR, "captures_manifest.json")
CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "antispoof", "training_config.json"))


def _ensure_dir():
    os.makedirs(CAPTURES_DIR, exist_ok=True)
    if not os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)


def get_next_capture_sequence() -> int:
    """Returns the next integer sequence number for captures."""
    _ensure_dir()
    existing = list_captures()
    if not existing:
        return 1
    max_seq = 0
    for c in existing:
        cid = c.get("capture_id", "")
        m = re.search(r"capture_(\d+)", cid)
        if m:
            seq = int(m.group(1))
            if seq > max_seq:
                max_seq = seq
    return max_seq + 1


def list_captures() -> List[Dict[str, Any]]:
    """Returns the list of all archived audio captures and their labels."""
    _ensure_dir()
    try:
        with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def archive_capture(
    raw_bytes: bytes,
    filename: str,
    result: Any,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Saves raw audio file, writes detailed analysis JSON, and updates the manifest.
    """
    _ensure_dir()
    seq = get_next_capture_sequence()
    now = datetime.now(timezone.utc)
    ts_str = now.strftime("%Y%m%d_%H%M%S")
    capture_id = f"capture_{seq:03d}"

    # Determine file extension
    ext = os.path.splitext(filename)[1].lower() if filename else ".wav"
    if not ext or ext not in [".wav", ".mp3", ".mpeg", ".webm", ".ogg", ".flac", ".m4a"]:
        ext = ".wav"

    audio_filename = f"{capture_id}_{ts_str}{ext}"
    audio_path = os.path.join(CAPTURES_DIR, audio_filename)

    # 1. Write raw audio file
    with open(audio_path, "wb") as f:
        f.write(raw_bytes)

    # 2. Extract result fields
    # Handle either pydantic model or dict
    res_dict = result.model_dump() if hasattr(result, "model_dump") else (result if isinstance(result, dict) else {})
    
    risk = res_dict.get("risk", {})
    authenticity = res_dict.get("authenticity", {})
    speaker = res_dict.get("speaker", {})
    audio_info = res_dict.get("audio_info", {})
    evidence = res_dict.get("evidence", {})

    result_data = {
        "capture_id": capture_id,
        "sequence": seq,
        "filename": audio_filename,
        "rel_path": f"audiosamples/captures/{audio_filename}",
        "timestamp": now.isoformat(),
        "session_id": session_id or res_dict.get("session_id"),
        "duration_seconds": audio_info.get("duration_seconds", 0.0),
        "risk_score": risk.get("score", 0),
        "risk_level": risk.get("level", "UNKNOWN"),
        "verdict": authenticity.get("classification", "UNKNOWN"),
        "synthetic_probability": authenticity.get("synthetic_probability", 0.0),
        "human_probability": authenticity.get("human_probability", 100.0),
        "speaker_match_score": speaker.get("match_score", 0.0),
        "forensic_score": evidence.get("forensic_score"),
        "forensic_features": evidence.get("forensic_features"),
        "summary": evidence.get("summary", ""),
        "user_ground_truth": None,  # Will be 'genuine' or 'synthetic' once labeled
        "full_result": res_dict,
    }

    result_filename = f"{capture_id}_{ts_str}_result.json"
    result_path = os.path.join(CAPTURES_DIR, result_filename)
    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2)

    # 3. Update manifest
    manifest_entry = {
        "capture_id": capture_id,
        "sequence": seq,
        "filename": audio_filename,
        "rel_path": f"audiosamples/captures/{audio_filename}",
        "result_file": result_filename,
        "timestamp": now.isoformat(),
        "duration_seconds": audio_info.get("duration_seconds", 0.0),
        "risk_score": risk.get("score", 0),
        "risk_level": risk.get("level", "UNKNOWN"),
        "verdict": authenticity.get("classification", "UNKNOWN"),
        "synthetic_probability": authenticity.get("synthetic_probability", 0.0),
        "user_ground_truth": None,
    }

    manifest = list_captures()
    manifest.append(manifest_entry)
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return {
        "capture_id": capture_id,
        "capture_file": audio_filename,
        "capture_path": f"audiosamples/captures/{audio_filename}",
        "result_file": result_filename,
        "sequence": seq,
    }


def label_capture(capture_id: str, label: str) -> Dict[str, Any]:
    """
    Labels a captured audio as 'genuine' (human) or 'synthetic' (ai).
    """
    _ensure_dir()
    norm_label = "genuine" if label.lower() in ["genuine", "human", "real"] else "synthetic"

    manifest = list_captures()
    found = False
    target_entry = None

    for item in manifest:
        if item.get("capture_id") == capture_id:
            item["user_ground_truth"] = norm_label
            found = True
            target_entry = item
            break

    if not found:
        raise ValueError(f"Capture ID '{capture_id}' not found in manifest.")

    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # Also update the individual result file
    res_file = target_entry.get("result_file")
    if res_file:
        rf_path = os.path.join(CAPTURES_DIR, res_file)
        if os.path.exists(rf_path):
            with open(rf_path, "r", encoding="utf-8") as f:
                res_content = json.load(f)
            res_content["user_ground_truth"] = norm_label
            with open(rf_path, "w", encoding="utf-8") as f:
                json.dump(res_content, f, indent=2)

    return {
        "capture_id": capture_id,
        "user_ground_truth": norm_label,
        "status": "LABELED",
    }


def add_capture_to_training_config(capture_id: str) -> Dict[str, Any]:
    """
    Adds a labeled capture into active_calibration_samples in training_config.json.
    """
    manifest = list_captures()
    item = next((c for c in manifest if c.get("capture_id") == capture_id), None)
    if not item:
        raise ValueError(f"Capture ID '{capture_id}' not found.")

    label = item.get("user_ground_truth")
    if not label:
        raise ValueError(f"Capture ID '{capture_id}' must be labeled before adding to calibration config.")

    if not os.path.exists(CONFIG_PATH):
        raise FileNotFoundError(f"Training config not found at {CONFIG_PATH}")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    active_samples = cfg.setdefault("active_calibration_samples", [])

    # Check if already present
    existing = next((s for s in active_samples if s.get("id") == capture_id), None)
    if existing:
        existing["label"] = label
        existing["path"] = item["rel_path"]
    else:
        active_samples.append({
            "id": capture_id,
            "designation": f"Mic Capture #{item.get('sequence', 1)}",
            "path": item["rel_path"],
            "label": label,
            "notes": f"Live test microphone capture labeled by user as {label}",
        })

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    return {
        "capture_id": capture_id,
        "status": "ADDED_TO_CONFIG",
        "active_sample_count": len(active_samples),
    }
