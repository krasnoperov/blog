import { expect, test } from '@playwright/test';

test.describe('offline-first app shell', () => {
  test('app shell navigation works in browser', async ({ page }) => {
    await page.goto('/app');

    await expect(page.getByRole('heading', { name: 'Run the game engine locally, sync later if you want.' })).toBeVisible();
    await page.getByRole('link', { name: 'Local drafts' }).click();
    await expect(page).toHaveURL(/\/app\/drafts$/);
    await expect(page.getByText('Choose a local draft')).toBeVisible();

    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/app\/settings$/);
    await expect(page.getByText('Runtime settings')).toBeVisible();
  });

  test('creating a draft updates the route and persists local state on reload', async ({ page }) => {
    await page.goto('/app/drafts');

    await page.getByRole('button', { name: 'New draft' }).click();
    await expect(page).toHaveURL(/\/app\/drafts\/.+/);

    await page.getByLabel('Session title').fill('Playwright Session');
    await page.getByLabel('Local notes').fill('Stored on device first.');

    await page.reload();

    await expect(page.getByLabel('Session title')).toHaveValue('Playwright Session');
    await expect(page.getByLabel('Local notes')).toHaveValue('Stored on device first.');
    await expect(page.getByText('Playwright Session')).toBeVisible();
  });

  test('settings toggle persists after reload', async ({ page }) => {
    await page.goto('/app/settings');

    const checkbox = page.getByRole('checkbox', { name: 'Enable optional sync queue' });
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await page.reload();
    await expect(page.getByRole('checkbox', { name: 'Enable optional sync queue' })).toBeChecked();
  });
});
