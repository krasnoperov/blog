import type { ReactNode } from 'react';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { DEFAULT_BOOTSTRAP } from '../../frontend/bootstrap';
import { StartRouteProviders } from '../components/StartRouteProviders';
import { ServiceWorkerRegistrar } from '../components/ServiceWorkerRegistrar';
import { loadStartSession } from '../lib/session';
import '../styles.css';

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#08111f" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <HeadContent />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <Scripts />
      </body>
    </html>
  );
}

function NotFoundPage() {
  return (
    <Document>
      <main style={{ padding: '2rem', fontFamily: 'inherit' }}>
        <h1>Page not found</h1>
        <p>The requested page was not found.</p>
        <p><a href="/">Return home</a></p>
      </main>
    </Document>
  );
}

function getRootSessionFallback(serverContext?: {
  bootstrap?: typeof DEFAULT_BOOTSTRAP;
}) {
  return serverContext?.bootstrap?.session ?? DEFAULT_BOOTSTRAP.session;
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Whitelabel' },
      { name: 'description', content: 'Hybrid foundation for SSR landing pages plus an offline-first game app with optional sync.' },
    ],
  }),
  loader: async ({ serverContext }) => {
    const fallbackSession = getRootSessionFallback(serverContext);
    const session = process.env.TSS_PRERENDERING === 'true'
      ? DEFAULT_BOOTSTRAP.session
      : await loadStartSession({ serverContext }).catch(() => fallbackSession);

    return { session };
  },
  component: () => (
    <Document>
      <RootAppShell />
    </Document>
  ),
  notFoundComponent: NotFoundPage,
});

function RootAppShell() {
  const { session } = Route.useLoaderData();

  return (
    <StartRouteProviders session={session}>
      <Outlet />
    </StartRouteProviders>
  );
}
