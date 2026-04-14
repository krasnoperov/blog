import { Hono } from 'hono';
import type { Env } from '../core/types';
import {
  buildFeedXml,
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMarkdownLinkHeader,
  buildRobotsTxt,
  buildSitemapXml,
  getMarkdownVariant,
} from './discovery';
import { renderStartDynamicApp } from './frontend-start-ssr';

export type Bindings = Env;
export type AppContext = {
  Bindings: Bindings;
};

const app = new Hono<AppContext>();

app.get('/robots.txt', (c) => {
  const content = buildRobotsTxt(c.env.ENVIRONMENT === 'production');

  return c.text(content, 200, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
});

app.get('/sitemap.xml', (c) => {
  return c.body(buildSitemapXml(), 200, {
    'Content-Type': 'application/xml; charset=utf-8',
  });
});

app.get('/feed.xml', (c) => {
  return c.body(buildFeedXml(), 200, {
    'Content-Type': 'application/rss+xml; charset=utf-8',
  });
});

app.get('/llms.txt', (c) => {
  return c.text(buildLlmsTxt(), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
  });
});

app.get('/llms-full.txt', (c) => {
  return c.text(buildLlmsFullTxt(), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
  });
});

app.get('/.well-known/llms.txt', (c) => {
  return c.text(buildLlmsTxt(), 200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    environment: c.env.ENVIRONMENT ?? 'development',
  });
});

app.notFound(async (c) => {
  const path = new URL(c.req.url).pathname;
  const markdownVariant = getMarkdownVariant(path);
  if (markdownVariant) {
    return c.body(markdownVariant.content, 200, {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Link': buildMarkdownLinkHeader(markdownVariant.canonicalPath),
      'X-Llms-Txt': '/llms.txt',
      'X-Robots-Tag': 'noindex, nofollow',
    });
  }

  if (path.startsWith('/api/')) {
    return c.json({ error: 'Not found' }, 404);
  }

  const startApp = await renderStartDynamicApp(c);
  if (startApp) {
    return startApp;
  }

  return c.env.ASSETS.fetch(new Request(c.req.url));
});

export default {
  fetch: app.fetch,
};

export { app };
