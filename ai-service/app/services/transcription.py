import os
import tempfile
from pathlib import Path
from threading import Lock


_model = None
_model_lock = Lock()

_AUDIO_SUFFIXES = {
    ".flac", ".m4a", ".mp3", ".mp4", ".mpeg", ".ogg", ".wav", ".webm",
}


def transcribe_audio(audio: bytes, filename: str) -> dict:
    global _model

    if not audio:
        raise ValueError("Audio file is empty.")

    suffix = Path(filename).suffix.lower()
    if suffix not in _AUDIO_SUFFIXES:
        raise ValueError(
            "Unsupported audio format. Use WAV, MP3, M4A, MP4, MPEG, OGG, FLAC, or WebM."
        )

    if _model is None:
        with _model_lock:
            if _model is None:
                try:
                    from faster_whisper import WhisperModel
                except ImportError as exc:
                    raise RuntimeError(
                        "Voice transcription is not installed. Install "
                        "requirements-voice.txt to enable it."
                    ) from exc

                _model = WhisperModel(
                    os.getenv("WHISPER_MODEL_SIZE", "small"),
                    device=os.getenv("WHISPER_DEVICE", "auto"),
                    compute_type=os.getenv("WHISPER_COMPUTE_TYPE", "int8"),
                )

    with tempfile.NamedTemporaryFile(suffix=suffix) as audio_file:
        audio_file.write(audio)
        audio_file.flush()
        segments, info = _model.transcribe(
            audio_file.name,
            beam_size=5,
            vad_filter=True,
        )
        transcript = " ".join(
            segment.text.strip() for segment in segments if segment.text.strip()
        ).strip()

    if not transcript:
        raise ValueError("No speech could be detected in the audio.")
    detected_language = getattr(info, "language", None)
    if detected_language not in {"en", "hi", "mr"}:
        raise ValueError(
            "The detected audio language is not supported. Use English, Hindi, or Marathi."
        )
    return {
        "text": transcript,
        "language": detected_language,
        "language_probability": round(
            float(getattr(info, "language_probability", 0.0)), 4
        ),
    }
