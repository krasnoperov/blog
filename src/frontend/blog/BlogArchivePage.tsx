import { BLOG_POSTS } from '../../shared/content/blog-posts';
import { Link } from '../components/Link';
import { BlogShell } from './BlogShell';
import styles from './BlogArchivePage.module.css';

export default function BlogArchivePage() {
  return (
    <BlogShell statusText={`${BLOG_POSTS.length} posts · Markdown-first publishing`}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Archive</span>
        <h1 className={styles.title}>Software factory writing, one post at a time.</h1>
        <p className={styles.description}>
          The archive starts with a single formatting post that demonstrates the writing surface.
          Everything after that can be your own notes, essays, diagrams, and technical walkthroughs.
        </p>
      </section>

      <section className={styles.postList}>
        {BLOG_POSTS.map((post) => (
          <Link key={post.slug} to={`/posts/${post.slug}`} className={styles.postLink}>
            <div>
              <div className={styles.postMeta}>
                <span>{post.publishedAt}</span>
                <span>{post.readingTime}</span>
              </div>
              <h2 className={styles.postTitle}>{post.title}</h2>
              <p className={styles.postSummary}>{post.summary}</p>
            </div>

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
