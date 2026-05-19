const assert = require("node:assert/strict");
const test = require("node:test");
const AnalysisHistory = require("./AnalysisHistory");

test("text search index does not treat language object as Mongo language override", () => {
  const textIndex = AnalysisHistory.schema
    .indexes()
    .find(([keys]) => Object.values(keys).includes("text"));

  assert.ok(textIndex, "expected a text search index");
  assert.equal(textIndex[1].language_override, "analysisLanguageOverride");
  assert.equal(textIndex[1].default_language, "none");
});
