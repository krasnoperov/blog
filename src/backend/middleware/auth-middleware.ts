import type { Context, Next } from 'hono';
import type { Container } from 'inversify';
import type { Env } from '../../core/types';
import { AuthService } from '../features/auth/auth-service';

/**
 * Extract token from request headers (Bearer token or cookie)
 */
function extractToken(c: Context): string | undefined {
  // Check Authorization header first for Bearer token
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Fall back to cookie
  const cookieHeader = c.req.header('Cookie');
  return cookieHeader
    ?.split('; ')
    .find((row) => row.startsWith('auth_token='))
    ?.split('=')[1];
}

/**
 * Create auth middleware that validates JWT tokens
 */
export function createAuthMiddleware() {
  return async (c: Context<{ Bindings: Env; Variables: { userId: number; container: Container } }>, next: Next) => {
    const container = c.get('container');
    const authService = container.get(AuthService);

    const token = extractToken(c);

    if (!token) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const payload = await authService.verifyJWT(token);
    if (!payload) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('userId', payload.userId);
    await next();
  };
}