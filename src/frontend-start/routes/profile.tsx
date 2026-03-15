import { createFileRoute, redirect } from '@tanstack/react-router';
import ProfilePage from '../../frontend/pages/ProfilePage';
import { requestContract, shouldSkipStartSsrPrefetch } from '../lib/request';
import { loadStartSession } from '../lib/session';

export const Route = createFileRoute('/profile')({
  loader: async ({ serverContext }) => {
    const session = await loadStartSession({ serverContext });

    if (!session.user) {
      throw redirect({ href: '/login' });
    }

    const profile = await shouldSkipStartSsrPrefetch(Boolean(session.user), { serverContext })
      ? undefined
      : await requestContract('userProfileGet', undefined, {}, { serverContext });
    return { profile };
  },
  component: ProfileStartRoute,
});

function ProfileStartRoute() {
  const { profile } = Route.useLoaderData();

  return <ProfilePage initialProfile={profile} />;
}
