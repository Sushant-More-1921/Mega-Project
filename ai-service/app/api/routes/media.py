import asyncio
import base64
import binascii
import os
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.api.routes.analyze import AnalyzeRequest, analyze_payload
from app.services.language import SUPPORTED_LANGUAGES
from app.services.ollama import OllamaError, ollama_chat
from app.services.transcription import transcribe_audio


router = APIRouter()
MAX_AUDIO_BYTES = 20 * 1024 * 1024
MAX_IMAGE_BYTES = 8 * 1024 * 1024
_IMAGE_TYPES = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),
}


class ImageAnalysisRequest(BaseModel):
    image_base64: str = Field(min_length=1, max_length=12_000_000)
    content_type: Literal["image/jpeg", "image/png", "image/webp"] | None = None
    text: str | None = Field(default=None, max_length=20_000)
    language: Literal["en", "hi", "mr"] | None = None


def _decode_image(encoded: str, content_type: str | None) -> tuple[bytes, str]:
    if encoded.startswith("data:"):
        try:
            header, encoded = encoded.split(",", 1)
            content_type = header[5:].split(";", 1)[0]
        except ValueError as exc:
            raise ValueError("Invalid image data URL.") from exc
    try:
        image = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ValueError("Image must be valid base64 data.") from exc
    if not image or len(image) > MAX_IMAGE_BYTES:
        raise ValueError("Image must be smaller than 8 MB.")

    detected_type = next(
        (
            mime
            for mime, signatures in _IMAGE_TYPES.items()
            if any(image.startswith(signature) for signature in signatures)
        ),
        None,
    )
    if detected_type == "image/webp" and image[8:12] != b"WEBP":
        detected_type = None
    if detected_type is None or (content_type and content_type != detected_type):
        raise ValueError("Image must be a valid JPEG, PNG, or WebP file.")
    return image, detected_type


@router.post("/voice/transcribe")
async def transcribe_complaint(audio: UploadFile = File(...)):
    filename = Path(audio.filename or "").name
    suffix = Path(filename).suffix.lower()
    if not suffix:
        raise HTTPException(status_code=400, detail="Audio filename must include a supported extension.")

    content = await audio.read(MAX_AUDIO_BYTES + 1)
    await audio.close()
    if len(content) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file must be smaller than 20 MB.")
    try:
        result = await asyncio.to_thread(transcribe_audio, content, filename)
        analysis = await asyncio.to_thread(
            analyze_payload,
            AnalyzeRequest(text=result["text"], language=result["language"]),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {**result, "analysis": analysis}


@router.post("/image/analyze")
def analyze_complaint_image(request: ImageAnalysisRequest):
    try:
        image, _ = _decode_image(request.image_base64, request.content_type)
        encoded_image = base64.b64encode(image).decode("ascii")
        image_description = ollama_chat(
            [
                {
                    "role": "system",
                    "content": (
                        "Describe only visible civic infrastructure or sanitation "
                        "problems, such as potholes, damaged roads, overflowing "
                        "garbage, blocked drains, or water leaks. Do not infer "
                        "hidden causes, identities, addresses, or details that "
                        "cannot be seen. If no civic problem is visible, say so."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Analyze this complaint photo. "
                        + (f"Citizen's note: {request.text}" if request.text else "")
                    ),
                },
            ],
            model=os.getenv("OLLAMA_VISION_MODEL", "llava"),
            images=[encoded_image],
        )
        if request.text:
            analysis_text = f"{request.text.strip()}\nVisible evidence: {image_description}"
        else:
            analysis_text = image_description
        analysis = analyze_payload(
            AnalyzeRequest(text=analysis_text, language=request.language)
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"image_description": image_description, "analysis": analysis}


@router.get("/voice/languages")
def get_supported_voice_languages():
    return {
        "languages": sorted(SUPPORTED_LANGUAGES),
        "transcription_model": os.getenv("WHISPER_MODEL_SIZE", "small"),
    }
