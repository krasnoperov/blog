export const SITE_NAME = 'Krasnoperov Blog';
export const SITE_TAGLINE = 'Software Factory Notes';
export const SITE_AUTHOR_NAME = 'Krasnoperov';
export const SITE_AUTHOR_URL = 'https://blog.krasnoperov.me/';
export const SITE_AUTHOR_SAME_AS = ['https://github.com/krasnoperov'];
export const SITE_LOCALE = 'en_US';
export const SITE_DESCRIPTION =
  'Personal tech writing on agent-driven development, harness design, and the small services that keep a coding-agent factory honest.';
export const SITE_ORIGIN = 'https://blog.krasnoperov.me';
export const SITE_FEED_PATH = '/feed.xml';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
