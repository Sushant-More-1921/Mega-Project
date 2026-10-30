import csv
import json
from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from app.main import app


ROOT = Path(__file__).resolve().parents[1]
EVALUATION_DIR = ROOT / "evaluation"
CATEGORY_LABELS = [
    "Drainage",
    "Garbage",
    "Pollution",
    "Road/Pothole",
    "Streetlight",
    "Water",
]
PRIORITY_LABELS = ["Critical", "High", "Low", "Medium"]
NYC_TYPE_LABELS = {
    "Air Quality": "Pollution",
    "Sanitation Condition": "Garbage",
    "Sewer": "Drainage",
    "Street Light Condition": "Streetlight",
    "Streetlight Condition": "Streetlight",
    "Water System": "Water",
}


def build_classifier() -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.98,
                    sublinear_tf=True,
                    max_features=100000,
                ),
            ),
            (
                "classifier",
                CalibratedClassifierCV(
                    estimator=LinearSVC(C=2.0, class_weight="balanced"),
                    method="sigmoid",
                    cv=3,
                ),
            ),
        ]
    )


def build_priority_model() -> Pipeline:
    return Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=2,
                    max_df=0.98,
                    sublinear_tf=True,
                    max_features=100000,
                ),
            ),
            (
                "classifier",
                CalibratedClassifierCV(
                    estimator=LinearSVC(C=2.0, class_weight="balanced"),
                    method="sigmoid",
                    cv=3,
                ),
            ),
        ]
    )


def clean_frame(frame: pd.DataFrame, label_column: str) -> pd.DataFrame:
    frame = frame.dropna(subset=["text", label_column]).copy()
    frame["text"] = frame["text"].astype(str).str.strip()
    frame[label_column] = frame[label_column].astype(str).str.strip()
    frame = frame[(frame["text"] != "") & (frame[label_column] != "")]
    return frame.drop_duplicates(subset=["text"])


def summarize(y_true: list[str], y_pred: list[str], labels: list[str]) -> dict:
    return {
        "rows": len(y_true),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, labels=labels, average="macro")),
        "per_class": classification_report(
            y_true, y_pred, labels=labels, output_dict=True, zero_division=0
        ),
        "confusion_matrix": confusion_matrix(y_true, y_pred, labels=labels).tolist(),
    }


def project_holdout(
    csv_path: Path,
    label_column: str,
    labels: list[str],
    model: Pipeline,
    header: int | None = 0,
) -> tuple[dict, list[str], list[str]]:
    frame = pd.read_csv(csv_path, header=header)
    if header is None:
        frame.columns = ["text", label_column]
    frame = clean_frame(frame, label_column)
    train, test = train_test_split(
        frame,
        test_size=0.20,
        random_state=42,
        stratify=frame[label_column],
    )
    model.fit(train["text"], train[label_column])
    predictions = model.predict(test["text"]).tolist()
    actual = test[label_column].tolist()
    return summarize(actual, predictions, labels), actual, predictions


def map_nyc_label(complaint_type: str, descriptor: str) -> str | None:
    if complaint_type == "Street Condition":
        return "Road/Pothole" if "pothole" in descriptor.lower() else None
    return NYC_TYPE_LABELS.get(complaint_type)


def evaluate_nyc(client: TestClient) -> tuple[dict, list[dict]]:
    data_path = EVALUATION_DIR / "nyc_311_test.csv"
    if not data_path.is_file():
        raise FileNotFoundError(f"External test data not found: {data_path}")

    frame = pd.read_csv(data_path).dropna(subset=["complaint_type", "descriptor"])
    frame["descriptor"] = frame["descriptor"].astype(str).str.strip()
    frame = frame[frame["descriptor"] != ""]
    unique_descriptors: dict[tuple[str, str], tuple[str, str]] = {}
    for row in frame.itertuples(index=False):
        complaint_type = str(row.complaint_type)
        descriptor = str(row.descriptor)
        label = map_nyc_label(complaint_type, descriptor)
        if label:
            unique_descriptors[(complaint_type, descriptor)] = (label, descriptor)

    predictions = []
    for (complaint_type, descriptor), (expected, text) in unique_descriptors.items():
        response = client.post("/analyze", json={"text": text, "language": "en"})
        response.raise_for_status()
        result = response.json()
        predictions.append(
            {
                "complaint_type": complaint_type,
                "descriptor": descriptor,
                "expected_category": expected,
                "predicted_category": result["category"],
                "category_confidence": result["category_confidence"],
                "priority": result["priority"],
                "priority_confidence": result["priority_confidence"],
                "correct": result["category"] == expected,
            }
        )

    if not predictions:
        raise ValueError("No supported labeled descriptors were found in NYC data.")

    metrics = summarize(
        [row["expected_category"] for row in predictions],
        [row["predicted_category"] for row in predictions],
        CATEGORY_LABELS,
    )
    metrics["supported_rows_in_download"] = len(frame)
    metrics["unique_descriptors_evaluated"] = len(predictions)
    metrics["class_support"] = {
        label: sum(row["expected_category"] == label for row in predictions)
        for label in CATEGORY_LABELS
    }
    return metrics, predictions


def percent(value: float) -> str:
    return f"{value * 100:.2f}%"


