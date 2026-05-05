import { test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'audit-shots');
mkdirSync(OUT_DIR, { recursive: true });
const writeShot = (name: string, body: Buffer) =>
  writeFileSync(join(OUT_DIR, `${name}.png`), body);

// Blog readability audit — capture full-page screenshots of the public surface
// across desktop + mobile so we can identify hard-to-read areas (especially
// post body, headers, code blocks).
const SHOTS: { name: string; path: string; waitFor?: string }[] = [
  { name: 'home', path: '/' },
  { name: 'posts-index', path: '/posts' },
  { name: 'post-yolo-patchrelay', path: '/posts/from-yolo-to-patchrelay' },
  { name: 'post-patchrelay', path: '/posts/patchrelay' },
  { name: 'post-merge-steward', path: '/posts/merge-steward' },
];

test.describe('@shots', () => {
  for (const { name, path, waitFor } of SHOTS) {
    test(`shot: ${name}`, async ({ page }, info) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      if (waitFor) await page.waitForSelector(waitFor);
      const body = await page.screenshot({ fullPage: true });
      writeShot(`${name}-${info.project.name}`, body);
      await info.attach(`${name}-${info.project.name}.png`, {
        body,
        contentType: 'image/png',
      });
    });
  }
});

// Targeted close-ups of the problem areas the user called out: headers and
// code blocks on the patchrelay post. We scroll-and-snap a few sections so
// we can compare typography density and contrast against the UserTold.ai
// console aesthetic.
test('post-detail-zoom', async ({ page }, info) => {
  await test.step('open patchrelay post', () =>
    page.goto('/posts/from-yolo-to-patchrelay', { waitUntil: 'networkidle' }));

  await test.step('snap the article header', async () => {
    const body = await page.screenshot({ fullPage: false });
    writeShot(`zoom-header-${info.project.name}`, body);
    await info.attach(`zoom-header-${info.project.name}.png`, { body, contentType: 'image/png' });
  });

  await test.step('snap each h2/h3 in context', async () => {
    const headings = await page.locator('article h2, article h3').all();
    for (let i = 0; i < headings.length; i++) {
      await headings[i].scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const body = await page.screenshot({ fullPage: false });
      writeShot(`zoom-heading-${i}-${info.project.name}`, body);
      await info.attach(`zoom-heading-${i}-${info.project.name}.png`, { body, contentType: 'image/png' });
    }
  });

  await test.step('snap each code block in context', async () => {
    const codeBlocks = await page.locator('article pre').all();
    for (let i = 0; i < codeBlocks.length; i++) {
      await codeBlocks[i].scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const body = await page.screenshot({ fullPage: false });
      writeShot(`zoom-code-${i}-${info.project.name}`, body);
      await info.attach(`zoom-code-${i}-${info.project.name}.png`, { body, contentType: 'image/png' });
    }
  });
});
