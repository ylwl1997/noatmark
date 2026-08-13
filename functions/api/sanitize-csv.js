// POST /api/sanitize-csv — escape CSV / Excel formula injection (OWASP).
// Prefixes cells starting with = + - @ tab CR with a single quote so they
// can't be interpreted as formulas when opened in a spreadsheet.
import { sanitizeCsv } from "../../js/engines/csv-sanitize.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const text = textOf(body);
  if (!text) return error("text is required");

  const delimiter = body && typeof body.delimiter === "string" ? body.delimiter : null;
  const r = sanitizeCsv(text, delimiter);

  return json({
    ok: true,
    sanitized: r.sanitized,
    escapedCells: r.changed,
    delimiter: r.delimiter,
    changedAny: r.changedAny,
  });
}

export async function onRequestOptions() {
  return handleOptions();
}
