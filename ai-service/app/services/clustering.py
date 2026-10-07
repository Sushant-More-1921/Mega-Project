import math
from datetime import datetime


class ComplaintClusterer:

    def __init__(
        self,
        text_threshold=0.85,
        location_radius=100
    ):
        self.text_threshold = text_threshold
        self.location_radius = location_radius

    # =========================================================
    # DISTANCE BETWEEN TWO LOCATIONS
    # =========================================================

    @staticmethod
    def calculate_distance(
        lat1,
        lon1,
        lat2,
        lon2
    ):

        earth_radius = 6371000

        lat1 = math.radians(float(lat1))
        lat2 = math.radians(float(lat2))

        delta_lat = math.radians(
            float(lat2) - float(lat1)
        )

        delta_lon = math.radians(
            float(lon2) - float(lon1)
        )

        a = (
            math.sin(delta_lat / 2) ** 2
            +
            math.cos(lat1)
            *
            math.cos(lat2)
            *
            math.sin(delta_lon / 2) ** 2
        )

        c = 2 * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a)
        )

        return earth_radius * c

    # =========================================================
    # CHECK WHETHER TWO COMPLAINTS BELONG TO SAME ISSUE
    # =========================================================

    def is_same_issue(
        self,
        text_similarity,
        distance_meters,
        category_match
    ):

        same_text = (
            text_similarity >= self.text_threshold
        )

        nearby = (
            distance_meters <= self.location_radius
        )

        same_category = bool(
            category_match
        )

        return (
            same_text
            and nearby
            and same_category
        )

    # =========================================================
    # CREATE / UPDATE ISSUE CLUSTER
    # =========================================================

    def determine_cluster(
        self,
        text_similarity,
        distance_meters,
        category_match,
        existing_cluster_id=None
    ):

        same_issue = self.is_same_issue(
            text_similarity=text_similarity,
            distance_meters=distance_meters,
            category_match=category_match
        )

        if same_issue:

            if existing_cluster_id:

                cluster_id = existing_cluster_id

            else:

                cluster_id = (
                    "ISSUE-"
                    +
                    datetime.now().strftime(
                        "%Y%m%d%H%M%S"
                    )
                )

            return {
                "is_same_issue": True,
                "match_type": "issue_cluster",
                "issue_cluster_id": cluster_id,
                "action": "store_and_link"
            }

        return {
            "is_same_issue": False,
            "match_type": "new_issue",
            "issue_cluster_id": None,
            "action": "store_as_new_issue"
        }


# =============================================================
# GLOBAL CLUSTERER
# =============================================================

clusterer = ComplaintClusterer()