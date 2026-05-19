const test = require("node:test");
const assert = require("node:assert/strict");
const parseUploadedFile = require("./fileParser");

const makeFile = ({ originalname, mimetype = "", content }) => ({
  originalname,
  mimetype,
  buffer: Buffer.from(content, "utf8")
});

test("parses CSV files using known text columns", () => {
  const file = makeFile({
    originalname: "comments.csv",
    mimetype: "text/csv",
    content: "comment,source\n hello world ,web\n\"bad, text\",upload\n"
  });

  assert.deepEqual(parseUploadedFile(file), ["hello world", "bad, text"]);
});

test("falls back to the first CSV column when no known text column exists", () => {
  const file = makeFile({
    originalname: "comments.CSV",
    content: "body,source\nfirst comment,web\nsecond comment,upload\n"
  });

  assert.deepEqual(parseUploadedFile(file), ["first comment", "second comment"]);
});

test("parses TXT files by trimming blank lines and capping bulk rows", () => {
  const content = Array.from({ length: 205 }, (_, index) => ` line ${index + 1} `).join("\n");
  const file = makeFile({ originalname: "comments.txt", mimetype: "text/plain", content: `\n${content}\n` });
  const rows = parseUploadedFile(file);

  assert.equal(rows.length, 200);
  assert.equal(rows[0], "line 1");
  assert.equal(rows[199], "line 200");
});
