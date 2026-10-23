/**
 * prerender.mjs — build-time static route pre-generation
 *
 * Copies the Vite SPA shell (dist/index.html) into each public marketing
 * route as dist/<route>/index.html, with that route's own title, description,
 * canonical and OG tags, and generates dist/sitemap.xml. Vercel's filesystem handler then serves
 * these directly, returning real HTTP 200s with the correct path. Anything
 * NOT in this list (or not a known app route in vercel.json) gets a genuine
 * HTTP 404 — fixing the soft-404 problem from the SPA catch-all rewrite.
 *
 * Also generates dist/404.html with a hard noindex meta tag injected at the
 * HTML level so search crawlers without JS execution never index the error page.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'fs';
import { build } from 'esbuild';
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

// ── Per-route head tags ────────────────────────────────────────────────────
// The SPA shell carries the home page's title, description, canonical and
// OG tags. react-helmet-async fixes them up in the browser, but crawlers that
// don't run JS (and social unfurlers) would otherwise see the HOME page's
// metadata, with the home canonical, on every route. So each prerendered
// file gets its own values here. The meta/link tags we rewrite are marked
// data-prerender; <SEO> removes them on mount so Helmet's copy is the only one.
const BASE_URL = 'https://softreset.school';
const SRC_PAGES = join(__dir, '..', 'src', 'pages');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : [],
  );
}

/** route ('/pricing') -> { title, description, noIndex } read from the page's
 * literal <SEO canonical="..."> props. Pages with computed props (tracks, lab
 * posts) are handled below. */
function readStaticSeo() {
  const out = new Map();
  for (const file of walk(SRC_PAGES)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/<SEO\b([\s\S]*?)\/>\s*(?=[<{)])/g)) {
      const block = m[1];
      const canonical = block.match(/canonical="([^"]+)"/)?.[1];
      const title = block.match(/title="([^"]+)"/)?.[1];
      const description = block.match(/description="([^"]+)"/)?.[1];
      if (canonical && title && description) {
        out.set(canonical, { title, description, noIndex: /\bnoIndex\b/.test(block) });
      }
    }
  }
  // Blog posts go through a shared layout (title/description/slug props).
  for (const file of walk(join(SRC_PAGES, 'blog'))) {
    const src = readFileSync(file, 'utf8');
    const m = src.match(/\btitle="([^"]+)"\s+description="([^"]+)"[\s\S]{0,300}?\bslug="([^"]+)"/);
    if (m) out.set(`/blog/${m[3]}`, { title: m[1], description: m[2] });
  }
  return out;
}

async function readTrackSeo() {
  const outfile = join(__dir, '..', 'node_modules', '.cache', 'prerender-trackCatalog.mjs');
  await build({
    entryPoints: [join(__dir, '..', 'src', 'data', 'trackCatalog.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent',
  });
  const { CATALOG_TRACKS } = await import(outfile);
  return new Map(CATALOG_TRACKS.map((t) => [
    `/tracks/${t.slug}`,
    {
      title: `${t.title} — what's inside the track`,
      description: `${t.pitch} Full curriculum outline, who it's for, and the credential exam — every lesson free to read, no account needed.`,
    },
  ]));
}

const esc = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function withHead(html, { title, description, canonical }) {
  const fullTitle = title.includes('Soft Reset School') ? title : `${title} | Soft Reset School`;
  const url = canonical === '/' ? `${BASE_URL}/` : `${BASE_URL}${canonical}`;
  const rep = (re, to) => {
    if (!re.test(html)) throw new Error(`prerender: head tag not found in shell: ${re}`);
    html = html.replace(re, to);
  };
  rep(/<title>[\s\S]*?<\/title>/, `<title>${escText(fullTitle)}</title>`);
  rep(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" name="description" content="${esc(description)}" />`);
  rep(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link data-prerender="1" rel="canonical" href="${url}" />`);
  rep(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" property="og:url" content="${url}" />`);
  rep(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" property="og:title" content="${esc(fullTitle)}" />`);
  rep(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" property="og:description" content="${esc(description)}" />`);
  rep(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" name="twitter:title" content="${esc(fullTitle)}" />`);
  rep(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta data-prerender="1" name="twitter:description" content="${esc(description)}" />`);
  return html;
}

const shellHtml = readFileSync(SHELL, 'utf8');
const homeSeo = {
  title: shellHtml.match(/<title>([\s\S]*?)<\/title>/)[1],
  description: shellHtml.match(/<meta name="description" content="([^"]*)"/)[1],
  canonical: '/',
};
const staticSeo = readStaticSeo();
const trackSeo = await readTrackSeo();
const labMeta = existsSync(LAB_POSTS_PATH) ? JSON.parse(readFileSync(LAB_POSTS_PATH, 'utf8')) : [];
const labSeo = new Map(labMeta.map((p) => [`/lab/${p.slug}`, {
  title: p.title,
  description: p.description || `${p.title} — from the Soft Reset Lab: writing on AI in healthcare, health IT and working life with a chronic illness or disability.`,
}]));

function seoFor(route) {
  const key = `/${route}`;
  return trackSeo.get(key) ?? labSeo.get(key) ?? staticSeo.get(key);
}

let count = 0;
const sitemapPaths = ['/'];
const missing = [];
for (const route of PUBLIC_ROUTES) {
  const seo = seoFor(route);
  const dir = join(DIST, route);
  mkdirSync(dir, { recursive: true });
  if (seo) {
    writeFileSync(join(dir, 'index.html'), withHead(shellHtml, { ...seo, canonical: `/${route}` }), 'utf8');
    if (!seo.noIndex) sitemapPaths.push(`/${route}`);
  } else {
    missing.push(route);
    writeFileSync(join(dir, 'index.html'), shellHtml, 'utf8');
  }
  count++;
}
if (missing.length) {
  console.error(`❌  prerender: no <SEO> metadata found for: ${missing.join(', ')}`);
  process.exit(1);
}

// The shell itself (home page, and the SPA fallback for app routes): mark the
// tags <SEO> replaces on mount.
writeFileSync(SHELL, withHead(shellHtml, homeSeo), 'utf8');

// sitemap.xml is generated from the same route list, so it can't drift from
// what is actually served.
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapPaths.map((p) => `  <url><loc>${BASE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`,
  'utf8',
);

// 404 fallback — Vercel serves this with a real HTTP 404 for unknown routes.
// Inject a hard noindex so non-JS crawlers never index the error page,
// even though it returns 404 (belt-and-suspenders).
const shell = shellHtml;
const shell404 = shell.replace(
  '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
  '<meta name="robots" content="noindex, nofollow" />'
);
writeFileSync(join(DIST, '404.html'), shell404, 'utf8');

console.log(`✓ prerender: ${count} routes + sitemap (${sitemapPaths.length} urls) + 404.html (noindex)`);
