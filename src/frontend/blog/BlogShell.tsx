import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Link } from '../components/Link';
import styles from './BlogShell.module.css';

interface BlogShellProps {
  children: ReactNode;
  statusText?: string;
}

export function BlogShell({
  children,
  statusText = 'Static markdown · Mermaid-ready',
}: BlogShellProps) {
  return (
    <div className={styles.page}>
      <AppHeader
        className={styles.header}
        leftSlot={(
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>K</span>
            <span className={styles.brandCopy}>
              <span className={styles.brandName}>Krasnoperov</span>
              <span className={styles.brandTag}>Software Factory Notes</span>
            </span>
          </Link>
        )}
        centerSlot={(
          <div className={styles.nav}>
            <Link to="/" className={styles.navLink}>Home</Link>
            <Link to="/posts" className={styles.navLink}>Archive</Link>
          </div>
        )}
        rightSlot={<span className={styles.statusPill}>{statusText}</span>}
      />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
