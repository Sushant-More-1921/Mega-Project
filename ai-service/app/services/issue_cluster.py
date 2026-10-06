from datetime import datetime
import math


class IssueClusterService:

    # =========================================================
    # SETTINGS
    # =========================================================

    LOCATION_RADIUS_METERS = 100


    # =========================================================
    # CALCULATE DISTANCE
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
    # BUILD ISSUE CLUSTER SUMMARY
    # =========================================================

    def build_cluster_summary(
        self,
        issue_cluster_id,
        complaints
    ):

        if not complaints:

            return {
                "issue_cluster_id": issue_cluster_id,
                "category": None,
                "location": None,
                "report_count": 0,
                "unique_citizen_count": 0,
                "first_reported_at": None,
                "latest_reported_at": None,
                "reports": []
            }


        # =====================================================
        # FILTER COMPLAINTS BELONGING TO THIS CLUSTER
        # =====================================================

        cluster_complaints = []

        for complaint in complaints:

            if (
                complaint.get(
                    "issue_cluster_id"
                )
                ==
                issue_cluster_id
            ):

                cluster_complaints.append(
                    complaint
                )


        if not cluster_complaints:

            return {
                "issue_cluster_id": issue_cluster_id,
                "category": None,
                "location": None,
                "report_count": 0,
                "unique_citizen_count": 0,
                "first_reported_at": None,
                "latest_reported_at": None,
                "reports": []
            }


        # =====================================================
        # CATEGORY
        # =====================================================

        categories = []

        for complaint in cluster_complaints:

            category = complaint.get(
                "category"
            )

            if category:
                categories.append(category)

        category = (
            categories[0]
            if categories
            else None
        )


        # =====================================================
        # LOCATION
        #
        # Use the first complaint as the representative
        # location of the issue cluster.
        # =====================================================

        first_complaint = (
            cluster_complaints[0]
        )

        latitude = first_complaint.get(
            "latitude"
        )

        longitude = first_complaint.get(
            "longitude"
        )

        location = None

        if (
            latitude is not None
            and
            longitude is not None
        ):

            location = {
                "latitude": float(latitude),
                "longitude": float(longitude),
                "radius_meters": (
                    self.LOCATION_RADIUS_METERS
                )
            }


        # =====================================================
        # UNIQUE CITIZENS
        # =====================================================

        citizen_ids = set()

        for complaint in cluster_complaints:

            citizen_id = complaint.get(
                "citizen_id"
            )

            if citizen_id is not None:

                citizen_ids.add(
                    citizen_id
                )


        # =====================================================
        # SORT BY TIME
        # =====================================================

        def get_datetime(
            complaint
        ):

            created_at = complaint.get(
                "created_at"
            )

            if not created_at:

                return datetime.max

            try:

                return datetime.fromisoformat(
                    created_at.replace(
                        "Z",
                        "+00:00"
                    )
                )

            except ValueError:

                return datetime.max


        sorted_complaints = sorted(
            cluster_complaints,
            key=get_datetime
        )


        # =====================================================
        # FIRST / LATEST REPORT
        # =====================================================

        first_report = (
            sorted_complaints[0]
        )

        latest_report = (
            sorted_complaints[-1]
        )

        first_reported_at = (
            first_report.get(
                "created_at"
            )
        )

        latest_reported_at = (
            latest_report.get(
                "created_at"
            )
        )


        # =====================================================
        # REPORT DETAILS
        # =====================================================

        reports = []

        for complaint in sorted_complaints:

            reports.append({

                "complaint_id": complaint.get(
                    "id"
                ),

                "citizen_id": complaint.get(
                    "citizen_id"
                ),

                "text": complaint.get(
                    "text"
                ),

                "category": complaint.get(
                    "category"
                ),

                "latitude": complaint.get(
                    "latitude"
                ),

                "longitude": complaint.get(
                    "longitude"
                ),

                "created_at": complaint.get(
                    "created_at"
                ),

                "status": complaint.get(
                    "status"
                )
            })


        # =====================================================
        # FINAL ISSUE CLUSTER SUMMARY
        # =====================================================

        return {

            "issue_cluster_id": (
                issue_cluster_id
            ),

            "category": category,

            "location": location,

            "report_count": (
                len(cluster_complaints)
            ),

            "unique_citizen_count": (
                len(citizen_ids)
            ),

            "first_reported_at": (
                first_reported_at
            ),

            "latest_reported_at": (
                latest_reported_at
            ),

            "reports": reports
        }


# =========================================================
# GLOBAL SERVICE
# =========================================================

issue_cluster_service = (
    IssueClusterService()
)