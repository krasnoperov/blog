import { useOnlineStatus } from './useOnlineStatus';
import { useAppStore } from './store';
import { getSyncAdapter } from './sync';
import styles from './GameAppShell.module.css';

export function AppSettingsPanel() {
  const isOnline = useOnlineStatus();
  const syncQueue = useAppStore((state) => state.syncQueue);
  const syncEnabled = useAppStore((state) => state.syncEnabled);
  const setSyncEnabled = useAppStore((state) => state.setSyncEnabled);
  const syncAdapter = getSyncAdapter();

  return (
    <section className={styles.panel}>
      <div className={styles.stack}>
        <h2 className={styles.sectionTitle}>Runtime settings</h2>
        <label className={styles.queueRow}>
          <input
            type="checkbox"
            checked={syncEnabled}
            onChange={(event) => setSyncEnabled(event.target.checked)}
          />
          <span className={styles.muted}>Enable optional sync queue</span>
        </label>

        <div className={styles.list}>
          <div className={styles.listItem}>
            Sync adapter: <strong>{syncAdapter.name}</strong>
          </div>
          <div className={styles.listItem}>
            Queue length: <strong>{syncQueue.length}</strong>
          </div>
          <div className={styles.listItem}>
            Connectivity: <strong>{isOnline ? 'online' : 'offline'}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
