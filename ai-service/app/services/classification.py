def classify_complaint(text: str) -> str:
    text = text.lower()

    if any(word in text for word in ["pothole", "road", "street", "broken road"]):
        return "Road/Pothole"

    if any(word in text for word in ["garbage", "waste", "trash", "dustbin"]):
        return "Garbage"

    if any(word in text for word in ["water", "pipeline", "water supply"]):
        return "Water"

    if any(word in text for word in ["drain", "drainage", "sewage"]):
        return "Drainage"

    if any(word in text for word in ["streetlight", "street light", "lamp", "light"]):
        return "Streetlight"

    if any(word in text for word in ["pollution", "smoke", "air pollution"]):
        return "Pollution"

    return "Other"