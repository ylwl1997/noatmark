/* NoAtMark scan engine — hidden characters + prompt-injection signals.
 *
 * Reusable pure functions (browser / Node / Workers). The scanner tool, the
 * prompt-injection checker, and the pre-publish inspector all share these.
 */

/* ---------- invisible / suspicious character classes ---------- */
const INVISIBLE = [
  { cp: 0x200b, name: "Zero Width Space", short: "ZWSP" },
  { cp: 0x200c, name: "Zero Width Non-Joiner", short: "ZWNJ" },
  { cp: 0x200d, name: "Zero Width Joiner", short: "ZWJ" },
  { cp: 0x2060, name: "Word Joiner", short: "WJ" },
  { cp: 0xfeff, name: "Zero Width No-Break Space / BOM", short: "BOM" },
  { cp: 0x00ad, name: "Soft Hyphen", short: "SHY" },
  { cp: 0x200e, name: "Left-To-Right Mark", short: "LRM" },
  { cp: 0x200f, name: "Right-To-Left Mark", short: "RLM" },
  { cp: 0x034f, name: "Combining Grapheme Joiner", short: "CGJ" },
];
const NAMED = new Map(INVISIBLE.map((c) => [c.cp, c]));

function classify(cp) {
  if (NAMED.has(cp)) return { ...NAMED.get(cp), group: "invisible" };
  if (cp >= 0xfe00 && cp <= 0xfe0f) return { name: "Variation Selector", short: "VS", group: "variation" };
  if (cp >= 0xe0100 && cp <= 0xe01ef) return { name: "Variation Selector (Sup)", short: "VS", group: "variation" };
  if (cp >= 0x2000 && cp <= 0x200a) return { name: "Special Space", short: "SPACE", group: "space" };
  if (cp === 0x00a0) return { name: "Non-Breaking Space", short: "NBSP", group: "space" };
  return null;
}

/** Scan text for invisible/suspicious characters. */
function scanHidden(text) {
  const matches = [];
  const counts = {};
  let idx = 0;
  for (const ch of text) {
    const info = classify(ch.codePointAt(0));
    if (info) {
      matches.push({ cp: ch.codePointAt(0), char: ch, index: idx, ...info });
      counts[info.group] = (counts[info.group] || 0) + 1;
    }
    idx += ch.length;
  }
  return { matches, counts, total: matches.length };
}

/** Remove invisible characters (keeps visible text). */
function stripInvisible(text) {
  let out = "";
  for (const ch of text) {
    if (!classify(ch.codePointAt(0))) out += ch;
  }
  return out;
}

/* ---------- prompt injection heuristics ---------- */
const INJECTION_PATTERNS = [
  { re: /\bignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|text|content)\b/i, name: "ignore-previous-instructions" },
  { re: /\b(disregard|forget|override)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)\b/i, name: "override-prior-instructions" },
  { re: /\byou\s+are\s+now\s+(an?\s+)?(unfiltered|unrestricted|jailbroken|developer|administrator|superuser|revealing)\b/i, name: "role-jailbreak" },
  { re: /\breveal\s+(your\s+)?(system\s+)?prompt\b/i, name: "prompt-exfiltration" },
  { re: /\boutput\s+(your\s+)?(system\s+)?prompt\b/i, name: "prompt-exfiltration" },
  { re: /\bsay\s+.*\bignore\b/i, name: "injection-directive" },
  { re: /<\|?im_start\||<\|?im_end\||<\s*(system|user|assistant)\s*>/i, name: "marker-spoof" },
  { re: /\b(\*){2,}|\b(###)+\b\s*(system|user|assistant|developer)\b/i, name: "role-spoof" },
];
function detectPromptInjection(text) {
  const hits = [];
  for (const p of INJECTION_PATTERNS) {
    if (p.re.test(text)) hits.push(p.name);
  }
  return hits;
}

/* ---------- white-on-white / hidden-text signals in HTML ---------- */
function detectHiddenHtml(html) {
  const flags = [];
  if (/color\s*:\s*(white|#fff(fff)?|#f[0-9a-f]{5}|rgb\(255,\s*255,\s*255\))/i.test(html)) flags.push("white-text");
  if (/opacity\s*:\s*0/i.test(html)) flags.push("zero-opacity");
  if (/font-size\s*:\s*0/i.test(html)) flags.push("zero-font-size");
  if (/display\s*:\s*none/i.test(html)) flags.push("display-none");
  if (/z-index\s*:\s*-?1/i.test(html)) flags.push("negative-z-index");
  if (/position\s*:\s*absolute/i.test(html) && /left\s*:\s*-?\d{2,}/i.test(html)) flags.push("off-screen");
  return flags;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { scanHidden, stripInvisible, detectPromptInjection, detectHiddenHtml, classify, INVISIBLE };
}
if (typeof window !== "undefined") {
  window.NoAtMarkScan = { scanHidden, stripInvisible, detectPromptInjection, detectHiddenHtml, classify, INVISIBLE };
}
