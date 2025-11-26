import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const runCli = (args: string[], cwd: string): Promise<{ stdout: string; stderr: string; code: number | null }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'node',
      ['--import', '@swc-node/register/esm-register', 'src/cli/index.ts', ...args],
      { cwd },
    );

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
  });
};

test('help command displays available commands', async () => {
  const cwd = process.cwd();
  const result = await runCli(['help'], cwd);

  assert.equal(result.code, 0, `CLI exited with code ${result.code}; stderr: ${result.stderr}`);
  assert.ok(result.stdout.includes('login'), 'Help output should include login command');
  assert.ok(result.stdout.includes('logout'), 'Help output should include logout command');
});
