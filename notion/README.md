# NoAtMark for Notion — bulk cleaner

Connects to the **Notion API** and strips invisible characters from your page
text — the zero-width spaces, joiners, and BOMs that AI copy-paste silently
drops into your notes. Zero dependencies, Node 18+.

## What it does

- Searches your pages (or takes a page/database id) and walks every block
  recursively (including child blocks).
- Strips invisible characters from each text block's `rich_text`.
- Updates only the blocks that actually changed (or previews with `--dry-run`).

## Requirements

- Node 18+ (no `npm install` — zero dependencies).
- A **Notion internal integration token**:
  1. https://www.notion.so/my-integrations → **New integration** → copy the token.
  2. Share each page (or the parent database) with the integration:
     page menu → **Connections** → add your integration.

## Usage

```bash
# Search pages by title and preview what would change:
NOTION_TOKEN=secret node clean.js --query "AI notes" --dry-run

# Clean a specific page (or database) by id:
NOTION_TOKEN=secret node clean.js <page-or-database-id> --dry-run

# For real:
NOTION_TOKEN=secret node clean.js --query "AI notes"
```

## What gets stripped

- Zero-width space (U+200B), joiner (U+200D), non-joiner (U+200C), word joiner (U+2060)
- BOM (U+00AD), soft hyphen (U+00AD), direction marks (U+200E / U+200F)
- Combining grapheme joiner (U+034F), variation selectors, special spaces, non-breaking space

## Notes

- Everything runs on your machine; your token is sent only to Notion.
- Rich-text formatting (bold, links, annotations) is preserved — only text
  content changes.
- For real-time stripping as you paste, use the free
  [browser extension](https://noatmark.com/extension/).

## More

- Web tools: https://noatmark.com/tools/
- API: https://noatmark.com/api/
- Ghost integration: https://noatmark.com/ghost/
