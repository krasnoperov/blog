import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { AppDraftsWorkspace } from '../../frontend/app/AppDraftsWorkspace';
import styles from '../../frontend/app/GameAppShell.module.css';

export const Route = createFileRoute('/app/drafts')({
  component: AppDraftsStartRoute,
});

function AppDraftsStartRoute() {
  const { pathname } = useLocation();

  return (
    <AppDraftsWorkspace>
      {pathname === '/app/drafts' ? (
        <div className={styles.editor}>
          <h2 className={styles.sectionTitle}>Choose a local draft</h2>
          <p className={styles.muted}>Select an existing session from the left or create a new one to keep the engine flow on-device.</p>
        </div>
      ) : (
        <Outlet />
      )}
    </AppDraftsWorkspace>
  );
}
