export const SITE_NAME = 'Krasnoperov Blog';
export const SITE_TAGLINE = 'Notes from one person shipping products';
export const SITE_AUTHOR_NAME = 'Aleksei Krasnoperov';
export const SITE_AUTHOR_URL = 'https://krasnoperov.me/';
export const SITE_AUTHOR_SAME_AS = [
  'https://github.com/krasnoperov',
  'https://x.com/snejink',
  'https://fellowmakers.app/people/snejink',
];
export const SITE_LOCALE = 'en_US';
export const SITE_DESCRIPTION =
  'I build four products with coding agents: UserTold, MakeFX, FellowMakers, and Learn, Speak, Repeat! Notes on running them, and on the agent setup that ships them.';
export const SITE_ORIGIN = 'https://krasnoperov.me';
export const SITE_FEED_PATH = '/feed.xml';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
