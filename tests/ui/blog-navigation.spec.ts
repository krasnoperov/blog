import { expect, test } from '@playwright/test';

test.describe('blog navigation', () => {
  test('reader can move from home to archive to a post', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'The software factory behind my products' })).toBeVisible();
    await expect(page.getByRole('group', { name: /isometric software factory/i })).toBeVisible();
    const label = (await page.getByRole('button', { name: /^Follow / }).last().getAttribute('aria-label')) ?? '';
    await page.getByRole('button', { name: label, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-corner="readout"]')).toContainText(label.replace('Follow ', ''));
    await page.getByRole('navigation', { name: 'Elsewhere' }).getByRole('link', { name: 'notes' }).click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByRole('heading', { name: 'Notes and essays, one post at a time.' })).toBeVisible();

    await page.getByRole('link', { name: /Hello World for Factory Notes/i }).click();
    await expect(page).toHaveURL(/\/posts\/hello-world-formatting-the-factory-notes$/);
    await expect(page.getByRole('heading', { name: 'Hello World for Factory Notes' })).toBeVisible();
  });
});
