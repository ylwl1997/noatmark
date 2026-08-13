// NoAtMark API shared helpers.
// Reused by every /api/* endpoint.

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-API-Key" },
  });
}

export function error(msg, status = 400) {
  return json({ ok: false, error: msg }, status);
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch (e) {
    return {};
  }
}

export function textOf(body, key = "text") {
  const t = body && body[key];
  return typeof t === "string" ? t : "";
}

export function handleOptions() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-API-Key" } });
}

// Per-IP rate limit backed by the RL KV namespace (bound to the Pages project).
// Returns { limited } — when limited, caller should respond 429.
export async function rateLimit(env, request, { limit = 60, windowSec = 60 } = {}) {
  if (!env || !env.RL) return { limited: false, note: "no-kv" };
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${ip}:${bucket}`;
  const cur = await env.RL.get(key, { type: "json" });
  const count = (cur && cur.count) || 0;
  const next = count + 1;
  await env.RL.put(key, JSON.stringify({ count: next }), { expirationTtl: windowSec + 30 });
  return { limited: next > limit, count: next, limit };
}

// Optional API-key gate. If env.API_KEYS is set (comma-separated), a valid
// X-API-Key header is required. If not set, open access (rate-limited only).
export async function checkApiKey(env, request) {
  const keys = env && env.API_KEYS ? String(env.API_KEYS).split(",").map((k) => k.trim()).filter(Boolean) : [];
  if (!keys.length) return { ok: true };
  const given = request.headers.get("X-API-Key") || "";
  return { ok: keys.includes(given), given };
}
