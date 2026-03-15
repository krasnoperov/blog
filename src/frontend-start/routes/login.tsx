import { createFileRoute, redirect } from '@tanstack/react-router';
import LoginPage from '../../frontend/pages/LoginPage';
import { loadStartSession } from '../lib/session';

export const Route = createFileRoute('/login')({
  loader: async ({ serverContext }) => {
    const session = await loadStartSession({ serverContext });

    if (session.user) {
      throw redirect({ href: '/profile' });
    }

    return { session };
  },
  component: LoginStartRoute,
});

function LoginStartRoute() {
  const { session } = Route.useLoaderData();

  return <LoginPage googleClientId={session.config.googleClientId} />;
}
