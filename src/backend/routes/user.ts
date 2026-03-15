import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from './types';
import { UserDAO } from '../../dao/user-dao';
import { createAuthMiddleware } from '../middleware/auth-middleware';
import { registerContractRoute } from '../openapi/contract-openapi';

const userRoutes = new OpenAPIHono<AppContext>();
userRoutes.use('/api/user/*', createAuthMiddleware());

registerContractRoute(userRoutes, 'userProfileGet', async (c) => {
  const user = c.get('authUser');
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
}, { tags: ['User'] });

registerContractRoute(userRoutes, 'userProfileUpdate', async (c) => {
  const user = c.get('authUser');
  const userId = c.get('userId');

  if (!user || !userId) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (c.get('authIsTestSession')) {
    return c.json({ error: 'Test sessions are read-only' }, 403);
  }

  const { name } = c.req.valid('json');
  const userDAO = c.get('container').get(UserDAO);

  await userDAO.updateSettings(userId, {
    name,
  });

  const updatedUser = await userDAO.findById(userId);

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
