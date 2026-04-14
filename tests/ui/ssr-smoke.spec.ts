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
    expect(response.headers()['x-llms-txt']).toBe('/llms.txt');
    const body = await response.text();
    expect(body).toContain('Notes from building a software factory.');
    expect(body).toContain('The seeded fake posts are gone.');
    expect(body).toContain('rel="canonical" href="https://blog.krasnoperov.me/"');
    expect(body).toContain('property="og:title" content="Krasnoperov Blog"');
  });

  test('posts index returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/posts', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    expect(response.headers()['link']).toContain('rel="llms-txt"');
    const body = await response.text();
    expect(body).toContain('Software factory writing, one post at a time.');
    expect(body).toContain('Hello World for Factory Notes');
    expect(body).toContain('rel="canonical" href="https://blog.krasnoperov.me/posts"');
  });

  test('post detail returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/posts/hello-world-formatting-the-factory-notes', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    expect(response.headers()['link']).toContain('/posts/hello-world-formatting-the-factory-notes.md');
    const body = await response.text();
    expect(body).toContain('Hello World for Factory Notes');
    expect(body).toContain('This is the first real post shape for the blog.');
    expect(body).toContain('property="og:type" content="article"');
    expect(body).toContain('name="twitter:card" content="summary"');
    expect(body).toContain('"@type":"BlogPosting"');
  });

  test('mermaid svg lab returns server-rendered HTML', async ({ request }) => {
    const response = await request.get('/experiments/mermaid-svg', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    const body = await response.text();
    expect(body).toContain('Mermaid SVG lab.');
    expect(body).toContain('Static SVG output');
    expect(body).toContain('/experiments/mermaid/flow-static.svg');
  });

  test('unknown HTML routes return uncached 404 responses', async ({ request }) => {
    const response = await request.get('/does-not-exist', {
      headers: { Accept: 'text/html' },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-frontend-renderer']).toBe('tanstack-start');
    expect(await response.text()).toContain('Page not found');
  });

  test('discovery endpoints are available for crawlers and language models', async ({ request }) => {
    const [robots, sitemap, feed, llms, llmsFull, homeMarkdown, archiveMarkdown, postMarkdown, wellKnownLlms] = await Promise.all([
      request.get('/robots.txt', { failOnStatusCode: false }),
      request.get('/sitemap.xml', { failOnStatusCode: false }),
      request.get('/feed.xml', { failOnStatusCode: false }),
      request.get('/llms.txt', { failOnStatusCode: false }),
      request.get('/llms-full.txt', { failOnStatusCode: false }),
      request.get('/index.md', { failOnStatusCode: false }),
      request.get('/posts.md', { failOnStatusCode: false }),
      request.get('/posts/hello-world-formatting-the-factory-notes.md', { failOnStatusCode: false }),
      request.get('/.well-known/llms.txt', { failOnStatusCode: false }),
    ]);

    expect(robots.status()).toBe(200);
    expect((await robots.text()).includes('Disallow: /')).toBeTruthy();

    expect(sitemap.status()).toBe(200);
    expect(sitemap.headers()['content-type']).toContain('application/xml');
    expect(await sitemap.text()).toContain('https://blog.krasnoperov.me/posts/hello-world-formatting-the-factory-notes');

    expect(feed.status()).toBe(200);
    expect(feed.headers()['content-type']).toContain('application/rss+xml');
    expect(await feed.text()).toContain('<rss version="2.0">');

    expect(llms.status()).toBe(200);
    expect(llms.headers()['x-robots-tag']).toBe('noindex, nofollow');
    expect(await llms.text()).toContain('https://blog.krasnoperov.me/posts/hello-world-formatting-the-factory-notes.md');

    expect(llmsFull.status()).toBe(200);
    expect(await llmsFull.text()).toContain('title: Hello World for Factory Notes');

    expect(homeMarkdown.status()).toBe(200);
    expect(homeMarkdown.headers()['content-type']).toContain('text/markdown');
    expect(await homeMarkdown.text()).toContain('# Krasnoperov Blog');

    expect(archiveMarkdown.status()).toBe(200);
    expect(archiveMarkdown.headers()['content-type']).toContain('text/markdown');
    expect(await archiveMarkdown.text()).toContain('# Archive');

    expect(postMarkdown.status()).toBe(200);
    expect(postMarkdown.headers()['content-type']).toContain('text/markdown');
    expect(postMarkdown.headers()['link']).toContain('rel="canonical"');
    expect(await postMarkdown.text()).toContain('```mermaid');

    expect(wellKnownLlms.status()).toBe(200);
    expect(await wellKnownLlms.text()).toContain('# Krasnoperov Blog');
  });
});
