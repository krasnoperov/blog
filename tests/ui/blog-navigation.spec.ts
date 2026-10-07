import { expect, test } from '@playwright/test';

test.describe('blog navigation', () => {
  test('reader can move from home to archive to a post', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: "I'm Alekséi, and I build products." })).toBeVisible();
    await page.getByRole('link', { name: 'browse archive' }).click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByRole('heading', { name: 'Notes and essays, one post at a time.' })).toBeVisible();

    await page.getByRole('link', { name: /Hello World for Factory Notes/i }).click();
    await expect(page).toHaveURL(/\/posts\/hello-world-formatting-the-factory-notes$/);
    await expect(page.getByRole('heading', { name: 'Hello World for Factory Notes' })).toBeVisible();
  });
});
