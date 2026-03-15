import { createFileRoute } from '@tanstack/react-router';
import { AppSettingsPanel } from '../../frontend/app/AppSettingsPanel';

export const Route = createFileRoute('/app/settings')({
  component: AppSettingsStartRoute,
});

function AppSettingsStartRoute() {
  return <AppSettingsPanel />;
}
