import { createFileRoute } from '@tanstack/react-router';
import MermaidSvgLabPage from '../../frontend/blog/MermaidSvgLabPage';

export const Route = createFileRoute('/experiments/mermaid-svg')({
  head: () => ({
    meta: [
      { title: 'Mermaid SVG Lab | Krasnoperov Blog' },
      {
        name: 'description',
        content: 'Experimental page comparing runtime Mermaid rendering with prerendered static SVG output.',
      },
    ],
  }),
  component: MermaidSvgLabPage,
});
