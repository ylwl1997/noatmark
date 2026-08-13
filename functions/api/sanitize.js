// POST /api/sanitize — clean text before feeding it to an LLM.
// Strips invisible/zero-width characters and flags prompt-injection patterns.
// Injection risks are FLAGGED, not auto-deleted (removing natural-language
// injection would corrupt legitimate content).
import { scanHidden, stripInvisible, detectPromptInjection, detectHiddenHtml } from "../../js/engines/scan.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");

  const cleaned = stripInvisible(text);
  const removed = text.length - cleaned.length;
  const injections = detectPromptInjection(text);
  const htmlFlags = detectHiddenHtml(text);

  return json({
    ok: true,
    cleaned,
    removedInvisible: removed,
    injectionRisks: injections,
    hiddenHtmlSignals: htmlFlags,
    needsReview: injections.length > 0 || htmlFlags.length > 0,
  });
}

export async function onRequestOptions() {
  return handleOptions();
}
