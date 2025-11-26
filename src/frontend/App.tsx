import { useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AuthorizationApprovalPage from './pages/AuthorizationApprovalPage';
import { loadSession } from './config';
import type { User } from './contexts/AuthContext';
import { useRouteStore } from './stores/routeStore';
import './styles/theme.css';

// Router component that renders based on route store
function AppRouter() {
  const page = useRouteStore((state) => state.page);

  switch (page) {
    case 'landing':
      return <LandingPage />;
    case 'login':
      return <LoginPage />;
    case 'profile':
      return <ProfilePage />;
    case 'oauthApprove':
      return <AuthorizationApprovalPage />;
    default:
      // Unknown route - show 404 or redirect to home
      return <LandingPage />;
  }
}


function App() {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [clientId, setClientId] = useState('');
  const [initialUser, setInitialUser] = useState<User | null>(null);

  useEffect(() => {
    loadSession().then((session) => {
      setClientId(session.config.googleClientId);
      setInitialUser(session.user);
      setSessionLoaded(true);
      if (!session.config.googleClientId) {
        console.error('Google Client ID not provided by backend');
      }
    });
  }, []);

  if (!sessionLoaded) {
    return null;
  }

  if (!clientId) {
    return (
      <AuthProvider initialUser={initialUser}>
        <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
          Google OAuth not configured. Please contact administrator.
        </div>
      </AuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider initialUser={initialUser}>
        <AppRouter />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
