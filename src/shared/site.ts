export const SITE_NAME = 'Krasnoperov Blog';
export const SITE_TAGLINE = 'Software Factory Notes';
export const SITE_AUTHOR_NAME = 'Krasnoperov';
export const SITE_DESCRIPTION =
  'Personal tech writing about the software factory: how ideas become scoped work, implementation, and delivered outcomes.';
export const SITE_ORIGIN = 'https://blog.krasnoperov.me';
export const SITE_FEED_PATH = '/feed.xml';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
