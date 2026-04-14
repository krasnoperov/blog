import {
  BLOG_POSTS,
  BLOG_PUBLIC_PATHS,
  getBlogPost,
  type BlogPost,
} from '../shared/content/blog-posts-backend';
import {
  SITE_DESCRIPTION,
  SITE_FEED_PATH,
  SITE_NAME,
  SITE_ORIGIN,
} from '../shared/site';

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatSitemapEntry(url: string, lastmod?: string): string {
  const fields = [`<loc>${xmlEscape(url)}</loc>`];
  if (lastmod) {
    fields.push(`<lastmod>${xmlEscape(lastmod)}</lastmod>`);
  }

  return `  <url>${fields.join('')}</url>`;
}

function postMarkdownPath(path: string): string | null {
  const match = /^\/posts\/([^/]+)\.md$/.exec(path);
  return match?.[1] ?? null;
}

function publishedDateIso(post: BlogPost): string {
  return `${post.publishedAt}T00:00:00.000Z`;
}

function formatRssDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toUTCString();
}

function homeMarkdown(): string {
  const featuredPost = BLOG_POSTS.find((post) => post.featured) ?? BLOG_POSTS[0];

  return [
    '# Krasnoperov Blog',
    '',
    SITE_DESCRIPTION,
    '',
    '## Focus',
    'Writing about the software factory: automatic processes that convert ideas into delivered software.',
    '',
    '## Main routes',
    `- Home: ${SITE_ORIGIN}/`,
    `- Archive: ${SITE_ORIGIN}/posts`,
    `- Feed: ${SITE_ORIGIN}${SITE_FEED_PATH}`,
    '',
    '## Latest post',
    featuredPost
      ? `- [${featuredPost.title}](${SITE_ORIGIN}${featuredPost.path}) — ${featuredPost.summary}`
      : '- No posts yet.',
    '',
  ].join('\n');
}

function archiveMarkdown(): string {
  return [
    '# Archive',
    '',
    `Canonical HTML: ${SITE_ORIGIN}/posts`,
    '',
    '## Posts',
    ...BLOG_POSTS.flatMap((post) => [
      `- [${post.title}](${SITE_ORIGIN}${post.path})`,
      `  Published: ${post.publishedAt}`,
      `  Summary: ${post.summary}`,
    ]),
    '',
  ].join('\n');
}

