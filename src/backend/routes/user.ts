import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { AppContext } from './types';
import { AuthService } from '../features/auth/auth-service';
import { UserDAO } from '../../dao/user-dao';
import { getAuthToken } from '../auth';
import { registerContractRoute } from '../openapi/contract-openapi';

const userRoutes = new OpenAPIHono<AppContext>();

async function requireAuthenticatedUser(c: Context<AppContext>) {
  const container = c.get('container');
  const authService = container.get(AuthService);

  const cookieHeader = c.req.header('Cookie');
  const token = getAuthToken(cookieHeader || null);

  if (!token) {
    return { error: c.json({ error: 'Authentication required' }, 401) };
  }

  const payload = await authService.verifyJWT(token);
  if (!payload) {
    return { error: c.json({ error: 'Invalid authentication' }, 401) };
  }

  const userDAO = container.get(UserDAO);
  const user = await userDAO.findById(payload.userId);

  if (!user) {
    return { error: c.json({ error: 'User not found' }, 404) };
  }

  return { user, userDAO };
}

registerContractRoute(userRoutes, 'userProfileGet', async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if ('error' in auth) {
    return auth.error;
  }

  return c.json({
    id: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
  });
}, { tags: ['User'] });

registerContractRoute(userRoutes, 'userProfileUpdate', async (c) => {
  const auth = await requireAuthenticatedUser(c);
  if ('error' in auth) {
    return auth.error;
  }

  const { name } = c.req.valid('json');

  await auth.userDAO.updateSettings(auth.user.id, {
    name,
  });

  const updatedUser = await auth.userDAO.findById(auth.user.id);

  return c.json({
    success: true,
    user: {
      id: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
    },
  });
}, {
  errorMessage: 'Invalid request payload',
  tags: ['User'],
});

export { userRoutes };
