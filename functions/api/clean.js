// POST /api/clean — strip invisible characters + clean LLM formatting.
import { cleanLLMText } from "../../js/engines/clean.js";
import { stripInvisible } from "../../js/engines/scan.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");
  const clean = cleanLLMText(text);
  const cleaned = stripInvisible(clean.cleaned);
  return json({ ok: true, cleaned, changed: cleaned !== text, stats: clean.stats });
}

export async function onRequestOptions() {
  return handleOptions();
}
