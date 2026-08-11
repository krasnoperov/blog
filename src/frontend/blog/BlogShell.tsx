import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Link } from '../components/Link';
import styles from './BlogShell.module.css';

interface BlogShellProps {
  children: ReactNode;
}

export function BlogShell({ children }: BlogShellProps) {
  return (
    <div className={styles.page}>
      <AppHeader
        className={styles.header}
        leftSlot={(
          <Link to="/" className={styles.brand} aria-label="krasnoperov.me">
            <span className={styles.brandName}>krasnoperov</span>
            <span className={styles.brandSuffix}>.me</span>
          </Link>
        )}
      />

      <main className={styles.main}>{children}</main>
    </div>
  );
}
