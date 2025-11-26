import { Hono } from 'hono';
import type { AppContext } from './types';

const healthRoutes = new Hono<AppContext>();

healthRoutes.get('/api/health', (c) => {
  console.log('health-check:hello', { env: c.env.ENVIRONMENT });
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

healthRoutes.get('/api/hello', (c) => {
  console.log('hello-route:visited');
  return c.json({ message: 'API foundation ready' });
});

export { healthRoutes };