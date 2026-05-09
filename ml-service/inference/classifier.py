import numpy as np
import re
from model.provider import provider
from preprocessing.cleaner import normalize_text, tokenize_words
from preprocessing.language import detect_language
from inference.lexicon import LEXICON, flattened_terms
from inference.rewrite import safer_rewrite
from explainability.shap_explainer import ShapExplainer


LABEL_ALIASES = {
    "toxic": "toxic",
    "toxicity": "toxic",
    "label_1": "toxic",
    "1": "toxic",
    "non-toxic": "non_toxic",
    "non_toxic": "non_toxic",
    "not toxic": "non_toxic",
    "label_0": "non_toxic",
    "0": "non_toxic",
}

GROUP_REFERENCES = {
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
    "pollute",
    "polluting",
    "spoiling",
    "spoiled",
}

GROUP_BLAME_PATTERNS = [
    re.compile(
        r"\b(?:your|their|that|this|these|those)\s+"
        r"(?:community|communities|group|groups|people|religion|caste|race|tribe|minority|immigrants|migrants)\b"
        r".{0,80}\b(?:ruin(?:ing|ed)?|destroy(?:ing|ed)?|damag(?:ing|ed|e)|pollut(?:ing|ed|e)|spoil(?:ing|ed)?)\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:ruin(?:ing|ed)?|destroy(?:ing|ed)?|damag(?:ing|ed|e)|pollut(?:ing|ed|e)|spoil(?:ing|ed)?)\b"
        r".{0,80}\b(?:community|communities|group|groups|people|religion|caste|race|tribe|minority|immigrants|migrants)\b",
        re.IGNORECASE,
    ),
]


def _sigmoid(x):
    return 1 / (1 + np.exp(-x))


class HateSpeechClassifier:
    def __init__(self):
        self._explainer = None

    def _pipeline_scores(self, text):
        classifier, _, _ = provider.get()
        raw = classifier(text)
        scores = raw[0] if raw and isinstance(raw[0], list) else raw
        parsed = {}

        for item in scores:
            label = str(item.get("label", "")).lower()
            normalized = LABEL_ALIASES.get(label, label.replace(" ", "_"))
            parsed[normalized] = float(item.get("score", 0))

        if "toxic" not in parsed:
            toxic_candidates = [value for key, value in parsed.items() if "toxic" in key and "non" not in key]
            parsed["toxic"] = max(toxic_candidates) if toxic_candidates else max(parsed.values() or [0])

        if "non_toxic" not in parsed:
            parsed["non_toxic"] = max(0.0, 1.0 - parsed["toxic"])

        return parsed

    def _lexicon_scores(self, words):
        category_scores = {}
        toxic_terms = []
        for category, lexicon in LEXICON.items():
            matches = [lexicon[word] for word in words if word in lexicon]
            category_scores[category] = min(1.0, sum(matches)) if matches else 0.0
            if matches:
                toxic_terms.extend([word for word in words if word in lexicon])
        return category_scores, sorted(set(toxic_terms))

    def _contextual_scores(self, text, words):
        has_group_reference = bool(set(words) & GROUP_REFERENCES)
        has_blame = bool(set(words) & BLAME_TERMS)
        group_blame = has_group_reference and has_blame and any(pattern.search(text) for pattern in GROUP_BLAME_PATTERNS)

        if not group_blame:
            return {"hate": 0.0, "toxicity": 0.0, "offensive": 0.0}, []

        evidence = [word for word in words if word in GROUP_REFERENCES or word in BLAME_TERMS]
        return {"hate": 0.62, "toxicity": 0.64, "offensive": 0.45}, sorted(set(evidence))

    def _predict_probability(self, texts):
        classifier, _, _ = provider.get()
        probabilities = []
        for text in texts:
            scores = self._pipeline_scores(text)
            toxic = scores.get("toxic", 0)
            probabilities.append([1 - toxic, toxic])
        return np.array(probabilities)

    def analyze(self, raw_text, include_explanation=True):
        text = normalize_text(raw_text)
        if not text:
            raise ValueError("Text is required")

        words = tokenize_words(text)
        model_scores = self._pipeline_scores(text)
        lexicon_scores, toxic_words = self._lexicon_scores(words)
        contextual_scores, contextual_terms = self._contextual_scores(text, words)
        toxic_words = sorted(set(toxic_words) | set(contextual_terms))
        model_toxicity = model_scores.get("toxic", 0)
        lexical_toxicity = max(lexicon_scores.values() or [0])
        contextual_toxicity = max(contextual_scores.values() or [0])
        toxicity = min(
            1.0,
            max(
                model_toxicity,
                contextual_toxicity,
                (model_toxicity * 0.72) + (max(lexical_toxicity, contextual_toxicity) * 0.38),
            ),
        )

        categories = {
            "hate": round(max(lexicon_scores["hate"], contextual_scores["hate"], toxicity * 0.6 if lexicon_scores["hate"] else 0), 4),
            "toxicity": round(max(lexicon_scores["toxicity"], toxicity), 4),
            "offensive": round(
                max(
                    lexicon_scores["offensive"],
                    contextual_scores["offensive"],
                    toxicity * 0.72 if max(lexical_toxicity, contextual_toxicity) else 0,
                ),
                4,
            ),
            "threat": round(max(lexicon_scores["threat"], toxicity * 0.75 if lexicon_scores["threat"] else 0), 4),
            "cyberbullying": round(max(lexicon_scores["cyberbullying"], toxicity * 0.65 if lexicon_scores["cyberbullying"] else 0), 4),
        }

        if categories["threat"] >= 0.55:
            prediction = "threat"
        elif categories["hate"] >= 0.58:
            prediction = "hate_speech"
        elif categories["cyberbullying"] >= 0.55:
            prediction = "cyberbullying"
        elif categories["offensive"] >= 0.52:
            prediction = "offensive"
        elif toxicity >= 0.5:
            prediction = "toxic"
        else:
            prediction = "non_toxic"

        if not toxic_words and toxicity >= 0.5:
            known = flattened_terms()
            toxic_words = [word for word in words if known.get(word, 0) >= 0.35][:8]

        if include_explanation:
            _, tokenizer, _ = provider.get()
            if self._explainer is None:
                self._explainer = ShapExplainer(self._predict_probability, tokenizer)
            explanation = self._explainer.explain(text, toxicity)
        else:
            explanation = ShapExplainer().explain(text, toxicity)

        return {
            "prediction": prediction,
            "confidence": round(float(toxicity if prediction != "non_toxic" else max(model_scores.get("non_toxic", 1 - toxicity), 1 - toxicity)), 4),
            "categories": categories,
            "toxic_words": toxic_words,
            "shap_explanation": explanation,
            "language": detect_language(text),
            "safer_rewrite": safer_rewrite(text, prediction, toxic_words),
        }


classifier = HateSpeechClassifier()
