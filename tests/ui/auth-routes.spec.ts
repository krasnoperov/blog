import { expect, test } from '@playwright/test';
import { AUTHENTICATED_USER, useTestSession } from './fixtures/auth';

test.describe('auth and protected routes', () => {
  test('profile redirects anonymous users to login', async ({ request }) => {
    const response = await request.get('/profile', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe('/login');
  });

  test('oauth approval redirects anonymous users to login', async ({ request }) => {
    const response = await request.get('/oauth/approve?request=req-123', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe('/login');
  });

  test('login page is reachable in browser', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText(/Login unavailable|Welcome!/)).toBeVisible();
  });

  test('login redirects authenticated test session to profile', async ({ request }) => {
    const response = await request.get('/login', {
      headers: {
        Accept: 'text/html',
        'x-whitelabel-test-session': encodeURIComponent(JSON.stringify(AUTHENTICATED_USER)),
      },
      failOnStatusCode: false,
      maxRedirects: 0,
    });

    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe('/profile');
  });

  test('profile page renders for authenticated test session with mocked data', async ({ page }) => {
    await useTestSession(page, AUTHENTICATED_USER);
    await page.route('**/api/user/profile', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: AUTHENTICATED_USER.id,
          email: AUTHENTICATED_USER.email,
          name: AUTHENTICATED_USER.name,
        }),
      }),
    );

    await page.goto('/profile');

    await expect(page.getByText('Your Profile')).toBeVisible();
    await expect(page.getByLabel('Name *')).toHaveValue('Playwright Tester');
    await expect(page.getByLabel('Email')).toHaveValue('playwright@example.com');
  });
});
