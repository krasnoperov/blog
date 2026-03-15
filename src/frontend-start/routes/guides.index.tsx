import { createFileRoute } from '@tanstack/react-router';
import { Link } from '../../frontend/components/Link';
import { AppHeader } from '../../frontend/components/AppHeader';
import { HeaderNav } from '../../frontend/components/HeaderNav';
import { useAuth } from '../../frontend/contexts/useAuth';
import { LANDING_PAGES } from '../../shared/content/landing-pages';
import styles from '../../frontend/content/ContentPage.module.css';

export const Route = createFileRoute('/guides/')({
  component: GuidesIndexRoute,
});

function GuidesIndexRoute() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <AppHeader
        leftSlot={(
          <Link to="/" className={styles.brand}>
            Mafia Engine
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
        <span className={styles.eyebrow}>SSR content library</span>
        <h1 className={styles.title}>Independent landing pages and guides</h1>
        <p className={styles.description}>
          Add more markdown entries to the content catalog and they will be available as server-rendered public pages.
        </p>

        <div className={styles.linkList}>
          {LANDING_PAGES.map((page) => (
            <Link key={page.slug} to={`/guides/${page.slug}`} className={styles.pageLink}>
              <span className={styles.pageLinkTitle}>{page.title}</span>
              <span className={styles.pageLinkBody}>{page.description}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
