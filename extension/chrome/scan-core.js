// NoAtMark scan core - compact invisible-character detection/cleaning.
// Shared by content script and popup (self-contained, no dependencies).
(function (global) {
  "use strict";

  // invisible code points to strip: zero-width chars/joiners, word joiner, BOM,
  // soft hyphen, direction marks, combining grapheme joiner, NBSP, variation
  // selectors (+ supplement), special spaces. Built from numbers so no literal
  // invisible characters ever appear in this source.
  var PTS = [0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF, 0x00AD, 0x200E, 0x200F, 0x034F, 0x00A0];
  var RANGES = [[0xFE00, 0xFE0F], [0xE0100, 0xE01EF], [0x2000, 0x200A]];

  function classBody() {
    var s = "";
    PTS.forEach(function (cp) { s += "\\u{" + cp.toString(16) + "}"; });
    RANGES.forEach(function (r) { s += "\\u{" + r[0].toString(16) + "}-\\u{" + r[1].toString(16) + "}"; });
    return s;
  }
  var INVISIBLE_RX = new RegExp("[" + classBody() + "]", "gu");

  function scanHidden(text) {
    var m = String(text || "").match(INVISIBLE_RX);
    return m ? m.length : 0;
  }
  function stripInvisible(text) {
    return String(text || "").replace(INVISIBLE_RX, "");
  }

  var api = { scanHidden: scanHidden, stripInvisible: stripInvisible };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NoAtMarkExt = api;
})(typeof self !== "undefined" ? self : globalThis);
