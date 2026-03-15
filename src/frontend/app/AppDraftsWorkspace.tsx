import type { ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate as useRouterNavigate } from '@tanstack/react-router';
import { useAppStore, type DraftPhase } from './store';
import styles from './GameAppShell.module.css';

const PHASE_LABELS: Record<DraftPhase, string> = {
  setup: 'Setup',
  lobby: 'Lobby',
  night: 'Night',
  day: 'Day',
  summary: 'Summary',
};

interface AppDraftsWorkspaceProps {
  children: ReactNode;
}

export function AppDraftsWorkspace({ children }: AppDraftsWorkspaceProps) {
  const navigate = useRouterNavigate();
  const { pathname } = useLocation();
  const drafts = useAppStore((state) => state.drafts);
  const createDraft = useAppStore((state) => state.createDraft);

  const handleCreateDraft = () => {
    const draftId = createDraft();
    void navigate({
      to: '/app/drafts/$draftId',
      params: { draftId },
    });
  };

  return (
    <section className={styles.grid}>
      <aside className={styles.draftList}>
        <button className={styles.actionButton} onClick={handleCreateDraft}>
          New draft
        </button>
        {drafts.length === 0 ? (
          <p className={styles.muted}>No local drafts yet. Create one and the shell will persist it on-device.</p>
        ) : drafts.map((draft) => (
          <RouterLink
            key={draft.id}
            to="/app/drafts/$draftId"
            params={{ draftId: draft.id }}
            className={`${styles.draftButton} ${pathname === `/app/drafts/${draft.id}` ? styles.draftButtonActive : ''}`}
          >
            <span className={styles.draftTitle}>{draft.title}</span>
            <span className={styles.draftMeta}>
              {PHASE_LABELS[draft.phase]} · {draft.playersCount} players · {draft.dirty ? 'local changes' : 'synced'}
            </span>
          </RouterLink>
        ))}
      </aside>

      {children}
    </section>
  );
}
