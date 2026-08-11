import {
  createBlogPostSummaries,
  getBlogPostBySlug,
  getBlogPublicPaths,
  type BlogPostManifestEntry,
  type BlogPostSummary,
} from './blog-posts-core';

export const BLOG_POST_MANIFEST = [
  {
    slug: 'two-films-about-durable-objects',
    title: 'I asked GPT-5.6 to explain Durable Objects',
    summary:
      'Ryan Dahl published celld, a self-hosted Durable Objects runtime. I wanted to understand how the model and the implementation fit together, so I asked GPT-5.6 to make two films — and kept sending the first versions back.',
    publishedAt: '2026-08-11',
    readingTime: '4 min read',
    tags: ['durable-objects', 'celld', 'distributed-systems', 'gpt-5.6', 'remotion'],
    featured: true,
  },
  {
    slug: 'linear-agent-past-the-pr',
    title: "A Linear agent that doesn't stop at the pull request",
    summary:
      "On Linear's surface, patchrelay is indistinguishable from Cursor or Devin — same protocol, same streaming thoughts, the same linked PR and diff. Two things set it apart: the work runs in my own repos, and the session doesn't end when the PR opens — it keeps reacting to review, CI, and the merge queue until the change actually lands.",
    publishedAt: '2026-05-29',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'linear', 'codex'],
    featured: true,
  },
  {
    slug: 'gates-not-autonomy',
    title: 'The gates, not the autonomy',
    summary:
      'Living with patchrelay, the autonomy turned out to be the part I reach for least deliberately. What actually changed how I ship are two gates — a reviewer and a merge queue — that do not care whether a human or an agent wrote the code.',
    publishedAt: '2026-05-23',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'review-quill', 'merge-steward'],
    featured: true,
  },
  {
    slug: 'not-scaling-code-review',
    title: 'Review volume is the wrong bottleneck',
    summary:
      'PatchRelay can keep agents busy, and that quickly makes manual review feel impossible. The review-quill repair loop absorbs much of the code-review work. The harder question — whether the agents are still steering the product in the right direction — is still open.',
    publishedAt: '2026-05-18',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
  },
  {
    slug: 'do-not-race-agent-prs',
    title: "Don't pay for the same review twice",
    summary:
      'Every review-quill round costs time and tokens. Two patterns waste them — parallel agents whose PRs should have been sequenced, and clean rebases that produce a new SHA without changing the diff. The factory plans to avoid the first and uses `patch-id` to skip the second.',
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
    title: 'patchrelay: Linear issues in, pull requests out',
    summary:
      'patchrelay is the deterministic orchestration layer that turns a delegated Linear issue into a linked pull request and keeps that PR healthy until merge or close.',
    publishedAt: '2026-04-29',
    readingTime: '5 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'codex', 'harness-engineering'],
    featured: true,
  },
  {
    slug: 'merge-steward',
    title: 'merge-steward: speculative integration, parallel validation, fast-forward landing',
    summary:
      'merge-steward is a self-hosted merge queue with three decisions — test every PR on `main + diff`, validate cumulative speculative chains in parallel, and fast-forward `main` to the exact tree CI ran against.',
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
