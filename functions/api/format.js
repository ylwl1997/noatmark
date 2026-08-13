// POST /api/format — LLM formatting hygiene (formatting-only, meaning untouched).
import { cleanLLMText } from "../../js/engines/clean.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");
  const r = cleanLLMText(text);
  return json({ ok: true, cleaned: r.cleaned, changed: r.changed, stats: r.stats });
}

export async function onRequestOptions() {
  return handleOptions();
}
