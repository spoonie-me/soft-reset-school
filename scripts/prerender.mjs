/**
 * prerender.mjs — build-time static route pre-generation
 *
 * Copies the Vite SPA shell (dist/index.html) into each public marketing
 * route as dist/<route>/index.html. Vercel's filesystem handler then serves
 * these directly, returning real HTTP 200s with the correct path. Anything
 * NOT in this list (or not a known app route in vercel.json) gets a genuine
 * HTTP 404 — fixing the soft-404 problem from the SPA catch-all rewrite.
 *
 * Also generates dist/404.html with a hard noindex meta tag injected at the
 * HTML level so search crawlers without JS execution never index the error page.
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dir, '..', 'dist');
const SHELL = join(DIST, 'index.html');

// Lab posts are generated content (scripts/build-lab-content.mjs), so their
// routes are read from the same metadata file instead of hardcoded here.
const LAB_POSTS_PATH = join(__dir, '..', 'src', 'data', 'labPosts.generated.json');
const labSlugs = existsSync(LAB_POSTS_PATH)
  ? JSON.parse(readFileSync(LAB_POSTS_PATH, 'utf8')).map((p) => p.slug)
  : [];

if (!existsSync(SHELL)) {
  console.error('❌  dist/index.html not found — run vite build first');
  process.exit(1);
}

// Public marketing routes to prerender as real static files.
// Each becomes dist/<route>/index.html.
// Authenticated app routes (/dashboard, /lesson/*, etc.) are handled
// by vercel.json → SPA fallback, NOT prerendered.
const PUBLIC_ROUTES = [
  // Core marketing
  'pricing',
  'tracks',
  'tracks/ai-orchestrated-dev',
  'tracks/ai-workflow-consulting',
  'tracks/ai-oversight-health-informatics',
  'tracks/accessibility-qa-lived-experience',
  'tracks/fundamentals',
  'tracks/ai',
  'tracks/tools',
  'tracks/advanced',
  'for-teams',
  'about',
  'employers',
  'welcome',
  'share-story',

  // Auth (low-content but indexable)
  'signup',
  'login',

  // Blog index + all posts
  'blog',
  'blog/what-is-ai-literacy',
  'blog/build-your-first-ai-app',
  'blog/coding-with-chronic-illness',
  'blog/prompt-engineering-guide',

  // Lab index + all posts (generated — see src/data/labPosts.generated.json)
  'lab',
  ...labSlugs.map((slug) => `lab/${slug}`),

  // Legal / compliance
  'imprint',
  'privacy',
  'terms',
  'cookies',
  'dpa',
];

let count = 0;
for (const route of PUBLIC_ROUTES) {
  const dir = join(DIST, route);
  mkdirSync(dir, { recursive: true });
  copyFileSync(SHELL, join(dir, 'index.html'));
  count++;
}

// 404 fallback — Vercel serves this with a real HTTP 404 for unknown routes.
// Inject a hard noindex so non-JS crawlers never index the error page,
// even though it returns 404 (belt-and-suspenders).
const shell = readFileSync(SHELL, 'utf8');
const shell404 = shell.replace(
  '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
  '<meta name="robots" content="noindex, nofollow" />'
);
writeFileSync(join(DIST, '404.html'), shell404, 'utf8');

console.log(`✓ prerender: ${count} routes + 404.html (noindex)`);
