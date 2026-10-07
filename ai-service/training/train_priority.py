import pandas as pd
import os

DATA_PATH = "data/complaints.csv"
OUTPUT_PATH = "data/priority_complaints.csv"


def assign_priority(text):
    text = str(text).lower()

    # =========================
    # CRITICAL PRIORITY
    # =========================

    critical_words = [
        "death",
        "dead",
        "fatal",
        "fatality",
        "electrocution",
        "electrocuted",
        "fire",
        "accident",
        "accidents",
        "injury",
        "injured",
        "injuries",
        "life threatening",
        "life-threatening",
        "emergency",
        "explosion",
        "collapse",
        "collapsed",
        "electric shock",
        "shock",
        "burning",
        "people trapped",
        "person trapped"
    ]

    critical_phrases = [
        "fire near",
        "fire at",
        "fire in",
        "causing accidents",
        "causing an accident",
        "people are injured",
        "person is injured",
        "someone is injured",
        "risk to life",
        "danger to life",
        "electric pole is burning",
        "electrical pole is burning",
        "building has collapsed",
        "road has collapsed"
    ]

    # =========================
    # HIGH PRIORITY
    # =========================

    high_words = [
        "blocked",
        "overflowing",
        "flood",
        "flooded",
        "sewage",
        "no water",
        "water supply stopped",
        "water pipeline burst",
        "pipe has burst",
        "burst pipeline",
        "broken pole",
        "fallen pole",
        "electric pole",
        "dark road",
        "huge pothole",
        "major pothole",
        "school",
        "hospital",
        "dangerous",
        "completely damaged"
    ]

    # =========================
    # MEDIUM PRIORITY
    # =========================

    medium_words = [
        "not working",
        "damaged",
        "broken",
        "leaking",
        "leak",
        "bad smell",
        "several days",
        "many days",
        "days",
        "weeks",
        "needs repair",
        "repair required",
        "stopped working"
    ]

    # =========================
    # PRIORITY DECISION
    # =========================

    # Critical has highest priority
    if (
        any(word in text for word in critical_words)
        or any(phrase in text for phrase in critical_phrases)
    ):
        return "Critical"

    # High priority
    if any(word in text for word in high_words):
        return "High"

    # Medium priority
    if any(word in text for word in medium_words):
        return "Medium"

    # Default
    return "Low"


# =========================
# LOAD DATASET
# =========================

df = pd.read_csv(DATA_PATH)

print("Original dataset size:", len(df))

# Remove missing complaint text
df = df.dropna(subset=["text"])

# Convert text to string
df["text"] = df["text"].astype(str)

# Generate priority labels
df["priority"] = df["text"].apply(assign_priority)


# =========================
# SHOW RESULTS
# =========================

print("\nPriority distribution:")
print(df["priority"].value_counts())

print("\nPriority percentages:")
print(
    (df["priority"].value_counts(normalize=True) * 100).round(2)
)

print("\nCritical complaints:")
print(
    df[df["priority"] == "Critical"]
    [["text", "category"]]
    .to_string(index=False)
)

print("\nSample labeled complaints:")
print(
    df[["text", "category", "priority"]]
    .head(20)
    .to_string(index=False)
)


# =========================
# SAVE DATASET
# =========================

os.makedirs("data", exist_ok=True)

df.to_csv(OUTPUT_PATH, index=False)

print("\nSaved priority dataset to:")
print(OUTPUT_PATH)

print("\nTotal records:", len(df))