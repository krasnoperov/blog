import styles from './GameAppShell.module.css';

export function AppOverviewPanel() {
  return (
    <section className={styles.panel}>
      <h2 className={styles.sectionTitle}>How to extend this</h2>
      <div className={styles.list}>
        <div className={styles.listItem}>
          Replace the placeholder draft fields with your real game state machine.
        </div>
        <div className={styles.listItem}>
          Keep the store local-first so a game never depends on a live request.
        </div>
        <div className={styles.listItem}>
          Plug in a sync adapter only when you are ready for remote backup, accounts, or analytics.
        </div>
      </div>
    </section>
  );
}