export function buildRobotsTxt(isProduction: boolean): string {
  if (!isProduction) {
    return 'User-agent: *\nDisallow: /\n';
  }

  return [
    '# AI Crawlers — Welcome',
    'User-agent: GPTBot',
    'Allow: /',
    '',
    'User-agent: ChatGPT-User',
    'Allow: /',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    '',
    'User-agent: Claude-User',
    'Allow: /',
    '',
    'User-agent: Google-Extended',
    'Allow: /',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    '',
    'User-agent: CCBot',
    'Allow: /',
    '',
    'User-agent: cohere-ai',
    'Allow: /',
    '',
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildSitemapXml(): string {
  const newestPost = BLOG_POSTS[0]?.publishedAt;
  const staticEntries = [
    formatSitemapEntry(SITE_ORIGIN, newestPost),
    formatSitemapEntry(`${SITE_ORIGIN}/posts`, newestPost),
    formatSitemapEntry(`${SITE_ORIGIN}${SITE_FEED_PATH}`, newestPost),
  ];
  const postEntries = BLOG_POSTS.map((post) =>
    formatSitemapEntry(`${SITE_ORIGIN}${post.path}`, post.publishedAt),
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...postEntries,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildFeedXml(): string {
  const items = BLOG_POSTS.map((post) => [
    '  <item>',
    `    <title>${xmlEscape(post.title)}</title>`,
    `    <link>${xmlEscape(`${SITE_ORIGIN}${post.path}`)}</link>`,
    `    <guid>${xmlEscape(`${SITE_ORIGIN}${post.path}`)}</guid>`,
    `    <description>${xmlEscape(post.summary)}</description>`,
    `    <pubDate>${xmlEscape(formatRssDate(post.publishedAt))}</pubDate>`,
    '  </item>',
  ].join('\n'));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${xmlEscape(SITE_NAME)}</title>`,
    `    <link>${xmlEscape(SITE_ORIGIN)}</link>`,
    `    <description>${xmlEscape(SITE_DESCRIPTION)}</description>`,
    `    <language>en</language>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function buildLlmsTxt(): string {
  const postLines = BLOG_POSTS.flatMap((post) => [
    `- ${post.title}`,
    `  URL: ${SITE_ORIGIN}${post.path}`,
    `  Markdown: ${SITE_ORIGIN}${post.markdownPath}`,
    `  Summary: ${post.summary}`,
    `  Published: ${post.publishedAt}`,
  ]);

  return [
    `# ${SITE_NAME}`,
    '',
    SITE_DESCRIPTION,
    '',
    '## Scope',
    'A personal technical blog about building a software factory: the systems, loops, and automations that turn ideas into delivered software.',
    '',
    '## Canonical routes',
    `- Home: ${SITE_ORIGIN}/`,
    `- Archive: ${SITE_ORIGIN}/posts`,
    `- Feed: ${SITE_ORIGIN}${SITE_FEED_PATH}`,
    '',
    '## Posts',
    ...postLines,
    '',
    '## For language models',
    `- Use ${SITE_ORIGIN}/posts/<slug> for the canonical HTML page.`,
    `- Use ${SITE_ORIGIN}/posts/<slug>.md for the source markdown.`,
    `- Use ${SITE_ORIGIN}/llms-full.txt for the full inlined corpus.`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt(): string {
  const sections = BLOG_POSTS.flatMap((post) => [
    `## ${post.title}`,
    `URL: ${SITE_ORIGIN}${post.path}`,
    `Markdown: ${SITE_ORIGIN}${post.markdownPath}`,
    `Published: ${post.publishedAt}`,
    `Reading time: ${post.readingTime}`,
    `Tags: ${post.tags.join(', ')}`,
    '',
    post.sourceMarkdown,
    '',
  ]);

  return [
    `# ${SITE_NAME} Full Context`,
    '',
    SITE_DESCRIPTION,
    '',
    'This file contains the current public blog corpus in one place for indexing and model ingestion.',
    '',
    '## Home',
    '',
    homeMarkdown(),
    '',
    '## Archive',
    '',
    archiveMarkdown(),
    '',
    ...sections,
  ].join('\n');
}

export function getMarkdownVariant(path: string): { canonicalPath: string; content: string } | null {
  if (path === '/index.md') {
    return {
      canonicalPath: '/',
      content: homeMarkdown(),
    };
  }

  if (path === '/posts.md') {
    return {
      canonicalPath: '/posts',
      content: archiveMarkdown(),
    };
  }

  const slug = postMarkdownPath(path);
  if (!slug) {
    return null;
  }

  const post = getBlogPost(slug);
  if (!post) {
    return null;
  }

  return {
    canonicalPath: post.path,
    content: post.sourceMarkdown,
  };
}

export function buildHtmlLinkHeader(path: string): string | null {
  if (!BLOG_PUBLIC_PATHS.includes(path)) {
    return null;
  }

  const parts = [
    `</feed.xml>; rel="alternate"; type="application/rss+xml"; title="${SITE_NAME}"`,
    '</llms.txt>; rel="llms-txt"',
    '</llms-full.txt>; rel="llms-full-txt"',
  ];
  if (path === '/') {
    parts.unshift('</index.md>; rel="alternate"; type="text/markdown"');
  }
  if (path === '/posts') {
    parts.unshift('</posts.md>; rel="alternate"; type="text/markdown"');
  }
  const post = BLOG_POSTS.find((candidate) => candidate.path === path);
  if (post) {
    parts.unshift(`<${post.markdownPath}>; rel="alternate"; type="text/markdown"`);
  }

  return parts.join(', ');
}

export function buildMarkdownLinkHeader(canonicalPath: string): string {
  return [
    `<${canonicalPath}>; rel="canonical"`,
    `</feed.xml>; rel="alternate"; type="application/rss+xml"; title="${SITE_NAME}"`,
    '</llms.txt>; rel="llms-txt"',
    '</llms-full.txt>; rel="llms-full-txt"',
  ].join(', ');
}

export { publishedDateIso };
