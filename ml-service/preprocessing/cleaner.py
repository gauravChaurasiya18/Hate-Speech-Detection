import re


def normalize_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text[:5000]


def tokenize_words(text: str):
    return re.findall(r"[\w\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF']+", text.lower(), flags=re.UNICODE)

