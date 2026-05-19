import test from "node:test";
import assert from "node:assert/strict";
import { buildContributionData, normalizeExplanation, tokenColor } from "./explainability.js";

test("normalizes fallback token explanations with toxic and safe polarity", () => {
  const result = {
    confidence: 0.8,
    prediction: "toxic",
    toxicWords: ["idiot"],
    categories: { toxicity: 0.8, hate: 0.1 },
    shapExplanation: [
      { token: "please", score: 0.2, polarity: "safe" },
      { token: "idiot", score: 0.6, polarity: "toxic" }
    ]
  };

  const explanation = normalizeExplanation(result, "Please stop idiot");
  const please = explanation.tokens.find((token) => token.normalized === "please");
  const idiot = explanation.tokens.find((token) => token.normalized === "idiot");

  assert.equal(explanation.tokenCount, 3);
  assert.equal(please.polarity, "safe");
  assert.ok(please.signedScore < 0);
  assert.equal(idiot.polarity, "toxic");
  assert.ok(idiot.score > 0.5);
  assert.equal(explanation.topToxicWords[0].word, "idiot");
});

test("builds sorted contribution data and color styles", () => {
  const data = buildContributionData([
    { word: "safe", signedScore: -0.2, category: "safe" },
    { word: "threat", signedScore: 0.7, category: "threat" }
  ]);

  assert.equal(data[0].name, "threat");
  assert.equal(data[0].positive, 70);
  assert.equal(data[1].negative, -20);
  assert.match(tokenColor(0.75).background, /^linear-gradient/);
});
