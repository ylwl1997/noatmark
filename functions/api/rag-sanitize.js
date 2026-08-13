// POST /api/rag-sanitize — sanitize untrusted text before it enters an LLM / RAG pipeline.
// Strips invisible characters (embedding corruption) and flags prompt-injection
// patterns + hidden-HTML signals (indirect injection). Injection risks are FLAGGED,
// not auto-deleted (removing natural-language injection would corrupt content).
import { stripInvisible, detectPromptInjection, detectHiddenHtml } from "../../js/engines/scan.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");

  const sanitized = stripInvisible(text);
  const removedInvisible = text.length - sanitized.length;
  const injectionRisks = detectPromptInjection(text);
  const hiddenHtmlSignals = detectHiddenHtml(text);

  return json({
    ok: true,
    sanitized,
    removedInvisible,
    injectionRisks,
    hiddenHtmlSignals,
    needsReview: injectionRisks.length > 0 || hiddenHtmlSignals.length > 0,
  });
}

export async function onRequestOptions() {
  return handleOptions();
}
