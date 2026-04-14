import { createFileRoute } from '@tanstack/react-router';
import BlogArchivePage from '../../frontend/blog/BlogArchivePage';
import { archivePageHead } from '../lib/metadata';

export const Route = createFileRoute('/posts/')({
  head: () => archivePageHead(),
  component: BlogArchivePage,
});
