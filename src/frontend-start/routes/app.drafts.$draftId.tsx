import { createFileRoute } from '@tanstack/react-router';
import { AppDraftEditorPanel } from '../../frontend/app/AppDraftEditorPanel';

export const Route = createFileRoute('/app/drafts/$draftId')({
  component: AppDraftDetailStartRoute,
});

function AppDraftDetailStartRoute() {
  const { draftId } = Route.useParams();

  return <AppDraftEditorPanel draftId={draftId} />;
}
