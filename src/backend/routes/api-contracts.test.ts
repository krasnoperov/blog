import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { apiContracts, type ApiContractKey } from '../../shared/api-contracts';

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (full.endsWith('.ts') && !full.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

const contractEntries = Object.entries(apiContracts) as Array<
  [ApiContractKey, (typeof apiContracts)[ApiContractKey]]
>;

describe('route contract registration', () => {
  test('every contract key has a registerContractRoute call in route files', () => {
    const routesDir = join(import.meta.dirname ?? __dirname, 'index.ts', '..');
    const routeFiles = collectTsFiles(routesDir);
    const allSource = routeFiles.map((file) => readFileSync(file, 'utf-8')).join('\n');

    const unregistered: string[] = [];
    for (const [key] of contractEntries) {
      const pattern = new RegExp(`registerContractRoute\\([^,]+,\\s*['"]${key}['"]`);
      if (!pattern.test(allSource)) {
        unregistered.push(key);
      }
    }

    assert.deepEqual(
      unregistered,
      [],
      `Contract keys not registered in any route file: ${unregistered.join(', ')}`,
    );
  });
});
