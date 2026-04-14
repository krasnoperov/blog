import type { ReactNode } from 'react';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import '../styles.css';

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f4ede2" />
        <HeadContent />
      </head>
      <body>
        {children}
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

export const Route = createRootRoute({
  component: () => (
    <Document>
      <Outlet />
    </Document>
  ),
  notFoundComponent: NotFoundPage,
});
