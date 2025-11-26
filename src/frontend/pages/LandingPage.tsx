import { Link } from '../components/Link';
import { useAuth } from '../contexts/useAuth';
import { AppHeader } from '../components/AppHeader';
import { HeaderNav } from '../components/HeaderNav';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <AppHeader
        leftSlot={(
          <Link to="/" className={styles.brand}>
            Bare Framework
          </Link>
        )}
        rightSlot={
          user ? (
            <HeaderNav userName={user.name} userEmail={user.email} />
          ) : (
            <Link to="/login" className={styles.authButton}>Sign In</Link>
          )
        }
      />

      <main className={styles.main}>
        <div className={styles.container}>
          {!user ? (
            <div className={styles.hero}>
              <h2 className={styles.headline}>Build Your Next Project</h2>
              <p className={styles.subtitle}>
                A modern, authenticated web application framework on Cloudflare Workers.
                Multi-user support, dual-worker architecture, real-time chat, and ready for your domain logic.
              </p>

              <div className={styles.features}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🔐</span>
                  <span className={styles.featureText}>Authentication</span>
                  <span className={styles.featureDescription}>Google OAuth with JWT tokens, secure user sessions</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>👥</span>
                  <span className={styles.featureText}>Multi-User</span>
                  <span className={styles.featureDescription}>User profiles, role-based access, complete user management</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>⚡</span>
                  <span className={styles.featureText}>Dual Workers</span>
                  <span className={styles.featureDescription}>HTTP worker for API + frontend, processing worker for async jobs</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>💬</span>
                  <span className={styles.featureText}>Real-Time Chat</span>
                  <span className={styles.featureDescription}>Chat components ready for AI integration or messaging</span>
                </div>
              </div>

              <div className={styles.ctaButtons}>
                <Link to="/login" className={styles.ctaButton}>Get Started</Link>
              </div>
            </div>
          ) : (
            <div className={styles.hero}>
              <h2 className={styles.headline}>Welcome, {user.name}!</h2>
              <p className={styles.subtitle}>
                You're logged in and ready to build. This is your bare framework foundation—add your domain logic to get started.
              </p>
              <div className={styles.ctaButtons}>
                <Link to="/profile" className={styles.ctaButton}>View Profile</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
