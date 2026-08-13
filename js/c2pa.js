/* NoAtMark C2PA verifier — client-side heuristic scan for Content Credentials.
 *
 * Honest scope: this DETECTS the presence of C2PA / Content Credentials
 * markers in a file's bytes. It is NOT a full cryptographic verification
 * (use verify.contentauthenticity.org or c2patool for that). It also cannot
 * prove absence: "no C2PA found" does not mean human-made — metadata may have
 * been stripped by a re-encode, screenshot, or CDN.
 *
 * Runs entirely in the browser. No upload.
 */

/* ---------- file type sniffing ---------- */
function sniffType(bytes) {
  const len = bytes.length;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (len > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "PNG";
  }
  // JPEG: FF D8 FF
  if (len > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "JPEG";
  }
  // WEBP: RIFF .... WEBP
  if (len > 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return "WEBP";
  }
  // SVG / XML text
  const head = ascii(bytes, 0, Math.min(256, len)).toLowerCase();
  if (head.includes("<svg") || head.startsWith("<?xml")) {
    return "SVG";
  }
  return "UNKNOWN";
}

function ascii(bytes, from, n) {
  let s = "";
  for (let i = from; i < from + n && i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/* ---------- byte search (returns first index or -1) ---------- */
function indexOfBytes(haystack, needle) {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/* ---------- PNG chunk parsing ---------- */
function pngC2paMarkers(bytes) {
  const markers = [];
  let off = 8; // skip signature
  const len = bytes.length;
  while (off + 8 <= len) {
    const size = (bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3];
    const type = ascii(bytes, off + 4, 4);
    const dataStart = off + 8;
    const dataEnd = dataStart + size;
    if (dataEnd > len) break;

    if (type === "iTXt" || type === "tEXt" || type === "zTXt") {
      const keyword = ascii(bytes, dataStart, 32).split("\0")[0] || "";
      if (keyword.toLowerCase() === "c2pa" || keyword.toLowerCase().includes("c2pa")) {
        let ref = "";
        // iTXt: keyword\0 compFlag compMethod lang\0 transKeyword\0 text...
        if (type === "iTXt") {
          let p = dataStart + keyword.length + 1;
          if (p + 2 <= dataEnd) { p += 2; } // compression flag + method
          // skip language tag and translated keyword (null terminated)
          while (p < dataEnd && bytes[p] !== 0) p++;
          p++;
          while (p < dataEnd && bytes[p] !== 0) p++;
          p++;
          ref = ascii(bytes, p, Math.min(160, dataEnd - p));
        } else {
          ref = ascii(bytes, dataStart + keyword.length + 1, Math.min(160, dataEnd - dataStart - keyword.length - 1));
        }
        markers.push({ type: "PNG metadata chunk", detail: `"${keyword}" → ${ref || "(inline)"}` });
      }
    }

    if (type === "IEND") break;
    off = dataEnd + 4; // + CRC
  }
  return markers;
}

/* ---------- generic byte-marker scan (JPEG / WEBP / SVG / UNKNOWN) ---------- */
function byteMarkers(bytes) {
  const markers = [];
  const sigs = [
    { name: "C2PA manifest reference", needle: strBytes("c2pa") },
    { name: "Content Credentials (name)", needle: strBytes("contentcredentials") },
    { name: "C2PA namespace (org)", needle: strBytes("c2pa.org") },
    { name: "JUMBF (JPEG universal metadata)", needle: strBytes("jumb") },
  ];
  for (const s of sigs) {
    if (indexOfBytes(bytes, s.needle) !== -1) markers.push({ type: s.name });
  }
  return markers;
}

function strBytes(s) {
  return Array.from(s, (c) => c.charCodeAt(0));
}

/* ---------- main entry ---------- */
function verifyFile(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const fileType = sniffType(bytes);
  let markers = [];

  if (fileType === "PNG") {
    markers = pngC2paMarkers(bytes);
  } else {
    markers = byteMarkers(bytes);
  }

  // For text formats (SVG), also catch the marker string directly.
  if (fileType === "SVG" && markers.length === 0) {
    markers = byteMarkers(bytes);
  }

  return {
    fileType,
    found: markers.length > 0,
    markers,
    sizeBytes: bytes.length,
    note:
      markers.length
        ? "C2PA / Content Credentials markers detected. Verify the signature officially with verify.contentauthenticity.org or c2patool."
        : "No C2PA markers detected. This is NOT proof of human authorship — metadata may have been stripped by re-encoding, screenshots, or CDNs.",
  };
}

if (typeof window !== "undefined") {
  window.C2paVerify = { verifyFile, sniffType };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { verifyFile, sniffType };
}
