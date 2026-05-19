const test = require("node:test");
const assert = require("node:assert/strict");
const sanitizeRequest = require("./securityMiddleware");

const runMiddleware = (req) =>
  new Promise((resolve) => {
    sanitizeRequest(req, {}, resolve);
  });

test("removes dangerous keys and trims strings across body, params, and query", async () => {
  const req = {
    body: {
      name: "  Alice\u0000  ",
      $where: "malicious",
      profile: {
        "role.admin": true,
        bio: "  hello  "
      },
      tags: [{ "$ne": "x", value: " safe " }]
    },
    params: { id: "  abc123  " },
    query: { search: "  test  ", "$or": "blocked" }
  };

  await runMiddleware(req);

  assert.deepEqual(req.body, {
    name: "Alice",
    profile: { bio: "hello" },
    tags: [{ value: "safe" }]
  });
  assert.deepEqual(req.params, { id: "abc123" });
  assert.deepEqual(req.query, { search: "test" });
});
