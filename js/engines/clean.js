/* NoAtMark text cleaning engine — LLM formatting hygiene.
 *
 * Removes the formatting *artifacts* LLM output carries: stray code fences,
 * excess blank lines, trailing spaces, repeated heading hashes, empty list
 * markers, and irregular whitespace. It does NOT rewrite content or meaning.
 *
 * Pure functions, no DOM — reusable in browser, Node, Workers, plugins.
 */

function normalizeNewlines(text) {
  return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function collapseBlankLines(text, max = 2) {
  // collapse runs of N+ blank lines down to `max`
  const re = new RegExp("\\n{" + (max + 1) + ",}", "g");
  return text.replace(re, "\n".repeat(max));
}

function stripTrailingWhitespace(text) {
  return text.replace(/[ \t]+$/gm, "");
}

function collapseSpaces(text) {
  // multiple spaces/tabs on a line -> one space (don't touch leading indent meaningfully)
  return text.replace(/[ \t]{2,}/g, " ");
}

function fixPunctuationSpacing(text) {
  return text
    .replace(/[ \t]+([,.;:!?])/g, "$1") // space before punctuation
    .replace(/([（(])\s+/g, "$1")      // space after opening bracket
    .replace(/\s+([）)])/g, "$1");     // space before closing bracket
}

function normalizeHeadingHashes(text) {
  // #### -> ### (LLMs rarely need >3 levels)
  return text.replace(/^(\s*)(#{4,})(\s*)/gm, "$1###$3");
}

function removeEmptyListMarkers(text) {
  return text
    .replace(/^\s*[-*]\s*$/gm, "")   // bare "-" or "*" line
    .replace(/^\s*\d+[.)]\s*$/gm, ""); // bare "1." or "1)" line
}

function removeStrayCodeFences(text) {
  // A fence is a line of ``` or ~~~ with optional language tag.
  const fence = /^(\s*)(```|~~~)(\s*[a-z0-9_+.-]*\s*)$/gm;
  const lines = text.split("\n");
  let open = false;
  for (let i = 0; i < lines.length; i++) {
    if (fence.test(lines[i])) {
      if (!open) { open = true; }
      else { open = false; lines[i] = ""; }
    }
  }
  return lines.join("\n");
}

/**
 * One-pass "clean LLM output" formatting pass.
 * Returns { cleaned, stats } where stats count what was fixed.
 */
function cleanLLMText(input) {
  let t = normalizeNewlines(input);
  const stats = { blankLines: 0, trailingSpaces: 0, spaces: 0, fences: 0, headings: 0 };

  const before = t;
  t = collapseBlankLines(t, 2);
  stats.blankLines = (before.match(/\n{3,}/g) || []).length;

  const t0 = t;
  t = stripTrailingWhitespace(t);
  stats.trailingSpaces = (t0.match(/[ \t]+$/gm) || []).length;

  t = collapseSpaces(t);
  t = fixPunctuationSpacing(t);

  const h0 = t;
  t = normalizeHeadingHashes(t);
  stats.headings = (h0.match(/^#{4,}/gm) || []).length;

  t = removeEmptyListMarkers(t);
  t = removeStrayCodeFences(t);
  // NOTE: no blanket "strip symbol runs" step here — it destroyed legitimate
  // Markdown (e.g. ## headings, **bold**), making cleaned text *lose* structure.
  // Formatting hygiene must not strip structural markup.

  // final tidy
  t = t.replace(/[ \t]+\n/g, "\n");
  t = collapseBlankLines(t, 2);
  t = t.trim() + (/\n$/.test(before.trim()) ? "" : "");

  return { cleaned: t, stats, changed: t !== input };
}

/** Collapse all blank lines (single spacing) — useful for plain-text cleanup. */
function singleSpace(text) {
  return normalizeNewlines(text).replace(/\n{3,}/g, "\n\n").trim();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { cleanLLMText, singleSpace, normalizeNewlines, collapseBlankLines, stripTrailingWhitespace, collapseSpaces, normalizeHeadingHashes, removeEmptyListMarkers, removeStrayCodeFences };
}
if (typeof window !== "undefined") {
  window.NoAtMarkClean = { cleanLLMText, singleSpace, normalizeNewlines, collapseBlankLines, stripTrailingWhitespace, collapseSpaces, normalizeHeadingHashes, removeEmptyListMarkers, removeStrayCodeFences };
}
