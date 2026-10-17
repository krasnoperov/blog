import { expect, test } from '@playwright/test';

// Pointing at a machine dims the rest of the floor and shows what it does;
// pointing at a station on the page lights the same machine in the figure.
test('pointing at a machine describes it', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.fx-stage svg');
  await expect(svg).toBeVisible();
  await page.waitForFunction(() => typeof (document.querySelector('.fx-stage') as (Element & { factoryState?: unknown }) | null)?.factoryState === 'function');

  const tip = page.locator('.fx-tip');
  const spot = page.locator('.fx-spot');
  await svg.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox();
  if (!box) throw new Error('figure has no box');
  // The review-quill gantry stands near the middle of the coding lines.
  await page.mouse.move(box.x + box.width * 0.37, box.y + box.height * 0.45);
  await expect(tip).toHaveAttribute('data-on', '');
  await expect(tip).toContainText('review-quill');
  await expect(spot).toHaveAttribute('data-on', '');

  // Off the plate, everything comes back.
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.move(0, 0);
  await expect(spot).not.toHaveAttribute('data-on', '');

  // A station card lights its machines without a note.
  await page.getByRole('heading', { name: 'Deploy', exact: true }).hover();
  await expect(spot).toHaveAttribute('data-on', '');
  await expect(tip).not.toHaveAttribute('data-on', '');
});
