import { Link } from '../components/Link';
import { useAuth } from '../contexts/useAuth';
import { AppHeader } from '../components/AppHeader';
import { HeaderNav } from '../components/HeaderNav';
import { LANDING_PAGES } from '../../shared/content/landing-pages';
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
              <h2 className={styles.headline}>SSR landing pages outside, offline-first game engine inside.</h2>
              <p className={styles.subtitle}>
                Use this foundation for a public content website with many independent text pages, and a local-first `/app` experience that keeps running even when the network disappears.
              </p>

              <div className={styles.features}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📰</span>
                  <span className={styles.featureText}>SSR content</span>
                  <span className={styles.featureDescription}>Public marketing and guide pages render server-side for indexing, sharing, and fast first paint</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📦</span>
                  <span className={styles.featureText}>Content registry</span>
                  <span className={styles.featureDescription}>Add independent markdown-backed landing pages without dragging app state into the public surface</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>📱</span>
                  <span className={styles.featureText}>Offline-first app</span>
                  <span className={styles.featureDescription}>Local drafts, local phase transitions, and optional sync that can be unplugged safely</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>🔐</span>
                  <span className={styles.featureText}>Account-aware sync</span>
                  <span className={styles.featureDescription}>Keep auth and remote APIs available for profiles and future backup or collaboration workflows</span>
                </div>
              </div>

              <div className={styles.ctaButtons}>
                <Link to="/app" className={styles.ctaButton}>Open App Shell</Link>
                <Link to="/guides" className={styles.ctaButton}>Browse Guides</Link>
              </div>

              <div className={styles.features}>
                {LANDING_PAGES.map((page) => (
                  <div key={page.slug} className={styles.featureItem}>
                    <span className={styles.featureIcon}>→</span>
                    <span className={styles.featureText}>
                      <Link to={`/guides/${page.slug}`} className={styles.authButton}>{page.title}</Link>
                    </span>
                    <span className={styles.featureDescription}>{page.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.hero}>
              <h2 className={styles.headline}>Welcome, {user.name}!</h2>
              <p className={styles.subtitle}>
                Your authenticated shell is ready. Use the public SSR guides for acquisition and the offline-first app for actual play.
              </p>
              <div className={styles.ctaButtons}>
                <Link to="/app" className={styles.ctaButton}>Open App</Link>
                <Link to="/profile" className={styles.ctaButton}>View Profile</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
