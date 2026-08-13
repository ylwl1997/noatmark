#!/usr/bin/env node
/**
 * NoAtMark — Notion bulk cleaner
 * Connects to the Notion API and strips invisible characters from page text.
 * Mirrors ghost/clean.js — zero dependencies, Node 18+.
 *
 * Usage:
 *   NOTION_TOKEN=secret node clean.js --query "AI notes" [--dry-run]
 *   NOTION_TOKEN=secret node clean.js <page-or-database-id> [--dry-run]
 *
 * Get a token: notion.so/my-integrations → New integration → copy the token,
 * then share the target pages with your integration (… menu → Connections).
 */
import process from 'node:process';

const TOKEN = process.env.NOTION_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('Missing NOTION_TOKEN. See README for setup.');
  process.exit(1);
}

// Invisible characters to strip (mirrors the JS engine).
const INVISIBLE_RE =
  /[\u{200B}\u{200C}\u{200D}\u{2060}\u{FEFF}\u{00AD}\u{200E}\u{200F}\u{034F}\u{00A0}\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}\u{2000}-\u{200A}]/gu;

function strip(text) {
  return typeof text === 'string' ? text.replace(INVISIBLE_RE, '') : text;
}

async function api(path, method = 'GET', body) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Recursively collect all blocks for a page (handles pagination + children). */
async function collectBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const url = `blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const r = await api(url);
    blocks.push(...(r.results || []));
    cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);

  for (const b of blocks) {
    if (b.has_children) {
      b.children = await collectBlocks(b.id);
    }
  }
  return blocks;
}

/** Clean a block's text; returns the block if it changed, else null. */
function cleanBlock(block) {
  if (!Array.isArray(block.rich_text) || block.rich_text.length === 0) return null;
  let changed = false;
  const richText = block.rich_text.map((item) => {
    const { plain_text, ...rest } = item; // plain_text is read-only; drop it
    if (rest.type === 'text' && rest.text && typeof rest.text.content === 'string') {
      const clean = strip(rest.text.content);
      if (clean !== rest.text.content) {
        rest.text = { ...rest.text, content: clean };
        changed = true;
      }
    }
    return rest;
  });
  return changed ? { ...block, rich_text: richText } : null;
}

async function updateBlock(block) {
  if (DRY_RUN) return;
  await api(`blocks/${block.id}`, 'PATCH', { rich_text: block.rich_text });
}

function parseArgs(argv) {
  const queryIdx = argv.indexOf('--query');
  const query = queryIdx >= 0 ? argv[queryIdx + 1] : null;
  const positional = argv.filter((a) => !a.startsWith('--') && a !== query).find((a) => !a.endsWith('.js'));
  return { query, positional };
}

async function main() {
  const { query, positional } = parseArgs(process.argv.slice(2));

  let pageIds = [];
  if (positional) {
    pageIds = [positional];
  } else {
    const r = await api('search', 'POST', {
      query: query || '',
      filter: { property: 'object', value: 'page' },
      page_size: 100,
    });
    pageIds = (r.results || []).map((p) => p.id);
    console.log(`Found ${pageIds.length} page(s).`);
  }

  let cleanedBlocks = 0;
  for (const pageId of pageIds) {
    const blocks = await collectBlocks(pageId);
    const flat = [];
    const flatten = (list) => list.forEach((b) => { flat.push(b); if (b.children) flatten(b.children); });
    flatten(blocks);

    for (const block of flat) {
      const cleaned = cleanBlock(block);
      if (!cleaned) continue;
      cleanedBlocks += 1;
      if (DRY_RUN) {
        console.log(`[dry-run] would clean block ${block.id}`);
      } else {
        await updateBlock(cleaned);
        console.log(`Cleaned block ${block.id}`);
      }
    }
  }

  console.log(
    DRY_RUN
      ? `Done (dry run). ${cleanedBlocks} block(s) contain invisible characters.`
      : `Done. Cleaned ${cleanedBlocks} block(s).`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
