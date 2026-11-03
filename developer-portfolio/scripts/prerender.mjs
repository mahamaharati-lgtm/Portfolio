// Renders each route to static HTML so content is visible before JavaScript loads
// (better first paint, SEO, and resilience). The client bundle then hydrates it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');
const { render, PAGE_META } = await import(pathToFileURL(ssrEntry).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
const base = process.env.BASE_PATH ?? '/';
// Optional GitHub Pages SPA fallback: deep links under this prefix are sent to that app's index.
const spaPrefix = process.env.SPA_FALLBACK_PREFIX ?? '';

// Preload the primary latin font so text doesn't reflow when it swaps in.
const fonts = fs
  .readdirSync(path.join(dist, 'assets'))
  .filter((f) => /^geist(-mono)?-latin-wght-normal-.*\.woff2$/.test(f))
  .map(
    (f) =>
      `<link rel="preload" href="${base}assets/${f}" as="font" type="font/woff2" crossorigin />`,
  )
  .join('\n    ');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const routes = [
  { url: '/', file: 'index.html', meta: PAGE_META['/'] },
  {
    url: '/projects/workflow-studio',
    file: 'projects/workflow-studio.html',
    meta: PAGE_META['/projects/workflow-studio'],
  },
  { url: '/404', file: '404.html', meta: PAGE_META['/404'] },
];

for (const route of routes) {
  let html = template
    .replace('<!--app-html-->', render(route.url))
    .replace('</head>', `  ${fonts}\n  </head>`);
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${escape(route.meta.title)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escape(route.meta.description)}$2`,
    )
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escape(route.meta.title)}$2`)
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
      `$1${escape(route.meta.description)}$2`,
    );
  if (spaPrefix && route.url === '/404') {
    const redirect = `<script>(function(){var p=location.pathname;if(p.indexOf(${JSON.stringify(spaPrefix)})===0&&p!==${JSON.stringify(spaPrefix)}){location.replace(${JSON.stringify(spaPrefix)}+'?p='+encodeURIComponent(p+location.search+location.hash));}})();</script>`;
    html = html.replace('<head>', `<head>\n    ${redirect}`);
  }
  if (siteUrl && route.url !== '/404') {
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${siteUrl}${route.url}" />\n  </head>`,
    );
  }
  const out = path.join(dist, route.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`prerendered ${route.url} → dist/${route.file}`);
}

if (siteUrl) {
  const urls = routes
    .filter((r) => r.url !== '/404')
    .map((r) => `  <url><loc>${siteUrl}${r.url}</loc></url>`)
    .join('\n');
  fs.writeFileSync(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  fs.appendFileSync(path.join(dist, 'robots.txt'), `Sitemap: ${siteUrl}/sitemap.xml\n`);
}
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true });
