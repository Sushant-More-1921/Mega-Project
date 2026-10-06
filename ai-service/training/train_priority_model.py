import pandas as pd
import os
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


DATA_PATH = "data/priority_complaints.csv"
MODEL_DIR = "models/priority_model"
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")


# Load dataset
df = pd.read_csv(DATA_PATH)

df = df.dropna(subset=["text", "priority"])

df["text"] = df["text"].astype(str)
df["priority"] = df["priority"].astype(str)

print("Dataset size:", len(df))

print("\nPriority distribution:")
print(df["priority"].value_counts())


# Features and target
X = df["text"]
y = df["priority"]


# Stratified train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# TF-IDF
vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),
    min_df=2,
    max_df=0.98,
    sublinear_tf=True,
    max_features=100000
)


# Class-balanced SVM
base_model = LinearSVC(
    C=2.0,
    class_weight="balanced"
)


# Calibrated probabilities
model = CalibratedClassifierCV(
    estimator=base_model,
    method="sigmoid",
    cv=3
)


# Pipeline
pipeline = Pipeline([
    ("tfidf", vectorizer),
    ("classifier", model)
])


# Train
print("\nTraining priority model...")

pipeline.fit(X_train, y_train)


# Predict
y_pred = pipeline.predict(X_test)


# Metrics
accuracy = accuracy_score(y_test, y_pred)

print("\n==============================")
print("PRIORITY MODEL RESULTS")
print("==============================")

print(f"\nAccuracy: {accuracy:.4f}")
print(f"Accuracy: {accuracy * 100:.2f}%")


print("\nClassification Report:")
print(
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)


print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))


# Save model
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(pipeline, MODEL_PATH)

print("\nModel saved to:")
print(MODEL_PATH)


# Test examples
test_complaints = [
    "There is a large pothole on the road",
    "The drainage is completely blocked and sewage is overflowing",
    "Streetlight is not working",
    "There is a fire near the electrical pole",
    "People are injured because of a road accident",
    "Water pipeline has burst near the hospital"
]


print("\n==============================")
print("EXAMPLE PREDICTIONS")
print("==============================")


for complaint in test_complaints:

    prediction = pipeline.predict([complaint])[0]

    probabilities = pipeline.predict_proba([complaint])[0]

    classes = pipeline.classes_

    probability_map = dict(
        zip(classes, probabilities)
    )

    confidence = probability_map[prediction]

    print("\nComplaint:", complaint)
    print("Priority:", prediction)
    print("Confidence:", round(float(confidence), 4))