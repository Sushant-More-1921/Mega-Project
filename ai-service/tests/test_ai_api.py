import base64
import json
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.api.routes.media import _decode_image
from app.main import app
from app.services.backend_status import (
    BackendStatusError,
    get_complaint_status,
)
from app.services.language import detect_language
from app.services.ollama import OllamaError


client = TestClient(app)


class LanguageTests(unittest.TestCase):
    def test_detects_supported_languages(self):
        self.assertEqual(detect_language("The road has a pothole"), "en")
        self.assertEqual(detect_language("सड़क पर गड्ढा है"), "hi")
        self.assertEqual(detect_language("सड़क पर कचरा है"), "hi")
        self.assertEqual(detect_language("रस्त्यावर खड्डा आहे"), "mr")
        self.assertEqual(detect_language("रस्त्यावर मोठा खड्डा"), "mr")

    def test_explicit_language_takes_precedence(self):
        self.assertEqual(detect_language("नमस्कार", "mr"), "mr")

    @patch(
        "app.services.analysis.ollama_chat",
        return_value="There is a pothole on the road.",
    )
    @patch("app.services.analysis.classifier.predict")
    @patch("app.services.analysis.priority_predictor.predict")
    def test_marathi_text_is_translated_before_classification(
        self, priority_predict, category_predict, translate
    ):
        category_predict.return_value = {
            "category": "Road/Pothole",
            "confidence": 0.9,
            "top_predictions": [],
        }
        priority_predict.return_value = {
            "priority": "High",
            "confidence": 0.8,
            "severity_score": 0.75,
            "source": "ml_model",
        }
        from app.services.analysis import analyze_text

        result = analyze_text("रस्त्यावर खड्डा आहे", "mr")

        self.assertEqual(result["language"], "mr")
        self.assertEqual(result["normalized_text"], "There is a pothole on the road.")
        category_predict.assert_called_once_with("There is a pothole on the road.")
        translate.assert_called_once()


class ImageValidationTests(unittest.TestCase):
    def test_accepts_valid_png_and_rejects_mismatched_content_type(self):
        png = b"\x89PNG\r\n\x1a\n" + b"image-data"
        encoded = base64.b64encode(png).decode("ascii")
        self.assertEqual(_decode_image(encoded, "image/png"), (png, "image/png"))
        with self.assertRaises(ValueError):
            _decode_image(encoded, "image/jpeg")

    def test_rejects_invalid_base64(self):
        with self.assertRaises(ValueError):
            _decode_image("not-base64!", None)


class BackendStatusTests(unittest.TestCase):
    @patch("app.services.backend_status.urlopen")
    def test_fetches_actual_tracking_status_from_backend(self, urlopen):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps(
            {"success": True, "data": {"trackingNumber": "CMP-1", "status": "ASSIGNED"}}
        ).encode("utf-8")
        urlopen.return_value = response

        result = get_complaint_status("CMP/1")

        self.assertEqual(result["status"], "ASSIGNED")
        self.assertIn("/complaints/track/CMP%2F1", urlopen.call_args.args[0].full_url)

    @patch("app.services.backend_status.urlopen")
    def test_rejects_backend_record_without_status(self, urlopen):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps(
            {"success": True, "data": {"trackingNumber": "CMP-1"}}
        ).encode("utf-8")
        urlopen.return_value = response

        with self.assertRaises(BackendStatusError):
            get_complaint_status("CMP-1")


