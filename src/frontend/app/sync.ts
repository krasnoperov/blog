export interface SyncDraftPayload {
  id: string;
  title: string;
  phase: string;
  playersCount: number;
  notes: string;
  updatedAt: string;
}

export interface SyncAdapter {
  name: string;
  isConfigured(): boolean;
  pushDraft(draft: SyncDraftPayload): Promise<void>;
}

const noopSyncAdapter: SyncAdapter = {
  name: 'disabled',
  isConfigured() {
    return false;
  },
  async pushDraft() {
    throw new Error('No sync adapter configured');
  },
};

let activeSyncAdapter: SyncAdapter = noopSyncAdapter;

export function configureSyncAdapter(adapter: SyncAdapter) {
  activeSyncAdapter = adapter;
}

export function getSyncAdapter(): SyncAdapter {
  return activeSyncAdapter;
}
