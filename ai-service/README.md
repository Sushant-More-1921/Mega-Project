# CivicResolve AI Service

FastAPI service for complaint classification and priority scoring, with optional
local Whisper transcription, Ollama translation and image/chat analysis, and
similarity-based duplicate detection.

## Run locally

Use Python 3.10 or newer. From this directory:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open `http://localhost:8000/docs` for the interactive API.

Optional features have separate dependencies:

```powershell
python -m pip install -r requirements-voice.txt
python -m pip install -r requirements-similarity.txt
```

Whisper downloads its configured model (`small` by default) on the first audio
request. Similarity analysis downloads its configured sentence-transformer on
the first duplicate check if it is not already cached. Ollama runs locally;
install and start it, then pull the selected models:

```powershell
ollama pull llama3.2
ollama pull llava
```

Set `OLLAMA_BASE_URL`, `OLLAMA_TEXT_MODEL`, `OLLAMA_VISION_MODEL`,
`WHISPER_MODEL_SIZE`, and `BACKEND_API_URL` as needed. Hindi and Marathi text
analysis is translated locally by Ollama before the English-trained classifier
is called. The reported language and original text are preserved in the result.
If local Ollama or the optional Whisper package/model is unavailable, the
relevant endpoint returns an explicit service error rather than a fabricated
result.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service and optional dependency readiness |
| `POST` | `/analyze` | Unified text classification, priority, optional duplicate and hotspot analysis |
| `POST` | `/classify` | Backwards-compatible alias for `/analyze` |
| `POST` | `/similar` | Existing duplicate/issue-cluster analysis |
| `POST` | `/hotspots` | Existing hotspot detection |
| `POST` | `/voice/transcribe` | Upload audio; returns transcript, detected language, and unified analysis |
| `GET` | `/voice/languages` | Supported language codes (`en`, `hi`, `mr`) |
| `POST` | `/image/analyze` | Analyze a JPEG, PNG, or WebP image using the local Ollama vision model |
| `POST` | `/chatbot/complaint` | Fetch live backend complaint status and answer a question with local Ollama |

### Unified analysis

`POST /analyze` accepts complaint text, optional language and location, and
optional backend context for duplicate and hotspot analysis:

```json
{
  "text": "There is a large pothole on the main road",
  "language": "en",
  "latitude": 16.705,
  "longitude": 74.243,
  "complaint_id": "complaint-123",
  "citizen_id": "citizen-456",
  "previous_complaints": [
    {
      "id": "complaint-122",
      "citizen_id": "citizen-777",
      "text": "A pothole has damaged the road",
      "latitude": 16.7051,
      "longitude": 74.2431,
      "category": "Road/Pothole",
      "issue_cluster_id": "ISSUE-20261021123456",
      "status": "IN_PROGRESS"
    }
  ],
  "issue_clusters": []
}
```

`previous_complaints` and `issue_clusters` should come from the backend database;
the AI service does not persist complaint records. Coordinates are required
when previous complaints are supplied. When no prior context is supplied,
`duplicate_detection` is `null` and `hotspots` is empty.

The response includes `language`, `normalized_text`, category confidence and
predictions, priority and severity, duplicate match/cluster data, and hotspots.
The classifier and priority model are currently trained on English complaints.
Hindi/Marathi analysis therefore requires a configured local Ollama text model
for translation; low-confidence predictions are marked for manual review.
Hindi and Marathi both use Devanagari, so pass `language` explicitly for short
or ambiguous text.

### Voice complaint

Send `multipart/form-data` with the file field named `audio`. Supported file
extensions are WAV, MP3, M4A, MP4, MPEG, OGG, FLAC, and WebM; the upload limit is
20 MB. Example:

```powershell
curl.exe -X POST http://localhost:8000/voice/transcribe `
  -F "audio=@complaint-hi.wav"
```

The transcription language comes from Whisper and is restricted to English,
Hindi, or Marathi. The response contains `text`, `language`,
`language_probability`, and the unified `analysis`.

### Image complaint

`POST /image/analyze` accepts a JSON body with base64 image bytes:

```json
{
  "image_base64": "<base64-encoded JPEG, PNG, or WebP>",
  "content_type": "image/jpeg",
  "text": "There is a pothole near the market",
  "language": "en"
}
```

Images are limited to 8 MB. The vision model describes visible civic problems;
the service combines that description with the optional citizen note and returns
the unified classification/priority analysis. Image understanding requires an
Ollama vision model such as `llava`.

### Complaint-tracking chatbot

`POST /chatbot/complaint` accepts:

```json
{
  "tracking_number": "CMP-2026-1042",
  "question": "What is happening with my complaint?",
  "language": "en"
}
```

The service calls `GET {BACKEND_API_URL}/complaints/track/{trackingNumber}` and
expects the backend response shape `{ "success": true, "data": { ... } }`.
The backend's `data` object must include the complaint status; optional timeline
and department details are included in the response. The API returns that
backend-derived status separately from the generated answer so the status is
authoritative. Backend errors are surfaced; Ollama is not allowed to substitute
an invented status.

### Backend integration contract

The backend should call `POST {AI_SERVICE_URL}/analyze` before saving a
complaint. Send the description as `text`, pass the citizen's language and
coordinates, and include bounded prior complaint/cluster records when duplicate
or hotspot analysis is required. Store or review the returned category,
priority, confidence, and cluster information; do not treat low-confidence
predictions as final. The AI service is stateless and does not write to the
complaint database.

Configure `BACKEND_API_URL` to the backend's API root (including `/api/v1`).
The backend mounts the complaint tracking route and returns the response shape
above. Apply the Prisma schema before running the backend.

The frontend sends complaint creation, image evidence, audio transcription,
tracking, and chatbot requests through the backend. Authenticated media routes
are `POST /api/v1/ai/voice/transcribe` (multipart field `audio`) and
`POST /api/v1/ai/image/analyze`; complaint submission can include an image to
analyze it as part of the unified complaint workflow. The backend stores photo
evidence in Cloudinary and saves its secure URL on the complaint, so configure
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in
the backend environment before enabling photo uploads. Voice transcription
requires installing `requirements-voice.txt` in the AI service, and image/chat
features require the configured Ollama models.

## Deployment

`Dockerfile` installs the base, voice, and similarity dependencies. Build and
run it from this directory:

```powershell
docker build -t civicresolve-ai .
docker run --rm -p 8000:8000 `
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 `
  -e BACKEND_API_URL=http://host.docker.internal:5000/api/v1 `
  civicresolve-ai
```

The model files under `models/` are included in the image. For production,
persist the Whisper model cache, set service resource limits, terminate TLS at
the deployment ingress, and restrict network access to the AI and backend
services. Ollama and Whisper require additional memory/compute; size instances
for the model selected in configuration.

## Tests

Run the focused suite with:

```powershell
python -m pip install -r requirements-dev.txt
python -m unittest discover -s tests -v
```

Tests mock network and optional-model calls; they do not require running Ollama,
downloading Whisper weights, or connecting to the backend.
