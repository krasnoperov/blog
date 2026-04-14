import { Link } from '../components/Link';
import { BLOG_POSTS } from '../../shared/content/blog-posts';
import { BlogShell } from './BlogShell';
import styles from './BlogHomePage.module.css';

const featuredPost = BLOG_POSTS.find((post) => post.featured) ?? BLOG_POSTS[0];
const archivePosts = BLOG_POSTS.filter((post) => post.slug !== featuredPost.slug);

export default function BlogHomePage() {
  return (
    <BlogShell statusText="Ideas into delivery · Static markdown">
      <section className={styles.hero}>
        <div className={styles.heroPanel}>
          <span className={styles.eyebrow}>Personal tech blog</span>
          <h1 className={styles.headline}>Notes from building a software factory.</h1>
          <p className={styles.subtitle}>
            This is a personal tech blog about building a software factory. The first post is intentionally
            small and practical: a self-demonstrating note that shows how markdown, code fences, and
            Mermaid diagrams render in the publishing system.
          </p>

          <div className={styles.actions}>
            <Link to={`/posts/${featuredPost.slug}`} className={styles.primaryAction}>Read the latest post</Link>
            <Link to="/posts" className={styles.secondaryAction}>Browse the archive</Link>
            <Link to="/experiments/mermaid-svg" className={styles.secondaryAction}>Open the Mermaid SVG lab</Link>
          </div>

          <div className={styles.signalGrid}>
            <div className={styles.signalItem}>
              <span className={styles.signalLabel}>Source format</span>
              <span className={styles.signalValue}>Plain markdown with code and diagrams</span>
            </div>
            <div className={styles.signalItem}>
              <span className={styles.signalLabel}>Current theme</span>
              <span className={styles.signalValue}>Formatting a clean writing surface for future factory notes</span>
            </div>
            <div className={styles.signalItem}>
              <span className={styles.signalLabel}>Publishing surface</span>
              <span className={styles.signalValue}>Server-rendered posts with polished reading UX</span>
            </div>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div>
            <h2 className={styles.asideTitle}>What lives here</h2>
            <p className={styles.asideCopy}>
              The seeded fake posts are gone. What remains is a single real starter note that proves the
              authoring model and leaves the rest of the archive ready for your own writing.
            </p>
          </div>

          <div className={styles.asideList}>
            <div className={styles.asideItem}>
              <strong>Markdown first</strong>
              Write plain text that stays readable in the repo.
            </div>
            <div className={styles.asideItem}>
              <strong>Diagram ready</strong>
              Add Mermaid only when a system is easier to see than to describe.
            </div>
            <div className={styles.asideItem}>
              <strong>Ready for real posts</strong>
              The rest of the archive is now open for your actual content.
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Featured post</span>
              <h2 className={styles.sectionTitle}>Start by proving the format</h2>
            </div>
          </div>
          <p className={styles.sectionBody}>
            Before filling the archive with serious essays, the blog needs one honest post that demonstrates
            how technical writing will look and feel once it is published.
          </p>

          <Link to={`/posts/${featuredPost.slug}`} className={styles.featuredCard}>
            <div className={styles.postMeta}>
              <span>{featuredPost.publishedAt}</span>
              <span>{featuredPost.readingTime}</span>
            </div>
            <h3 className={styles.featuredTitle}>{featuredPost.title}</h3>
            <p className={styles.featuredSummary}>{featuredPost.summary}</p>
            <div className={styles.tagRow}>
              {featuredPost.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </Link>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Archive</span>
              <h2 className={styles.sectionTitle}>Current writing</h2>
            </div>
            <Link to="/posts" className={styles.secondaryAction}>See all posts</Link>
          </div>

          <div className={styles.archiveList}>
            {archivePosts.map((post) => (
              <Link key={post.slug} to={`/posts/${post.slug}`} className={styles.postCard}>
                <div className={styles.postMeta}>
                  <span>{post.publishedAt}</span>
                  <span>{post.readingTime}</span>
                </div>
                <h3 className={styles.postCardTitle}>{post.title}</h3>
                <p className={styles.postCardSummary}>{post.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <p className={styles.footerNote}>
        The archive now begins with one self-demonstrating hello-world post. Future entries can stay just
        as simple at the source level: markdown in, polished HTML out.
      </p>
    </BlogShell>
  );
}
