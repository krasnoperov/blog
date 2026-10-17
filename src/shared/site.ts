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
  "I build what I need, and agents run it: Learn, Speak, Repeat!, UserTold, MakeFX, and FellowMakers. Notes on building agent-native products and bringing them to people.";
export const HOME_DESCRIPTION =
  'The software factory behind UserTold and MakeFX: issues in Linear, agents on the line, review-quill and merge-steward at the gates, GitHub as the bus.';
export const SITE_ORIGIN = 'https://krasnoperov.me';
export const SITE_FEED_PATH = '/feed.xml';

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
