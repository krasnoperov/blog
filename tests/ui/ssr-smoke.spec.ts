import { expect, test } from '@playwright/test';

test.describe('SSR smoke', () => {
  test('home page returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    const body = await response.text();
    expect(body).toContain('SSR landing pages outside, offline-first game engine inside.');
  });

  test('guides index returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/guides', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    const body = await response.text();
    expect(body).toContain('Independent landing pages and guides');
    expect(body).toContain('Offline-first Mafia Night');
  });

  test('guide detail returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/guides/offline-first-mafia', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    const body = await response.text();
    expect(body).toContain('Offline-first Mafia Night');
    expect(body).toContain('Offline play');
  });

  test('app shell route renders through SSR', async ({ request }) => {
    const response = await request.get('/app', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    const body = await response.text();
    expect(body).toContain('Run the game engine locally, sync later if you want.');
  });
});
