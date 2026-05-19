from inference.lexicon import LEXICON
from preprocessing.cleaner import tokenize_with_spans
from config import MAX_EXPLANATION_TOKENS


CATEGORIES = ("hate", "toxicity", "offensive", "threat", "cyberbullying")

SAFE_CONTEXT_TERMS = {
    "please",
    "kindly",
    "respect",
    "peace",
    "calm",
    "sorry",
    "help",
    "support",
    "safe",
    "kripya",
    "shanti",
    "madad",
    "dhanyavaad",
    "कृपया",
    "शांति",
    "मदद",
    "धन्यवाद",
}

CONTEXT_TERMS = {
    "you",
    "your",
    "they",
    "their",
    "them",
    "tum",
    "tu",
    "tera",
    "teri",
    "aap",
    "hai",
    "ho",
    "community",
    "group",
    "people",
    "जात",
    "समुदाय",
    "लोग",
}


def _clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def _category_scores(word):
    return {category: terms[word] for category, terms in LEXICON.items() if word in terms}


def _best_category(category_scores, fallback="toxicity"):
    if not category_scores:
        return fallback, 0.0
    return max(category_scores.items(), key=lambda item: item[1])


def _clean_shap_token(token):
    return str(token or "").replace("##", "").replace("▁", "").strip().lower()


def _shap_lookup(shap_explanation):
    lookup = {}
    for item in shap_explanation or []:
        token = _clean_shap_token(item.get("token"))
        if not token:
            continue
        score = float(item.get("score") or 0)
        polarity = item.get("polarity") or "toxic"
        existing = lookup.get(token)
        if not existing or abs(score) > abs(existing["score"]):
            lookup[token] = {"score": score, "polarity": polarity}
    return lookup


def _category_influence(category_scores, category, signed_score):
    magnitude = abs(float(signed_score or 0))
    if signed_score < 0:
        return {name: 0.0 for name in CATEGORIES}

    if category_scores:
        max_score = max(category_scores.values()) or 1.0
        return {
            name: round(magnitude * (category_scores.get(name, 0.0) / max_score), 4)
            for name in CATEGORIES
        }

    return {name: round(magnitude if name == category else 0.0, 4) for name in CATEGORIES}


def _build_attention(tokens, index):
    source = tokens[index]
    links = []
    source_strength = abs(source["signed_score"])

    for target in tokens:
        if target["index"] == source["index"]:
            continue

        distance = abs(target["index"] - source["index"])
        related_category = source["category"] == target["category"] and source["category"] in CATEGORIES
        context_pair = (
            source["normalized"] in CONTEXT_TERMS and target["signed_score"] > 0.05
        ) or (
            target["normalized"] in CONTEXT_TERMS and source["signed_score"] > 0.05
        )

        if distance > 6 and not related_category and not context_pair:
            continue

        target_strength = abs(target["signed_score"])
        strength = 0.1 + (1 / (distance + 1)) * 0.42 + source_strength * 0.26 + target_strength * 0.22
        if related_category:
            strength += 0.16
        if context_pair:
            strength += 0.12
        if source_strength < 0.03 and target_strength < 0.03 and distance > 2:
            strength -= 0.16

        strength = _clamp(strength, 0.0, 1.0)
        if strength >= 0.14:
            links.append(
                {
                    "index": target["index"],
                    "word": target["word"],
                    "strength": round(strength, 4),
                }
            )

    return sorted(links, key=lambda item: item["strength"], reverse=True)[:4]


def _top_toxic_words(tokens):
    best = {}
    for token in tokens:
        if token["signed_score"] <= 0.04:
            continue
        key = token["normalized"]
        current = best.get(key)
        if not current or token["signed_score"] > current["score"]:
            best[key] = {
                "word": token["word"],
                "score": token["signed_score"],
                "category": token["category"],
                "percentage": round(token["signed_score"] * 100, 1),
            }
    return sorted(best.values(), key=lambda item: item["score"], reverse=True)[:8]


def _category_summary(tokens, categories):
    summary = []
    for category in CATEGORIES:
        token_count = sum(1 for token in tokens if token["category"] == category and token["signed_score"] > 0)
        score = float((categories or {}).get(category, 0.0) or 0.0)
        if score > 0 or token_count:
            summary.append(
                {
                    "category": category,
                    "score": round(score, 4),
                    "percentage": round(score * 100, 1),
                    "token_count": token_count,
                }
            )
    return summary


def build_visual_explanation(text, categories, toxic_words, shap_explanation, model_toxicity):
    all_tokens = tokenize_with_spans(text)
    display_tokens = all_tokens[:MAX_EXPLANATION_TOKENS]
    toxic_set = {str(word).lower() for word in toxic_words or []}
    shap_scores = _shap_lookup(shap_explanation)
    strongest_category = max((categories or {"toxicity": 0.0}).items(), key=lambda item: item[1])[0]
    tokens = []

    for token in display_tokens:
        word = token["normalized"]
        category_scores = _category_scores(word)
        category, base_score = _best_category(category_scores, strongest_category)
        shap = shap_scores.get(word)
        signed_score = 0.0
        polarity = "neutral"

        if base_score > 0:
            signed_score = _clamp((base_score * 0.72) + (model_toxicity * 0.32))
            polarity = "toxic"
        elif word in toxic_set:
            signed_score = _clamp(max(model_toxicity * 0.58, (categories or {}).get(strongest_category, 0) * 0.76))
            category = strongest_category
            polarity = "toxic"
        elif shap:
            shap_score = _clamp(float(shap["score"]))
            if shap.get("polarity") == "safe":
                signed_score = -_clamp(shap_score * (0.72 + (1 - model_toxicity) * 0.32), 0.02, 0.4)
                category = "safe"
                polarity = "safe"
            else:
                signed_score = _clamp(shap_score * (0.8 + model_toxicity * 0.5))
                category = strongest_category
                polarity = "toxic"
        elif word in SAFE_CONTEXT_TERMS:
            signed_score = -_clamp((1 - model_toxicity) * 0.24, 0.03, 0.3)
            category = "safe"
            polarity = "safe"
        elif model_toxicity < 0.42:
            signed_score = -_clamp((1 - model_toxicity) * 0.1, 0.02, 0.16)
            category = "safe"
            polarity = "safe"

        toxic_score = max(0.0, signed_score)
        confidence = _clamp(max(abs(signed_score), model_toxicity if toxic_score else 1 - model_toxicity), 0, 1)

        tokens.append(
            {
                "index": token["index"],
                "word": token["word"],
                "normalized": token["normalized"],
                "score": round(toxic_score, 4),
                "signed_score": round(signed_score, 4),
                "polarity": polarity,
                "category": category,
                "category_influence": _category_influence(category_scores, category, signed_score),
                "confidence": round(confidence * 100, 1),
                "start": token["start"],
                "end": token["end"],
                "attention": [],
            }
        )

    for index in range(len(tokens)):
        tokens[index]["attention"] = _build_attention(tokens, index)

    return {
        "tokens": tokens,
        "top_toxic_words": _top_toxic_words(tokens),
        "category_summary": _category_summary(tokens, categories or {}),
        "confidence": round(model_toxicity * 100, 1),
        "token_count": len(all_tokens),
        "truncated": len(all_tokens) > len(display_tokens),
        "schema_version": "xai-v1",
    }
