import assert from 'node:assert/strict';
import test from 'node:test';
import { serveMediaAsset } from './media-ranges';

const bytes = new TextEncoder().encode('0123456789');
const assets = {
  fetch: async () =>
    new Response(bytes, {
      headers: {
        'Content-Length': String(bytes.byteLength),
        'Content-Type': 'video/mp4',
        ETag: '"media-etag"',
      },
    }),
} as unknown as Fetcher;

test('serves explicit, open-ended, and suffix media ranges', async () => {
  const cases = [
    ['bytes=3-6', '3456', 'bytes 3-6/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
  ] as const;

  for (const [range, expectedBody, expectedContentRange] of cases) {
    const response = await serveMediaAsset(
      new Request('https://example.com/media/film.mp4', { headers: { Range: range } }),
      assets,
    );

    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Content-Range'), expectedContentRange);
    assert.equal(response.headers.get('Content-Length'), String(expectedBody.length));
    assert.equal(await response.text(), expectedBody);
  }
});

test('rejects unsatisfiable and multi-part media ranges', async () => {
  for (const range of ['bytes=20-', 'bytes=0-1,4-5']) {
    const response = await serveMediaAsset(
      new Request('https://example.com/media/film.mp4', { headers: { Range: range } }),
      assets,
    );

    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), 'bytes */10');
    assert.equal(await response.text(), '');
  }
});

test('streams the complete asset when no range is requested', async () => {
  const response = await serveMediaAsset(new Request('https://example.com/media/film.mp4'), assets);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(await response.text(), '0123456789');
});
