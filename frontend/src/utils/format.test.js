import test from "node:test";
import assert from "node:assert/strict";
import { labelName, percent, dateTime } from "./format.js";

test("formats percentages and labels for display", () => {
  assert.equal(percent(0.756), "76%");
  assert.equal(percent(undefined), "0%");
  assert.equal(labelName("hate_speech"), "Hate Speech");
  assert.equal(labelName("non_toxic"), "Non Toxic");
});

test("uses a stable empty date fallback", () => {
  assert.equal(dateTime(null), "Never");
});
