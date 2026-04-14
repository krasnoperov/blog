import { createFileRoute, notFound } from '@tanstack/react-router';
import { BlogPostPage } from '../../frontend/blog/BlogPostPage';
import { getBlogPost, type BlogPost } from '../../shared/content/blog-posts';
import { postPageHead } from '../lib/metadata';

export const Route = createFileRoute('/posts/$slug')({
  loader: async ({ params }) => {
    const post = await getBlogPost(params.slug);
    if (!post) {
      throw notFound();
    }

    return { post };
  },
  head: ({ loaderData }) => loaderData?.post ? postPageHead(loaderData.post) : postPageHead({
    slug: 'post',
    path: '/posts/post',
    markdownPath: '/posts/post.md',
    title: 'Post',
    summary: 'Software factory writing on Krasnoperov Blog.',
    publishedAt: '1970-01-01',
    readingTime: '5 min read',
    tags: [],
    featured: false,
  }),
  component: PostRoute,
});

function PostRoute() {
  const { post } = Route.useLoaderData() as { post: BlogPost };

  return <BlogPostPage post={post} />;
}
