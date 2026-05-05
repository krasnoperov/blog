import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'audit.spec.ts',
  outputDir: 'test-results',
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? 'http://localhost:3000',
    // Default: only keep heavy artefacts on failure.
    // Override per run: AUDIT_KEEP_VIDEO=1 / AUDIT_KEEP_TRACE=1 to retain on success too.
    trace:      process.env.AUDIT_KEEP_TRACE ? 'on' : 'retain-on-failure',
    video:      process.env.AUDIT_KEEP_VIDEO ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      // iPhone 13 viewport/UA on Chromium — avoids requiring a separate WebKit install.
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
});
