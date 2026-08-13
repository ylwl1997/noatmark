/* NoAtMark file cleaner — scan first, then clean, with feedback.
 *
 * Phase 1 scanFile: report what pollution a file contains (invisible chars by
 * type, formatting issues) WITHOUT modifying anything.
 * Phase 2 cleanFile: user-triggered cleaning, returns a summary of what was
 * removed.
 *
 * Reuses scan/clean/plaintext engines. All client-side. Formats: txt, md,
 * html, csv, json, rtf, docx (via JSZip).
 */
(function (global) {
  "use strict";

  function engine(name) {
    var g = typeof self !== "undefined" ? self : globalThis;
    return g[name] || (g.window && g.window[name]) || null;
  }
  function getScan() { return engine("NoAtMarkScan"); }
  function getClean() { return engine("NoAtMarkClean"); }
  function getPlain() { return engine("NoAtMarkPlain"); }

  var EXT_MAP = { txt: "txt", md: "md", markdown: "md", html: "html", htm: "html",
                  csv: "csv", json: "json", docx: "docx", rtf: "rtf" };

  function detectFormat(name) {
    var ext = String(name || "").split(".").pop().toLowerCase();
    return EXT_MAP[ext] || "txt";
  }

  function isFormattingFormat(fmt) {
    return fmt !== "csv" && fmt !== "json" && fmt !== "rtf";
  }

  /** Phase 1: scan text content, return what's wrong. Nothing is modified. */
  function scanTextContent(text, format) {
    var sc = getScan(), cl = getClean();
    var hidden = sc.scanHidden(text);
    var formatting = null;
    if (isFormattingFormat(format)) {
      formatting = cl.cleanLLMText(text).stats;
    }
    var dirty =
      hidden.total > 0 ||
      (formatting && (formatting.blankLines || formatting.trailingSpaces ||
                      formatting.headings || formatting.fences));
    return { hidden: { total: hidden.total, byGroup: hidden.counts }, formatting: formatting, dirty: !!dirty };
  }

  /** Phase 2: clean text content; return cleaned + summary of what was removed. */
  function cleanTextFile(text, format, opts) {
    var sc = getScan(), cl = getClean();
    var before = sc.scanHidden(text).total;

    var cleaned;
    if (format === "csv" || format === "json") cleaned = sc.stripInvisible(text);
    else if (format === "rtf") cleaned = sc.stripInvisible(text);
    else if (format === "html") {
      cleaned = sc.stripInvisible(text);
      cleaned = opts && opts.plainText ? getPlain().htmlToText(cleaned) : cl.cleanLLMText(cleaned).cleaned;
    } else {
      cleaned = cl.cleanLLMText(sc.stripInvisible(text)).cleaned;
    }

    var after = sc.scanHidden(cleaned).total;
    return {
      cleaned: cleaned,
      summary: {
        invisibleRemoved: before - after,
        formatting: isFormattingFormat(format) ? cl.cleanLLMText(text).stats : null,
      },
    };
  }

  /** docx scan (needs JSZip). Returns hidden-char report on the XML. */
  async function scanDocx(file) {
    var JSZip = global.JSZip;
    if (!JSZip) throw new Error("JSZip is not loaded");
    var zip = await JSZip.loadAsync(file);
    var entry = zip.file("word/document.xml");
    if (!entry) throw new Error("not a valid .docx (no word/document.xml)");
    var xml = await entry.async("string");
    var hidden = getScan().scanHidden(xml);
    return { hidden: { total: hidden.total, byGroup: hidden.counts }, formatting: null, dirty: hidden.total > 0 };
  }

  /** docx clean: strip invisible chars from the XML and repack. */
  async function cleanDocx(file, downloadName) {
    var JSZip = global.JSZip;
    var zip = await JSZip.loadAsync(file);
    var entry = zip.file("word/document.xml");
    if (!entry) throw new Error("not a valid .docx (no word/document.xml)");
    var xml = await entry.async("string");
    var before = getScan().scanHidden(xml).total;
    var cleanedXml = getScan().stripInvisible(xml);
    zip.file("word/document.xml", cleanedXml);
    var blob = await zip.generateAsync({ type: "blob" });
    return { blob: blob, downloadName: downloadName, summary: { invisibleRemoved: before, formatting: null } };
  }

  /** Scan a File (no modification). */
  async function scanFile(file) {
    var format = detectFormat(file.name);
    var base = String(file.name).replace(/\.(\w+)$/i, "");
    if (format === "docx") {
      var r = await scanDocx(file);
      return { format: format, downloadName: base + "-cleaned.docx", ...r };
    }
    var text = await file.text();
    var s = scanTextContent(text, format);
    var ext = "." + format;
    return { format: format, text: text, downloadName: base + "-cleaned" + ext, hidden: s.hidden, formatting: s.formatting, dirty: s.dirty };
  }

  /** Clean a File; returns cleaned output + summary. */
  async function cleanFile(file, opts) {
    var format = detectFormat(file.name);
    var base = String(file.name).replace(/\.(\w+)$/i, "");
    if (format === "docx") {
      return await cleanDocx(file, base + "-cleaned.docx");
    }
    var text = await file.text();
    var r = cleanTextFile(text, format, opts);
    var ext = "." + format;
    return { format: format, text: r.cleaned, downloadName: base + "-cleaned" + ext, summary: r.summary };
  }

  var api = { scanFile: scanFile, cleanFile: cleanFile, scanTextContent: scanTextContent,
              cleanTextFile: cleanTextFile, detectFormat: detectFormat };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.NoAtMarkFileCleaner = api;
})(typeof self !== "undefined" ? self : globalThis);
