import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { readTestSessionOverride } from './test-session';

function encode(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

describe('readTestSessionOverride', () => {
  test('uses test-session override in local environments', () => {
    const result = readTestSessionOverride({
      ENVIRONMENT: 'local',
    } as never, encode({
      id: 7,
      email: 'local@example.com',
      name: 'Local Tester',
    }));

    assert.equal(result?.email, 'local@example.com');
    assert.equal(result?.google_id, null);
  });

  test('ignores test-session override outside local-style environments', () => {
    const result = readTestSessionOverride({
      ENVIRONMENT: 'production',
    } as never, encode({
      id: 7,
      email: 'prod@example.com',
      name: 'Should Be Ignored',
    }));

    assert.equal(result, undefined);
  });
});
