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

// Index.html is emitted once after all workers finish via globalTeardown
// (see playwright.style-reference.config.ts). Per-worker / per-project
// emission would race when multiple projects run in parallel.

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
