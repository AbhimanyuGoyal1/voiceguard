from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional

from backend.schemas.analysis import AnalysisResult, ErrorResponse
from backend.services.audio_preprocessor import decode_and_validate_audio, AudioProcessingError
from backend.services.pipeline import build_analysis_pipeline_response

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
        processed_tensor, metadata = decode_and_validate_audio(file_bytes, filename=file.filename or "audio.wav")
        result = build_analysis_pipeline_response(
            metadata=metadata,
            audio_tensor=processed_tensor,
            session_id=session_id,
            enrolled_speaker_id=enrolled_speaker_id or "Primary User",
        )
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
