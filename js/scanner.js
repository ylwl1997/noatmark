/* NoAtMark scanner engine.
 * Pure functions: classify invisible code points, scan text, clean text.
 * No DOM, no dependencies.
 */

// Named invisible / zero-width characters we care about.
const INVISIBLE_NAMED = [
  { cp: 0x200B, name: "Zero Width Space", short: "ZWSP" },
  { cp: 0x200C, name: "Zero Width Non-Joiner", short: "ZWNJ" },
  { cp: 0x200D, name: "Zero Width Joiner", short: "ZWJ" },
  { cp: 0x2060, name: "Word Joiner", short: "WJ" },
  { cp: 0xFEFF, name: "Zero Width No-Break Space / BOM", short: "BOM" },
  { cp: 0x00AD, name: "Soft Hyphen", short: "SHY" },
  { cp: 0x200E, name: "Left-To-Right Mark", short: "LRM" },
  { cp: 0x200F, name: "Right-To-Left Mark", short: "RLM" },
  { cp: 0x202A, name: "Left-To-Right Embedding", short: "LRE" },
  { cp: 0x202B, name: "Right-To-Left Embedding", short: "RLE" },
  { cp: 0x202C, name: "Pop Directional Formatting", short: "PDF" },
  { cp: 0x202D, name: "Left-To-Right Override", short: "LRO" },
  { cp: 0x202E, name: "Right-To-Left Override", short: "RLO" },
  { cp: 0x2066, name: "Left-To-Right Isolate", short: "LRI" },
  { cp: 0x2067, name: "Right-To-Left Isolate", short: "RLI" },
  { cp: 0x2068, name: "First Strong Isolate", short: "FSI" },
  { cp: 0x2069, name: "Pop Directional Isolate", short: "PDI" },
  { cp: 0xFFFC, name: "Object Replacement Character", short: "ORC" },
  { cp: 0x034F, name: "Combining Grapheme Joiner", short: "CGJ" },
];
const NAMED_MAP = new Map(INVISIBLE_NAMED.map((c) => [c.cp, c]));

// Control characters that are normal formatting (kept by default).
const KEEP_CTRL = new Set([0x09, 0x0A, 0x0D]);

/**
 * Classify a code point.
 * Returns {name, short, group} or null if it's a normal visible character.
 * group: 'zero-width' | 'special-space' | 'control' | 'variation'
 */
function classifyCp(cp) {
  const named = NAMED_MAP.get(cp);
  if (named) return { ...named, group: "zero-width" };
  if (cp >= 0xFE00 && cp <= 0xFE0F)
    return { name: "Variation Selector", short: "VS", group: "variation" };
  if (cp >= 0xE0100 && cp <= 0xE01EF)
    return { name: "Variation Selector (Supplement)", short: "VS", group: "variation" };
  if (cp >= 0x2000 && cp <= 0x200A)
    return { name: "Special Space", short: "SPACE", group: "special-space" };
  if (cp === 0x00A0)
    return { name: "Non-Breaking Space", short: "NBSP", group: "special-space" };
  if ((cp >= 0x0000 && cp <= 0x001F) || (cp >= 0x007F && cp <= 0x009F)) {
    if (KEEP_CTRL.has(cp)) return null;
    return { name: "Control Character", short: "CTRL", group: "control" };
  }
  return null;
}

/**
 * Scan text for invisible characters.
 * Returns { matches: [{cp, char, index, name, short, group}], counts: {group: n}, total }
 */
function scanText(text, options = {}) {
  const matches = [];
  const counts = {};
  let i = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const info = classifyCp(cp);
    if (info) {
      if (options.keepBom && cp === 0xFEFF) { i += ch.length; continue; }
      if (options.keepSpecial && (info.group === "special-space")) { i += ch.length; continue; }
      if (options.keepCtrl && info.group === "control") { i += ch.length; continue; }
      const rec = { cp, char: ch, index: i, ...info };
      matches.push(rec);
      counts[info.group] = (counts[info.group] || 0) + 1;
    }
    i += ch.length;
  }
  return { matches, counts, total: matches.length };
}

/**
 * Remove invisible characters from text, honoring the same options.
 * Returns cleaned string.
 */
function cleanText(text, options = {}) {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const info = classifyCp(cp);
    if (info) {
      if (options.keepBom && cp === 0xFEFF) { out += ch; continue; }
      if (options.keepSpecial && info.group === "special-space") { out += ch; continue; }
      if (options.keepCtrl && info.group === "control") { out += ch; continue; }
      continue; // drop invisible char
    }
    out += ch;
  }
  return out;
}

/** Render an invisible char as a short visible placeholder for the highlight view. */
function charGlyph(rec) {
  // Show a small marker so the (invisible) char is visible in the highlight.
  const labels = { ZWSP: "◌", ZWNJ: "◌", ZWJ: "◌", BOM: "﻿", SHY: "­" };
  return labels[rec.short] || rec.char || "◌";
}

/** Build an HTML string for the highlight view. */
function renderHighlight(text, matches, options = {}) {
  if (!matches.length) return `<span class="empty-note">No invisible characters found. Your text is clean.</span>`;
  let html = "";
  let cursor = 0;
  for (const m of matches) {
    html += esc(text.slice(cursor, m.index));
    const glyph = esc(charGlyph(m));
    html += `<mark class="inv" title="U+${m.cp.toString(16).toUpperCase().padStart(4, "0")} — ${esc(m.name)}">${glyph}</mark>`;
    cursor = m.index + m.char.length;
  }
  html += esc(text.slice(cursor));
  return html;
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { scanText, cleanText, renderHighlight, classifyCp, INVISIBLE_NAMED };
}
if (typeof window !== "undefined") {
  window.scanner = { scanText, cleanText, renderHighlight, classifyCp, INVISIBLE_NAMED };
}
