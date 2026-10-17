import { createFileRoute } from '@tanstack/react-router';
import FactoryHomePage from '../../frontend/factory/FactoryHomePage';
import { homePageHead } from '../lib/metadata';

export const Route = createFileRoute('/')({
  head: () => homePageHead(),
  component: FactoryHomePage,
});
