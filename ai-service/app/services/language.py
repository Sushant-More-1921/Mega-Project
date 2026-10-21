import re


SUPPORTED_LANGUAGES = {"en", "hi", "mr"}

_MARATHI_MARKERS = {
    "आहे", "आहेत", "नाही", "करा", "झाली", "झाले", "माझ्या", "माझे",
    "मला", "पाणी", "रस्ता", "रस्त्यावर", "खड्डा", "खड्डे", "तक्रार",
}
_HINDI_MARKERS = {
    "है", "हैं", "नहीं", "करें", "हुआ", "हुई", "मेरे", "मेरा", "मेरी",
    "पानी", "सड़क", "गड्ढा", "गड्ढे", "शिकायत", "कृपया",
}


def detect_language(text: str, requested_language: str | None = None) -> str:
    if requested_language:
        language = requested_language.lower().split("-")[0]
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError("Language must be one of: en, hi, mr.")
        return language

    devanagari = re.findall(r"[\u0900-\u097f]+", text)
    if not devanagari:
        return "en"

    words = set(devanagari)
    marathi_matches = len(words & _MARATHI_MARKERS)
    hindi_matches = len(words & _HINDI_MARKERS)
    if marathi_matches > hindi_matches:
        return "mr"
    if hindi_matches:
        return "hi"

    # Hindi and Marathi share Devanagari; callers can pass an explicit language
    # when a short message does not contain enough language-specific vocabulary.
    return "hi"
