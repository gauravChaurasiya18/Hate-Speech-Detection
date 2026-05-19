const assert = require("node:assert/strict");
const test = require("node:test");
const ChatMessage = require("./ChatMessage");

test("chat message text search index does not treat moderation language as Mongo language override", () => {
  const textIndex = ChatMessage.schema
    .indexes()
    .find(([keys]) => Object.values(keys).includes("text"));

  assert.ok(textIndex, "expected a text search index");
  assert.equal(textIndex[1].language_override, "chatLanguageOverride");
  assert.equal(textIndex[1].default_language, "none");
});
