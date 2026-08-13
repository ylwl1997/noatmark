# NoAtMark for Ghost — bulk cleaner

Ghost doesn't support PHP plugins (it's Node-based), so this is the real
equivalent: a zero-dependency Node script that connects to the **Ghost Admin
API**, scans every post, and strips invisible characters from titles, excerpts,
and body text — without touching your markup.

## What it does

- Pulls all posts through the Ghost Admin API (paginated).
- Strips invisible characters from `title` and `excerpt`.
- Strips invisible characters from `mobiledoc` **text markers only** — a
  surgical edit that leaves cards, atoms, and formatting intact (an HTML
  round-trip would silently drop some Ghost content).
- Updates only the posts that actually changed (with `updated_at` collision
  detection).

## Requirements

- Node 18+ (no `npm install` needed — zero dependencies).
- A Ghost **Admin API key**:
  Ghost Admin → **Settings → Integrations → Add custom integration** →
  copy the **Admin API key** (format `id:secret`).

## Usage

```bash
# Dry run — see what would change, no writes:
GHOST_URL=https://yourblog.com GHOST_ADMIN_KEY=id:secret node clean.js --dry-run

# For real:
GHOST_URL=https://yourblog.com GHOST_ADMIN_KEY=id:secret node clean.js
```

## What gets stripped

- Zero-width space (U+200B), joiner (U+200D), non-joiner (U+200C)
- Word joiner (U+2060), BOM (U+FEFF), soft hyphen (U+00AD)
- Direction marks (U+200E / U+200F), combining grapheme joiner (U+034F)
- Variation selectors, special spaces, non-breaking space

## Notes

- Everything runs on your machine. Your Admin API key is never sent anywhere
  except your own Ghost server.
- Ghost has no "save" hook, so there's no auto-clean-on-save. For real-time
  stripping as you paste, use the free
  [NoAtMark browser extension](https://noatmark.com/extension/).
- `--dry-run` first — it reports what would change without writing anything.

## More

- Web tools: https://noatmark.com/tools/
- Text hygiene API: https://noatmark.com/api/
- WordPress plugin: https://noatmark.com/wordpress-plugin/
