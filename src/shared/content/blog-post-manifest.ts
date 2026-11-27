import {
  createBlogPostSummaries,
  getBlogPostBySlug,
  getBlogPublicPaths,
  type BlogPostManifestEntry,
  type BlogPostSummary,
} from './blog-posts-core';

export const BLOG_POST_MANIFEST = [
  {
    slug: 'github-agent-identities',
    title: "I wanted to approve my agent's pull request",
    summary:
      'How I configured separate GitHub identities for coding and review agents, with credentials and signing keys that work through long sessions and restarts.',
    publishedAt: '2026-11-27',
    readingTime: '4 min read',
    tags: ['github', 'agentic-development', 'authentication', 'code-review', 'gpg'],
    featured: true,
  },
  {
    slug: 'i-just-wanted-to-speak-spanish',
    title: 'I just wanted to speak Spanish',
    summary:
      'Learning to speak Spanish led me to build a course, user-interview tools, and a media canvas. These are the products and what I plan to do with them next.',
    publishedAt: '2026-10-08',
    readingTime: '3 min read',
    tags: ['indie-hacking', 'product-development', 'learnspeakrepeat', 'usertold', 'makefx', 'fellowmakers'],
    featured: true,
  },
  {
    slug: 'orchestrator-moved-into-the-session',
    title: 'The orchestrator moved into the session',
    summary:
      'Claude Code now plans and delegates much of the work I previously split into Linear issues. review-quill and merge-steward still check and land the resulting PRs.',
    publishedAt: '2026-10-08',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'claude-code', 'review-quill', 'merge-steward'],
    featured: true,
  },
  {
    slug: 'a-writing-agent-with-durable-objects',
    title: 'A writing agent with Durable Objects',
    summary:
      'Writing Practice is a small example of using a Durable Object for persistent agent work.',
    publishedAt: '2026-08-12',
    updatedAt: '2026-08-13',
    readingTime: '1 min read',
    tags: ['durable-objects', 'celld', 'writing-tools', 'ai-agents'],
    featured: true,
  },
  {
    slug: 'how-durable-objects-work',
    title: 'How Durable Objects work',
    summary:
      'celld brings the Durable Objects model to compatible infrastructure beyond Cloudflare. Two short videos explain the model and the runtime beneath it.',
    publishedAt: '2026-08-11',
    updatedAt: '2026-08-13',
    readingTime: '1 min read',
    tags: ['durable-objects', 'celld', 'distributed-systems', 'gpt-5.6', 'remotion'],
    featured: true,
  },
  {
    slug: 'linear-agent-past-the-pr',
    title: "A Linear agent that doesn't stop at the pull request",
    summary:
      'patchrelay uses Linear’s standard agent interface, runs in persistent worktrees, and keeps the session active through review, CI repairs, and landing.',
    publishedAt: '2026-05-29',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'linear', 'codex'],
    featured: true,
  },
  {
    slug: 'gates-not-autonomy',
    title: 'The gates, not the autonomy',
    summary:
      'I delegate tasks with clear requirements and keep exploratory work interactive. Both routes use the same reviewer and merge queue; judging product decisions remains harder.',
    publishedAt: '2026-05-23',
    readingTime: '2 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'review-quill', 'merge-steward'],
    featured: true,
  },
  {
    slug: 'not-scaling-code-review',
    title: 'Review volume is the wrong bottleneck',
    summary:
      'The automated review loop handles thousands of attempts. I still need a better way to see when a technically sound change takes the product in the wrong direction.',
    publishedAt: '2026-05-18',
    readingTime: '2 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
  },
  {
    slug: 'do-not-race-agent-prs',
    title: "Don't pay for the same review twice",
    summary:
      'patchrelay checks for dependencies before branches race to land. review-quill separately reuses approvals when a rebased patch still meets its cache rules.',
    publishedAt: '2026-05-18',
    readingTime: '2 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'merge-steward'],
    featured: false,
  },
  {
    slug: 'merge-trees',
    title: 'Merge trees: a clean mental model',
    summary:
      'Separating the patch, integrated tree, and tested commit helped me avoid repeated reviews and land the code CI actually checked.',
    publishedAt: '2026-05-06',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'merge-steward', 'review-quill', 'mental-model'],
    featured: false,
  },
  {
    slug: 'from-yolo-to-patchrelay',
    title: 'From YOLO to patchrelay',
    summary:
      'Running four coding agents moved my bottleneck from writing code to coordinating reviews, CI, and merges. That is where patchrelay started.',
    publishedAt: '2026-04-29',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'security'],
    featured: true,
  },
  {
    slug: 'patchrelay',
    title: 'patchrelay: Linear issues in, pull requests out',
    summary:
      'patchrelay takes a delegated Linear issue through implementation, review fixes, CI repairs, and merge, keeping the same workspace available throughout.',
    publishedAt: '2026-04-29',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'agentic-development', 'codex', 'harness-engineering'],
    featured: true,
  },
  {
    slug: 'merge-steward',
    title: 'merge-steward: speculative integration, parallel validation, fast-forward landing',
    summary:
      'merge-steward tests cumulative speculative branches in parallel, then advances main to the exact commit that passed CI. Queue state survives restarts, and failures give agents a specific repair job.',
    publishedAt: '2026-04-29',
    readingTime: '4 min read',
    tags: ['software-factory', 'patchrelay', 'merge-steward', 'merge-queue'],
    featured: false,
  },
  {
    slug: 'review-quill',
    title: 'review-quill: a strict reviewer for your coding agent',
    summary:
      'review-quill checks a real checkout at each PR head, publishes GitHub reviews, and reuses approvals for matching patches. The harder problem is knowing when repeated fixes have become churn.',
    publishedAt: '2026-04-29',
    readingTime: '4 min read',
    tags: ['software-factory', 'patchrelay', 'review-quill', 'code-review'],
    featured: false,
  },
  {
    slug: 'picking-an-agent-harness',
    title: 'Picking an agent harness when the SDK terms are murky',
    summary:
      'I replaced patchrelay’s terminal-driven Codex runner with App Server so the agent runtime could own conversation state. Here is the April 2026 reasoning and what would make me reconsider.',
    publishedAt: '2026-04-07',
    readingTime: '3 min read',
    tags: ['software-factory', 'patchrelay', 'harness-engineering', 'codex', 'claude-code'],
    featured: false,
  },
  {
    slug: 'hello-world-formatting-the-factory-notes',
    title: 'Hello World for Factory Notes',
    summary:
      'A self-demonstrating post that shows how this blog renders markdown structure, code, tables, and Mermaid diagrams.',
    publishedAt: '2026-03-28',
    readingTime: '2 min read',
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
