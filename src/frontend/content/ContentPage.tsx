import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from '../components/Link';
import { AppHeader } from '../components/AppHeader';
import { HeaderNav } from '../components/HeaderNav';
import { useAuth } from '../contexts/useAuth';
import { LANDING_PAGES, type LandingPageEntry } from '../../shared/content/landing-pages';
import markdownStyles from '../styles/markdown.module.css';
import styles from './ContentPage.module.css';

interface ContentPageProps {
  page: LandingPageEntry;
}

export function ContentPage({ page }: ContentPageProps) {
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
        <span className={styles.eyebrow}>{page.eyebrow}</span>
        <h1 className={styles.title}>{page.title}</h1>
        <p className={styles.description}>{page.description}</p>

        <div className={styles.layout}>
          <article className={`${styles.article} ${markdownStyles.markdown}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {page.markdown}
            </ReactMarkdown>
          </article>

          <aside className={styles.sidebar}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Launch surfaces</h2>
              <p className={styles.cardText}>
                Public guides stay SSR-friendly and search-friendly. The interactive runtime lives in the offline-first app shell.
              </p>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Related pages</h2>
              <div className={styles.linkList}>
                {LANDING_PAGES.filter((entry) => entry.slug !== page.slug).map((entry) => (
                  <Link key={entry.slug} to={`/guides/${entry.slug}`} className={styles.pageLink}>
                    <span className={styles.pageLinkTitle}>{entry.title}</span>
                    <span className={styles.pageLinkBody}>{entry.description}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Open the app</h2>
              <p className={styles.cardText}>
                The `/app` route is the local-first shell where game sessions, engine state, and optional sync live.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
