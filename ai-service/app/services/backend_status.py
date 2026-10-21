import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


class BackendStatusError(RuntimeError):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def get_complaint_status(tracking_number: str) -> dict:
    base_url = os.getenv(
        "BACKEND_API_URL", "http://localhost:5000/api/v1"
    ).rstrip("/")
    url = (
        f"{base_url}/complaints/track/"
        f"{quote(tracking_number.strip(), safe='')}"
    )
    request = Request(url, headers={"Accept": "application/json"})

    try:
        with urlopen(
            request,
            timeout=float(os.getenv("BACKEND_TIMEOUT_SECONDS", "10")),
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            raise BackendStatusError(
                "No complaint was found for that tracking number.", 404
            ) from exc
        raise BackendStatusError(
            f"Backend complaint tracking returned HTTP {exc.code}."
        ) from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise BackendStatusError(
            "The backend complaint-tracking service is unavailable."
        ) from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise BackendStatusError(
            "The backend returned an invalid complaint response."
        ) from exc

    complaint = payload.get("data") if isinstance(payload, dict) else None
    if not isinstance(complaint, dict):
        raise BackendStatusError(
            "The backend response did not contain complaint data."
        )
    if not isinstance(complaint.get("status"), str) or not complaint["status"].strip():
        raise BackendStatusError(
            "The backend complaint record did not contain a status."
        )
    return complaint
