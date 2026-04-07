#!/usr/bin/env node
// Generates dist/sitemap.xml after `npm run build`.
// Runs automatically via "postbuild" script in package.json.

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const BASE_URL = 'https://stockview.pages.dev';
const TODAY = new Date().toISOString().split('T')[0];

// Import company IDs directly from the data file (no JSX/React — plain JS)
const { wig20Companies } = await import('../src/data/wig20.js');

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  ...wig20Companies.map((c) => ({
    loc: `/stock/${c.id}`,
    priority: '0.8',
    changefreq: 'daily',
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, priority, changefreq }) => `  <url>
    <loc>${BASE_URL}${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), xml, 'utf8');
console.log(`✓ Generated dist/sitemap.xml (${urls.length} URLs)`);
