import assert from 'node:assert/strict';
import test from 'node:test';
import { legacyHostRedirect } from './redirects';

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
