import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from './types';
import { AuthHandler } from '../features/auth/auth-handler';
import { registerContractRoute } from '../openapi/contract-openapi';

const authRoutes = new OpenAPIHono<AppContext>();

registerContractRoute(authRoutes, 'authSession', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.getSession(c);
}, { tags: ['Auth'] });

registerContractRoute(authRoutes, 'authGoogle', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.googleAuth(c, c.req.valid('json'));
}, {
  errorMessage: 'Invalid request payload',
  tags: ['Auth'],
});

registerContractRoute(authRoutes, 'authLogout', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.logout(c);
}, { tags: ['Auth'] });

export { authRoutes };
