import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { FrontendSession } from '../../frontend/bootstrap';
import { AuthProvider } from '../../frontend/contexts/AuthContext';
import { createQueryClient } from '../../frontend/queryClient';

interface StartRouteProvidersProps {
  children: ReactNode;
  session: FrontendSession;
}

function MaybeGoogleOAuthProvider({
  clientId,
  children,
}: {
  clientId?: string;
  children: ReactNode;
}) {
  if (!clientId) {
    return <>{children}</>;
  }

  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}

export function StartRouteProviders({ children, session }: StartRouteProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MaybeGoogleOAuthProvider clientId={session.config.googleClientId}>
        <AuthProvider initialUser={session.user}>
          {children}
        </AuthProvider>
      </MaybeGoogleOAuthProvider>
    </QueryClientProvider>
  );
}
