import re
try:
    from langdetect import DetectorFactory, detect_langs

    DetectorFactory.seed = 7
except ImportError:
    detect_langs = None


LANG_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
}


def detect_language(text: str):
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", text))
    has_telugu = bool(re.search(r"[\u0C00-\u0C7F]", text))
    has_tamil = bool(re.search(r"[\u0B80-\u0BFF]", text))
    ascii_hindi_markers = re.search(
        r"\b(tum|tera|teri|aap|log|bekar|nikamma|chup|ganda|pagal|ghatiya|kutta|saale)\b",
        text.lower(),
    )

    if has_telugu:
        return {"code": "te", "name": "Telugu", "confidence": 0.96}
    if has_tamil:
        return {"code": "ta", "name": "Tamil", "confidence": 0.96}
    if has_devanagari:
        return {"code": "hi", "name": "Hindi", "confidence": 0.95}
    if ascii_hindi_markers:
        return {"code": "hi-en", "name": "Hinglish", "confidence": 0.82}

    if detect_langs is None:
        latin_ratio = sum(ch.isascii() and ch.isalpha() for ch in text) / max(1, sum(ch.isalpha() for ch in text))
        if latin_ratio >= 0.85:
            return {"code": "en", "name": "English", "confidence": 0.74}
        return {"code": "unknown", "name": "Unknown", "confidence": 0.0}

    try:
        candidates = detect_langs(text)
        if candidates:
            top = candidates[0]
            code = top.lang
            return {
                "code": code,
                "name": LANG_NAMES.get(code, code.upper()),
                "confidence": round(float(top.prob), 3),
            }
    except Exception:
        pass

    return {"code": "unknown", "name": "Unknown", "confidence": 0.0}
