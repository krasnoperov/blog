import fromYoloToPatchrelayMarkdown from './posts/from-yolo-to-patchrelay.md';
import helloWorldMarkdown from './posts/hello-world-formatting-the-factory-notes.md';
import pickingAnAgentHarnessMarkdown from './posts/picking-an-agent-harness.md';
import {
  createBlogPost,
  getBlogPostBySlug,
  type BlogPost,
  type BlogPostSummary,
} from './blog-posts-core';
import {
  BLOG_POSTS as BLOG_POST_SUMMARIES,
  BLOG_PUBLIC_PATHS,
  type BlogPostSlug,
} from './blog-post-manifest';

const RAW_POSTS = {
  'from-yolo-to-patchrelay': fromYoloToPatchrelayMarkdown,
  'hello-world-formatting-the-factory-notes': helloWorldMarkdown,
  'picking-an-agent-harness': pickingAnAgentHarnessMarkdown,
} satisfies Record<BlogPostSlug, string>;

export const BLOG_POSTS: BlogPost[] = BLOG_POST_SUMMARIES.map((summary) =>
  createBlogPost(summary, RAW_POSTS[summary.slug as BlogPostSlug]),
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPostBySlug(BLOG_POSTS, slug);
}

export type { BlogPost, BlogPostSummary };
export { BLOG_POST_SUMMARIES, BLOG_PUBLIC_PATHS };
