import type { Context } from 'hono';
import { getAuthToken } from './auth';
import { AuthController } from './features/auth/auth-controller';
import { AuthService } from './features/auth/auth-service';
import { readTestSessionOverride, TEST_SESSION_HEADER } from './features/auth/test-session';
import type { AppContext } from './routes/types';
// Built by `npm run build` before worker deploy.
// @ts-expect-error Generated TanStack Start server bundle lives outside src/.
import startServer from '../../dist/frontend-start/server/server.js';

async function resolveBootstrapSession(c: Context<AppContext>) {
  const container = c.get('container');
  const authService = container.get(AuthService);
  const authController = container.get(AuthController);

  const session = {
    config: {
      googleClientId: c.env.GOOGLE_CLIENT_ID || '',
      environment: c.env.ENVIRONMENT || 'development',
    },
    user: null as Awaited<ReturnType<AuthController['getCurrentUser']>>['user'] | null,
  };

  const testSessionUser = readTestSessionOverride(c.env, c.req.header(TEST_SESSION_HEADER));
  if (testSessionUser !== undefined) {
    session.user = testSessionUser;
    return session;
  }

  const token = getAuthToken(c.req.header('Cookie') || null);
  if (!token) {
    return session;
  }

  const payload = await authService.verifyJWT(token);
  if (!payload) {
    return session;
  }

  const result = await authController.getCurrentUser(payload.userId);
  if (!result.error && result.user) {
    session.user = result.user;
  }

  return session;
}

export async function renderStartApp(c: Context<AppContext>): Promise<Response> {
  const bootstrap = {
    session: await resolveBootstrapSession(c),
  };

  const { app } = await import('./index');
  const response = await startServer.fetch(c.req.raw, {
    context: {
      apiFetch: (request: Request) => app.fetch(request, c.env, c.executionCtx),
      bootstrap,
      requestMeta: {
        authorizationHeader: c.req.header('Authorization') ?? undefined,
        cookieHeader: c.req.header('Cookie') ?? undefined,
        origin: new URL(c.req.url).origin,
        testSessionHeader: c.req.header(TEST_SESSION_HEADER) ?? undefined,
      },
    },
  });

  const out = new Response(response.body, response);
  out.headers.set('Cache-Control', 'private, no-store');
  out.headers.set('X-Frontend-Renderer', 'tanstack-start');
  return out;
}

export async function renderStartDynamicApp(c: Context<AppContext>): Promise<Response | null> {
  const requestUrl = new URL(c.req.url);
  const path = requestUrl.pathname;
  const accept = c.req.header('Accept') || '';

  if (!['GET', 'HEAD'].includes(c.req.method)) {
    return null;
  }
  if (path.startsWith('/api/') || path.startsWith('/.well-known/')) {
    return null;
  }
  if (/\.[a-zA-Z0-9]+$/.test(path)) {
    return null;
  }
  if (!accept.includes('text/html') && !accept.includes('*/*')) {
    return null;
  }

  return renderStartApp(c);
}
