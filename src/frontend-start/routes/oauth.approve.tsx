import { createFileRoute, redirect } from '@tanstack/react-router';
import AuthorizationApprovalPage from '../../frontend/pages/AuthorizationApprovalPage';
import { requestContract, shouldSkipStartSsrPrefetch } from '../lib/request';
import { loadStartSession } from '../lib/session';

type OAuthApproveSearch = {
  request?: string;
};

export const Route = createFileRoute('/oauth/approve')({
  validateSearch: (search: Record<string, unknown>): OAuthApproveSearch => ({
    request: typeof search.request === 'string' ? search.request : undefined,
  }),
  loader: async ({ location, serverContext }) => {
    const session = await loadStartSession({ serverContext });

    if (!session.user) {
      throw redirect({ href: '/login' });
    }

    const requestId = new URL(location.href, 'https://whitelabel.krasnoperov.me').searchParams.get('request') ?? undefined;
    if (!requestId) {
      return { requestId: undefined, approvalRequest: null };
    }

    const approvalRequest = await shouldSkipStartSsrPrefetch(Boolean(session.user), { serverContext })
      ? null
      : await requestContract('oauthApprovalRequest', undefined, {
        query: { request: requestId },
      }, { serverContext });

    return { requestId, approvalRequest };
  },
  component: OAuthApproveStartRoute,
});

function OAuthApproveStartRoute() {
  const { requestId, approvalRequest } = Route.useLoaderData();

  return <AuthorizationApprovalPage requestId={requestId} initialRequest={approvalRequest} />;
}
