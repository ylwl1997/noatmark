// POST /api/plaintext — HTML / rich text to clean plain text.
import { htmlToText } from "../../js/engines/plaintext.js";
import { json, error, readBody, textOf, handleOptions } from "./_lib.js";

export async function onRequestPost(context) {
  const body = await readBody(context.request);
  const html = textOf(body, "html") || textOf(body);
  if (!html) return error("html is required");
  const plain = htmlToText(html);
  return json({ ok: true, plain, chars: plain.length });
}

export async function onRequestOptions() {
  return handleOptions();
}
