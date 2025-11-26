// Processing Worker: Queue Consumer + Workflows + Workflow Status API
// This worker handles all background processing

import 'reflect-metadata';
import { Hono } from 'hono';
import { handleQueue } from '../backend/index';
import type { Env } from '../core/types';

// Simple Hono app for health checks and future workflow status endpoints
const app = new Hono<{ Bindings: Env }>();

// --- FUTURE: Workflow status endpoint ---
// app.get('/api/workflow/:instanceId', async (c) => {
//   const { instanceId } = c.req.param();
//   try {
//     const instance = await c.env.MY_WORKFLOW.get(instanceId);
//     if (!instance) {
//       return c.json({ error: 'Workflow instance not found', instanceId }, 404);
//     }
//     const status = await instance.status();
//     return c.json({ instanceId, status });
//   } catch (error) {
//     console.error('Error fetching workflow status:', error);
//     return c.json({
//       error: 'Failed to fetch workflow status',
//       instanceId,
//       details: error instanceof Error ? error.message : String(error)
//     }, 500);
//   }
// });

// Health check endpoint
app.get('/api/health', (c) => {
  console.log('[Processing Worker] Health check request received');
  return c.json({ status: 'ok', worker: 'processing' });
});

// Export processing worker with queue capabilities
export default {
  // HTTP handler for health checks and future workflow status
  fetch: app.fetch,

  // Queue consumer handler
  queue: handleQueue,
};

// --- FUTURE: Export your Workflow classes here ---
// Example:
// export { MyWorkflow } from '../backend/workflows/MyWorkflow';
