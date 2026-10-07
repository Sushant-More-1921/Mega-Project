from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ml_classifier import classifier
from app.services.priority import priority_predictor

router = APIRouter()


class ComplaintRequest(BaseModel):
    text: str


@router.post("/classify")
def classify_complaint(request: ComplaintRequest):

    try:
        # =========================
        # CATEGORY PREDICTION
        # =========================

        category_result = classifier.predict(request.text)

        category_confidence = category_result["confidence"]

        # =========================
        # LOW-CONFIDENCE CHECK
        # =========================

        CONFIDENCE_THRESHOLD = 0.70

        if category_confidence < CONFIDENCE_THRESHOLD:
            category_status = "low_confidence"
            manual_review = True
        else:
            category_status = "confident"
            manual_review = False

        # =========================
        # PRIORITY PREDICTION
        # =========================

        priority_result = priority_predictor.predict(request.text)

        # =========================
        # COMBINED RESPONSE
        # =========================

        return {
            "complaint": request.text,

            "category": category_result["category"],
            "category_confidence": category_confidence,
            "category_status": category_status,
            "manual_review": manual_review,

            "top_predictions": category_result["top_predictions"],

            "priority": priority_result["priority"],
            "priority_confidence": priority_result["confidence"],
            "severity_score": priority_result["severity_score"],
            "priority_source": priority_result["source"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        print("AI Error:", e)

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed."
        )