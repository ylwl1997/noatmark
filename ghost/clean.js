#!/usr/bin/env node
/**
 * NoAtMark — Ghost bulk cleaner
 * Connects to the Ghost Admin API and strips invisible characters from all
 * posts (title, excerpt, and mobiledoc text markers) without touching markup.
 *
 * Usage:
 *   GHOST_URL=https://yourblog.com GHOST_ADMIN_KEY=id:secret node clean.js [--dry-run]
 *
 * Get an Admin API key: Ghost Admin → Settings → Integrations → Add custom
 * integration → copy the "Admin API key".
 *
 * Zero dependencies. Requires Node 18+ (uses global fetch + node:crypto).
 */
import crypto from 'node:crypto';
import process from 'node:process';

const GHOST_URL = (process.env.GHOST_URL || '').replace(/\/+$/, '');
const GHOST_KEY = process.env.GHOST_ADMIN_KEY || '';
const DRY_RUN = process.argv.includes('--dry-run');

if (!GHOST_URL || !GHOST_KEY) {
  console.error('Missing GHOST_URL or GHOST_ADMIN_KEY. See README for setup.');
  process.exit(1);
}
if (!GHOST_KEY.includes(':')) {
  console.error('GHOST_ADMIN_KEY must be in "id:secret" format.');
  process.exit(1);
}

/** Build a Ghost Admin API JWT from the "id:secret" key. */
function adminJwt() {
  const [id, secret] = GHOST_KEY.split(':');
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const header = enc({ alg: 'HS256', kid: id, typ: 'JWT' });
  const payload = enc({ iat: now, exp: now + 300, aud: '/admin/' });
  const sig = crypto
    .createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// Invisible characters to strip — mirrors the WordPress plugin's code-point
// list, including supplementary-plane variation selectors U+E0100–E01EF.
// Written as explicit escapes so the source stays free of invisible chars.
const INVISIBLE_RE =
  /[\u{200B}\u{200C}\u{200D}\u{2060}\u{FEFF}\u{00AD}\u{200E}\u{200F}\u{034F}\u{00A0}\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}\u{2000}-\u{200A}]/gu;

function strip(text) {
  return typeof text === 'string' ? text.replace(INVISIBLE_RE, '') : text;
}

/**
 * Strip invisible chars from mobiledoc text markers. This is surgical — it
 * edits only the text inside markers, leaving cards, atoms, and markups intact,
 * so no Ghost formatting is lost (unlike an HTML round-trip).
 */
function stripMobiledoc(mobiledoc) {
  let doc = mobiledoc;
  if (typeof doc === 'string') {
    try {
      doc = JSON.parse(doc);
    } catch {
      return { value: mobiledoc, changed: false };
    }
  }
  if (!doc || !Array.isArray(doc.sections)) return { value: mobiledoc, changed: false };

  let changed = false;
  for (const section of doc.sections) {
    if (!Array.isArray(section)) continue;
    const markers = section[2];
    if (!Array.isArray(markers)) continue;
    for (const marker of markers) {
      // Text marker: [0, openMarkups, closeCount, text]
      if (Array.isArray(marker) && marker[0] === 0 && typeof marker[3] === 'string') {
        const clean = strip(marker[3]);
        if (clean !== marker[3]) {
          marker[3] = clean;
          changed = true;
        }
      }
    }
  }
  return { value: JSON.stringify(doc), changed };
}

async function api(path, token, opts = {}) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/${path}`, {
    ...opts,
    headers: {
      Authorization: `Ghost ${token}`,
      'Content-Type': 'application/json',
      'Accept-Version': 'v5.0',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ghost API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchAllPosts(token) {
  const posts = [];
  let page = 1;
  let pages = 1;
  do {
    const json = await api(`posts/?page=${page}&limit=100&formats=mobiledoc`, token);
    posts.push(...(json.posts || []));
    pages = json.meta?.pagination?.pages || 1;
    page += 1;
  } while (page <= pages);
  return posts;
}

async function main() {
  const token = adminJwt();
  console.log(`Fetching posts from ${GHOST_URL} ...`);
  const posts = await fetchAllPosts(token);
  console.log(`Found ${posts.length} post(s).`);

  let cleaned = 0;
  for (const post of posts) {
    const updates = { id: post.id, updated_at: post.updated_at };
    let changed = false;

    const title = strip(post.title);
    if (title !== post.title) {
      updates.title = title;
      changed = true;
    }
    if (post.excerpt) {
      const excerpt = strip(post.excerpt);
      if (excerpt !== post.excerpt) {
        updates.excerpt = excerpt;
        changed = true;
      }
    }
    const m = stripMobiledoc(post.mobiledoc);
    if (m.changed) {
      updates.mobiledoc = m.value;
      changed = true;
    }

    if (!changed) continue;

    cleaned += 1;
    const label = (post.title || post.slug || post.id).slice(0, 50);
    if (DRY_RUN) {
      console.log(`[dry-run] would clean: ${label}`);
      continue;
    }
    await api(`posts/${post.id}/`, token, {
      method: 'PUT',
      body: JSON.stringify({ posts: [updates] }),
    });
    console.log(`Cleaned: ${label}`);
  }

  console.log(
    DRY_RUN
      ? `Done (dry run). ${cleaned} post(s) contain invisible characters.`
      : `Done. Cleaned ${cleaned} post(s).`
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
