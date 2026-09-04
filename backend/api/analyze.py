import asyncio
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.schemas.analysis import AnalysisResult, ErrorResponse
from backend.services.audio_preprocessor import decode_and_validate_audio, AudioProcessingError
from backend.services.pipeline import build_analysis_pipeline_response
from backend.database import get_db
from backend.services.history_service import record_incident_analysis
from backend.services.capture_archiver import archive_capture

router = APIRouter(prefix="/api", tags=["Audio Analysis"])


@router.post(
    "/analyze",
    response_model=AnalysisResult,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or unprocessable audio input"},
        500: {"model": ErrorResponse, "description": "Internal audio processing error"},
    },
)
async def analyze_audio(
    file: UploadFile = File(..., description="Audio file binary stream (WAV, MP3, OGG, WebM, FLAC)"),
    session_id: Optional[str] = Form(None, description="Optional client session ID"),
    enrolled_speaker_id: Optional[str] = Form("Primary User", description="Target enrolled identity for verification"),
    db: AsyncSession = Depends(get_db),
):
    """
    Core audio analysis ingestion and preprocessing endpoint.
    Decodes raw audio, validates duration and signal energy, resamples to 16kHz mono,
    executes real ECAPA-TDNN speaker verification, and returns the structured AnalysisResult.
    """
    if not file:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ErrorResponse(
                error_code="EMPTY_AUDIO",
                message="No audio file uploaded.",
                action_hint="Please attach a valid audio file or record from microphone.",
            ).model_dump(),
        )

    try:
        file_bytes = await file.read()
        processed_tensor, metadata = await asyncio.to_thread(
            decode_and_validate_audio,
            file_bytes,
            filename=file.filename or "audio.wav",
        )
        result = await asyncio.to_thread(
            build_analysis_pipeline_response,
            metadata=metadata,
            audio_tensor=processed_tensor,
            session_id=session_id,
            enrolled_speaker_id=enrolled_speaker_id or "Primary User",
        )

        # Archive incoming test audio and analysis result for calibration
        try:
            capture_meta = await asyncio.to_thread(
                archive_capture,
                raw_bytes=file_bytes,
                filename=file.filename or "microphone_test.wav",
                result=result,
                session_id=session_id,
            )
            result.capture_id = capture_meta.get("capture_id")
            result.capture_file = capture_meta.get("capture_file")
        except Exception:
            pass

        # Persist incident analysis to database
        try:
            await record_incident_analysis(db, result)
        except Exception:
            pass
        return result

    except AudioProcessingError as ape:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ErrorResponse(
                error_code=ape.error_code,  # type: ignore
                message=ape.message,
                action_hint=ape.action_hint,
            ).model_dump(),
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error_code="PROCESSING_ERROR",
                message=f"An unexpected audio processing error occurred: {str(e)}",
                action_hint="Ensure the audio payload is valid and try again.",
            ).model_dump(),
        )
