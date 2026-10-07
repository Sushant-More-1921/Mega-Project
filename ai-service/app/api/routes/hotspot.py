from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.hotspot import hotspot_service


router = APIRouter()


# =========================================================
# ISSUE CLUSTER LOCATION
# =========================================================

class ClusterLocation(BaseModel):

    latitude: float = Field(
        ...,
        ge=-90,
        le=90
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180
    )


# =========================================================
# ISSUE CLUSTER
# =========================================================

class IssueCluster(BaseModel):

    issue_cluster_id: str

    category: str | None = None

    location: ClusterLocation

    report_count: int = Field(
        default=0,
        ge=0
    )

    unique_citizen_count: int = Field(
        default=0,
        ge=0
    )


# =========================================================
# HOTSPOT REQUEST
# =========================================================

class HotspotRequest(BaseModel):

    issue_clusters: list[IssueCluster] = []


# =========================================================
# HOTSPOT API
# =========================================================

@router.post("/hotspots")
def detect_hotspots(
    request: HotspotRequest
):

    try:

        # Convert Pydantic models
        # into dictionaries.

        clusters = [
            cluster.model_dump()
            for cluster
            in request.issue_clusters
        ]


        # Run hotspot detection.

        hotspots = (
            hotspot_service.find_hotspots(
                clusters
            )
        )


        # Return result.

        return {
            "hotspot_count": len(
                hotspots
            ),

            "hotspots": hotspots
        }


    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


    except Exception as e:

        print(
            "Hotspot Detection Error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Hotspot detection failed."
            )
        )