/* NoAtMark CSV formula-injection sanitizer.
 *
 * Prevents CSV / Excel formula injection (OWASP): cells that start with
 * = + - @ tab CR are interpreted as formulas by Excel, WPS and Google Sheets.
 * We prefix such cells with a single quote so they're forced to be text.
 *
 * Pure functions, no DOM — reusable in browser, Node, Workers, plugins.
 */

var DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

/** Parse CSV text into rows of cells (handles quoted fields + escaped quotes). */
function parseCsv(text, delimiter) {
  var d = delimiter || ",";
  var rows = [];
  var row = [];
  var field = "";
  var inQuotes = false;
  var i = 0;
  var n = text.length;
  while (i < n) {
    var c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += c; i += 1; continue;
    }
    if (c === '"') {
      // Only a quote at the very start of a field opens a quoted field.
      // A quote in the middle of an unquoted field is a literal character
      // (lenient, matches Python's csv reader).
      if (field === "") { inQuotes = true; i += 1; continue; }
      field += '"'; i += 1; continue;
    }
    if (c === d) { row.push(field); field = ""; i += 1; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i += 1; continue; }
    if (c === "\r") { i += 1; continue; }
    field += c; i += 1;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** Serialize rows back to CSV (quote cells that need it). */
function serializeCsv(rows, delimiter) {
  var d = delimiter || ",";
  return rows.map(function (row) {
    return row.map(function (cell) {
      if (/[",\n\r]/.test(cell)) return '"' + cell.replace(/"/g, '""') + '"';
      return cell;
    }).join(d);
  }).join("\n");
}

/** Guess the delimiter from the first line (comma, semicolon, or tab). */
function detectDelimiter(text) {
  var line = String(text).split(/\r?\n/)[0] || "";
  var counts = {
    ",": (line.match(/,/g) || []).length,
    ";": (line.match(/;/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
  };
  var best = ",";
  for (var k in counts) { if (counts[k] > counts[best]) best = k; }
  return counts[best] === 0 ? "," : best;
}

/** Escape a single cell if it leads with a dangerous character. */
function escapeFormulaCell(cell) {
  var s = String(cell);
  return DANGEROUS_PREFIX.test(s) ? "'" + s : s;
}

/**
 * Sanitize CSV text against formula injection.
 * Returns { sanitized, changed, delimiter, changedAny }.
 */
function sanitizeCsv(text, delimiter) {
  var d = delimiter || detectDelimiter(text);
  var rows = parseCsv(text, d);
  var changed = 0;
  rows = rows.map(function (row) {
    return row.map(function (cell) {
      if (DANGEROUS_PREFIX.test(cell)) { changed += 1; return "'" + cell; }
      return cell;
    });
  });
  return { sanitized: serializeCsv(rows, d), changed: changed, delimiter: d, changedAny: changed > 0 };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { sanitizeCsv, escapeFormulaCell, detectDelimiter, parseCsv, serializeCsv };
}
if (typeof window !== "undefined") {
  window.NoAtMarkCsv = { sanitizeCsv, escapeFormulaCell, detectDelimiter, parseCsv, serializeCsv };
}
