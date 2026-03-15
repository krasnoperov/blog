import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { requestContract } from './api';
import { ApiError } from '../../shared/api-error';

describe('frontend API client error handling', () => {
  test('structured error response preserves code and retryable on ApiError', async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = (async () => new Response(JSON.stringify({
        error: 'Quota exceeded',
        code: 'QUOTA_EXCEEDED',
        retryable: false,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

      await assert.rejects(
        () => requestContract('authSession'),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.message, 'Quota exceeded');
          assert.equal(error.status, 403);
          assert.equal(error.code, 'QUOTA_EXCEEDED');
          assert.equal(error.retryable, false);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('non-JSON error response falls back to status text', async () => {
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = (async () => new Response('Gateway Timeout', {
        status: 504,
        statusText: 'Gateway Timeout',
      })) as typeof fetch;

      await assert.rejects(
        () => requestContract('authSession'),
        (error: unknown) => {
          assert.ok(error instanceof ApiError);
          assert.equal(error.status, 504);
          assert.equal(error.message, 'Gateway Timeout');
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
