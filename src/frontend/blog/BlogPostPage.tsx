import { isValidElement, type HTMLAttributes, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BLOG_POSTS, type BlogPost } from '../../shared/content/blog-posts';
import { MermaidBlock } from '../components/MermaidBlock';
import { Link } from '../components/Link';
import markdownStyles from '../styles/markdown.module.css';
import { BlogShell } from './BlogShell';
import styles from './BlogPostPage.module.css';

interface BlogPostPageProps {
  post: BlogPost;
}

interface CodeProps extends HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }

  return '';
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function renderHeading(level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
  return function Heading({
    children,
    className,
    ...props
  }: HTMLAttributes<HTMLHeadingElement>) {
    const label = extractText(children);
    const id = slugifyHeading(label);
    const Tag = level;

    return (
      <Tag id={id || undefined} className={className} {...props}>
        {id ? (
          <a
            href={`#${id}`}
            className={markdownStyles.headingAnchor}
            aria-label={`Link to section ${label}`}
          >
            #
          </a>
        ) : null}
        {children}
      </Tag>
    );
  };
}

const markdownComponents: Components = {
  h1: renderHeading('h1'),
  h2: renderHeading('h2'),
  h3: renderHeading('h3'),
  h4: renderHeading('h4'),
  h5: renderHeading('h5'),
  h6: renderHeading('h6'),
  a({ href, children, ...props }) {
    const isExternal = typeof href === 'string' && /^https?:\/\//.test(href);

    return (
      <a
        href={href}
        {...props}
        rel={isExternal ? 'noreferrer' : undefined}
        target={isExternal ? '_blank' : undefined}
      >
        {children}
      </a>
    );
  },
  code({ inline, className, children, ...props }: CodeProps) {
    const languageMatch = /language-([\w-]+)/.exec(className ?? '');
    const code = String(children).replace(/\n$/, '');

    if (!inline && languageMatch?.[1] === 'mermaid') {
      return <MermaidBlock chart={code} />;
    }

    if (!inline) {
      return (
        <pre className={markdownStyles.codeFrame}>
          <code className={className} {...props}>
            {code}
          </code>
        </pre>
      );
    }

    return (
      <code className={markdownStyles.inlineCode} {...props}>
        {children}
      </code>
    );
  },
};

function formatPublishedDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BlogPostPage({ post }: BlogPostPageProps) {
  const relatedPosts = BLOG_POSTS.filter((candidate) => candidate.slug !== post.slug).slice(0, 2);

  return (
    <BlogShell
      pageHead={[
        { value: 'post' },
        { value: formatPublishedDate(post.publishedAt) },
        { value: post.readingTime },
        { value: post.title },
      ]}
    >
      <section className={styles.intro}>
        <Link to="/posts" className={styles.backLink}>← back to archive</Link>
        <div className={styles.meta}>
          <span>{formatPublishedDate(post.publishedAt)}</span>
          <span>{post.readingTime}</span>
        </div>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.summary}>{post.summary}</p>
      </section>

      <section className={styles.layout}>
        <article className={`${styles.article} ${markdownStyles.markdown}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.markdown}
          </ReactMarkdown>
        </article>
      </section>

      <footer className={styles.foot}>
        <div className={styles.footSection}>
          <span className={styles.footEyebrow}>Tags</span>
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className={styles.footSection}>
            <span className={styles.footEyebrow}>Keep reading</span>
            <div className={styles.relatedList}>
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} to={`/posts/${relatedPost.slug}`} className={styles.relatedLink}>
                  <span className={styles.relatedTitle}>{relatedPost.title}</span>
                  <span className={styles.relatedSummary}>{relatedPost.summary}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </footer>
    </BlogShell>
  );
}
