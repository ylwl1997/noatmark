// Applies to every /api/* request: rate limit + optional API-key gate.
import { rateLimit, checkApiKey } from "./_lib.js";

export async function onRequest(context) {
  // OPTIONS preflight always passes
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-API-Key" } });
  }

  const key = await checkApiKey(context.env, context.request);
  if (!key.ok) {
    return new Response(JSON.stringify({ ok: false, error: "invalid or missing X-API-Key" }), {
      status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const rl = await rateLimit(context.env, context.request);
  if (rl.limited) {
    return new Response(JSON.stringify({ ok: false, error: "rate limit exceeded", limit: rl.limit, count: rl.count }), {
      status: 429, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Retry-After": "60" },
    });
  }

  return context.next();
}
