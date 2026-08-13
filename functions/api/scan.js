// POST /api/scan — hidden characters + prompt injection detection.
import { scanHidden, detectPromptInjection, detectHiddenHtml } from "../../js/engines/scan.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");
  const hidden = scanHidden(text);
  const injections = detectPromptInjection(text);
  const htmlFlags = detectHiddenHtml(text);
  return json({
    ok: true,
    hiddenCount: hidden.total,
    hidden: hidden.matches.slice(0, 50).map((m) => ({ cp: m.cp, name: m.name, group: m.group, index: m.index })),
    injections,
    htmlFlags,
    flagged: hidden.total > 0 || injections.length > 0 || htmlFlags.length > 0,
  });
}

export async function onRequestOptions() {
  return handleOptions();
}
