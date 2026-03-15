import type { Page } from '@playwright/test';

export interface TestSessionUser {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export const AUTHENTICATED_USER: TestSessionUser = {
  id: 7,
  email: 'playwright@example.com',
  name: 'Playwright Tester',
  google_id: null,
  created_at: '2026-03-15T00:00:00.000Z',
  updated_at: '2026-03-15T00:00:00.000Z',
};

function encodeTestSessionHeader(user: TestSessionUser | null): string {
  return encodeURIComponent(JSON.stringify(user));
}

export async function useTestSession(page: Page, user: TestSessionUser | null) {
  await page.context().setExtraHTTPHeaders({
    'x-whitelabel-test-session': encodeTestSessionHeader(user),
  });
}
