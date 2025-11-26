import { Hono } from 'hono';
import type { Env } from '../core/types';
import { createContainer } from '../core/container';
import { registerRoutes } from './routes';
import { uploadSecurityMiddleware } from './middleware/upload-security';
import type { AppContext } from './routes/types';

export type Bindings = Env;

const app = new Hono<AppContext>();

// Middleware to set up container
app.use('*', async (c, next) => {
  const container = createContainer(c.env);
  c.set('container', container);
  await next();
});

// Apply upload security middleware to upload routes
app.use('/api/upload/*', uploadSecurityMiddleware());

// Register all routes
registerRoutes(app);

// Queue handler - bare foundation (no processing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
async function handleQueue(batch: MessageBatch<any>, env: Env): Promise<void> {
  // No queue processing in bare foundation
  // Acknowledge all messages to prevent retries
  for (const message of batch.messages) {
    message.ack();
  }

  // --- FUTURE: Add queue processing when implementing workflows ---
  // Example:
  // const container = createContainer(env);
  //
  // for (const message of batch.messages) {
  //   try {
  //     const msg = message.body as MyQueueMessage;
  //
  //     if (msg.type === 'my-job-type') {
  //       // Start workflow
  //       const instance = await env.MY_WORKFLOW.create({
  //         params: { jobId: msg.jobId, ...msg.params }
  //       });
  //
  //       message.ack();
  //     } else {
  //       console.error('Unknown message type:', msg.type);
  //       message.retry();
  //     }
  //   } catch (error) {
  //     console.error('Queue processing error:', error);
  //     message.retry({ delaySeconds: 60 });
  //   }
  // }
}

// No custom notFound handler needed!
// With not_found_handling = "single-page-application" in wrangler.toml:
// - API routes that match will return their responses
// - Unmatched routes fall through to Assets middleware
// - Assets serves the file if it exists, or index.html for SPA routing

// Export as default for standalone use
export default {
  fetch: app.fetch,
  queue: handleQueue,
};

// Also export the app and handleQueue for the unified worker
export { app, handleQueue };