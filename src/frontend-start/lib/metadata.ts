import {
  BLOG_POSTS,
  HOMEPAGE_POSTS,
  type BlogPostSummary,
} from '../../shared/content/blog-posts';
import {
  SITE_DESCRIPTION,
  SITE_FEED_PATH,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_SAME_AS,
  SITE_AUTHOR_URL,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from '../../shared/site';

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  metaExtras?: Array<Record<string, string>>;
  linkExtras?: Array<Record<string, string>>;
}

function baseMetadata({
  title,
  description,
  path,
  ogType = 'website',
  jsonLd,
  metaExtras = [],
  linkExtras = [],
}: PageMetadataInput) {
  const canonicalUrl = absoluteUrl(path);

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'author', content: SITE_AUTHOR_NAME },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: SITE_LOCALE },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      ...metaExtras,
    ],
    links: [
      { rel: 'canonical', href: canonicalUrl },
      { rel: 'alternate', type: 'application/rss+xml', href: absoluteUrl(SITE_FEED_PATH), title: SITE_NAME },
      ...linkExtras,
    ],
    scripts: jsonLd
      ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((entry) => ({
          type: 'application/ld+json',
          children: JSON.stringify(entry),
        }))
      : undefined,
  };
}

export function homePageHead() {
  return baseMetadata({
    title: SITE_NAME,
    description: 'Notes on agent-driven development, harness design, and the small services that keep a coding-agent factory honest.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: absoluteUrl('/'),
      // Mirror the visible homepage list so structured data and the rendered
      // shop-window stay in sync. Archive (CollectionPage) keeps the full list.
      blogPost: HOMEPAGE_POSTS.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        url: absoluteUrl(post.path),
        datePublished: post.publishedAt,
      })),
    },
  });
}

export function archivePageHead() {
  return baseMetadata({
    title: `Archive | ${SITE_NAME}`,
    description: 'Archive of software factory posts on delivery systems, control planes, specs, and measurement.',
    path: '/posts',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${SITE_NAME} Archive`,
        description: 'Archive of software factory notes and technical essays.',
        url: absoluteUrl('/posts'),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: BLOG_POSTS.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(post.path),
            name: post.title,
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Archive', item: absoluteUrl('/posts') },
        ],
      },
    ],
  });
}

export function postPageHead(post: BlogPostSummary) {
  const publishedAtIso = `${post.publishedAt}T00:00:00.000Z`;
  const modifiedAt = post.updatedAt ?? post.publishedAt;
  const modifiedAtIso = `${modifiedAt}T00:00:00.000Z`;
  const author = {
    '@type': 'Person' as const,
    name: SITE_AUTHOR_NAME,
    url: SITE_AUTHOR_URL,
    sameAs: SITE_AUTHOR_SAME_AS,
  };

  return baseMetadata({
    title: `${post.title} | ${SITE_NAME}`,
    description: post.summary,
    path: post.path,
    ogType: 'article',
    metaExtras: [
      { property: 'article:published_time', content: publishedAtIso },
      { property: 'article:modified_time', content: modifiedAtIso },
      { property: 'article:author', content: SITE_AUTHOR_URL },
      // The head merger in @tanstack/react-router (headContentUtils.js) dedupes
      // meta entries by name/property, so multiple `article:tag` entries collapse
      // to the last one. Emit a single comma-joined value, and surface the full
      // tag list via `keywords` + the BlogPosting JSON-LD below.
      { property: 'article:tag', content: post.tags.join(', ') },
      { name: 'keywords', content: post.tags.join(', ') },
    ],
    linkExtras: [
      {
        rel: 'alternate',
        type: 'text/markdown',
        href: absoluteUrl(post.markdownPath),
      },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.summary,
        datePublished: post.publishedAt,
        dateModified: modifiedAt,
        url: absoluteUrl(post.path),
        mainEntityOfPage: absoluteUrl(post.path),
        isPartOf: {
          '@type': 'Blog',
          name: SITE_NAME,
          url: absoluteUrl('/'),
        },
        author,
        publisher: author,
        keywords: post.tags,
        articleSection: SITE_TAGLINE,
        inLanguage: 'en',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Archive', item: absoluteUrl('/posts') },
          { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(post.path) },
        ],
      },
    ],
  });
}
