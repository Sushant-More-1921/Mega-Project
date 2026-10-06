import os
import numpy as np
import pandas as pd
import faiss

from sentence_transformers import SentenceTransformer


# =========================================================
# PATHS AND MODEL
# =========================================================

DATA_PATH = "data/complaints.csv"

INDEX_DIR = "models/faiss_index"

INDEX_PATH = os.path.join(
    INDEX_DIR,
    "complaints.index"
)

TEXTS_PATH = os.path.join(
    INDEX_DIR,
    "complaints_texts.npy"
)

MODEL_NAME = (
    "sentence-transformers/all-MiniLM-L6-v2"
)


# =========================================================
# COMPLAINT SIMILARITY SERVICE
# =========================================================

class ComplaintSimilarity:

    def __init__(self):

        print("Loading embedding model...")

        self.model = SentenceTransformer(
            MODEL_NAME
        )

        self.index = None
        self.texts = None

        if (
            os.path.exists(INDEX_PATH)
            and
            os.path.exists(TEXTS_PATH)
        ):

            print(
                "Loading existing FAISS index..."
            )

            self.index = faiss.read_index(
                INDEX_PATH
            )

            self.texts = np.load(
                TEXTS_PATH,
                allow_pickle=True
            )

            print(
                f"Loaded {self.index.ntotal} "
                "complaint embeddings."
            )

        else:

            print(
                "FAISS index not found."
            )

            print(
                "Run the index-building script first."
            )


    # =====================================================
    # BUILD FAISS INDEX
    # =====================================================

    def build_index(self):

        print(
            "Loading complaint dataset..."
        )

        df = pd.read_csv(
            DATA_PATH
        )

        df = df.dropna(
            subset=["text"]
        )

        df["text"] = (
            df["text"]
            .astype(str)
            .str.strip()
        )

        # Remove exact duplicate complaints
        df = df.drop_duplicates(
            subset=["text"]
        )

        texts = df["text"].tolist()

        print(
            f"Unique complaints after "
            f"removing duplicates: {len(texts)}"
        )

        print(
            "Creating embeddings..."
        )

        embeddings = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=True,
            normalize_embeddings=True
        )

        embeddings = np.asarray(
            embeddings,
            dtype="float32"
        )

        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(
            dimension
        )

        self.index.add(
            embeddings
        )

        self.texts = np.array(
            texts,
            dtype=object
        )

        os.makedirs(
            INDEX_DIR,
            exist_ok=True
        )

        faiss.write_index(
            self.index,
            INDEX_PATH
        )

        np.save(
            TEXTS_PATH,
            self.texts
        )

        print(
            "\nFAISS index created successfully."
        )

        print(
            f"Total indexed complaints: "
            f"{self.index.ntotal}"
        )

        print(
            f"Embedding dimension: "
            f"{dimension}"
        )


    # =====================================================
    # SEARCH SIMILAR COMPLAINTS
    # =====================================================

    def search(
        self,
        text,
        top_k=5
    ):

        if not text or not text.strip():

            raise ValueError(
                "Complaint text cannot be empty."
            )

        if self.index is None:

            raise RuntimeError(
                "FAISS index is not available."
            )

        text = text.strip()

        embedding = self.model.encode(
            [text],
            normalize_embeddings=True
        )

        embedding = np.asarray(
            embedding,
            dtype="float32"
        )

        scores, indices = (
            self.index.search(
                embedding,
                top_k
            )
        )

        results = []

        for score, index in zip(
            scores[0],
            indices[0]
        ):

            if index == -1:
                continue

            similarity = float(score)

            results.append({

                "complaint": str(
                    self.texts[index]
                ),

                "text_similarity": float(
                    round(
                        similarity,
                        4
                    )
                )
            })

        return results


    # =====================================================
    # HAVERSINE DISTANCE
    # =====================================================

    @staticmethod
    def calculate_distance(
        lat1,
        lon1,
        lat2,
        lon2
    ):

        earth_radius = 6371000

        lat1 = np.radians(
            float(lat1)
        )

        lat2 = np.radians(
            float(lat2)
        )

        delta_lat = np.radians(
            float(lat2) - float(lat1)
        )

        delta_lon = np.radians(
            float(lon2) - float(lon1)
        )

        a = (

            np.sin(
                delta_lat / 2
            ) ** 2

            +

            np.cos(lat1)
            *
            np.cos(lat2)
            *
            np.sin(
                delta_lon / 2
            ) ** 2
        )

        c = 2 * np.arctan2(
            np.sqrt(a),
            np.sqrt(1 - a)
        )

        distance = (
            earth_radius * c
        )

        return float(
            distance
        )


    # =====================================================
    # LOCATION SIMILARITY
    # =====================================================

    @staticmethod
    def location_score(
        distance_meters,
        radius_meters=100
    ):

        distance_meters = float(
            distance_meters
        )

        radius_meters = float(
            radius_meters
        )

        if distance_meters >= radius_meters:

            return 0.0

        score = (
            1
            -
            (
                distance_meters
                /
                radius_meters
            )
        )

        return float(
            round(
                max(
                    0.0,
                    min(
                        1.0,
                        score
                    )
                ),
                4
            )
        )


    # =====================================================
    # CHECK DUPLICATE / ISSUE
    # =====================================================

    def check_duplicate(
        self,
        new_text,
        new_latitude,
        new_longitude,
        previous_complaints,
        text_threshold=0.85,
        location_radius=100,
        duplicate_threshold=0.70
    ):

        if (
            not new_text
            or
            not new_text.strip()
        ):

            raise ValueError(
                "Complaint text cannot be empty."
            )

        if new_latitude is None:

            raise ValueError(
                "Latitude is required."
            )

        if new_longitude is None:

            raise ValueError(
                "Longitude is required."
            )

        if not previous_complaints:

            return {

                "possible_duplicate": False,

                "duplicate_score": 0.0,

                "reason": (
                    "No previous complaints "
                    "available."
                ),

                "best_match": None,

                "matches": []
            }


        new_latitude = float(
            new_latitude
        )

        new_longitude = float(
            new_longitude
        )


        # -------------------------------------------------
        # EMBEDDING FOR NEW COMPLAINT
        # -------------------------------------------------

        new_embedding = self.model.encode(
            [new_text],
            normalize_embeddings=True
        )

        new_embedding = np.asarray(
            new_embedding,
            dtype="float32"
        )


        matches = []


        # =================================================
        # CHECK EACH PREVIOUS COMPLAINT
        # =================================================

        for complaint in previous_complaints:

            previous_text = str(
                complaint.get(
                    "text",
                    ""
                )
            ).strip()


            previous_latitude = (
                complaint.get(
                    "latitude"
                )
            )

            previous_longitude = (
                complaint.get(
                    "longitude"
                )
            )


            if not previous_text:

                continue


            if (
                previous_latitude is None
                or
                previous_longitude is None
            ):

                continue


            previous_latitude = float(
                previous_latitude
            )

            previous_longitude = float(
                previous_longitude
            )


            # -------------------------------------------------
            # CREATE PREVIOUS COMPLAINT EMBEDDING
            # -------------------------------------------------

            previous_embedding = (
                self.model.encode(
                    [previous_text],
                    normalize_embeddings=True
                )
            )

            previous_embedding = np.asarray(
                previous_embedding,
                dtype="float32"
            )


            # -------------------------------------------------
            # TEXT SIMILARITY
            # -------------------------------------------------

            text_similarity = float(
                np.dot(
                    new_embedding[0],
                    previous_embedding[0]
                )
            )


            # -------------------------------------------------
            # LOCATION DISTANCE
            # -------------------------------------------------

            distance = (
                self.calculate_distance(
                    new_latitude,
                    new_longitude,
                    previous_latitude,
                    previous_longitude
                )
            )


            # -------------------------------------------------
            # LOCATION SIMILARITY
            # -------------------------------------------------

            location_similarity = (
                self.location_score(
                    distance,
                    location_radius
                )
            )


            # -------------------------------------------------
            # CATEGORY MATCH
            # -------------------------------------------------

            new_category = (
                complaint.get(
                    "new_category"
                )
            )

            previous_category = (
                complaint.get(
                    "category"
                )
            )


            if (
                new_category
                and
                previous_category
                and
                new_category
                ==
                previous_category
            ):

                category_match = 1.0

            else:

                category_match = 0.0


            # -------------------------------------------------
            # COMBINED SCORE
            # -------------------------------------------------

            duplicate_score = (

                text_similarity * 0.60

                +

                location_similarity * 0.30

                +

                category_match * 0.10
            )


            duplicate_score = float(
                round(
                    duplicate_score,
                    4
                )
            )


            # -------------------------------------------------
            # POSSIBLE DUPLICATE / SAME ISSUE
            # -------------------------------------------------

            possible_duplicate = (

                text_similarity
                >=
                text_threshold

                and

                distance
                <=
                location_radius

                and

                duplicate_score
                >=
                duplicate_threshold
            )


            # =================================================
            # STORE MATCH INFORMATION
            # =================================================

            matches.append({

                "complaint_id": complaint.get(
                    "id"
                ),

                "citizen_id": complaint.get(
                    "citizen_id"
                ),

                "issue_cluster_id": complaint.get(
                    "issue_cluster_id"
                ),

                "created_at": complaint.get(
                    "created_at"
                ),

                "complaint": previous_text,

                "text_similarity": float(
                    round(
                        text_similarity,
                        4
                    )
                ),

                "distance_meters": float(
                    round(
                        distance,
                        2
                    )
                ),

                "location_similarity": float(
                    location_similarity
                ),

                "category_match": bool(
                    category_match
                ),

                "duplicate_score": float(
                    duplicate_score
                ),

                "possible_duplicate": bool(
                    possible_duplicate
                )
            })


        # =================================================
        # SORT MATCHES
        # =================================================

        matches.sort(
            key=lambda x: float(
                x["duplicate_score"]
            ),
            reverse=True
        )


        # =================================================
        # BEST MATCH
        # =================================================

        best_match = (
            matches[0]
            if matches
            else None
        )


        # =================================================
        # RETURN RESULT
        # =================================================

        if best_match:

            return {

                "possible_duplicate": bool(
                    best_match[
                        "possible_duplicate"
                    ]
                ),

                "duplicate_score": float(
                    best_match[
                        "duplicate_score"
                    ]
                ),

                "best_match": best_match,

                "matches": matches
            }


        return {

            "possible_duplicate": False,

            "duplicate_score": 0.0,

            "best_match": None,

            "matches": []
        }


# =========================================================
# GLOBAL SIMILARITY ENGINE
# =========================================================

similarity_engine = ComplaintSimilarity()