import test from "node:test";
import assert from "node:assert/strict";
import worker, { hashIP } from "../src/index.js";

const env = {
  ALLOWED_ORIGINS: "http://localhost:4000",
  IP_HASH_SECRET: "test-only-secret-32-characters-long",
};
const request = (body = {}, headers = {}, method = "POST") => {
  const req = new Request("https://visitors.example/api/visit", {
    method,
    headers: {
      Origin: "http://localhost:4000",
      "Content-Type": "application/json",
      "CF-Connecting-IP": "203.0.113.1",
      ...headers,
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  req.cf = { country: "CN", city: "Hangzhou" };
  return req;
};
test("keyed hashes are deterministic and do not expose IPs", async () => {
  const hash = await hashIP("203.0.113.1", env.IP_HASH_SECRET);
  assert.equal(hash.length, 64);
  assert.equal(hash, await hashIP("203.0.113.1", env.IP_HASH_SECRET));
  assert.notEqual(hash, await hashIP("203.0.113.1", "different-secret"));
});
test("rejects unauthorized origins and supports preflight", async () => {
  assert.equal(
    (await worker.fetch(request({}, { Origin: "https://evil.example" }), env))
      .status,
    403,
  );
  const response = await worker.fetch(request({}, {}, "OPTIONS"), env);
  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    "http://localhost:4000",
  );
});
test("fails clearly when backend is unconfigured", async () => {
  assert.equal((await worker.fetch(request(), env)).status, 503);
});
for (const privacy of ["body", "DNT", "Sec-GPC", "none"]) {
  test(`privacy ${privacy}: writes only when counting is enabled`, async () => {
    let writes = 0;
    const DB = {
      prepare(sql) {
        return {
          sql,
          bind(...args) {
            assert.ok(!args.includes("203.0.113.1"));
            return this;
          },
        };
      },
      async batch(statements) {
        writes = statements.filter((s) => s.sql.includes("INSERT INTO")).length;
        return [
          ...(writes ? [{ results: [] }] : []),
          { results: [{ views: 3, unique_count: 2, countries: 1 }] },
          { results: [{ country: "CN", count: 2 }] },
        ];
      },
    };
    const response = await worker.fetch(
      request(
        privacy === "body" ? { optOut: true } : {},
        ["DNT", "Sec-GPC"].includes(privacy) ? { [privacy]: "1" } : {},
      ),
      { ...env, DB },
    );
    assert.equal(response.status, 200);
    assert.equal(writes, privacy === "none" ? 1 : 0);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    const data = await response.json();
    assert.equal(data.visitor.ip, "203.0.113.1");
    assert.equal(data.unique, 2);
  });
}
test("database errors return a safe unavailable response", async () => {
  const DB = {
    prepare() {
      throw new Error("private database information");
    },
  };
  const response = await worker.fetch(request(), { ...env, DB });
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private database/);
});
test("oversized bodies are rejected", async () => {
  assert.equal(
    (
      await worker.fetch(request({ text: "x".repeat(1100) }), {
        ...env,
        DB: {},
      })
    ).status,
    413,
  );
});
