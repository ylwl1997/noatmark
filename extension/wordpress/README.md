# NoAtMark Text Hygiene — WordPress Plugin

Strip invisible characters (zero-width spaces, BOMs, soft hyphens) from your content automatically — and see them in the editor before you publish.

## What it does

1. **Auto-clean on save** — `content_save_pre`, `excerpt_save_pre`, and `title_save_pre` strip invisible characters the moment you save.
2. **Gutenberg sidebar** — a "NoAtMark" panel shows a live count of invisible characters in the post and a **Clean now** button.
3. **Bulk clean** — a Tools → NoAtMark Text Hygiene admin page scans and cleans every post at once.

## Install

1. Download this folder as a zip.
2. In WordPress, go to **Plugins → Add New → Upload Plugin** and upload the zip.
3. Activate **NoAtMark Text Hygiene**.

That's it — cleaning is on. The sidebar appears in the block editor automatically.

## What gets stripped

- Zero-width space `U+200B`, joiner `U+200D`, non-joiner `U+200C`
- Word joiner `U+2060`, BOM `U+FEFF`, soft hyphen `U+00AD`
- Direction marks `U+200E`/`U+200F`, combining grapheme joiner `U+034F`
- Variation selectors, special spaces, non-breaking space

Everything runs locally in your WordPress install. No data leaves your server.

## Ghost users

Ghost doesn't support PHP plugins. Use the free [NoAtMark browser extension](https://noatmark.com/extension/) to strip invisible characters automatically when you copy into the Ghost editor, or paste through the [web cleaner](https://noatmark.com/tools/file-cleaner/) first.

## More

- Web tools: https://noatmark.com/tools/
- Text hygiene API: https://noatmark.com/api/
- MCP server for AI agents: https://noatmark.com/mcp/

Not affiliated with Automattic or WordPress. GPL-2.0-or-later.
