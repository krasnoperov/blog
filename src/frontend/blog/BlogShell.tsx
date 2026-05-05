import type { ReactNode } from 'react';
import { AppHeader } from '../components/AppHeader';
import { Link } from '../components/Link';
import styles from './BlogShell.module.css';

export interface PageHeadSegment {
  label?: string;
  value: string;
  hideOnMobile?: boolean;
}

interface BlogShellProps {
  children: ReactNode;
  statusText?: string;
  pageHead?: PageHeadSegment[];
}

export function BlogShell({ children, statusText, pageHead }: BlogShellProps) {
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

      {pageHead && pageHead.length > 0 && (
        <div className={styles.pageHead}>
          {pageHead.map((segment, index) => (
            <span
              key={index}
              className={segment.hideOnMobile ? styles.pageHeadHideOnMobile : undefined}
            >
              {index > 0 && <span className={styles.pageHeadSep}> · </span>}
              {segment.label && <span className={styles.pageHeadLabel}>{segment.label} </span>}
              <span className={styles.pageHeadValue}>{segment.value}</span>
            </span>
          ))}
        </div>
      )}

      <main className={styles.main}>{children}</main>
    </div>
  );
}
