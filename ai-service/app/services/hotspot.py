import math


class HotspotService:

    HOTSPOT_RADIUS_METERS = 300

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

    def find_hotspots(
        self,
        issue_clusters
    ):

        hotspots = []

        if not issue_clusters:
            return hotspots

        visited = set()

        for i, current_cluster in enumerate(
            issue_clusters
        ):

            cluster_id = current_cluster.get(
                "issue_cluster_id"
            )

            if not cluster_id:
                continue

            if cluster_id in visited:
                continue

            current_location = (
                current_cluster.get(
                    "location"
                )
            )

            if not current_location:
                continue

            current_latitude = (
                current_location.get(
                    "latitude"
                )
            )

            current_longitude = (
                current_location.get(
                    "longitude"
                )
            )

            if (
                current_latitude is None
                or
                current_longitude is None
            ):
                continue

            nearby_clusters = []

            for other_cluster in issue_clusters:

                other_id = other_cluster.get(
                    "issue_cluster_id"
                )

                if not other_id:
                    continue

                other_location = (
                    other_cluster.get(
                        "location"
                    )
                )

                if not other_location:
                    continue

                other_latitude = (
                    other_location.get(
                        "latitude"
                    )
                )

                other_longitude = (
                    other_location.get(
                        "longitude"
                    )
                )

                if (
                    other_latitude is None
                    or
                    other_longitude is None
                ):
                    continue

                distance = (
                    self.calculate_distance(
                        current_latitude,
                        current_longitude,
                        other_latitude,
                        other_longitude
                    )
                )

                if (
                    distance
                    <= self.HOTSPOT_RADIUS_METERS
                ):

                    nearby_clusters.append(
                        {
                            "issue_cluster_id": other_id,
                            "category": (
                                other_cluster.get(
                                    "category"
                                )
                            ),
                            "report_count": (
                                other_cluster.get(
                                    "report_count",
                                    0
                                )
                            ),
                            "unique_citizen_count": (
                                other_cluster.get(
                                    "unique_citizen_count",
                                    0
                                )
                            ),
                            "distance_meters": round(
                                distance,
                                2
                            )
                        }
                    )

            if len(nearby_clusters) >= 2:

                hotspot_id = (
                    "HOTSPOT-"
                    + str(len(hotspots) + 1)
                )

                total_reports = sum(
                    cluster.get(
                        "report_count",
                        0
                    )
                    for cluster
                    in nearby_clusters
                )

                total_citizens = sum(
                    cluster.get(
                        "unique_citizen_count",
                        0
                    )
                    for cluster
                    in nearby_clusters
                )

                hotspots.append(
                    {
                        "hotspot_id": hotspot_id,

                        "center": {
                            "latitude": float(
                                current_latitude
                            ),
                            "longitude": float(
                                current_longitude
                            ),
                            "radius_meters": (
                                self.HOTSPOT_RADIUS_METERS
                            )
                        },

                        "issue_cluster_count": (
                            len(nearby_clusters)
                        ),

                        "total_reports": (
                            total_reports
                        ),

                        "total_unique_citizens": (
                            total_citizens
                        ),

                        "issue_clusters": (
                            nearby_clusters
                        )
                    }
                )

                for cluster in nearby_clusters:
                    visited.add(
                        cluster[
                            "issue_cluster_id"
                        ]
                    )

        return hotspots


hotspot_service = HotspotService()