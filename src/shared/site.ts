export const SITE_NAME = 'Krasnoperov Blog';
export const SITE_TAGLINE = "A builder's notes";
export const SITE_AUTHOR_NAME = 'Aleksei Krasnoperov';
export const SITE_AUTHOR_URL = 'https://krasnoperov.me/';
export const SITE_AUTHOR_SAME_AS = [
  'https://github.com/krasnoperov',
  'https://x.com/snejink',
  'https://fellowmakers.app/people/snejink',
];
export const SITE_LOCALE = 'en_US';
export const SITE_DESCRIPTION =
  "I'm a builder: UserTold, MakeFX, FellowMakers, and Learn, Speak, Repeat! Notes on building products: users, distribution, pricing, and the agents that ship them.";
export const SITE_ORIGIN = 'https://krasnoperov.me';
export const SITE_FEED_PATH = '/feed.xml';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
