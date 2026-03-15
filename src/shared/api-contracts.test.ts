import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { apiContracts } from './api-contracts';
import { apiRouteMeta, buildApiPath } from './api-routes';

describe('apiContracts', () => {
  test('buildApiPath appends query params', () => {
    const path = buildApiPath('oauthAuthorize', {}, {
      client_id: 'local-engine',
      redirect_uri: 'https://example.com/callback',
      response_type: 'code',
      state: 'draft 1',
    });

    assert.equal(
      path,
      '/api/oauth/authorize?client_id=local-engine&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&response_type=code&state=draft+1',
    );
  });

  test('apiRouteMeta stays in sync with runtime contracts', () => {
    const contractEntries = Object.entries(apiContracts).map(([key, contract]) => [
      key,
      { method: contract.method, path: contract.path },
    ]);
    const routeEntries = Object.entries(apiRouteMeta);

    assert.deepEqual(routeEntries, contractEntries);
  });
});
