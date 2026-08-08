import { SITE_ORIGIN } from '../shared/site';

// Hosts that used to serve the blog (or alias the apex) before it moved to
// krasnoperov.me. They stay attached to the production worker so old links
// keep resolving, but every request is permanently redirected to the apex.
const LEGACY_HOSTNAMES = new Set([
  'blog.krasnoperov.me',
  'www.blog.krasnoperov.me',
  'www.krasnoperov.me',
]);

export function legacyHostRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!LEGACY_HOSTNAMES.has(url.hostname)) {
    return null;
  }

  const target = new URL(url.pathname + url.search, SITE_ORIGIN);
  return Response.redirect(target.toString(), 301);
}
