import { SITE_ORIGIN } from '../shared/site';

// Hosts that used to serve the blog (or alias the apex) before it moved to
// krasnoperov.me. They stay attached to the production worker so old links
// keep resolving, but every request is permanently redirected to the apex.
const LEGACY_HOSTNAMES = new Set([
  'blog.krasnoperov.me',
  'www.blog.krasnoperov.me',
  'www.krasnoperov.me',
]);

const LEGACY_POST_PATHS = new Map([
  ['/posts/two-films-about-durable-objects', '/posts/how-durable-objects-work'],
  [
    '/posts/writing-practice-on-celld',
    '/posts/a-writing-agent-with-durable-objects',
  ],
]);

export function legacyPostRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  const markdownSuffix = url.pathname.endsWith('.md') ? '.md' : '';
  const path = markdownSuffix ? url.pathname.slice(0, -markdownSuffix.length) : url.pathname;
  const canonicalPath = LEGACY_POST_PATHS.get(path);

  if (!canonicalPath) {
    return null;
  }

  const target = new URL(`${canonicalPath}${markdownSuffix}${url.search}`, SITE_ORIGIN);
  return Response.redirect(target.toString(), 301);
}

export function legacyHostRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!LEGACY_HOSTNAMES.has(url.hostname)) {
    return null;
  }

  const target = new URL(url.pathname + url.search, SITE_ORIGIN);
  return Response.redirect(target.toString(), 301);
}
