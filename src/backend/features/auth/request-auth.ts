import type { Context } from 'hono';
import type { User } from '../../../db/types';
import { getAuthToken } from '../../auth';
import type { AppContext } from '../../routes/types';
import { UserDAO } from '../../../dao/user-dao';
import { AuthService } from './auth-service';
import { readTestSessionOverride, TEST_SESSION_HEADER, type TestSessionUser } from './test-session';

export type AuthenticatedRequestUser = Pick<
  User,
  'id' | 'email' | 'name' | 'google_id' | 'created_at' | 'updated_at'
>;

export type RequestAuthState =
  | { kind: 'missing' }
  | { kind: 'invalid_token' }
  | {
    kind: 'authenticated';
    isTestSession: boolean;
    user: AuthenticatedRequestUser | TestSessionUser | null;
    userId: number;
  };

type ResolveRequestAuthOptions = {
  loadUser?: boolean;
};

function getBearerToken(authorizationHeader?: string | null): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim() || null;
}

export async function resolveRequestAuth(
  c: Context<AppContext>,
  options: ResolveRequestAuthOptions = {},
): Promise<RequestAuthState> {
  const { loadUser = true } = options;
  const testSessionUser = readTestSessionOverride(c.env, c.req.header(TEST_SESSION_HEADER));

  if (testSessionUser !== undefined) {
    if (testSessionUser === null) {
      return { kind: 'missing' };
    }

    return {
      kind: 'authenticated',
      isTestSession: true,
      user: testSessionUser,
      userId: testSessionUser.id,
    };
  }

  const token = getBearerToken(c.req.header('Authorization'))
    ?? getAuthToken(c.req.header('Cookie') || null);

  if (!token) {
    return { kind: 'missing' };
  }

  const container = c.get('container');
  const authService = container.get(AuthService);
  const payload = await authService.verifyJWT(token);

  if (!payload) {
    return { kind: 'invalid_token' };
  }

  if (!loadUser) {
    return {
      kind: 'authenticated',
      isTestSession: false,
      user: null,
      userId: payload.userId,
    };
  }

  const userDAO = container.get(UserDAO);
  const user = await userDAO.findById(payload.userId);

  return {
    kind: 'authenticated',
    isTestSession: false,
    user: user ?? null,
    userId: payload.userId,
  };
}
