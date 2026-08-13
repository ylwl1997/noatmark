/* NoAtMark plain-text extractor engine — rich text / HTML -> clean plain text.
 *
 * Strips tags and styling, decodes entities, and maps block elements to line
 * breaks. Regex-based so it runs in browser, Node, and Workers alike (no DOM
 * dependency). Good for pasting rich text into editors, CMS fields, email, etc.
 *
 * Pure functions, no DOM.
 */

const BLOCK_TAGS = "address|article|aside|blockquote|br|div|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|th|thead|tr|ul";

function decodeEntities(s) {
  const named = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'",
    "&#x27;": "'", "&apos;": "'", "&nbsp;": " ", "&ensp;": " ", "&emsp;": " ",
    "&ndash;": "–", "&mdash;": "—", "&hellip;": "…", "&middot;": "·", "&copy;": "©",
  };
  s = s.replace(/&(amp|lt|gt|quot|#39|#x27|apos|nbsp|ensp|emsp|ndash|mdash|hellip|middot|copy);/gi,
    (m) => named[m.toLowerCase()] || m);
  s = s.replace(/&#(\d+);/g, (m, d) => {
    const cp = parseInt(d, 10);
    return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
  });
  s = s.replace(/&#x([0-9a-f]+);/gi, (m, h) => {
    const cp = parseInt(h, 16);
    return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
  });
  return s;
}

function htmlToText(html) {
  let s = String(html);
  // drop non-content blocks
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  // block elements -> line breaks (keep table cell separation)
  s = s.replace(new RegExp("</(" + BLOCK_TAGS + ")>", "gi"), "\n");
  s = s.replace(new RegExp("<(" + BLOCK_TAGS + ")[^>]*>", "gi"), "\n");
  // remaining tags stripped
  s = s.replace(/<[^>]+>/g, "");
  // entities
  s = decodeEntities(s);
  // clean whitespace
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  // dedent
  const lines = s.split("\n").map((l) => l.trim());
  s = lines.join("\n").trim();
  return s;
}

function htmlToTextOptions(html, opts) {
  const base = htmlToText(html);
  if (opts && opts.singleLine) return base.replace(/\n+/g, " ");
  return base;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { htmlToText, htmlToTextOptions, decodeEntities };
}
if (typeof window !== "undefined") {
  window.NoAtMarkPlain = { htmlToText, htmlToTextOptions, decodeEntities };
}
