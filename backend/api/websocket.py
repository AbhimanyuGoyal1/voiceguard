import asyncio
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any

from backend.services.audio_preprocessor import decode_and_validate_audio
from backend.services.pipeline import build_analysis_pipeline_response
from backend.database import AsyncSessionLocal
from backend.services.history_service import record_incident_analysis

ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/analyze")
async def websocket_analysis_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for streaming real-time analysis pipeline events:
    RECORDING -> ANALYZING -> PARTIAL_RESULT -> FINAL_RESULT
    """
    await websocket.accept()
    session_id = f"ws_session_{uuid.uuid4().hex[:10]}"

    try:
        # Send initial connected handshake
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "READY",
        })

        while True:
            # Receive text command or binary audio chunk
            message = await websocket.receive()
            
            if "text" in message and message["text"]:
                payload = json.loads(message["text"])
                msg_type = payload.get("type", "")

                if msg_type == "START_RECORDING":
                    await websocket.send_json({
                        "type": "STATE_CHANGE",
                        "state": "RECORDING",
                        "session_id": session_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                elif msg_type == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })

            elif "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                
                # 1. State: ANALYZING
                await websocket.send_json({
                    "type": "STATE_CHANGE",
                    "state": "ANALYZING",
                    "session_id": session_id,
                    "stage": "AUDIO_PREPROCESSING",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await asyncio.sleep(0.15)  # Smooth transition pace

                # 2. Preprocess
                try:
                    tensor, metadata = await asyncio.to_thread(
                        decode_and_validate_audio,
                        raw_bytes,
                        "ws_stream.wav",
                    )

                    # 3. Partial result: Speaker Verification
                    await websocket.send_json({
                        "type": "PARTIAL_RESULT",
                        "state": "ANALYZING",
                        "stage": "SPEAKER_VERIFICATION",
                        "session_id": session_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })
                    await asyncio.sleep(0.2)

                    # 4. Final Result with complete ML analysis
                    final_result = await asyncio.to_thread(
                        build_analysis_pipeline_response,
                        metadata=metadata,
                        audio_tensor=tensor,
                        session_id=session_id,
                    )

                    # Persist incident record
                    try:
                        async with AsyncSessionLocal() as db:
                            await record_incident_analysis(db, final_result)
                    except Exception:
                        pass

                    await websocket.send_json({
                        "type": "FINAL_RESULT",
                        "state": final_result.state,
                        "session_id": session_id,
                        "data": final_result.model_dump(),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })

                except Exception as err:
                    await websocket.send_json({
                        "type": "ERROR",
                        "state": "ERROR",
                        "session_id": session_id,
                        "error_code": "PROCESSING_ERROR",
                        "message": str(err),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    })

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
