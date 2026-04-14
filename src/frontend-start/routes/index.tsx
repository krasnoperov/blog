import { createFileRoute } from '@tanstack/react-router';
import BlogHomePage from '../../frontend/blog/BlogHomePage';
import { homePageHead } from '../lib/metadata';

export const Route = createFileRoute('/')({
  head: () => homePageHead(),
  component: BlogHomePage,
});
