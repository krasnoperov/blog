import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { apiContracts, type ApiContractKey } from '../shared/api-contracts';
import { toContractOpenApiRoute } from './openapi/contract-openapi';

function toOpenApiPath(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
}

const contractEntries = Object.entries(apiContracts) as Array<
  [ApiContractKey, (typeof apiContracts)[ApiContractKey]]
>;

describe('OpenAPI generation', () => {
  test('every contract key produces a valid OpenAPI route', () => {
    for (const [key] of contractEntries) {
      const route = toContractOpenApiRoute(key);
      assert.ok(route, `Failed to build OpenAPI route for ${key}`);
      assert.equal(route.operationId, key);
    }
  });

  test('contract routes include standard response schemas', () => {
    for (const [key] of contractEntries) {
      const route = toContractOpenApiRoute(key);
      const responses = route.responses as Record<string, unknown>;

      assert.ok(responses[200], `Missing 200 response for ${key}`);
      assert.ok(responses[401], `Missing 401 response for ${key}`);
      assert.ok(responses[404], `Missing 404 response for ${key}`);
      assert.ok(responses[500], `Missing 500 response for ${key}`);
    }
  });

  test('every contract path converts to valid OpenAPI path syntax', () => {
    for (const [key, contract] of contractEntries) {
      const openApiPath = toOpenApiPath(contract.path);
      assert.ok(!openApiPath.includes(':'), `Contract ${key} has unconverted path param in ${openApiPath}`);
    }
  });
});
