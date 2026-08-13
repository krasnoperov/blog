import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyHostRedirect, legacyPostRedirect } from './redirects';

test('redirects renamed posts and their Markdown sources to canonical URLs', () => {
  const cases = [
    [
      'https://krasnoperov.me/posts/two-films-about-durable-objects?utm_source=x',
      'https://krasnoperov.me/posts/how-durable-objects-work?utm_source=x',
    ],
    [
      'https://krasnoperov.me/posts/two-films-about-durable-objects.md',
      'https://krasnoperov.me/posts/how-durable-objects-work.md',
    ],
    [
      'https://krasnoperov.me/posts/writing-practice-on-celld',
      'https://krasnoperov.me/posts/a-writing-agent-with-durable-objects',
    ],
    [
      'https://krasnoperov.me/posts/writing-practice-on-celld.md',
      'https://krasnoperov.me/posts/a-writing-agent-with-durable-objects.md',
    ],
    [
      'https://blog.krasnoperov.me/posts/two-films-about-durable-objects',
      'https://krasnoperov.me/posts/how-durable-objects-work',
    ],
  ] as const;

  for (const [from, to] of cases) {
    const response = legacyPostRedirect(new Request(from));

    assert.ok(response, from);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), to);
  }
});

test('leaves canonical and unrelated post paths untouched', () => {
  for (const path of [
    '/posts/how-durable-objects-work',
    '/posts/a-writing-agent-with-durable-objects.md',
    '/posts/patchrelay',
  ]) {
    assert.equal(legacyPostRedirect(new Request(`https://krasnoperov.me${path}`)), null, path);
  }
});

test('redirects the legacy blog host to the apex, preserving path and query', () => {
  const response = legacyHostRedirect(
    new Request('https://blog.krasnoperov.me/posts/patchrelay?utm_source=rss'),
  );

  assert.ok(response);
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://krasnoperov.me/posts/patchrelay?utm_source=rss',
  );
});

test('redirects www hosts to the apex', () => {
  for (const host of ['www.blog.krasnoperov.me', 'www.krasnoperov.me']) {
    const response = legacyHostRedirect(new Request(`https://${host}/feed.xml`));

    assert.ok(response, host);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://krasnoperov.me/feed.xml');
  }
});

test('leaves canonical, stage, and local hosts untouched', () => {
  for (const origin of [
    'https://krasnoperov.me',
    'https://blog-stage.krasnoperov.me',
    'http://localhost:8788',
  ]) {
    assert.equal(legacyHostRedirect(new Request(`${origin}/posts`)), null, origin);
  }
});
