import math
from config import ENABLE_SHAP, MAX_SHAP_TOKENS
from inference.lexicon import flattened_terms
from preprocessing.cleaner import tokenize_words


class ShapExplainer:
    def __init__(self, predict_probability=None, tokenizer=None):
        self.predict_probability = predict_probability
        self.tokenizer = tokenizer
        self._explainer = None

    def _lexical_explanation(self, text, model_confidence):
        lexicon = flattened_terms()
        words = tokenize_words(text)
        scored = []

        for word in words[:MAX_SHAP_TOKENS]:
            base = lexicon.get(word, 0)
            if base:
                score = min(1.0, base * (0.65 + model_confidence * 0.5))
                scored.append({"token": word, "score": round(score, 4), "polarity": "toxic"})

        if not scored and model_confidence >= 0.55:
            for word in words[: min(8, len(words))]:
                length_weight = min(0.4, math.log(len(word) + 1) / 10)
                scored.append({"token": word, "score": round(length_weight * model_confidence, 4), "polarity": "toxic"})

        return sorted(scored, key=lambda item: item["score"], reverse=True)[:12]

    def explain(self, text, model_confidence):
        if not ENABLE_SHAP or self.predict_probability is None or self.tokenizer is None:
            return self._lexical_explanation(text, model_confidence)

        try:
            import shap

            if self._explainer is None:
                masker = shap.maskers.Text(self.tokenizer)
                self._explainer = shap.Explainer(self.predict_probability, masker)

            values = self._explainer([text[:1000]])
            tokens = values.data[0]
            toxic_values = values.values[0]
            if getattr(toxic_values, "ndim", 1) > 1:
                toxic_values = toxic_values[:, -1]

            explanation = []
            for token, score in zip(tokens, toxic_values):
                cleaned = str(token).strip()
                if cleaned and abs(float(score)) > 0.001:
                    explanation.append(
                        {
                            "token": cleaned,
                            "score": round(abs(float(score)), 4),
                            "polarity": "toxic" if float(score) >= 0 else "safe",
                        }
                    )

            if explanation:
                return sorted(explanation, key=lambda item: item["score"], reverse=True)[:12]
        except Exception:
            pass

        return self._lexical_explanation(text, model_confidence)

