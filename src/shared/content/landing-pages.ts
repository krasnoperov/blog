import offlineFirstMafia from './pages/offline-first-mafia.md?raw';
import gameMasterGuide from './pages/game-master-guide.md?raw';
import localSyncArchitecture from './pages/local-sync-architecture.md?raw';
import landingPlaybook from './pages/landing-playbook.md?raw';

export interface LandingPageEntry {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  markdown: string;
}

export const LANDING_PAGES: LandingPageEntry[] = [
  {
    slug: 'offline-first-mafia',
    title: 'Offline-first Mafia Night',
    description: 'Design the host experience so the game continues smoothly with or without a network connection.',
    eyebrow: 'Offline play',
    markdown: offlineFirstMafia,
  },
  {
    slug: 'game-master-guide',
    title: 'Game Master Guide',
    description: 'Turn facilitation knowledge into SEO-friendly landing pages and shareable host resources.',
    eyebrow: 'Facilitation',
    markdown: gameMasterGuide,
  },
  {
    slug: 'local-sync-architecture',
    title: 'Local-first Sync Architecture',
    description: 'Separate local persistence from optional sync so product reliability does not depend on connectivity.',
    eyebrow: 'Architecture',
    markdown: localSyncArchitecture,
  },
  {
    slug: 'landing-playbook',
    title: 'Landing Page Playbook',
    description: 'Publish a growing set of independent marketing and guide pages from a clean content registry.',
    eyebrow: 'Content system',
    markdown: landingPlaybook,
  },
];

export function getLandingPage(slug: string): LandingPageEntry | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
