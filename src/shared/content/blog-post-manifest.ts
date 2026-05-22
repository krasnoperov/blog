import {
  createBlogPostSummaries,
  getBlogPostBySlug,
  getBlogPublicPaths,
  type BlogPostManifestEntry,
  type BlogPostSummary,
} from './blog-posts-core';

export const BLOG_POST_MANIFEST = [
  {
    slug: 'not-scaling-code-review',
    title: 'Review volume is the wrong bottleneck',
    summary:
      'PatchRelay can keep agents busy, and that quickly makes manual review feel impossible. The review-quill repair loop absorbs much of the code-review work, but it does not answer the more important question: whether the product still looks, feels, and behaves right.',
    publishedAt: '2026-05-18',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
  },
  {
    slug: 'do-not-race-agent-prs',
    title: 'Do not race agent PRs',
    summary:
      'PatchRelay mostly runs independent issues, but a few branches should never race. Sequence the predictable conflicts, let normal PRs stay normal, and keep merge-steward as the safety net.',
    publishedAt: '2026-05-18',
    readingTime: '4 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'merge-steward'],
    featured: false,
  },
  {
    slug: 'merge-trees',
    title: 'Merge trees: a clean mental model',
    summary:
      'A PatchRelay model for changes, reviews, and landings, built from primitives Git already gives you: commit trees, patch-id, merge-tree, and fast-forward landing.',
    publishedAt: '2026-05-06',
    readingTime: '4 min read',
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
      'Running coding agents on real work turned me into their full-time conductor. patchrelay is what I built to stop being the bottleneck: Linear is the control surface, runs survive restarts, and takeover is one command.',
    publishedAt: '2026-04-29',
    readingTime: '7 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'codex', 'harness-engineering'],
    featured: true,
  },
  {
    slug: 'merge-steward',
    title: 'merge-steward: a self-hosted merge queue without the Enterprise gate',
    summary:
      'Parallel agents produce parallel pull requests that can break each other on integration. merge-steward is a self-hosted serial merge queue: test the integrated SHA, fast-forward only when it is still valid, and publish failure reasons an agent can read.',
    publishedAt: '2026-04-29',
    readingTime: '6 min read',
    tags: ['software-factory', 'patchrelay', 'merge-steward', 'merge-queue'],
    featured: false,
  },
  {
    slug: 'review-quill',
    title: 'review-quill: a strict reviewer for your coding agent',
    summary:
      'Coding agents focus on the task and forget the surroundings: docs drift, tests go stale, sibling files keep old assumptions. review-quill is the strict reviewer that keeps sending the PR back until the repo is aligned again.',
    publishedAt: '2026-04-29',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
  },
  {
    slug: 'picking-an-agent-harness',
    title: 'Picking an agent harness when the SDK terms are murky',
    summary:
      'The five real options for embedding a coding agent into a custom factory, why the SDK licensing question pushed me to the Codex App Server, and why session-attach belongs in the agent runtime, not the terminal layer.',
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
