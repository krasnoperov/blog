import type { User } from './contexts/AuthContextProvider';

interface Config {
  googleClientId: string;
}

interface Session {
  config: Config;
  user: User | null;
}

export async function loadSession(): Promise<Session> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to load session, using dummy data for development');
      // Return dummy data for development when backend is not running
      return {
        config: { googleClientId: 'dummy-client-id-for-dev' },
        user: null,
      };
    }

    const data = await response.json() as { config?: Config; user?: User };
    return {
      config: data.config || { googleClientId: '' },
      user: data.user || null,
    };
  } catch (error) {
    console.error('Error loading session (backend might not be running):', error);
    // Return dummy data for development when backend is not running
    return {
      config: { googleClientId: 'dummy-client-id-for-dev' },
      user: null,
    };
  }
}