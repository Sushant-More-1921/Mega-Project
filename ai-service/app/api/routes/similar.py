from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.similarity import similarity_engine
from app.services.clustering import clusterer
from app.services.issue_cluster import issue_cluster_service


router = APIRouter()


# =========================================================
# PREVIOUS COMPLAINT
# =========================================================

class PreviousComplaint(BaseModel):

    id: int | None = None

    citizen_id: int | None = None

    text: str

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

    category: str | None = None

    issue_cluster_id: str | None = None

    created_at: str | None = None

    status: str | None = None


# =========================================================
# NEW COMPLAINT
# =========================================================

class SimilarityRequest(BaseModel):

    complaint_id: int | None = None

    citizen_id: int | None = None

    text: str

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

    category: str | None = None

    created_at: str | None = None

    status: str | None = None

    previous_complaints: list[
        PreviousComplaint
    ] = []


# =========================================================
# SIMILAR / DUPLICATE / CLUSTER API
# =========================================================

@router.post("/similar")
def find_similar_complaints(
    request: SimilarityRequest
):

    try:

        # =================================================
        # CONVERT PREVIOUS COMPLAINTS
        # =================================================

        previous_complaints = []

        for complaint in request.previous_complaints:

            complaint_data = (
                complaint.model_dump()
            )

            complaint_data[
                "new_category"
            ] = request.category

            previous_complaints.append(
                complaint_data
            )


        # =================================================
        # RUN SIMILARITY
        # =================================================

        similarity_result = (
            similarity_engine.check_duplicate(
                new_text=request.text,
                new_latitude=request.latitude,
                new_longitude=request.longitude,
                previous_complaints=previous_complaints
            )
        )


        # =================================================
        # BEST MATCH
        # =================================================

        best_match = (
            similarity_result.get(
                "best_match"
            )
        )


        # =================================================
        # DEFAULT RESULT
        # =================================================

        match_type = "new_issue"

        issue_cluster_id = None

        action = "store_as_new_issue"

        duplicate_of = None


        # =================================================
        # CHECK BEST MATCH
        # =================================================

        if best_match:

            text_similarity = float(
                best_match.get(
                    "text_similarity",
                    0.0
                )
            )

            distance_meters = float(
                best_match.get(
                    "distance_meters",
                    999999
                )
            )

            category_match = bool(
                best_match.get(
                    "category_match",
                    False
                )
            )


            # =============================================
            # DETERMINE SAME REAL-WORLD ISSUE
            # =============================================

            cluster_result = (
                clusterer.determine_cluster(
                    text_similarity=text_similarity,
                    distance_meters=distance_meters,
                    category_match=category_match,
                    existing_cluster_id=(
                        best_match.get(
                            "issue_cluster_id"
                        )
                    )
                )
            )


            if cluster_result[
                "is_same_issue"
            ]:

                previous_citizen_id = (
                    best_match.get(
                        "citizen_id"
                    )
                )

                current_citizen_id = (
                    request.citizen_id
                )


                # =========================================
                # SAME CITIZEN = DUPLICATE
                # =========================================

                if (
                    current_citizen_id is not None
                    and
                    previous_citizen_id is not None
                    and
                    current_citizen_id
                    ==
                    previous_citizen_id
                ):

                    match_type = "duplicate"

                    duplicate_of = (
                        best_match.get(
                            "complaint_id"
                        )
                    )

                    issue_cluster_id = (
                        best_match.get(
                            "issue_cluster_id"
                        )
                    )

                    action = (
                        "store_and_mark_duplicate"
                    )


                # =========================================
                # DIFFERENT CITIZEN = ISSUE CLUSTER
                # =========================================

                else:

                    match_type = "issue_cluster"

                    issue_cluster_id = (
                        cluster_result[
                            "issue_cluster_id"
                        ]
                    )

                    action = "store_and_link"

                    duplicate_of = None


        # =================================================
        # BUILD CLUSTER SUMMARY
        # =================================================

        cluster_summary = None


        if issue_cluster_id:

            cluster_complaints = (
                list(previous_complaints)
            )


            # Add current complaint to the summary
            # so the backend can see the new report too.

            current_complaint = {

                "id": request.complaint_id,

                "citizen_id": request.citizen_id,

                "text": request.text,

                "category": request.category,

                "latitude": request.latitude,

                "longitude": request.longitude,

                "issue_cluster_id": (
                    issue_cluster_id
                ),

                "created_at": request.created_at,

                "status": request.status
            }


            cluster_complaints.append(
                current_complaint
            )


            cluster_summary = (
                issue_cluster_service
                .build_cluster_summary(
                    issue_cluster_id=(
                        issue_cluster_id
                    ),
                    complaints=(
                        cluster_complaints
                    )
                )
            )


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "complaint_id": (
                request.complaint_id
            ),

            "citizen_id": (
                request.citizen_id
            ),

            "complaint": request.text,

            "latitude": float(
                request.latitude
            ),

            "longitude": float(
                request.longitude
            ),

            "category": request.category,


            # ---------------------------------------------
            # MATCH INFORMATION
            # ---------------------------------------------

            "match_type": match_type,

            "possible_duplicate": bool(
                match_type == "duplicate"
            ),

            "duplicate_of": duplicate_of,


            # ---------------------------------------------
            # ISSUE CLUSTER
            # ---------------------------------------------

            "issue_cluster_id": (
                issue_cluster_id
            ),

            "action": action,


            # ---------------------------------------------
            # SIMILARITY
            # ---------------------------------------------

            "duplicate_score": float(
                similarity_result.get(
                    "duplicate_score",
                    0.0
                )
            ),


            # ---------------------------------------------
            # CLUSTER SUMMARY
            # ---------------------------------------------

            "cluster_summary": (
                cluster_summary
            ),


            # ---------------------------------------------
            # BEST MATCH
            # ---------------------------------------------

            "best_match": best_match,


            # ---------------------------------------------
            # ALL MATCHES
            # ---------------------------------------------

            "matches": (
                similarity_result.get(
                    "matches",
                    []
                )
            )
        }


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print(
            "Similarity / Cluster AI Error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Similarity and cluster "
                "analysis failed."
            )
        )