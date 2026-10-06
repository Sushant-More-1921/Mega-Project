import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)


DATA_PATH = "data/complaints.csv"
MODEL_DIR = "models/complaint_classifier"
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")


def train_model():

    print("=" * 60)
    print("CIVICRESOLVE AI - CALIBRATED COMPLAINT CLASSIFIER")
    print("=" * 60)

    df = pd.read_csv(DATA_PATH)

    print(f"\nOriginal dataset: {len(df)}")

    df = df.dropna(subset=["text", "category"])

    df["text"] = df["text"].astype(str).str.strip()
    df["category"] = df["category"].astype(str).str.strip()

    df = df[df["text"] != ""]
    df = df.drop_duplicates(subset=["text"])

    print(f"After cleaning: {len(df)}")

    print("\nCategories:")
    print(df["category"].value_counts())

    X = df["text"]
    y = df["category"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples:  {len(X_test)}")

    base_svm = LinearSVC(
        C=2.0,
        class_weight="balanced"
    )

    calibrated_svm = CalibratedClassifierCV(
        estimator=base_svm,
        method="sigmoid",
        cv=3
    )

    model = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                strip_accents="unicode",
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.98,
                sublinear_tf=True,
                max_features=100000
            )
        ),
        (
            "classifier",
            calibrated_svm
        )
    ])

    print("\nTraining calibrated Linear SVM...")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\n" + "=" * 60)
    print("MODEL RESULTS")
    print("=" * 60)

    print(f"\nAccuracy: {accuracy * 100:.2f}%")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            digits=4
        )
    )

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, predictions))

    # Example probability
    example_text = "There is a huge pothole on the main road"

    example_prediction = model.predict([example_text])[0]
    example_probability = model.predict_proba([example_text])[0].max()

    print("\nExample prediction:")
    print(f"Complaint: {example_text}")
    print(f"Category: {example_prediction}")
    print(f"Confidence: {example_probability * 100:.2f}%")

    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(model, MODEL_PATH)

    print("\n" + "=" * 60)
    print("MODEL SAVED")
    print("=" * 60)

    print(MODEL_PATH)


if __name__ == "__main__":
    train_model()