export interface BlogPostSummary {
  slug: string;
  path: string;
  markdownPath: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  tags: string[];
  featured: boolean;
}

export interface BlogPost extends BlogPostSummary {
  sourceMarkdown: string;
  markdown: string;
}

export interface BlogPostManifestEntry {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime?: string;
  tags?: string[] | string;
  featured?: boolean | string;
}

export interface ParsedFrontmatter {
  metadata: Record<string, string>;
  content: string;
}

export function getBlogPostPath(slug: string): string {
  return `/posts/${slug}`;
}

export function getBlogPostMarkdownPath(slug: string): string {
  return `${getBlogPostPath(slug)}.md`;
}

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Blog posts must start with frontmatter.');
  }

  const [, rawFrontmatter, content] = match;
  const metadata = rawFrontmatter
    .split(/\r?\n/)
    .reduce<Record<string, string>>((accumulator, line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key) {
        accumulator[key] = value;
      }

      return accumulator;
    }, {});

  return {
    metadata,
    content: content.trim(),
  };
}

function normalizeTags(value: string[] | string | undefined): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean);
  }

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeBoolean(value: boolean | string | undefined): boolean {
  return value === true || value === 'true';
}

function compareField(
  slug: string,
  field: keyof Pick<BlogPostSummary, 'title' | 'summary' | 'publishedAt' | 'readingTime'>,
  expected: string,
  actual: string,
) {
  if (expected !== actual) {
    throw new Error(`Blog post "${slug}" has mismatched ${field} metadata.`);
  }
}

function assertSummaryMatchesSource(summary: BlogPostSummary, metadata: Record<string, string>) {
  compareField(summary.slug, 'title', summary.title, metadata.title ?? '');
  compareField(summary.slug, 'summary', summary.summary, metadata.summary ?? '');
  compareField(summary.slug, 'publishedAt', summary.publishedAt, metadata.publishedAt ?? '');
  compareField(summary.slug, 'readingTime', summary.readingTime, metadata.readingTime ?? '5 min read');

  const sourceTags = normalizeTags(metadata.tags);
  if (summary.tags.join('|') !== sourceTags.join('|')) {
    throw new Error(`Blog post "${summary.slug}" has mismatched tags metadata.`);
  }

  const sourceFeatured = normalizeBoolean(metadata.featured);
  if (summary.featured !== sourceFeatured) {
    throw new Error(`Blog post "${summary.slug}" has mismatched featured metadata.`);
  }
}

function sortPosts<T extends { publishedAt: string }>(posts: T[]): T[] {
  return posts.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function createBlogPostSummary(entry: Readonly<BlogPostManifestEntry>): BlogPostSummary {
  return {
    slug: entry.slug,
    path: getBlogPostPath(entry.slug),
    markdownPath: getBlogPostMarkdownPath(entry.slug),
    title: entry.title,
    summary: entry.summary,
    publishedAt: entry.publishedAt,
    readingTime: entry.readingTime ?? '5 min read',
    tags: normalizeTags(entry.tags),
    featured: normalizeBoolean(entry.featured),
  };
}

export function createBlogPostSummaries(
  entries: readonly Readonly<BlogPostManifestEntry>[],
): BlogPostSummary[] {
  return sortPosts(entries.map(createBlogPostSummary));
}

export function createBlogPost(summary: BlogPostSummary, markdown: string): BlogPost {
  const { metadata, content } = parseFrontmatter(markdown);
  assertSummaryMatchesSource(summary, metadata);

  return {
    ...summary,
    sourceMarkdown: markdown.trim(),
    markdown: content,
  };
}

export function getBlogPostBySlug<T extends { slug: string }>(
  posts: T[],
  slug: string,
): T | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getBlogPublicPaths(posts: Array<{ path: string }>): string[] {
  return ['/', '/posts', ...posts.map((post) => post.path)];
}
