// POST /api/watermark — embed / extract / verify an invisible keyed watermark.
import { embed, extract, verify } from "../../js/engines/watermark.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const action = textOf(body, "action") || "embed";
  const key = textOf(body, "key");
  const text = textOf(body);

  if (action === "embed") {
    const payload = textOf(body, "payload");
    if (!text || !payload) return error("text and payload are required for embed");
    const watermarked = embed(text, payload, key || "noatmark");
    return json({ ok: true, watermarked, added: watermarked.length - text.length });
  }

  if (action === "extract") {
    if (!text) return error("text is required for extract");
    const payload = extract(text, key || "noatmark");
    return json({ ok: true, payload, found: payload !== null });
  }

  if (action === "verify") {
    const expected = textOf(body, "payload");
    if (!text || !expected) return error("text and payload are required for verify");
    const ok = verify(text, expected, key || "noatmark");
    return json({ ok, verified: ok, extracted: extract(text, key || "noatmark") });
  }

  return error("unknown action (embed | extract | verify)");
}

export async function onRequestOptions() {
  return handleOptions();
}
