import type { Context } from 'hono';
import type { Env } from '../core/types';
import { buildHtmlLinkHeader } from './discovery';
// Built by `npm run build` before worker deploy.
// @ts-expect-error Generated TanStack Start server bundle lives outside src/.
import startServer from '../../dist/frontend-start/server/server.js';

type AppContext = Context<{ Bindings: Env }>;

export async function renderStartApp(c: AppContext): Promise<Response> {
  const response = await startServer.fetch(c.req.raw);
  const path = new URL(c.req.url).pathname;

  const out = new Response(response.body, response);
  out.headers.set(
    'Cache-Control',
    response.status >= 400 ? 'no-store' : 'public, max-age=300',
  );
  out.headers.set('X-Llms-Txt', '/llms.txt');
  out.headers.set('X-Frontend-Renderer', 'tanstack-start');
  const linkHeader = buildHtmlLinkHeader(path);
  if (linkHeader) {
    out.headers.set('Link', linkHeader);
  }
  return out;
}

export async function renderStartDynamicApp(c: AppContext): Promise<Response | null> {
  const requestUrl = new URL(c.req.url);
  const path = requestUrl.pathname;
  const accept = c.req.header('Accept') || '';

  if (!['GET', 'HEAD'].includes(c.req.method)) {
    return null;
  }
  if (path.startsWith('/api/')) {
    return null;
  }
  if (/\.[a-zA-Z0-9]+$/.test(path)) {
    return null;
  }
  if (!accept.includes('text/html') && !accept.includes('*/*')) {
    return null;
  }

  return renderStartApp(c);
}
