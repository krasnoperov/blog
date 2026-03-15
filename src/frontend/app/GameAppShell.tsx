import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate as useRouterNavigate } from '@tanstack/react-router';
import { AppHeader } from '../components/AppHeader';
import { HeaderNav } from '../components/HeaderNav';
import { Link } from '../components/Link';
import { useAuth } from '../contexts/useAuth';
import { useOnlineStatus } from './useOnlineStatus';
import { useAppStore } from './store';
import { getSyncAdapter } from './sync';
import styles from './GameAppShell.module.css';

interface GameAppShellProps {
  children: ReactNode;
}

export default function GameAppShell({ children }: GameAppShellProps) {
  const { user } = useAuth();
  const navigate = useRouterNavigate();
  const { pathname } = useLocation();
  const isOnline = useOnlineStatus();

  const drafts = useAppStore((state) => state.drafts);
  const syncQueue = useAppStore((state) => state.syncQueue);
  const syncEnabled = useAppStore((state) => state.syncEnabled);
  const syncStatusMessage = useAppStore((state) => state.syncStatusMessage);
  const lastSyncAttemptAt = useAppStore((state) => state.lastSyncAttemptAt);
  const createDraft = useAppStore((state) => state.createDraft);
  const flushSyncQueue = useAppStore((state) => state.flushSyncQueue);

  useEffect(() => {
    if (!isOnline || !syncEnabled || syncQueue.length === 0) {
      return;
    }

    void flushSyncQueue();
  }, [isOnline, syncEnabled, syncQueue.length, flushSyncQueue]);

  const dirtyDrafts = drafts.filter((draft) => draft.dirty).length;
  const syncAdapter = getSyncAdapter();

  const handleCreateDraft = () => {
    const draftId = createDraft();
    void navigate({
      to: '/app/drafts/$draftId',
      params: { draftId },
    });
  };

  return (
    <div className={styles.page}>
      <AppHeader
        leftSlot={(
          <Link to="/" className={styles.brand}>
            Mafia Engine
          </Link>
        )}
        rightSlot={
          user ? (
            <HeaderNav userName={user.name} userEmail={user.email} />
          ) : (
            <Link to="/login" className={styles.authButton}>Sign In</Link>
          )
        }
        statusSlot={(
          <div className={styles.statusRow}>
            <span className={`${styles.badge} ${isOnline ? styles.online : styles.offline}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className={styles.badge}>
              {syncEnabled ? `Sync: ${syncAdapter.name}` : 'Sync disabled'}
            </span>
            <span className={styles.badge}>{dirtyDrafts} local changes</span>
          </div>
        )}
      />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <span className={styles.kicker}>Offline-first app runtime</span>
            <h1 className={styles.title}>Run the game engine locally, sync later if you want.</h1>
            <p className={styles.description}>
              This shell is intentionally local-first. Drafts, phase transitions, and sync queue state stay on the device so the host flow survives lost connectivity.
            </p>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Local drafts</span>
                <span className={styles.statValue}>{drafts.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Queued sync jobs</span>
                <span className={styles.statValue}>{syncQueue.length}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Current mode</span>
                <span className={styles.statValue}>{syncEnabled ? 'Hybrid' : 'Device only'}</span>
              </div>
            </div>
          </div>

          <aside className={styles.panel}>
            <div className={styles.stack}>
              <h2 className={styles.sectionTitle}>Operational rules</h2>
              <p className={styles.muted}>Gameplay mutations save locally first. Remote sync is optional and can be added later via a sync adapter.</p>
              <div className={styles.editorActions}>
                <button className={styles.actionButton} onClick={handleCreateDraft}>
                  Create local session
                </button>
                <button className={styles.secondaryButton} onClick={() => void flushSyncQueue()}>
                  Try sync now
                </button>
              </div>
              <p className={styles.muted}>
                {syncStatusMessage}
                {lastSyncAttemptAt ? ` Last attempt: ${new Date(lastSyncAttemptAt).toLocaleString()}.` : ''}
              </p>
            </div>
          </aside>
        </section>

        <nav className={styles.tabs} aria-label="Game runtime sections">
          <RouterLink
            to="/app"
            activeOptions={{ exact: true }}
            className={`${styles.tab} ${(pathname === '/app' || pathname === '/app/') ? styles.tabActive : ''}`}
          >
            Overview
          </RouterLink>
          <RouterLink
            to="/app/drafts"
            className={`${styles.tab} ${pathname.startsWith('/app/drafts') ? styles.tabActive : ''}`}
          >
            Local drafts
          </RouterLink>
          <RouterLink
            to="/app/settings"
            className={`${styles.tab} ${pathname.startsWith('/app/settings') ? styles.tabActive : ''}`}
          >
            Settings
          </RouterLink>
        </nav>

        {children}
      </main>
    </div>
  );
}
