from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ml_classifier import classifier


router = APIRouter()


class ComplaintRequest(BaseModel):
    text: str


@router.post("/classify")
def classify_complaint(request: ComplaintRequest):

    try:
        result = classifier.predict(request.text)

        return {
            "complaint": request.text,
            "category": result["category"],
            "confidence": result["confidence"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="AI classification failed."
        )