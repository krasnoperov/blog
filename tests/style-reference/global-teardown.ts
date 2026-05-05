// Single-writer index.html emission for the style-reference gallery. Runs
// once after every worker and project finishes, so the index always
// reflects the complete set of PNGs in audit-out/style-reference/.
//
// The per-spec test.afterAll variant raced when Playwright ran multiple
// projects/workers in parallel — competing writers left routes or
// schemes missing from index.html.

import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export default async function globalTeardown() {
  const dir = join(process.cwd(), 'audit-out/style-reference');
  if (!existsSync(dir)) return;
  const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
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

  writeFileSync(join(dir, 'index.html'), html);
}
