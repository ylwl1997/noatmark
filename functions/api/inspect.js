// POST /api/inspect — pre-publish inspection report (GEO score + fixes).
import { inspectArticle } from "../../js/engines/inspect.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");
  const r = inspectArticle(text);
  return json({
    ok: true,
    geoScore: r.geoScore,
    words: r.words,
    hiddenCount: r.hiddenTotal,
    injectionCount: r.injectionCount,
    scores: Object.fromEntries(Object.entries(r.scores).map(([k, v]) => [k, { score: v.score, reasons: v.reasons }])),
    recommendations: r.recommendations,
    cleanedText: r.cleanedText,
    changed: r.changed,
  });
}

export async function onRequestOptions() {
  return handleOptions();
}
