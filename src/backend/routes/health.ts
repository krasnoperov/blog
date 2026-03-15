import { OpenAPIHono } from '@hono/zod-openapi';
import type { AppContext } from './types';
import { registerContractRoute } from '../openapi/contract-openapi';

const healthRoutes = new OpenAPIHono<AppContext>();

registerContractRoute(healthRoutes, 'healthCheck', (c) => {
  console.log('health-check:hello', { env: c.env.ENVIRONMENT });
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
}, { tags: ['Health'] });

registerContractRoute(healthRoutes, 'hello', (c) => {
  console.log('hello-route:visited');
  return c.json({ message: 'API foundation ready' });
}, { tags: ['Health'] });

export { healthRoutes };
