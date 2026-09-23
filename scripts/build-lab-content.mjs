/**
 * build-lab-content.mjs — turns content/lab/*.md into what the Lab section
 * serves: per-post body files in public/content/lab/ (fetched client-side at
 * runtime) and a metadata index at src/data/labPosts.generated.json (used by
 * the Lab index page and prerender.mjs).
 *
 * Rerun this (npm run lab:generate) any time a file is added to content/lab/.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const SRC_DIR = join(ROOT, 'content', 'lab');
const PUBLIC_OUT = join(ROOT, 'public', 'content', 'lab');
const DATA_OUT = join(ROOT, 'src', 'data', 'labPosts.generated.json');

mkdirSync(PUBLIC_OUT, { recursive: true });

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    meta[key] = val;
  }
  return { meta, body: m[2].trim() };
}

function readTimeFor(body) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.md'));
const posts = [];

for (const file of files) {
  const raw = readFileSync(join(SRC_DIR, file), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const slug = meta.slug || basename(file, '.md');

  writeFileSync(join(PUBLIC_OUT, `${slug}.md`), body, 'utf8');

  posts.push({
    slug,
    title: meta.title || slug,
    date: meta.date || '2026-01-01',
    description: meta.description || '',
    tags: (meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    source: meta.source || '',
    readTime: readTimeFor(body),
  });
}

posts.sort((a, b) => (a.date < b.date ? 1 : -1));

mkdirSync(dirname(DATA_OUT), { recursive: true });
writeFileSync(DATA_OUT, JSON.stringify(posts, null, 2) + '\n', 'utf8');

console.log(`✓ lab content: ${posts.length} posts -> public/content/lab/ + ${basename(DATA_OUT)}`);
