import { app } from '../backend/index';
import type { Env } from '../core/types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await app.fetch(request, env, ctx);

    if (env.ENVIRONMENT !== 'stage' || response.webSocket || response.status === 101) {
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
