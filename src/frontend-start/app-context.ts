import type { QueryClient } from '@tanstack/react-query';
import type { AppBootstrap } from '../frontend/bootstrap';
import { DEFAULT_BOOTSTRAP } from '../frontend/bootstrap';

export interface StartRequestMeta {
  authorizationHeader?: string;
  cookieHeader?: string;
  origin: string;
  testSessionHeader?: string;
}

export interface StartServerContext {
  apiFetch?: (request: Request) => Promise<Response>;
  bootstrap?: AppBootstrap;
  requestMeta?: StartRequestMeta;
}

export interface StartRouterContext {
  queryClient: QueryClient;
  bootstrap: AppBootstrap;
  serverContext?: StartServerContext;
}

export const DEFAULT_START_BOOTSTRAP: AppBootstrap = DEFAULT_BOOTSTRAP;
