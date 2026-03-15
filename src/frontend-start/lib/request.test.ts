import assert from 'node:assert/strict';
import test from 'node:test';
import { requestContract, shouldSkipStartSsrPrefetch } from './request';

test('requestContract uses explicit server request metadata during SSR', async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ headers: Headers; url: string }> = [];

  globalThis.fetch = (async (input, init) => {
    const request = input instanceof Request ? input : null;
    calls.push({
      headers: request ? new Headers(request.headers) : new Headers(init?.headers),
      url: request?.url ?? String(input),
    });

    return new Response(
      JSON.stringify({
        config: {
          googleClientId: 'google-client',
        },
        user: null,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  }) as typeof fetch;

  try {
    const response = await requestContract(
      'authSession',
      undefined,
      {},
      {
        serverContext: {
          requestMeta: {
            authorizationHeader: 'Bearer token',
            cookieHeader: 'sid=abc',
            origin: 'https://whitelabel.krasnoperov.me',
            testSessionHeader: '%7B%22id%22%3A1%7D',
          },
        },
      },
    );

    assert.equal(response.user, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://whitelabel.krasnoperov.me/api/auth/session');
    assert.equal(calls[0]?.headers.get('authorization'), 'Bearer token');
    assert.equal(calls[0]?.headers.get('cookie'), 'sid=abc');
    assert.equal(calls[0]?.headers.get('x-whitelabel-test-session'), '%7B%22id%22%3A1%7D');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('shouldSkipStartSsrPrefetch respects explicit test-session context', async () => {
  const result = await shouldSkipStartSsrPrefetch(true, {
    serverContext: {
      requestMeta: {
        origin: 'https://whitelabel.krasnoperov.me',
        testSessionHeader: '%7B%22id%22%3A1%7D',
      },
    },
  });

  assert.equal(result, true);
});
