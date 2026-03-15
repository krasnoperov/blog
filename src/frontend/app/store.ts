import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getSyncAdapter } from './sync';

export type DraftPhase = 'setup' | 'lobby' | 'night' | 'day' | 'summary';

export interface GameDraft {
  id: string;
  title: string;
  phase: DraftPhase;
  playersCount: number;
  notes: string;
  updatedAt: string;
  dirty: boolean;
  lastSyncedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  draftId: string;
  operation: 'upsert';
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface AppStoreState {
  drafts: GameDraft[];
  syncQueue: SyncQueueItem[];
  syncEnabled: boolean;
  lastSyncAttemptAt?: string;
  syncStatusMessage?: string;
  createDraft: () => string;
  updateDraft: (draftId: string, updates: Partial<Omit<GameDraft, 'id'>>) => void;
  advanceDraftPhase: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  flushSyncQueue: () => Promise<void>;
}

const PHASE_ORDER: DraftPhase[] = ['setup', 'lobby', 'night', 'day', 'summary'];

function nextPhase(phase: DraftPhase): DraftPhase {
  const index = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[(index + 1) % PHASE_ORDER.length] || 'setup';
}

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function queueUpsert(syncQueue: SyncQueueItem[], draftId: string): SyncQueueItem[] {
  const withoutExisting = syncQueue.filter((item) => item.draftId !== draftId);
  return [
    ...withoutExisting,
    {
      id: crypto.randomUUID(),
      draftId,
      operation: 'upsert',
      createdAt: new Date().toISOString(),
      attempts: 0,
    },
  ];
}

export const useAppStore = create<AppStoreState>()(persist((set, get) => ({
  drafts: [],
  syncQueue: [],
  syncEnabled: false,
  lastSyncAttemptAt: undefined,
  syncStatusMessage: 'Local-only mode',
  createDraft: () => {
    const id = crypto.randomUUID();
    const draft: GameDraft = {
      id,
      title: `Session ${new Date().toLocaleDateString()}`,
      phase: 'setup',
      playersCount: 8,
      notes: '',
      updatedAt: new Date().toISOString(),
      dirty: true,
    };

    set((state) => ({
      drafts: [draft, ...state.drafts],
      syncQueue: state.syncEnabled ? queueUpsert(state.syncQueue, id) : state.syncQueue,
      syncStatusMessage: state.syncEnabled ? 'Queued local changes for sync' : 'Saved locally',
    }));

    return id;
  },
  updateDraft: (draftId, updates) => set((state) => ({
    drafts: state.drafts.map((draft) => draft.id === draftId ? {
      ...draft,
      ...updates,
      updatedAt: new Date().toISOString(),
      dirty: true,
    } : draft),
    syncQueue: state.syncEnabled ? queueUpsert(state.syncQueue, draftId) : state.syncQueue,
    syncStatusMessage: state.syncEnabled ? 'Queued local changes for sync' : 'Saved locally',
  })),
  advanceDraftPhase: (draftId) => set((state) => ({
    drafts: state.drafts.map((draft) => draft.id === draftId ? {
      ...draft,
      phase: nextPhase(draft.phase),
      updatedAt: new Date().toISOString(),
      dirty: true,
    } : draft),
    syncQueue: state.syncEnabled ? queueUpsert(state.syncQueue, draftId) : state.syncQueue,
    syncStatusMessage: state.syncEnabled ? 'Queued local changes for sync' : 'Saved locally',
  })),
  deleteDraft: (draftId) => set((state) => {
    const remainingDrafts = state.drafts.filter((draft) => draft.id !== draftId);
    return {
      drafts: remainingDrafts,
      syncQueue: state.syncQueue.filter((item) => item.draftId !== draftId),
      syncStatusMessage: 'Draft removed locally',
    };
  }),
  setSyncEnabled: (enabled) => set((state) => ({
    syncEnabled: enabled,
    syncQueue: enabled
      ? state.drafts.reduce((queue, draft) => draft.dirty ? queueUpsert(queue, draft.id) : queue, state.syncQueue)
      : state.syncQueue,
    syncStatusMessage: enabled ? 'Sync enabled when adapter and network are available' : 'Local-only mode',
  })),
  flushSyncQueue: async () => {
    const { drafts, syncQueue, syncEnabled } = get();
    const adapter = getSyncAdapter();

    if (!syncEnabled) {
      set({
        lastSyncAttemptAt: new Date().toISOString(),
        syncStatusMessage: 'Sync is disabled',
      });
      return;
    }

    if (!adapter.isConfigured()) {
      set({
        lastSyncAttemptAt: new Date().toISOString(),
        syncStatusMessage: 'Sync adapter not configured yet',
      });
      return;
    }

    for (const job of syncQueue) {
      const draft = drafts.find((item) => item.id === job.draftId);
      if (!draft) {
        continue;
      }

      try {
        await adapter.pushDraft({
          id: draft.id,
          title: draft.title,
          phase: draft.phase,
          playersCount: draft.playersCount,
          notes: draft.notes,
          updatedAt: draft.updatedAt,
        });

        set((state) => ({
          drafts: state.drafts.map((item) => item.id === draft.id ? {
            ...item,
            dirty: false,
            lastSyncedAt: new Date().toISOString(),
          } : item),
          syncQueue: state.syncQueue.filter((item) => item.id !== job.id),
          lastSyncAttemptAt: new Date().toISOString(),
          syncStatusMessage: 'Sync completed',
        }));
      } catch (error) {
        set((state) => ({
          syncQueue: state.syncQueue.map((item) => item.id === job.id ? {
            ...item,
            attempts: item.attempts + 1,
            lastError: error instanceof Error ? error.message : 'Unknown sync error',
          } : item),
          lastSyncAttemptAt: new Date().toISOString(),
          syncStatusMessage: 'Sync failed; local state is still safe',
        }));
      }
    }
  },
}), {
  name: 'whitelabel-app-store',
  storage: createJSONStorage(() => (
    typeof window === 'undefined'
      ? noopStorage
      : window.localStorage
  )),
  partialize: (state) => ({
    drafts: state.drafts,
    syncQueue: state.syncQueue,
    syncEnabled: state.syncEnabled,
    lastSyncAttemptAt: state.lastSyncAttemptAt,
    syncStatusMessage: state.syncStatusMessage,
  }),
}));
