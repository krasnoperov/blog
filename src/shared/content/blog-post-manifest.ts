import {
  createBlogPostSummaries,
  getBlogPostBySlug,
  getBlogPublicPaths,
  type BlogPostManifestEntry,
  type BlogPostSummary,
} from './blog-posts-core';

export const BLOG_POST_MANIFEST = [
  {
    slug: 'merge-trees',
    title: 'Merge trees: a mental model for the factory',
    summary:
      'Three services running, three vocabularies, and a long tail of observed waste — re-reviews on rebase, ci_repair on flaky branch CI, cosmetic pushes that dismissed approvals. The fix was not more orchestration glue. It was a shared mental model built from four Git primitives.',
    publishedAt: '2026-05-06',
    readingTime: '8 min read',
    tags: ['software-factory', 'patchrelay', 'merge-steward', 'review-quill', 'mental-model'],
    featured: false,
  },
  {
    slug: 'from-yolo-to-patchrelay',
    title: 'From YOLO to patchrelay',
    summary:
      'Notes on a year of agent-driven development — permission prompts, a rented Hetzner box with nothing on it, a parallel-agent experiment that turned into merge-conflict hell, and the small annoyance that became patchrelay.',
    publishedAt: '2026-04-29',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'security'],
    featured: true,
  },
  {
    slug: 'patchrelay',
    title: 'patchrelay: a Linear-driven harness for Codex',
    summary:
      'Running coding agents on real work turned me into their full-time conductor — copying task IDs, watching CI, switching terminals, rebasing branches. patchrelay is what I built to stop being the bottleneck: Linear becomes the control surface, runs survive restarts, and operator takeover is one command.',
    publishedAt: '2026-04-29',
    readingTime: '7 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'codex', 'harness-engineering'],
    featured: true,
  },
  {
    slug: 'merge-steward',
    title: 'merge-steward: a self-hosted merge queue without the Enterprise gate',
    summary:
      'Parallel agents produce parallel pull requests that break each other on integration. merge-steward is a self-hosted serial speculative merge queue — every merge tested against the live tip of main, no Enterprise gate, structured failure reasons an agent can read.',
    publishedAt: '2026-04-29',
    readingTime: '6 min read',
    tags: ['software-factory', 'patchrelay', 'merge-steward', 'merge-queue'],
    featured: false,
  },
  {
    slug: 'review-quill',
    title: 'review-quill: a strict reviewer for your coding agent',
    summary:
      'Agentic sessions focus on the task and forget the surroundings — docs drift, tests stale, sibling files keep old assumptions. review-quill is the strict reviewer that catches the misalignments, and because two AI agents iterate at machine speed, the loop converges fast.',
    publishedAt: '2026-04-29',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
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
