import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { AppOverviewPanel } from '../../frontend/app/AppOverviewPanel';
import GameAppShell from '../../frontend/app/GameAppShell';

export const Route = createFileRoute('/app')({
  component: AppStartRoute,
});

function AppStartRoute() {
  const { pathname } = useLocation();

  return (
    <GameAppShell>
      {pathname === '/app' ? <AppOverviewPanel /> : <Outlet />}
    </GameAppShell>
  );
}
