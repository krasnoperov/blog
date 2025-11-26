import { create } from 'zustand';
import { subscribeToNavigation, initNavigator } from '../navigation/navigator';

export type RoutePage =
  | 'landing'
  | 'login'
  | 'profile'
  | 'oauthApprove'
  | 'unknown';

export interface RouteParams {
  [key: string]: string | undefined;
}

interface RouteState {
  path: string;
  search: string;
  page: RoutePage;
  params: RouteParams;
  setLocation: (path: string, search: string) => void;
}

const parseRoute = (path: string): { page: RoutePage; params: RouteParams } => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const segments = path.replace(/\/+$/, '').split('/');

  if (path === '/' || path === '') {
    return { page: 'landing', params: {} };
  }

  if (path === '/login') {
    return { page: 'login', params: {} };
  }

  if (path === '/profile') {
    return { page: 'profile', params: {} };
  }

  if (path === '/oauth/approve') {
    return { page: 'oauthApprove', params: {} };
  }

  return { page: 'unknown', params: {} };
};

const shallowEqualParams = (a: RouteParams, b: RouteParams): boolean => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
const initialSearch = typeof window !== 'undefined' ? window.location.search : '';
const initialRoute = parseRoute(initialPath);

export const useRouteStore = create<RouteState>()((set, get) => ({
  path: initialPath,
  search: initialSearch,
  page: initialRoute.page,
  params: initialRoute.params,
  setLocation: (path, search) => {
    const next = parseRoute(path);
    const state = get();
    if (
      state.path === path &&
      state.search === search &&
      state.page === next.page &&
      shallowEqualParams(state.params, next.params)
    ) {
      return;
    }

    set({
      path,
      search,
      page: next.page,
      params: next.params,
    });
  },
}));

// Initialize navigation system and connect to store
if (typeof window !== 'undefined') {
  initNavigator();

  // Subscribe to navigation events and update store
  subscribeToNavigation((url) => {
    useRouteStore.getState().setLocation(url.pathname, url.search);
  });
}
