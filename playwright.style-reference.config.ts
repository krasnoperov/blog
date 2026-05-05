import { defineConfig, devices } from '@playwright/test';

// Style-reference gallery: captures every public route at four breakpoints in
// light + dark colour schemes. Output is a static HTML report suitable for
// design review and design-tool handoff. Output is gitignored under
// audit-out/style-reference/.
//
// Run against the live deployment:
//   AUDIT_BASE_URL=https://blog.krasnoperov.me \
//     npx playwright test -c playwright.style-reference.config.ts
//
// Run against a local dev server (start `npm run dev` separately):
//   AUDIT_BASE_URL=http://localhost:3001 \
//     npx playwright test -c playwright.style-reference.config.ts
//
// The pages live behind one set of public routes (`/`, `/posts`, `/posts/:slug`)
// — no Ladle, no auth — so this config does not start a webServer; the test
// expects an already-running URL.

export default defineConfig({
  testDir: './tests/style-reference',
  testMatch: 'style-reference.spec.ts',
  outputDir: './audit-out/style-reference',
  timeout: 60_000,
  retries: 0,
  fullyParallel: true,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'audit-out/style-reference-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? 'http://localhost:3001',
    trace: process.env.AUDIT_KEEP_TRACE ? 'on' : 'retain-on-failure',
    video: process.env.AUDIT_KEEP_VIDEO ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  // Two colour-scheme variants per viewport size = 8 projects. Matches the
  // breakpoint set in subtitles' audit config (375 / 768 / 1280 / 1440) so
  // designers comparing the systems read the same widths.
  projects: [
    { name: 'desktop-light',     use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, colorScheme: 'light' } },
    { name: 'desktop-dark',      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 }, colorScheme: 'dark' } },
    { name: 'desktop-lg-light',  use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
    { name: 'desktop-lg-dark',   use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
    { name: 'tablet-light',      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, colorScheme: 'light' } },
    { name: 'tablet-dark',       use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, colorScheme: 'dark' } },
    { name: 'phone-light',       use: { ...devices['iPhone 13'], browserName: 'chromium', colorScheme: 'light' } },
    { name: 'phone-dark',        use: { ...devices['iPhone 13'], browserName: 'chromium', colorScheme: 'dark' } },
  ],
});
