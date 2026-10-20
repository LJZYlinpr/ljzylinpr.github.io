export async function hashIP(ip, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hash = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim());
    if (!origin || !allowed.includes(origin))
      return new Response("Forbidden", { status: 403 });
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "private, no-store",
      Vary: "Origin",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    };
    const reply = (data, status = 200) =>
      Response.json(data, { status, headers });
    if (new URL(request.url).pathname !== "/api/visit")
      return reply({ error: "Not found" }, 404);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST")
      return reply({ error: "Method not allowed" }, 405);
    if (!env.DB || !env.IP_HASH_SECRET || env.IP_HASH_SECRET.length < 32)
      return reply({ error: "Service not configured" }, 503);
    if (!request.headers.get("Content-Type")?.startsWith("application/json"))
      return reply({ error: "Expected JSON" }, 415);
    let body;
    try {
      // Limit the stream before parsing, including requests without Content-Length.
      const reader = request.body?.getReader();
      if (!reader) return reply({ error: "Missing body" }, 400);
      let bytes = 0,
        value = "";
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 1024) {
          await reader.cancel();
          return reply({ error: "Body too large" }, 413);
        }
        value += decoder.decode(chunk.value, { stream: true });
      }
      body = JSON.parse(value + decoder.decode());
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new Error("Invalid body");
    } catch {
      return reply({ error: "Invalid JSON" }, 400);
    }
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip) return reply({ error: "Network information unavailable" }, 503);
    const country = /^[A-Z]{2}$/.test(request.cf?.country || "")
      ? request.cf.country
      : "XX";
    const optOut =
      body.optOut === true ||
      request.headers.get("DNT") === "1" ||
      request.headers.get("Sec-GPC") === "1";
    try {
      const statements = [];
      if (!optOut) {
        const id = await hashIP(ip, env.IP_HASH_SECRET);
        const now = Math.floor(Date.now() / 1000);
        // Atomic upsert: refreshes from the same network within 30 minutes count once.
        statements.push(
          env.DB.prepare(
            `INSERT INTO visitors (id, country, views, last_seen) VALUES (?, ?, 1, ?)
          ON CONFLICT(id) DO UPDATE SET views = visitors.views + 1, last_seen = excluded.last_seen
          WHERE visitors.last_seen <= excluded.last_seen - 1800`,
          ).bind(id, country, now),
        );
      }
      statements.push(
        env.DB.prepare(
          "SELECT COALESCE(SUM(views), 0) AS views, COUNT(*) AS unique_count, COUNT(DISTINCT CASE WHEN country != 'XX' THEN country END) AS countries FROM visitors",
        ),
      );
      statements.push(
        env.DB.prepare(
          "SELECT country, COUNT(*) AS count FROM visitors WHERE country != 'XX' GROUP BY country ORDER BY count DESC, country LIMIT 8",
        ),
      );
      const results = await env.DB.batch(statements);
      const stats = results[results.length - 2].results[0];
      return reply({
        views: stats.views,
        unique: stats.unique_count,
        countries: stats.countries,
        regions: results[results.length - 1].results,
        visitor: {
          ip,
          country: country === "XX" ? null : country,
          city: request.cf?.city || null,
        },
      });
    } catch {
      return reply({ error: "Statistics temporarily unavailable" }, 503);
    }
  },
};
