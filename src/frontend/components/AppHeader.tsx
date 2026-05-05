import type { ReactNode } from 'react';
import { TopLoadingBar } from './TopLoadingBar';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  statusSlot?: ReactNode;
  className?: string;
  isLoading?: boolean;
}

const mergeClasses = (...values: Array<string | undefined | false>) =>
  values.filter(Boolean).join(' ');

export function AppHeader({
  leftSlot,
  centerSlot,
  rightSlot,
  statusSlot,
  className,
  isLoading = false,
}: AppHeaderProps) {
  return (
    <>
      <TopLoadingBar isLoading={isLoading} />
      <div className={mergeClasses(styles.headerWrapper, className)}>
        <nav className={styles.header}>
          <div className={styles.side}>{leftSlot}</div>
          <div className={styles.center}>{centerSlot}</div>
          <div className={styles.side}>
            <div className={styles.rightContent}>{rightSlot}</div>
          </div>
        </nav>

        {statusSlot && (
          <div className={styles.status}>
            {statusSlot}
          </div>
        )}
      </div>
    </>
  );
}
