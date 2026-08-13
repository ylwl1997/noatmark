# NoAtMark for Google Docs — invisible-character cleaner

A copy-paste Google Apps Script that adds a **NoAtMark** menu to Google Docs to
strip invisible characters (zero-width spaces, BOMs, soft hyphens) from your
document — preserving bold, links, and other formatting.

## Install (no add-on store needed)

1. Open your Google Doc → **Extensions → Apps Script**.
2. Delete the placeholder code and paste the whole `noatmark.gs`.
3. Save, then in the toolbar select the `onOpen` function → **Run** (authorize it).
4. Reload the doc. A **NoAtMark** menu appears in the menu bar.

## Usage

- Menu → **NoAtMark → Clean invisible characters**.
- A popup reports how many invisible characters were removed.

## What it strips

- Zero-width space (U+200B), joiner (U+200D), non-joiner (U+200C), word joiner (U+2060)
- BOM (U+FEFF), soft hyphen (U+00AD), direction marks (U+200E / U+200F)
- Combining grapheme joiner (U+034F), variation selectors, special spaces, non-breaking space

## Notes

- Handles paragraphs, list items, and table cells.
- Uses `editAsText()` + `deleteText()` so formatting is preserved.
- Runs entirely inside your document — nothing leaves Google Docs.

## More

- Web tools: https://noatmark.com/tools/
- Notion: https://noatmark.com/notion/
- Ghost: https://noatmark.com/ghost/
