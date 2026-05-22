import { Link } from '../components/Link';
import { HOMEPAGE_POSTS } from '../../shared/content/blog-posts';
import { BlogShell } from './BlogShell';
import styles from './BlogHomePage.module.css';

const featuredPost = HOMEPAGE_POSTS.find((post) => post.featured) ?? HOMEPAGE_POSTS[0];

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function BlogHomePage() {
  return (
    <BlogShell pageHead={[{ value: 'home' }, { label: '', value: `${HOMEPAGE_POSTS.length} posts` }]}>
      <section className={styles.hero}>
        <h1 className={styles.headline}>
          Notes from building a software factory.
        </h1>
        <p className={styles.subtitle}>
          A personal tech blog about agent-driven development, harness design, and the small
          services that keep a coding-agent factory honest.
        </p>
        <div className={styles.actions}>
          <Link to={`/posts/${featuredPost.slug}`} className={styles.actionPrimary}>read the latest</Link>
          <Link to="/posts" className={styles.actionSecondary}>browse archive</Link>
        </div>
      </section>

      <section className={styles.archive}>
        <header className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>Recent posts</span>
            <h2 className={styles.sectionTitle}>{HOMEPAGE_POSTS.length} entries</h2>
          </div>
          <Link to="/posts" className={styles.sectionLink}>see all</Link>
        </header>

        <div className={styles.archiveList}>
          {HOMEPAGE_POSTS.map((post) => (
            <Link key={post.slug} to={`/posts/${post.slug}`} className={styles.postCard}>
              <div className={styles.postMeta}>
                <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
                <span>{post.readingTime}</span>
              </div>
              <h3 className={styles.postCardTitle}>{post.title}</h3>
              <p className={styles.postCardSummary}>{post.summary}</p>
              <div className={styles.postTags}>
                {post.tags.map((tag) => (
                  <span key={tag} className={styles.postTag}>{tag}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <p className={styles.footerNote}>
        Posts are plain markdown in the repo. The publishing system renders code fences and
        Mermaid diagrams without ceremony.
      </p>
    </BlogShell>
  );
}
