import { expect, test } from '@playwright/test';

test.describe('blog navigation', () => {
  test('reader can move from home to archive to a post', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'How my code gets from an issue to production' })).toBeVisible();
    await page.getByRole('button', { name: /Landing/ }).click();
    await expect(page.getByRole('img', { name: /Landing/ })).toBeVisible();
    // Play runs while the pointer is still over the figure.
    await page.getByRole('button', { name: 'Play' }).first().click();
    await expect(page.getByRole('img', { name: /Step 11 of 11/ })).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'one goes red' }).click();
    await page.getByRole('button', { name: 'Next step' }).nth(1).click();
    await expect(page.getByRole('heading', { name: 'Build the train' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Elsewhere' }).getByRole('link', { name: 'notes' }).click();

    await expect(page).toHaveURL(/\/posts$/);
    await expect(page.getByRole('heading', { name: 'Notes and essays, one post at a time.' })).toBeVisible();

    await page.getByRole('link', { name: /Hello World for Factory Notes/i }).click();
    await expect(page).toHaveURL(/\/posts\/hello-world-formatting-the-factory-notes$/);
    await expect(page.getByRole('heading', { name: 'Hello World for Factory Notes' })).toBeVisible();
  });
});
