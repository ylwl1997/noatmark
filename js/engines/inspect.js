/* NoAtMark Pre-Publish Inspector engine.
 *
 * Combines the scan/clean engines with a transparent GEO (Generative Engine
 * Optimization) scoring model. Scores are explainable rules, not a black box:
 * each sub-score lists exactly why it is what it is.
 *
 * Pure functions; reuses window.NoAtMarkScan / NoAtMarkClean in the browser,
 * or requires ./scan.js ./clean.js in Node / Workers.
 */

function getScan() {
  if (typeof window !== "undefined" && window.NoAtMarkScan) return window.NoAtMarkScan;
  return require("./scan.js");
}
function getClean() {
  if (typeof window !== "undefined" && window.NoAtMarkClean) return window.NoAtMarkClean;
  return require("./clean.js");
}

/* ---------- low-level metrics ---------- */
function countWords(text) {
  const t = String(text).replace(/[#*_`>|~-]/g, " ").replace(/[^\w\s'-]/g, " ").trim();
  return t ? t.split(/\s+/).length : 0;
}
function headingLevels(text) {
  return [...String(text).matchAll(/^#{1,6}\s+/gm)].map((m) => m[0].length - 1);
}
function splitParagraphs(text) {
  return String(text).split(/\n{2,}/).map((p) => p.trim().replace(/^#{1,6}\s+/, "")).filter(Boolean);
}
function hasLists(text) {
  return /(^|\n)\s*[-*+]\s+|\d+[.)]\s+/m.test(String(text));
}
function capsRuns(text) {
  return (String(text).match(/\b[A-Z]{8,}\b/g) || []).length;
}
function repetitionHits(text) {
  const words = countWords(text);
  if (!words) return 0;
  const freq = {};
  String(text).toLowerCase().replace(/[a-z']+/g, (w) => { freq[w] = (freq[w] || 0) + 1; });
  let hits = 0;
  for (const [w, c] of Object.entries(freq)) {
    if (w.length < 4) continue;
    if (c >= Math.max(8, words * 0.12)) hits++;
  }
  return hits;
}

/* ---------- sub-scores (0-100 each) ---------- */
function scoreStructure(levels) {
  const reasons = [];
  if (levels.length === 0) { reasons.push("no headings found"); return { score: 20, reasons }; }
  let score = 60;
  const used = new Set(levels);
  if (used.has(2)) score += 15;
  if (used.has(3)) score += 10;
  if (used.size >= 3) score += 10;
  let jumps = 0;
  for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) jumps++;
  if (jumps > 1) { score -= 15; reasons.push(jumps + " heading-level jumps"); }
  if (!used.has(2) && !used.has(3)) reasons.push("only " + (used.has(1) ? "H1" : "H" + [...used][0]) + " — consider H2/H3 sub-sections");
  else reasons.push(levels.length + " headings");
  return { score: clamp(score), reasons };
}

function scoreScannability(text) {
  const reasons = [];
  let score = 50;
  if (hasLists(text)) { score += 30; reasons.push("lists present (good for AI engines)"); }
  else reasons.push("no lists — add bullets where it fits");
  const paras = splitParagraphs(text);
  if (paras.length) {
    const lens = paras.map((p) => countWords(p));
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    const tooLong = lens.filter((l) => l > 180).length;
    if (avg > 140) { score -= 15; reasons.push("paragraphs average " + Math.round(avg) + " words — split long ones"); }
    else reasons.push("paragraphs average " + Math.round(avg) + " words");
    if (tooLong) score -= Math.min(15, tooLong * 5);
  } else {
    reasons.push("no paragraphs detected");
  }
  return { score: clamp(score), reasons };
}

function scoreLength(words) {
  if (words < 120) return { score: 15, reasons: ["short (" + words + " words) — AI engines favor substantive content"] };
  if (words < 300) return { score: 45, reasons: [words + " words — a solid start"] };
  if (words < 800) return { score: 75, reasons: [words + " words"] };
  return { score: 100, reasons: [words + " words — strong depth"] };
}

function scoreClarity(text) {
  let score = 100;
  const reasons = [];
  const caps = capsRuns(text);
  const rep = repetitionHits(text);
  if (caps) { score -= caps * 10; reasons.push(caps + " ALL-CAPS run" + (caps > 1 ? "s" : "")); }
  if (rep) { score -= rep * 15; reasons.push(rep + " heavily repeated term" + (rep > 1 ? "s" : "")); }
  if (!caps && !rep) reasons.push("clear, varied writing");
  return { score: clamp(score), reasons };
}

function scorePollution(hidden, injections, deepHeadings) {
  let score = 100;
  const reasons = [];
  if (hidden.total) { score -= Math.min(60, hidden.total * 5); reasons.push(hidden.total + " invisible characters — spam-risk signal"); }
  if (injections.length) { score -= injections.length * 30; reasons.push(injections.length + " prompt-injection pattern(s)"); }
  if (deepHeadings) { score -= Math.min(20, deepHeadings * 8); reasons.push(deepHeadings + " over-deep heading(s)"); }
  if (score === 100) reasons.push("no pollution detected");
  return { score: clamp(score), reasons };
}

function clamp(n) { return Math.max(0, Math.min(100, Math.round(n))); }

/* ---------- main entry ---------- */
function inspectArticle(text) {
  const sc = getScan(), cl = getClean();
  const t = String(text || "");

  const hidden = sc.scanHidden(t);
  const injections = sc.detectPromptInjection(t);
  const levels = headingLevels(t);
  const deepHeadings = levels.filter((l) => l > 3).length;
  const words = countWords(t);

  const S = {
    structure: scoreStructure(levels),
    scannability: scoreScannability(t),
    length: scoreLength(words),
    clarity: scoreClarity(t),
    pollution: scorePollution(hidden, injections, deepHeadings),
  };
  const geoScore = clamp(
    S.structure.score * 0.25 + S.scannability.score * 0.2 +
    S.length.score * 0.15 + S.clarity.score * 0.15 + S.pollution.score * 0.25
  );

  // recommendations
  const rec = [];
  if (levels.length === 0) rec.push("Add clear H2/H3 headings to structure the article.");
  else if (!new Set(levels).has(2)) rec.push("Use H2 sub-headings to break the article into sections.");
  if (!hasLists(t)) rec.push("Add bullets or numbered lists where it fits — AI engines reward scannable content.");
  splitParagraphs(t).forEach((p) => { if (countWords(p) > 180) rec.push("Split a " + countWords(p) + "-word paragraph for readability."); });
  if (hidden.total) rec.push("Strip " + hidden.total + " invisible character(s) with the zero-width remover.");
  if (injections.length) rec.push("Review flagged prompt-injection patterns before publishing.");
  if (deepHeadings) rec.push("Lower " + deepHeadings + " heading(s) beyond H3 to keep hierarchy clean.");
  if (capsRuns(t)) rec.push("Replace ALL-CAPS phrases with normal case.");
  if (repetitionHits(t)) rec.push("Reduce repeated terms for cleaner reading.");
  if (words < 300) rec.push("Add more substance — 300+ words is a stronger target for AI search.");

  // one-click cleaned text (formatting + invisible chars, meaning untouched)
  const formatted = cl.cleanLLMText(t).cleaned;
  const cleanedText = sc.stripInvisible(formatted);

  return {
    words,
    hiddenTotal: hidden.total,
    injectionCount: injections.length,
    scores: S,
    geoScore,
    recommendations: rec,
    cleanedText,
    changed: cleanedText !== t,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { inspectArticle, countWords, headingLevels };
}
if (typeof window !== "undefined") {
  window.NoAtMarkInspect = { inspectArticle };
}
