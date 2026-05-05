import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Link } from '../components/Link';
import styles from './BlogShell.module.css';

interface BlogShellProps {
  children: ReactNode;
  statusText?: string;
}

export function BlogShell({ children, statusText }: BlogShellProps) {
  return (
    <div className={styles.page}>
      <AppHeader
        className={styles.header}
        leftSlot={(
          <Link to="/" className={styles.brand}>
            <span className={styles.brandSigil}>$</span>
            <span className={styles.brandName}>krasnoperov</span>
            <span className={styles.brandSuffix}>.me</span>
          </Link>
        )}
        centerSlot={(
          <div className={styles.nav}>
            <Link to="/" className={styles.navLink}>home</Link>
            <Link to="/posts" className={styles.navLink}>archive</Link>
          </div>
        )}
        rightSlot={statusText ? <span className={styles.statusPill}>{statusText}</span> : null}
      />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
