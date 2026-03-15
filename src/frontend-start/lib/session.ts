import type { FrontendSession } from '../../frontend/bootstrap';
import { DEFAULT_BOOTSTRAP } from '../../frontend/bootstrap';
import { requestContract, type StartLoaderContext } from './request';

function getBootstrapSession(context?: StartLoaderContext): FrontendSession | null {
  const session = context?.serverContext?.bootstrap?.session;
  if (!session) {
    return null;
  }

  return {
    config: {
      googleClientId: session.config.googleClientId ?? DEFAULT_BOOTSTRAP.session.config.googleClientId,
      environment: session.config.environment ?? DEFAULT_BOOTSTRAP.session.config.environment,
    },
    user: session.user ?? null,
  };
}

export async function loadStartSession(context?: StartLoaderContext): Promise<FrontendSession> {
  const bootstrapSession = getBootstrapSession(context);
  if (bootstrapSession) {
    return bootstrapSession;
  }

  const response = await requestContract('authSession', undefined, {}, context);
  return {
    config: {
      googleClientId: response.config.googleClientId ?? '',
      environment: response.config.environment,
    },
    user: response.user ?? null,
  };
}
