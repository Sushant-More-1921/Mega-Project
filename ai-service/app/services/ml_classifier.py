import os
import joblib


MODEL_PATH = os.path.join(
    "models",
    "complaint_classifier",
    "model.joblib"
)


class ComplaintClassifier:

    def __init__(self):

        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found: {MODEL_PATH}"
            )

        self.model = joblib.load(MODEL_PATH)

    def predict(self, text: str):

        if not text or not text.strip():
            raise ValueError(
                "Complaint text cannot be empty."
            )

        text = text.strip()

        # Predict category
        category = self.model.predict([text])[0]

        # Get calibrated probabilities
        probabilities = self.model.predict_proba([text])[0]

        # Get model classes
        classes = self.model.classes_

        # Map category -> probability
        confidence_map = dict(
            zip(classes, probabilities)
        )

        confidence = confidence_map[category]

        # Get top 3 predictions
        ranked = sorted(
            zip(classes, probabilities),
            key=lambda x: x[1],
            reverse=True
        )

        top_predictions = [
            {
                "category": category_name,
                "confidence": round(
                    float(probability), 4
                )
            }
            for category_name, probability in ranked[:3]
        ]

        return {
            "category": category,
            "confidence": round(
                float(confidence), 4
            ),
            "top_predictions": top_predictions
        }


classifier = ComplaintClassifier()