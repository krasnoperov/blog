import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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

const DEFAULT_HEADER_HEIGHT = 72;
const SCROLL_THRESHOLD = 2;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const lastScrollY = useRef(0);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const maxOffsetRef = useRef(DEFAULT_HEADER_HEIGHT);

  const applyOffset = useCallback((value: number) => {
    const maxOffset = maxOffsetRef.current || DEFAULT_HEADER_HEIGHT;
    const nextOffset = Math.max(0, Math.min(value, maxOffset));
    if (nextOffset !== offsetRef.current) {
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
    }
  }, []);

  const measure = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      return;
    }
    const measured = wrapper.offsetHeight || DEFAULT_HEADER_HEIGHT;
    maxOffsetRef.current = measured;
    applyOffset(offsetRef.current);
  }, [applyOffset]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    lastScrollY.current = window.scrollY;

    measure();

    const updateVisibility = () => {
      const current = window.scrollY;
      const diff = current - lastScrollY.current;

      if (Math.abs(diff) <= SCROLL_THRESHOLD) {
        return;
      }

      let candidateOffset = offsetRef.current + diff;
      if (current <= 0) {
        candidateOffset = 0;
      }

      applyOffset(candidateOffset);

      lastScrollY.current = current;
    };

    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        updateVisibility();
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measure);

    const wrapper = wrapperRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrapper) {
      resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(wrapper);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measure);
      resizeObserver?.disconnect();
    };
  }, [measure, applyOffset]);

  useEffect(() => {
    measure();
  }, [measure]);

  return (
    <>
      <TopLoadingBar isLoading={isLoading} />
      <div
        ref={wrapperRef}
        className={mergeClasses(styles.headerWrapper, className)}
        style={{ transform: `translate3d(0, -${offset}px, 0)` }}
      >
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
