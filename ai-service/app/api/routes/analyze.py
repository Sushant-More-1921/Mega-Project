from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.services.analysis import analyze_text
from app.services.clustering import clusterer
from app.services.hotspot import hotspot_service
from app.services.issue_cluster import issue_cluster_service
from app.services.similarity import similarity_engine


router = APIRouter()


class ComplaintContext(BaseModel):
    id: str | int | None = None
    citizen_id: str | int | None = None
    text: str = Field(min_length=1, max_length=20_000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    category: str | None = None
    issue_cluster_id: str | None = None
    created_at: str | None = None
    status: str | None = None


class ClusterLocation(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class IssueCluster(BaseModel):
    issue_cluster_id: str = Field(min_length=1)
    category: str | None = None
    location: ClusterLocation
    report_count: int = Field(default=0, ge=0)
    unique_citizen_count: int = Field(default=0, ge=0)


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    language: Literal["en", "hi", "mr"] | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    complaint_id: str | int | None = None
    citizen_id: str | int | None = None
    created_at: str | None = None
    status: str | None = None
    previous_complaints: list[ComplaintContext] = Field(
        default_factory=list, max_length=500
    )
    issue_clusters: list[IssueCluster] = Field(default_factory=list, max_length=500)

    @model_validator(mode="after")
    def validate_coordinates(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Latitude and longitude must be provided together.")
        if self.previous_complaints and self.latitude is None:
            raise ValueError(
                "Latitude and longitude are required when previous complaints are supplied."
            )
        return self


def analyze_payload(request: AnalyzeRequest) -> dict:
    result = analyze_text(request.text, request.language)
    duplicate_detection = None
    issue_cluster_id = None

    if request.latitude is not None and request.previous_complaints:
        previous_complaints = []
        for complaint in request.previous_complaints:
            previous = complaint.model_dump()
            previous["new_category"] = result["category"]
            previous_complaints.append(previous)

        duplicate_detection = similarity_engine.check_duplicate(
            new_text=result["normalized_text"],
            new_latitude=request.latitude,
            new_longitude=request.longitude,
            previous_complaints=previous_complaints,
        )
        best_match = duplicate_detection.get("best_match")
        if best_match:
            cluster_result = clusterer.determine_cluster(
                text_similarity=best_match["text_similarity"],
                distance_meters=best_match["distance_meters"],
                category_match=best_match["category_match"],
                existing_cluster_id=best_match.get("issue_cluster_id"),
            )
            if cluster_result["is_same_issue"]:
                issue_cluster_id = cluster_result["issue_cluster_id"]
                duplicate_detection["issue_cluster"] = {
                    **cluster_result,
                    "duplicate_of": (
                        best_match.get("complaint_id")
                        if request.citizen_id is not None
                        and best_match.get("citizen_id") is not None
                        and str(request.citizen_id)
                        == str(best_match.get("citizen_id"))
                        else None
                    ),
                }

    clusters = [cluster.model_dump() for cluster in request.issue_clusters]
    if issue_cluster_id and request.latitude is not None:
        cluster_complaints = [
            complaint.model_dump()
            for complaint in request.previous_complaints
        ]
        cluster_complaints.append(
            {
                "id": request.complaint_id,
                "citizen_id": request.citizen_id,
                "text": result["normalized_text"],
                "category": result["category"],
                "latitude": request.latitude,
                "longitude": request.longitude,
                "issue_cluster_id": issue_cluster_id,
                "created_at": request.created_at,
                "status": request.status,
            }
        )
        summary = issue_cluster_service.build_cluster_summary(
            issue_cluster_id=issue_cluster_id,
            complaints=cluster_complaints,
        )
        if summary["location"]:
            clusters.append(
                {
                    "issue_cluster_id": issue_cluster_id,
                    "category": summary["category"],
                    "location": summary["location"],
                    "report_count": summary["report_count"],
                    "unique_citizen_count": summary["unique_citizen_count"],
                }
            )

    hotspots = hotspot_service.find_hotspots(clusters) if clusters else []
    return {
        **result,
        "duplicate_detection": duplicate_detection,
        "issue_cluster_id": issue_cluster_id,
        "hotspot_count": len(hotspots),
        "hotspots": hotspots,
    }


@router.post("/analyze")
@router.post("/classify")
def analyze_complaint(request: AnalyzeRequest):
    try:
        return analyze_payload(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
