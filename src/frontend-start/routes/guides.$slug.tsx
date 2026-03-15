import { createFileRoute, notFound } from '@tanstack/react-router';
import { ContentPage } from '../../frontend/content/ContentPage';
import { getLandingPage } from '../../shared/content/landing-pages';

export const Route = createFileRoute('/guides/$slug')({
  loader: async ({ params }) => {
    const page = getLandingPage(params.slug);
    if (!page) {
      throw notFound();
    }

    return { page };
  },
  component: GuideRoute,
});

function GuideRoute() {
  const { page } = Route.useLoaderData();

  return <ContentPage page={page} />;
}
