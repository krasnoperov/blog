import { Hono } from 'hono';
import type { AppContext } from './types';
import { AuthService } from '../features/auth/auth-service';
import { UserDAO } from '../../dao/user-dao';
import { getAuthToken } from '../auth';

const userRoutes = new Hono<AppContext>();

// User settings endpoint
userRoutes.put('/api/user/settings', async (c) => {
  try {
    const container = c.get('container');
    const authService = container.get(AuthService);
    const userDAO = container.get(UserDAO);

    // Check authentication
    const cookieHeader = c.req.header("Cookie");
    const token = getAuthToken(cookieHeader || null);

    if (!token) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const payload = await authService.verifyJWT(token);
    if (!payload) {
      return c.json({ error: 'Invalid authentication' }, 401);
    }

    // Get and validate request body
    const body = await c.req.json();
    const { name } = body;

    // Update user settings
    await userDAO.updateSettings(payload.userId, {
      name,
    });

    // Return updated user
    const user = await userDAO.findById(payload.userId);
    if (!user) {
      return c.json({ error: 'User not found after update' }, 500);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        google_id: user.google_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// User profile endpoints
userRoutes.get('/api/user/profile', async (c) => {
  const container = c.get('container');
  const authService = container.get(AuthService);

  const cookieHeader = c.req.header("Cookie");
  const token = getAuthToken(cookieHeader || null);

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const payload = await authService.verifyJWT(token);
  if (!payload) {
    return c.json({ error: 'Invalid authentication' }, 401);
  }

  const userDAO = container.get(UserDAO);
  const user = await userDAO.findById(payload.userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

userRoutes.patch('/api/user/profile', async (c) => {
  const container = c.get('container');
  const authService = container.get(AuthService);

  const cookieHeader = c.req.header("Cookie");
  const token = getAuthToken(cookieHeader || null);

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const payload = await authService.verifyJWT(token);
  if (!payload) {
    return c.json({ error: 'Invalid authentication' }, 401);
  }

  const userDAO = container.get(UserDAO);
  const user = await userDAO.findById(payload.userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const body = await c.req.json();
  const { name } = body;

  // Validate name if provided
  if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
    return c.json({ error: 'Name is required and must be a non-empty string' }, 400);
  }

  // Update user settings
  await userDAO.updateSettings(user.id, {
    name: name !== undefined ? name.trim() : undefined,
  });

  // Fetch updated user
  const updatedUser = await userDAO.findById(user.id);

  return c.json({
    success: true,
    user: {
      id: updatedUser!.id,
      email: updatedUser!.email,
      name: updatedUser!.name,
    },
  });
});

export { userRoutes };