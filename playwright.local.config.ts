import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? '8788');
const baseURL = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/ui',
  timeout: 20_000,
  retries: 1,
  workers: 2,
  fullyParallel: true,
  outputDir: './test-results/ui',
  use: {
    baseURL,
    storageState: { cookies: [], origins: [] },
    navigationTimeout: 10_000,
    actionTimeout: 5_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run test:ui:serve',
    port,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: process.env.PLAYWRIGHT_WORKER_VERBOSE ? 'pipe' : 'ignore',
    stderr: process.env.PLAYWRIGHT_WORKER_VERBOSE ? 'pipe' : 'ignore',
  },
});