class ApiTests(unittest.TestCase):
    @patch("app.api.routes.analyze.analyze_text")
    def test_unified_analysis_response(self, analyze_text):
        analyze_text.return_value = {
            "complaint": "There is a pothole",
            "language": "en",
            "normalized_text": "There is a pothole",
            "category": "Road/Pothole",
            "category_confidence": 0.91,
            "category_status": "confident",
            "manual_review": False,
            "top_predictions": [{"category": "Road/Pothole", "confidence": 0.91}],
            "priority": "High",
            "priority_confidence": 0.8,
            "severity_score": 0.75,
            "priority_source": "ml_model",
        }

        response = client.post("/analyze", json={"text": "There is a pothole"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["category"], "Road/Pothole")
        self.assertIsNone(response.json()["duplicate_detection"])
        self.assertEqual(response.json()["hotspots"], [])

    @patch("app.api.routes.analyze.analyze_text")
    def test_classify_alias_uses_unified_analysis(self, analyze_text):
        analyze_text.return_value = {
            "category": "Road/Pothole",
            "priority": "High",
            "category_confidence": 0.9,
            "manual_review": False,
        }
        response = client.post("/classify", json={"text": "Road has a pothole"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["priority"], "High")
        self.assertIn("duplicate_detection", response.json())

    @patch("app.api.routes.analyze.hotspot_service.find_hotspots")
    @patch("app.api.routes.analyze.issue_cluster_service.build_cluster_summary")
    @patch("app.api.routes.analyze.clusterer.determine_cluster")
    @patch("app.api.routes.analyze.similarity_engine.check_duplicate")
    @patch("app.api.routes.analyze.analyze_text")
    def test_unified_analysis_runs_duplicate_cluster_and_hotspot_steps(
        self,
        analyze_text,
        check_duplicate,
        determine_cluster,
        build_summary,
        find_hotspots,
    ):
        analyze_text.return_value = {
            "complaint": "Pothole on road",
            "language": "en",
            "normalized_text": "Pothole on road",
            "category": "Road/Pothole",
        }
        check_duplicate.return_value = {
            "possible_duplicate": True,
            "best_match": {
                "complaint_id": "old",
                "citizen_id": 7,
                "text_similarity": 0.9,
                "distance_meters": 10,
                "category_match": True,
            },
        }
        determine_cluster.return_value = {
            "is_same_issue": True,
            "issue_cluster_id": "issue-1",
            "action": "store_and_link",
        }
        build_summary.return_value = {
            "location": {"latitude": 16.7, "longitude": 74.2},
            "category": "Road/Pothole",
            "report_count": 2,
            "unique_citizen_count": 2,
        }
        find_hotspots.return_value = [{"hotspot_id": "hotspot-1"}]

        response = client.post(
            "/analyze",
            json={
                "text": "Pothole on road",
                "latitude": 16.7,
                "longitude": 74.2,
                "citizen_id": "7",
                "previous_complaints": [
                    {
                        "id": "old",
                        "citizen_id": 7,
                        "text": "Large hole in road",
                        "latitude": 16.7,
                        "longitude": 74.2,
                        "category": "Road/Pothole",
                        "issue_cluster_id": "issue-1",
                    }
                ],
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["issue_cluster_id"], "issue-1")
        self.assertEqual(response.json()["duplicate_detection"]["issue_cluster"]["duplicate_of"], "old")
        self.assertEqual(response.json()["hotspot_count"], 1)
        self.assertEqual(response.json()["hotspots"][0]["hotspot_id"], "hotspot-1")

    def test_unified_analysis_rejects_unpaired_coordinates(self):
        response = client.post(
            "/analyze",
            json={"text": "The road is damaged", "latitude": 16.7},
        )
        self.assertEqual(response.status_code, 422)

    @patch("app.api.routes.chatbot.ollama_chat", return_value="Your complaint is in progress.")
    @patch("app.api.routes.chatbot.get_complaint_status")
    def test_chatbot_returns_backend_status_separately(self, get_status, _chat):
        get_status.return_value = {
            "trackingNumber": "CMP-2026-1042",
            "status": "IN_PROGRESS",
        }
        response = client.post(
            "/chatbot/complaint",
            json={"tracking_number": "CMP-2026-1042", "question": "Status?"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"]["status"], "IN_PROGRESS")
        self.assertIn("in progress", response.json()["answer"])

    @patch(
        "app.api.routes.chatbot.get_complaint_status",
        side_effect=BackendStatusError("No complaint was found.", 404),
    )
    def test_chatbot_surfaces_missing_backend_complaint(self, _get_status):
        response = client.post(
            "/chatbot/complaint",
            json={"tracking_number": "missing", "question": "Status?"},
        )
        self.assertEqual(response.status_code, 404)

    @patch(
        "app.api.routes.chatbot.get_complaint_status",
        return_value={"trackingNumber": "CMP-1", "status": "SUBMITTED"},
    )
    @patch(
        "app.api.routes.chatbot.ollama_chat",
        side_effect=OllamaError("Ollama is unavailable."),
    )
    def test_chatbot_reports_unavailable_ollama(self, _chat, _get_status):
        response = client.post(
            "/chatbot/complaint",
            json={"tracking_number": "CMP-1", "question": "Status?"},
        )
        self.assertEqual(response.status_code, 503)

    @patch("app.api.routes.media.ollama_chat", return_value="A pothole is visible.")
    @patch("app.api.routes.analyze.analyze_text")
    def test_image_route_returns_analysis(self, analyze_text, _vision):
        analyze_text.return_value = {
            "category": "Road/Pothole",
            "language": "en",
            "normalized_text": "A pothole is visible.",
            "priority": "Medium",
        }
        png = b"\x89PNG\r\n\x1a\n" + b"image-data"
        response = client.post(
            "/image/analyze",
            json={
                "image_base64": base64.b64encode(png).decode("ascii"),
                "content_type": "image/png",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["image_description"], "A pothole is visible.")

    @patch(
        "app.api.routes.media.ollama_chat",
        side_effect=OllamaError("Ollama is unavailable."),
    )
    def test_image_route_reports_unavailable_vision_model(self, _vision):
        png = b"\x89PNG\r\n\x1a\n" + b"image-data"
        response = client.post(
            "/image/analyze",
            json={"image_base64": base64.b64encode(png).decode("ascii")},
        )
        self.assertEqual(response.status_code, 503)

    @patch(
        "app.api.routes.media.transcribe_audio",
        return_value={"text": "पानी नहीं है", "language": "hi", "language_probability": 0.9},
    )
    @patch("app.api.routes.analyze.analyze_text")
    def test_voice_route_returns_transcript_and_analysis(self, analyze_text, _transcribe):
        analyze_text.return_value = {
            "category": "Water",
            "language": "hi",
            "normalized_text": "There is no water.",
            "priority": "High",
        }
        response = client.post(
            "/voice/transcribe",
            files={"audio": ("complaint.wav", b"audio-data", "audio/wav")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["language"], "hi")
        self.assertEqual(response.json()["analysis"]["category"], "Water")

    @patch(
        "app.api.routes.media.transcribe_audio",
        side_effect=RuntimeError("Voice transcription is not installed."),
    )
    def test_voice_route_reports_missing_whisper(self, _transcribe):
        response = client.post(
            "/voice/transcribe",
            files={"audio": ("complaint.wav", b"audio-data", "audio/wav")},
        )
        self.assertEqual(response.status_code, 503)


if __name__ == "__main__":
    unittest.main()
