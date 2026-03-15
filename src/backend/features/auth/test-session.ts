import { z } from 'zod';
import type { Env } from '../../../core/types';

export const TEST_SESSION_HEADER = 'x-whitelabel-test-session';

const TestSessionUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  google_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export interface TestSessionUser {
  id: number;
  email: string;
  name: string;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

function isLocalLikeEnvironment(env: Env): boolean {
  return env.ENVIRONMENT === 'local' || env.ENVIRONMENT === 'development' || env.ENVIRONMENT === undefined;
}

export function readTestSessionOverride(
  env: Env,
  rawHeader?: string | null,
): TestSessionUser | null | undefined {
  if (!rawHeader || !isLocalLikeEnvironment(env)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawHeader)) as unknown;
    if (parsed === null) {
      return null;
    }

    const user = TestSessionUserSchema.parse(parsed);
    const timestamp = new Date().toISOString();
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      google_id: user.google_id ?? null,
      created_at: user.created_at ?? timestamp,
      updated_at: user.updated_at ?? timestamp,
    };
  } catch {
    return undefined;
  }
}
