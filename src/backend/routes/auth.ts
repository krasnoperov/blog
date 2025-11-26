import { Hono } from 'hono';
import type { AppContext } from './types';
import { AuthHandler } from '../features/auth/auth-handler';

const authRoutes = new Hono<AppContext>();

authRoutes.get('/api/auth/session', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.getSession(c);
});

authRoutes.post('/api/auth/google', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.googleAuth(c);
});

authRoutes.post('/api/auth/logout', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.logout(c);
});

export { authRoutes };