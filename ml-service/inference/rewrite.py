import re
from inference.lexicon import flattened_terms
from preprocessing.cleaner import tokenize_words

SAFE_TEMPLATES = {
    "threat": "I am concerned about this situation and want it handled safely through the right channels.",
    "hate_speech": "I have concerns about this issue, but I do not want to blame or insult any community.",
    "offensive": "I disagree with what happened and want to explain my concern respectfully.",
    "cyberbullying": "I am uncomfortable with this behavior and want the conversation to stay respectful.",
    "toxic": "I disagree with this, but I want to express my concern respectfully.",
    "non_toxic": "This message is already written in a relatively safe way.",
}

GROUP_CONTEXT_TERMS = {
    "community",
    "communities",
    "group",
    "groups",
    "people",
    "religion",
    "caste",
    "race",
    "tribe",
    "minority",
    "immigrants",
    "migrants",
}

BLAME_TERMS = {
    "ruin",
    "ruining",
    "ruined",
    "destroy",
    "destroying",
    "destroyed",
    "damage",
    "damaging",
    "damaged",
    "pollute",
    "polluting",
    "polluted",
    "spoil",
    "spoiling",
    "spoiled",
}

TOPIC_PATTERNS = [
    (re.compile(r"\b(?:this|the|our)\s+(country|nation)\b", re.IGNORECASE), "the country"),
    (re.compile(r"\b(?:this|the|our)\s+(city|town|village|state)\b", re.IGNORECASE), "this place"),
    (re.compile(r"\b(?:this|the|our)\s+(school|college|university)\b", re.IGNORECASE), "this institution"),
    (re.compile(r"\b(?:this|the|our)\s+(workplace|office|company)\b", re.IGNORECASE), "this workplace"),
]


def _topic_from_text(text: str) -> str:
    for pattern, topic in TOPIC_PATTERNS:
        if pattern.search(text):
            return topic

    words = set(tokenize_words(text))
    if {"country", "nation"} & words:
        return "the country"
    if {"city", "town", "village", "state"} & words:
        return "this place"
    if {"school", "college", "university"} & words:
        return "this institution"
    if {"workplace", "office", "company"} & words:
        return "this workplace"
    return "the situation"


def _concern_from_text(text: str, prediction: str) -> str:
    words = set(tokenize_words(text))
    topic = _topic_from_text(text)

    if words & BLAME_TERMS:
        return f"I am worried about challenges affecting {topic}"
    if prediction == "threat":
        return f"I am concerned about safety around {topic}"
    if prediction == "cyberbullying":
        return f"I feel uncomfortable with what is happening in {topic}"
    if prediction == "offensive":
        return f"I disagree with what happened in {topic}"
    return f"I have concerns about {topic}"


def _group_blame_rewrite(text: str) -> str:
    concern = _concern_from_text(text, "hate_speech")
    return f"{concern} and want to discuss solutions respectfully without blaming any community."


def _reframe_rewrite(text: str, prediction: str) -> str:
    concern = _concern_from_text(text, prediction)
    endings = {
        "threat": "and want it handled safely through the right channels.",
        "hate_speech": "and want to discuss it without insulting or blaming any group.",
        "offensive": "and want to explain my concern respectfully.",
        "cyberbullying": "and want the conversation to stay respectful.",
        "toxic": "and want to express that concern respectfully.",
    }
    return f"{concern} {endings.get(prediction, endings['toxic'])}"


def safer_rewrite(text: str, prediction: str, toxic_words):
    if prediction == "non_toxic":
        return SAFE_TEMPLATES["non_toxic"]

    if prediction == "hate_speech" and set(toxic_words) & GROUP_CONTEXT_TERMS:
        return _group_blame_rewrite(text)

    rewritten = text
    for word in sorted(set(toxic_words), key=len, reverse=True):
        rewritten = re.sub(rf"\b{re.escape(word)}\b", "inappropriate", rewritten, flags=re.IGNORECASE)

    remaining_terms = set(tokenize_words(rewritten)) & set(flattened_terms().keys())
    if remaining_terms or len(rewritten) > 180:
        return _reframe_rewrite(text, prediction)

    return rewritten if rewritten != text else _reframe_rewrite(text, prediction)
