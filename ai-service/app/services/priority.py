import os
import joblib


MODEL_PATH = os.path.join(
    "models",
    "priority_model",
    "model.joblib"
)


class PriorityPredictor:

    def __init__(self):
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Priority model not found: {MODEL_PATH}"
            )

        self.model = joblib.load(MODEL_PATH)

    def predict(self, text: str):

        if not text or not text.strip():
            raise ValueError(
                "Complaint text cannot be empty."
            )

        text = text.strip()
        text_lower = text.lower()

        # ==========================================
        # SAFETY-CRITICAL OVERRIDE
        # ==========================================

        critical_words = [
            "fire",
            "accident",
            "injury",
            "injured",
            "injuries",
            "electrocution",
            "electrocuted",
            "electric shock",
            "explosion",
            "fatal",
            "fatality",
            "death",
            "dead",
            "collapsed",
            "collapse",
            "people trapped",
            "person trapped",
            "life threatening",
            "life-threatening"
        ]

        critical_phrases = [
            "risk to life",
            "danger to life",
            "causing accidents",
            "causing an accident",
            "people are injured",
            "someone is injured",
            "person is injured",
            "fire near",
            "fire at",
            "fire in"
        ]

        critical_detected = (
            any(word in text_lower for word in critical_words)
            or any(
                phrase in text_lower
                for phrase in critical_phrases
            )
        )

        # ==========================================
        # ML PREDICTION
        # ==========================================

        ml_priority = self.model.predict([text])[0]

        probabilities = self.model.predict_proba([text])[0]
        classes = self.model.classes_

        probability_map = dict(
            zip(classes, probabilities)
        )

        ml_confidence = probability_map[ml_priority]

        # ==========================================
        # FINAL PRIORITY
        # ==========================================

        if critical_detected:
            final_priority = "Critical"
            source = "safety_override"
        else:
            final_priority = ml_priority
            source = "ml_model"

        # ==========================================
        # SEVERITY SCORE
        # ==========================================

        if final_priority == "Critical":
            severity_score = 0.95

        elif final_priority == "High":
            severity_score = 0.75

        elif final_priority == "Medium":
            severity_score = 0.50

        else:
            severity_score = 0.25

        return {
            "priority": final_priority,
            "confidence": round(
                float(ml_confidence),
                4
            ),
            "severity_score": severity_score,
            "source": source
        }


priority_predictor = PriorityPredictor()