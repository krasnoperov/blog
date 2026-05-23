import fromYoloToPatchrelayMarkdown from './posts/from-yolo-to-patchrelay.md';
import gatesNotAutonomyMarkdown from './posts/gates-not-autonomy.md';
import doNotRaceAgentPrsMarkdown from './posts/do-not-race-agent-prs.md';
import helloWorldMarkdown from './posts/hello-world-formatting-the-factory-notes.md';
import mergeStewardMarkdown from './posts/merge-steward.md';
import mergeTreesMarkdown from './posts/merge-trees.md';
import notScalingCodeReviewMarkdown from './posts/not-scaling-code-review.md';
import patchrelayMarkdown from './posts/patchrelay.md';
import pickingAnAgentHarnessMarkdown from './posts/picking-an-agent-harness.md';
import reviewQuillMarkdown from './posts/review-quill.md';
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
  'do-not-race-agent-prs': doNotRaceAgentPrsMarkdown,
  'from-yolo-to-patchrelay': fromYoloToPatchrelayMarkdown,
  'gates-not-autonomy': gatesNotAutonomyMarkdown,
  'hello-world-formatting-the-factory-notes': helloWorldMarkdown,
  'merge-steward': mergeStewardMarkdown,
  'merge-trees': mergeTreesMarkdown,
  'not-scaling-code-review': notScalingCodeReviewMarkdown,
  'patchrelay': patchrelayMarkdown,
  'picking-an-agent-harness': pickingAnAgentHarnessMarkdown,
  'review-quill': reviewQuillMarkdown,
} satisfies Record<BlogPostSlug, string>;

export const BLOG_POSTS: BlogPost[] = BLOG_POST_SUMMARIES.map((summary) =>
  createBlogPost(summary, RAW_POSTS[summary.slug as BlogPostSlug]),
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPostBySlug(BLOG_POSTS, slug);
}

export type { BlogPost, BlogPostSummary };
export { BLOG_POST_SUMMARIES, BLOG_PUBLIC_PATHS };