def report_metrics(title: str, metrics: dict, labels: list[str]) -> list[str]:
    lines = [
        f"### {title}",
        "",
        f"- Rows evaluated: **{metrics['rows']:,}**",
        f"- Accuracy: **{percent(metrics['accuracy'])}**",
        f"- Macro F1: **{percent(metrics['macro_f1'])}**",
    ]
    if "supported_rows_in_download" in metrics:
        lines.append(
            f"- NYC rows downloaded: **{metrics['supported_rows_in_download']:,}**"
        )
    lines.extend(
        [
            "",
            "| Class | Precision | Recall | F1 | Support |",
            "| --- | ---: | ---: | ---: | ---: |",
        ]
    )
    for label in labels:
        result = metrics["per_class"][label]
        lines.append(
            f"| {label} | {percent(result['precision'])} | "
            f"{percent(result['recall'])} | {percent(result['f1-score'])} | "
            f"{int(result['support'])} |"
        )
    lines.extend(["", "Confusion matrix (rows = actual, columns = predicted):", ""])
    lines.append("| Actual \ Predicted | " + " | ".join(labels) + " |")
    lines.append("| --- | " + " | ".join("---:" for _ in labels) + " |")
    for label, values in zip(labels, metrics["confusion_matrix"]):
        lines.append(f"| {label} | " + " | ".join(str(value) for value in values) + " |")
    lines.append("")
    return lines


def main() -> None:
    category_metrics, _, _ = project_holdout(
        ROOT / "data" / "complaints.csv",
        "category",
        CATEGORY_LABELS,
        build_classifier(),
        header=None,
    )
    priority_metrics, _, _ = project_holdout(
        ROOT / "data" / "priority_complaints.csv",
        "priority",
        PRIORITY_LABELS,
        build_priority_model(),
    )

    client = TestClient(app)
    health = client.get("/health")
    health.raise_for_status()
    nyc_metrics, nyc_predictions = evaluate_nyc(client)
    with (EVALUATION_DIR / "nyc_311_predictions.csv").open(
        "w", newline="", encoding="utf-8"
    ) as output:
        writer = csv.DictWriter(output, fieldnames=list(nyc_predictions[0]))
        writer.writeheader()
        writer.writerows(nyc_predictions)

    sample_text = "There is a large pothole on the main road"
    sample_response = client.post(
        "/analyze", json={"text": sample_text, "language": "en"}
    )
    sample_response.raise_for_status()
    sample_result = sample_response.json()

    lines = [
        "# CivicResolve AI service evaluation",
        "",
        f"Generated: {datetime.now().astimezone().isoformat(timespec='seconds')}",
        "",
        "## Results",
        "",
        "These checks evaluate two different things: a reproducible 80/20 split "
        "trained during this run on the project datasets, and external category "
        "generalization using NYC 311 issue descriptors passed through the "
        "FastAPI routes. They are not interchangeable.",
        "",
    ]
    lines.extend(report_metrics("Project category holdout", category_metrics, CATEGORY_LABELS))
    lines.extend(report_metrics("Project priority holdout", priority_metrics, PRIORITY_LABELS))
    lines.extend(report_metrics("External NYC 311 descriptor check", nyc_metrics, CATEGORY_LABELS))
    lines.extend(
        [
            "## FastAPI route smoke check (in-process TestClient)",
            "",
            f"- `GET /health`: HTTP {health.status_code}; "
            f"`{json.dumps(health.json(), sort_keys=True)}`",
            f"- `/analyze` sample: {sample_text!r}",
            f"- Response: category **{sample_result['category']}** "
            f"({percent(sample_result['category_confidence'])} confidence), "
            f"priority **{sample_result['priority']}** "
            f"({percent(sample_result['priority_confidence'])} confidence).",
            "",
            "## Interpretation and limitations",
            "",
            "- Project holdout metrics use a stratified random 20% split "
            "(random seed 42). They measure performance on the project data "
            "distribution, not an independently collected civic dataset.",
            "- Priority labels in `priority_complaints.csv` were generated by "
            "the project's keyword rules. Priority scores therefore measure "
            "agreement with those pseudo-labels, not verified urgency.",
            "- The NYC check tests one row per unique `(complaint_type, "
            "descriptor)` pair in the downloaded sample. The expected project "
            "category is mapped from the NYC service type, and the model sees "
            "only the descriptor text. NYC does not provide equivalent project "
            "priority labels. Garbage may have no support in the sample.",
            "- The NYC check is a useful domain-shift stress test, not a "
            "representative estimate of model quality on free-form complaints.",
            "- Voice, image, chatbot, and duplicate-detection dependencies "
            "require separate local model/service setup; this report does not "
            "claim those integrations are live-tested. API unit tests mock "
            "external model and backend calls.",
            "",
            "## Reproduce",
            "",
            "From `ai-service`, run:",
            "",
            "```powershell",
            ".\\venv\\Scripts\\python.exe -m evaluation.evaluate_ai",
            ".\\venv\\Scripts\\python.exe -m unittest discover -s tests -v",
            "```",
            "",
            "External data: NYC Open Data, 311 Service Requests from 2020 to "
            "2025, dataset `erm2-nwe9`: "
            "[data.cityofnewyork.us](https://data.cityofnewyork.us/resource/erm2-nwe9.json). "
            "The saved sample is `nyc_311_test.csv`; predictions are in "
            "`nyc_311_predictions.csv`.",
            "",
        ]
    )
    report_path = EVALUATION_DIR / "AI_SERVICE_TEST_REPORT.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Report: {report_path}")
    print(f"NYC predictions: {EVALUATION_DIR / 'nyc_311_predictions.csv'}")
    print("Category holdout:", percent(category_metrics["accuracy"]))
    print("Priority holdout:", percent(priority_metrics["accuracy"]))
    print(
        "NYC external:", percent(nyc_metrics["accuracy"]),
        f"({nyc_metrics['rows']} unique descriptors)",
    )
    print(
        "Sample /analyze:",
        json.dumps(
            {
                "category": sample_result["category"],
                "category_confidence": sample_result["category_confidence"],
                "priority": sample_result["priority"],
                "priority_confidence": sample_result["priority_confidence"],
            }
        ),
    )
    print("Health:", json.dumps(health.json(), sort_keys=True))


if __name__ == "__main__":
    main()
