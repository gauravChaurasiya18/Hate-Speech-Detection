import re
from inference.lexicon import flattened_terms
from preprocessing.cleaner import tokenize_words

# Context-aware replacement suggestions
WORD_REPLACEMENTS = {
    "hate": "dislike",
    "kill": "harm",
    "stupid": "misguided",
    "idiot": "person",
    "fool": "person",
    "trash": "garbage",
    "scum": "person",
    "deserves": "should",
    "parasite": "burden",
    "invade": "enter",
    "infest": "populate",
    "disease": "problem",
    "virus": "issue",
    "cancer": "problem",
}

SAFE_TEMPLATES = {
    "threat": "I am concerned about this situation and want it handled safely through proper channels.",
    "hate_speech": "I have concerns about this issue, but I want to discuss it respectfully without blaming any community.",
    "offensive": "I disagree with what happened and would like to explain my concern more respectfully.",
    "cyberbullying": "I am uncomfortable with this behavior and believe the conversation should stay respectful.",
    "toxic": "I disagree with this sentiment and would like to express my concern more constructively.",
    "non_toxic": "This message is already expressed in a respectful way.",
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


def _smart_word_replacement(word: str) -> str:
    """Replace toxic words with contextually appropriate alternatives."""
    lower_word = word.lower()
    
    # Check direct mappings
    if lower_word in WORD_REPLACEMENTS:
        return WORD_REPLACEMENTS[lower_word]
    
    # Check lemma-based replacements
    for key, replacement in WORD_REPLACEMENTS.items():
        if lower_word.startswith(key):
            return replacement
    
    # Fallback to generic replacement
    return "inappropriate"


def _replace_toxic_words(text: str, toxic_words: list) -> str:
    """Replace toxic words with better alternatives while preserving structure."""
    rewritten = text
    for word in sorted(set(toxic_words), key=len, reverse=True):
        replacement = _smart_word_replacement(word)
        rewritten = re.sub(
            rf"\b{re.escape(word)}\b", 
            replacement, 
            rewritten, 
            flags=re.IGNORECASE
        )
    return rewritten


def safer_rewrite(text: str, prediction: str, toxic_words):
    """Generate a safer rewrite of potentially harmful text while preserving intent."""
    if prediction == "non_toxic":
        return text  # Return original if already safe

    # Try intelligent word replacement first
    rewritten = _replace_toxic_words(text, toxic_words)
    
    # If replacement was successful and meaningful, return it
    if rewritten != text and len(rewritten) >= len(text) * 0.6:
        return rewritten
    
    # For hate speech with group context, use contextual reframing
    if prediction == "hate_speech" and set(toxic_words) & GROUP_CONTEXT_TERMS:
        return _group_blame_rewrite(text)
    
    # For other cases, use context-aware reframing
    return _reframe_rewrite(text, prediction)
