import {
  createBlogPost,
  getBlogPostMarkdownPath,
  getBlogPostPath,
  type BlogPost,
  type BlogPostSummary,
} from './blog-posts-core';
import {
  BLOG_POSTS,
  BLOG_PUBLIC_PATHS,
  getBlogPostSummary,
} from './blog-post-manifest';

const RAW_POST_LOADERS = import.meta.glob('./posts/*.md', {
  query: '?raw',
  import: 'default',
});

function getMarkdownModulePath(slug: string): string {
  return `./posts/${slug}.md`;
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const summary = getBlogPostSummary(slug);
  const loadMarkdown = RAW_POST_LOADERS[getMarkdownModulePath(slug)];
  if (!summary || !loadMarkdown) {
    return undefined;
  }

  const markdown = await loadMarkdown();
  return createBlogPost(summary, markdown as string);
}

export type { BlogPost, BlogPostSummary };
export { getBlogPostMarkdownPath, getBlogPostPath };
export { BLOG_POSTS, BLOG_PUBLIC_PATHS, getBlogPostSummary };
