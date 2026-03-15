import type { Context, Next } from 'hono';
import type { AppContext } from '../routes/types';
import { resolveRequestAuth } from '../features/auth/request-auth';

type AuthFailureReason = 'invalid_token' | 'missing_token' | 'user_not_found';

type AuthMiddlewareOptions = {
  loadUser?: boolean;
  onAuthFailure?: (c: Context<AppContext>, reason: AuthFailureReason) => void;
};

export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const { loadUser = true, onAuthFailure } = options;

  return async (c: Context<AppContext>, next: Next) => {
    const auth = await resolveRequestAuth(c, { loadUser });

    if (auth.kind === 'missing') {
      onAuthFailure?.(c, 'missing_token');
      return c.json({ error: 'Not authenticated' }, 401);
    }

    if (auth.kind === 'invalid_token') {
      onAuthFailure?.(c, 'invalid_token');
      return c.json({ error: 'Invalid token' }, 401);
    }

    if (loadUser && !auth.user) {
      onAuthFailure?.(c, 'user_not_found');
      return c.json({ error: 'User not found' }, 404);
    }

    c.set('userId', auth.userId);
    c.set('authIsTestSession', auth.isTestSession);
    if (auth.user) {
      c.set('authUser', auth.user);
    }

    await next();
  };
}
