/* NoAtMark invisible watermark engine.
 *
 * Embeds a short payload (e.g. your domain, email, or content ID) into text as
 * invisible zero-width characters, obfuscated with a key. The same invisible
 * chars can be stripped by the scanner/cleaner — "add it, or remove it."
 *
 * Scheme: payload bytes -> XOR with a key-derived byte stream -> each bit as
 * a zero-width char (U+200B = 0, U+200C = 1), prefixed by a start marker.
 *
 * Pure functions, no DOM — reusable from browser, Node, Workers, plugins.
 */

const C0 = "​"; // zero width space  = bit 0
const C1 = "‌"; // zero width non-joiner = bit 1
const MARK = "‍​‍"; // ZWJ ZWSP ZWJ — start marker

/* ---------- payload obfuscation (keyed, deterministic) ---------- */
function keyStream(key, n) {
  // FNV-1a seed, then xorshift32 to produce n pseudo-random bytes
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let x = (h || 1) >>> 0;
  const out = [];
  for (let i = 0; i < n; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    out.push(x & 0xff);
  }
  return out;
}

function obfuscate(bytes, key) {
  const ks = keyStream(key, bytes.length);
  return bytes.map((b, i) => b ^ ks[i]);
}
function deobfuscate(bytes, key) {
  return obfuscate(bytes, key); // XOR is symmetric
}

/* ---------- bytes <-> invisible chars ---------- */
function bytesToInvisible(bytes) {
  let s = "";
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) s += (b >> i) & 1 ? C1 : C0;
  }
  return s;
}
function invisibleToBytes(s) {
  const bytes = [];
  let cur = 0, bits = 0;
  for (const ch of s) {
    if (ch === C0) { cur = (cur << 1); bits++; }
    else if (ch === C1) { cur = (cur << 1) | 1; bits++; }
    else continue;
    if (bits === 8) { bytes.push(cur); cur = 0; bits = 0; }
  }
  return bytes;
}

/* ---------- public API ---------- */
function embed(text, payload, key) {
  if (typeof text !== "string" || !payload) return null;
  const bytes = Array.from(new TextEncoder().encode(payload));
  return text + MARK + bytesToInvisible(obfuscate(bytes, key || "noatmark"));
}

function extract(text, key) {
  if (typeof text !== "string") return null;
  const idx = text.indexOf(MARK);
  if (idx === -1) return null;
  const invis = text.slice(idx + MARK.length);
  const bytes = deobfuscate(invisibleToBytes(invis), key || "noatmark");
  try {
    return new TextDecoder().decode(Uint8Array.from(bytes));
  } catch (e) {
    return null;
  }
}

function verify(text, payload, key) {
  const got = extract(text, key);
  return got === payload;
}

function watermarkLength(payload, key) {
  if (!payload) return 0;
  return MARK.length + bytesToInvisible(obfuscate(Array.from(new TextEncoder().encode(payload)), key || "noatmark")).length;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { embed, extract, verify, watermarkLength, MARK };
}
if (typeof window !== "undefined") {
  window.NoAtMarkWatermark = { embed, extract, verify, watermarkLength, MARK };
}
