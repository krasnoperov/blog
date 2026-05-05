import { test } from '@playwright/test';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Style-reference capture pipeline: walks every public route (`/`, `/posts`,
// `/posts/:slug`) at the active project's viewport + colour scheme, writes
// full-page screenshots to audit-out/style-reference/, and emits a static
// index.html that links every shot grouped by route.
//
// The post slug list is parsed from the markdown content directory at runtime
// so new posts pick up automatically without touching the spec.

const SHOTS_DIR = join(process.cwd(), 'audit-out/style-reference');
mkdirSync(SHOTS_DIR, { recursive: true });

const POSTS_DIR = join(process.cwd(), 'src/shared/content/posts');
const postSlugs = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort()
  : [];

const ROUTES: { name: string; path: string }[] = [
  { name: 'home', path: '/' },
  { name: 'archive', path: '/posts' },
  ...postSlugs.map((slug) => ({ name: `post-${slug}`, path: `/posts/${slug}` })),
];

const writeShot = (name: string, body: Buffer) =>
  writeFileSync(join(SHOTS_DIR, `${name}.png`), body);

test.describe('@style-reference', () => {
  for (const { name, path } of ROUTES) {
    test(`shot: ${name}`, async ({ page }, info) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      const body = await page.screenshot({ fullPage: true });
      const fname = `${name}__${info.project.name}`;
      writeShot(fname, body);
      await info.attach(`${fname}.png`, { body, contentType: 'image/png' });
    });
  }
});

// Emit a static gallery once per worker after all captures land. The index
// reads whatever PNGs ended up in the shots dir, grouped by route name, so it
// stays accurate even if a subset of projects ran.
test.afterAll(async () => {
  const files = readdirSync(SHOTS_DIR).filter((f) => f.endsWith('.png')).sort();
  if (files.length === 0) return;
  const byRoute = new Map<string, string[]>();
  for (const f of files) {
    const route = f.split('__')[0];
    if (!byRoute.has(route)) byRoute.set(route, []);
    byRoute.get(route)!.push(f);
  }
  const sections = Array.from(byRoute.entries()).map(([route, shots]) => {
    const tiles = shots
      .map((f) => {
        const project = f.replace(`${route}__`, '').replace(/\.png$/, '');
        return `<figure><figcaption>${project}</figcaption><a href="${f}"><img src="${f}" alt="${f}" loading="lazy"></a></figure>`;
      })
      .join('\n');
    return `<section><h2>${route}</h2><div class="grid">${tiles}</div></section>`;
  });
  const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Blog style reference</title>
<style>
  body { font-family: 'JetBrains Mono', ui-monospace, monospace; padding: 32px; background: #fafaf7; color: #1f1d1a; }
  h1 { font-size: 18px; margin: 0 0 24px; letter-spacing: 0.14em; text-transform: uppercase; }
  h2 { font-size: 14px; margin: 32px 0 12px; letter-spacing: 0.08em; text-transform: uppercase; border-top: 1px solid #ddd6c8; padding-top: 12px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  figure { margin: 0; }
  figcaption { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #6b6557; margin-bottom: 6px; }
  img { width: 100%; height: auto; border: 1px solid #ddd6c8; display: block; }
  @media (prefers-color-scheme: dark) {
    body { background: #1c1916; color: #ece6db; }
    h2 { border-color: #3a342c; }
    figcaption { color: #a39d8e; }
    img { border-color: #3a342c; }
  }
</style>
<h1>Blog style reference</h1>
${sections.join('\n')}
</html>`;
  writeFileSync(join(SHOTS_DIR, 'index.html'), html);
});
