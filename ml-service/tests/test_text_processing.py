import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_ROOT))

from inference.lexicon import flattened_terms
from inference.rewrite import safer_rewrite
from preprocessing.cleaner import normalize_text, tokenize_with_spans, tokenize_words
from preprocessing.language import detect_language


class TextProcessingTests(unittest.TestCase):
    def test_normalize_text_trims_whitespace_and_caps_length(self):
        text = normalize_text("  hello\n\nworld  " + ("x" * 6000))

        self.assertTrue(text.startswith("hello world"))
        self.assertLessEqual(len(text), 5000)

    def test_tokenizer_keeps_indic_script_spans(self):
        tokens = tokenize_with_spans("Hello बेवकूफ world")

        self.assertEqual([token["normalized"] for token in tokens], ["hello", "बेवकूफ", "world"])
        self.assertEqual(tokenize_words("तुम बेकार हो"), ["तुम", "बेकार", "हो"])

    def test_language_detection_uses_script_and_hinglish_hints(self):
        self.assertEqual(detect_language("तुम कैसे हो")["code"], "hi")
        self.assertEqual(detect_language("tum pagal ho")["code"], "hi-en")

    def test_safer_rewrite_replaces_terms_and_preserves_group_safety(self):
        self.assertEqual(safer_rewrite("You are an idiot", "toxic", ["idiot"]), "You are an inappropriate")
        self.assertIn(
            "without blaming any community",
            safer_rewrite("Your community is ruining the country", "hate_speech", ["community", "ruining"]),
        )

    def test_lexicon_contains_real_hindi_terms(self):
        terms = flattened_terms()

        self.assertIn("बेवकूफ", terms)
        self.assertIn("नफरत", terms)
        self.assertNotIn("à¤¬à¥‡à¤µà¤•à¥‚à¤«", terms)


if __name__ == "__main__":
    unittest.main()
