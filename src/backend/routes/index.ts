/**
 * Central route registration file
 * Organizes all API routes into logical groups
 */
import type { Hono } from 'hono';
import type { AppContext } from './types';

// Import route modules
import { healthRoutes } from './health';
import { oauthRoutes } from './oauth';
import { authRoutes } from './auth';
import { userRoutes } from './user';

/**
 * Register all routes with the main app
 */
export function registerRoutes(app: Hono<AppContext>) {
  // Health check routes
  app.route('/', healthRoutes);

  // OAuth/OpenID Connect routes
  app.route('/', oauthRoutes);

  // Authentication routes
  app.route('/', authRoutes);

  // User profile routes
  app.route('/', userRoutes);

  // --- FUTURE: Add your domain-specific routes here ---
  // Example:
  // import { assetRoutes } from './assets';
  // app.route('/', assetRoutes);
  //
  // Example: Upload routes
  // import { uploadRoutes } from './upload';
  // app.route('/', uploadRoutes);
}
