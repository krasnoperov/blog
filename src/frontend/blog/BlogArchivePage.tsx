import { BLOG_POSTS } from '../../shared/content/blog-posts';
import { Link } from '../components/Link';
import { BlogShell } from './BlogShell';
import styles from './BlogArchivePage.module.css';

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function BlogArchivePage() {
  return (
    <BlogShell>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Archive · {BLOG_POSTS.length} posts</span>
        <h1 className={styles.title}>Notes and essays, one post at a time.</h1>
        <p className={styles.description}>
          Everything in order: the agent setup that ships my products, and what I learn building
          and running the products themselves.
        </p>
      </section>

      <section className={styles.postList}>
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} to={`/posts/${post.slug}`} className={styles.postLink}>
            <div className={styles.postMeta}>
              <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
              <span>{post.readingTime}</span>
            </div>
            <h2 className={styles.postTitle}>{post.title}</h2>
            <p className={styles.postSummary}>{post.summary}</p>
            <div className={styles.postTags}>
              {post.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </BlogShell>
  );
}
