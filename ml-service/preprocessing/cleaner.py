import re

WORD_PATTERN = re.compile(r"[\w\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF']+", flags=re.UNICODE)


def normalize_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text[:5000]


def tokenize_words(text: str):
    return [match.group(0).lower() for match in WORD_PATTERN.finditer(text or "")]


def tokenize_with_spans(text: str):
    tokens = []
    for index, match in enumerate(WORD_PATTERN.finditer(text or "")):
        word = match.group(0)
        tokens.append(
            {
                "index": index,
                "word": word,
                "normalized": word.lower(),
                "start": match.start(),
                "end": match.end(),
            }
        )
    return tokens
