import { useNavigate as useRouterNavigate } from '@tanstack/react-router';
import { useAppStore, type DraftPhase } from './store';
import styles from './GameAppShell.module.css';

const PHASE_LABELS: Record<DraftPhase, string> = {
  setup: 'Setup',
  lobby: 'Lobby',
  night: 'Night',
  day: 'Day',
  summary: 'Summary',
};

interface AppDraftEditorPanelProps {
  draftId: string;
}

export function AppDraftEditorPanel({ draftId }: AppDraftEditorPanelProps) {
  const navigate = useRouterNavigate();
  const draft = useAppStore((state) => state.drafts.find((item) => item.id === draftId) ?? null);
  const updateDraft = useAppStore((state) => state.updateDraft);
  const advanceDraftPhase = useAppStore((state) => state.advanceDraftPhase);
  const deleteDraft = useAppStore((state) => state.deleteDraft);
  const flushSyncQueue = useAppStore((state) => state.flushSyncQueue);

  if (!draft) {
    return (
      <div className={styles.editor}>
        <h2 className={styles.sectionTitle}>Draft not found</h2>
        <p className={styles.muted}>This local session no longer exists on the device.</p>
        <button
          className={styles.secondaryButton}
          onClick={() => void navigate({ to: '/app/drafts' })}
        >
          Back to drafts
        </button>
      </div>
    );
  }

  const handleDeleteDraft = () => {
    deleteDraft(draft.id);
    void navigate({ to: '/app/drafts' });
  };

  return (
    <div className={styles.editor}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="draft-title">Session title</label>
        <input
          id="draft-title"
          className={styles.input}
          value={draft.title}
          onChange={(event) => updateDraft(draft.id, { title: event.target.value })}
        />
      </div>

      <div className={styles.editorMeta}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="draft-phase">Engine phase</label>
          <select
            id="draft-phase"
            className={styles.select}
            value={draft.phase}
            onChange={(event) => updateDraft(draft.id, { phase: event.target.value as DraftPhase })}
          >
            {Object.entries(PHASE_LABELS).map(([phase, label]) => (
              <option key={phase} value={phase}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="player-count">Players</label>
          <input
            id="player-count"
            type="number"
            min={4}
            max={20}
            className={styles.input}
            value={draft.playersCount}
            onChange={(event) => updateDraft(draft.id, { playersCount: Number(event.target.value) || 0 })}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="draft-notes">Local notes</label>
        <textarea
          id="draft-notes"
          className={styles.textarea}
          value={draft.notes}
          onChange={(event) => updateDraft(draft.id, { notes: event.target.value })}
        />
      </div>

      <div className={styles.editorActions}>
        <button className={styles.actionButton} onClick={() => advanceDraftPhase(draft.id)}>
          Advance phase
        </button>
        <button className={styles.secondaryButton} onClick={() => void flushSyncQueue()}>
          Flush queue
        </button>
        <button className={styles.dangerButton} onClick={handleDeleteDraft}>
          Delete draft
        </button>
      </div>
    </div>
  );
}
