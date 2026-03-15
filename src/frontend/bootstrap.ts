import type { DehydratedState } from '@tanstack/react-query';
import type { User } from './contexts/AuthContextProvider';

export interface FrontendConfig {
  googleClientId: string;
  environment?: string;
}

export interface FrontendSession {
  config: FrontendConfig;
  user: User | null;
}

export interface AppBootstrap {
  session: FrontendSession;
  dehydratedState?: DehydratedState;
}

export const DEFAULT_BOOTSTRAP: AppBootstrap = {
  session: {
    config: {
      googleClientId: '',
      environment: 'development',
    },
    user: null,
  },
};
