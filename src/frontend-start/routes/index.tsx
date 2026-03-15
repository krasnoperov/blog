import { createFileRoute } from '@tanstack/react-router';
import LandingPage from '../../frontend/pages/LandingPage';

export const Route = createFileRoute('/')({
  component: LandingPage,
});
