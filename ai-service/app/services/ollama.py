import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class OllamaError(RuntimeError):
    pass


def ollama_chat(
    messages: list[dict[str, str | list[str]]],
    *,
    model: str | None = None,
    images: list[str] | None = None,
) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    model_name = model or os.getenv("OLLAMA_TEXT_MODEL", "llama3.2")
    message_list = [dict(message) for message in messages]
    if images:
        message_list[-1]["images"] = images

    body = json.dumps(
        {"model": model_name, "messages": message_list, "stream": False}
    ).encode("utf-8")
    request = Request(
        f"{base_url}/api/chat",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise OllamaError(f"Ollama returned HTTP {exc.code}.") from exc
    except (URLError, TimeoutError, OSError) as exc:
        raise OllamaError(
            "Ollama is unavailable. Start Ollama and pull the configured model."
        ) from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise OllamaError("Ollama returned an invalid response.") from exc

    content = result.get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise OllamaError("Ollama returned an empty response.")
    return content.strip()
