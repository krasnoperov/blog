import { expect, test } from '@playwright/test';
import { AUTHENTICATED_USER, useTestSession } from './fixtures/auth';

test.describe('OAuth approval page', () => {
  test('renders approval UI for authenticated test session and follows decision redirect', async ({ page }) => {
    await useTestSession(page, AUTHENTICATED_USER);

    await page.route('**/api/oauth/authorize/request*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientId: 'whitelabel-cli',
          clientName: 'Whitelabel CLI',
          scopes: ['openid', 'profile', 'email'],
          user: {
            id: AUTHENTICATED_USER.id,
            email: AUTHENTICATED_USER.email,
          },
        }),
      }),
    );

    let decisionBody: { requestId: string; approved: boolean } | null = null;
    await page.route('**/api/oauth/authorize/decision', async (route) => {
      decisionBody = route.request().postDataJSON() as { requestId: string; approved: boolean };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ redirectUrl: 'about:blank#oauth-approved' }),
      });
    });

    await page.goto('/oauth/approve?request=req-abc');

    await expect(page.getByText('Authorize Application')).toBeVisible();
    await expect(page.getByText('Whitelabel CLI')).toBeVisible();
    await expect(page.getByText(AUTHENTICATED_USER.email)).toBeVisible();

    await page.getByRole('button', { name: 'Grant Access' }).click();

    expect(decisionBody).toEqual({ requestId: 'req-abc', approved: true });
    await expect(page).toHaveURL('about:blank#oauth-approved');
  });
});
