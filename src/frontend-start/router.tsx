import { createRouter } from '@tanstack/react-router';
import { createQueryClient } from '../frontend/queryClient';
import { DEFAULT_START_BOOTSTRAP } from './app-context';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = createQueryClient();
  return createRouter({
    routeTree,
    context: {
      queryClient,
      bootstrap: DEFAULT_START_BOOTSTRAP,
      serverContext: undefined,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
  });
}
