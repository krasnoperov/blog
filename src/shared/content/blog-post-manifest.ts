import {
  createBlogPostSummaries,
  getBlogPostBySlug,
  getBlogPublicPaths,
  type BlogPostManifestEntry,
  type BlogPostSummary,
} from './blog-posts-core';

export const BLOG_POST_MANIFEST = [
  {
    slug: 'from-yolo-to-patchrelay',
    title: 'From YOLO to patchrelay',
    summary:
      'How turning off permission prompts forced me onto a rented server, and how four parallel terminals forced me to write the thing I now call patchrelay.',
    publishedAt: '2026-04-07',
    readingTime: '9 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'security'],
    featured: true,
  },
  {
    slug: 'picking-an-agent-harness',
    title: 'Picking an agent harness when the SDK terms are murky',
    summary:
      'The five honest options for embedding a coding agent into a custom factory, why the SDK licensing question pushed me to the Codex App Server, and why I stopped fighting tmux for session attach.',
    publishedAt: '2026-04-07',
    readingTime: '11 min read',
    tags: ['software-factory', 'patchrelay', 'harness-engineering', 'codex', 'claude-code'],
    featured: false,
  },
  {
    slug: 'hello-world-formatting-the-factory-notes',
    title: 'Hello World for Factory Notes',
    summary:
      'A self-demonstrating post that shows how this blog renders markdown structure, code, tables, and Mermaid diagrams.',
    publishedAt: '2026-03-28',
    readingTime: '4 min read',
    tags: ['hello-world', 'markdown', 'diagrams'],
    featured: false,
  },
] as const satisfies readonly BlogPostManifestEntry[];

export type BlogPostSlug = (typeof BLOG_POST_MANIFEST)[number]['slug'];

export const BLOG_POSTS: BlogPostSummary[] = createBlogPostSummaries(BLOG_POST_MANIFEST);
export const BLOG_PUBLIC_PATHS = getBlogPublicPaths(BLOG_POSTS);

export function getBlogPostSummary(slug: string): BlogPostSummary | undefined {
  return getBlogPostBySlug(BLOG_POSTS, slug);
}
