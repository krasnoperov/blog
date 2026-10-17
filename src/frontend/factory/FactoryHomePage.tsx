import type { ReactNode } from 'react';
import { Link } from '../components/Link';
import { FactoryFigure } from './FactoryFigure';
import { FactoryLine } from './FactoryLine';
import styles from './FactoryHomePage.module.css';

const REPO = 'https://github.com/krasnoperov/patchrelay';

interface Station {
  n: string;
  name: string;
  // The machines in the figure this station is about.
  figure: string[];
  body: ReactNode;
  links: Array<{ label: string; href: string }>;
}

// Point the figure at machines: it dims the rest of the floor around them.
const pointAt = (ids: string[]) => document.dispatchEvent(new CustomEvent('fx-station', { detail: { ids } }));

const STATIONS: Station[] = [
  {
    n: '01',
    name: 'Intake',
    figure: ['intake'],
    body: (
      <>Issues live in Linear. Delegating one to the patchrelay app lets it write the feature; undelegating pauses it. Once a PR is approved and green, patchrelay may still repair its merge candidate, never the branch.</>
    ),
    links: [{ label: 'linear.app', href: 'https://linear.app' }],
  },
  {
    n: '02',
    name: 'Triage',
    figure: ['intake', 'patchrelay'],
    body: (
      <>I triage and plan in an ordinary Claude Code or Codex session: split the work into issues and set <code>blockedBy</code> between the ones that touch the same ground. When patchrelay picks an issue up, a short Codex pass only decides whether it is implementation or an umbrella that coordinates child issues.</>
    ),
    links: [{ label: 'patchrelay', href: REPO }],
  },
  {
    n: '03',
    name: 'Dev',
    figure: ['patchrelay', 'claude', 'codex'],
    body: (
      <>One durable worktree per issue. patchrelay drives Codex straight from Linear; I pick up the rest in Claude Code or Codex. Every path ends in a pull request.</>
    ),
    links: [
      { label: 'post', href: '/posts/patchrelay' },
      { label: 'ship-pr', href: 'https://github.com/krasnoperov/patchrelay-agents' },
    ],
  },
  {
    n: '04',
    name: 'Review',
    figure: ['review'],
    body: (
      <>review-quill checks out the exact head, reads it against the repo’s <code>REVIEW_WORKFLOW.md</code>, and posts a plain GitHub approve or request changes. Requested changes come back as a <code>review_fix</code> run when patchrelay wrote the code, or land in the waiting ship-pr session when I did.</>
    ),
    links: [
      { label: 'post', href: '/posts/review-quill' },
      { label: 'npm', href: 'https://www.npmjs.com/package/review-quill' },
    ],
  },
  {
    n: '05',
    name: 'Merge queue',
    figure: ['gate', 'stack', 'ci'],
    body: (
      <>merge-steward admits a PR approved on its exact head with green checks, then builds future-main candidates, each on top of the one ahead, and runs CI on those SHAs in parallel. A candidate that conflicts with the ones below, or goes red, is repaired in place on its candidate ref, rechecked by a narrow integration review, and tested again; the approved PR head stays frozen, and nothing is stacked on a conflict until it has a candidate.</>
    ),
    links: [
      { label: 'post', href: '/posts/merge-steward' },
      { label: 'npm', href: 'https://www.npmjs.com/package/merge-steward' },
    ],
  },
  {
    n: '06',
    name: 'Main',
    figure: ['stack'],
    body: (
      <>Landing is a fast-forward of <code>main</code> to the SHA that passed. If <code>main</code> moved first, the candidate is rebuilt on the new tip and tested again, not reviewed again.</>
    ),
    links: [{ label: 'post', href: '/posts/merge-trees' }],
  },
  {
    n: '07',
    name: 'Deploy',
    figure: ['deploy'],
    body: (
      <>A push to <code>main</code> runs the repo’s own Actions: stage and production on Cloudflare Workers, from the same SHA at once. On UserTold each runs a smoke test, and the issue is Done only when both pass.</>
    ),
    links: [{ label: 'post', href: '/posts/gates-not-autonomy' }],
  },
  {
    n: '08',
    name: 'Feedback',
    figure: ['usertold'],
    body: (
      <>UserTold interviews the people using what shipped. Interviews become evidence, evidence becomes findings, and the findings I send land in Linear’s Triage as the next work on the line.</>
    ),
    links: [{ label: 'usertold.ai', href: 'https://usertold.ai' }],
  },
  {
    n: '—',
    name: 'Human Needed',
    figure: ['desk'],
    body: (
      <>Every repair loop (<code>review_fix</code>, <code>ci_repair</code>, queue and integration repair) has a budget, ten tries each on my repos. When one runs out, the issue moves to Human Needed. The agents are told to stop and ask before touching auth, migrations, bindings or dependencies.</>
    ),
    links: [{ label: 'post', href: '/posts/gates-not-autonomy' }],
  },
  {
    n: '—',
    name: 'GitHub, the bus',
    figure: ['bus'],
    body: (
      <>The services never call each other. A webhook only wakes them; every decision is re-read from GitHub: head SHA, reviews, checks, refs.</>
    ),
    links: [{ label: 'source', href: REPO }],
  },
];


function Outbound({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('/')) return <Link to={href} className={styles.link}>{children}</Link>;
  return <a href={href} className={styles.link} rel="noreferrer">{children}</a>;
}

export default function FactoryHomePage() {
  return (
    <div className={`iso ${styles.page}`}>
      <header className={styles.bar}>
        <Link to="/" className={styles.brand} aria-label="krasnoperov.me">krasnoperov<span>.me</span></Link>
        <nav className={styles.nav} aria-label="Elsewhere">
          <Link to="/posts" className={styles.navLink}>notes</Link>
          <a href={REPO} className={styles.navLink} rel="noreferrer">patchrelay</a>
          <a href="https://github.com/krasnoperov" className={styles.navLink} rel="noreferrer">github</a>
          <a href="https://x.com/snejink" className={styles.navLink} rel="noreferrer">x</a>
        </nav>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Aleksei Krasnoperov · October 2026</p>
          <h1 className={styles.headline}>The software factory behind my products</h1>
          <p className={styles.lede}>
            Everything I build ships through one factory: seven live products and the factory itself. Each agent works its own line: patchrelay from
            Linear, Claude Code and Codex from sessions I start. Every pull request now goes through review-quill,
            and merge-steward merges all of them into one queue. The figure below is a simulation, not a live feed.
          </p>
        </section>

        <section className={styles.figure} aria-label="The factory">
          <FactoryFigure />
        </section>

        <section className={styles.stations} aria-labelledby="stations-title">
          <h2 id="stations-title" className={styles.sectionTitle}>Stations</h2>
          <ol className={styles.stationList}>
            {STATIONS.map((station) => (
              <li
                key={station.name}
                className={styles.station}
                tabIndex={0}
                onMouseEnter={() => pointAt(station.figure)}
                onMouseLeave={() => pointAt([])}
                onFocus={() => pointAt(station.figure)}
                onBlur={() => pointAt([])}
              >
                <span className={styles.stationNumber}>{station.n}</span>
                <h3 className={styles.stationName}>{station.name}</h3>
                <p className={styles.stationBody}>{station.body}</p>
                <p className={styles.stationLinks}>
                  {station.links.map((link) => (
                    <Outbound key={link.href} href={link.href}>{link.label}</Outbound>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.evals} aria-labelledby="evals-title" onMouseEnter={() => pointAt(['evals'])} onMouseLeave={() => pointAt([])}>
          <h2 id="evals-title" className={styles.sectionTitle}>Evals</h2>
          <div className={styles.evalGrid}>
            <article className={styles.evalCard}>
              <span className={styles.evalFigure}>11</span>
              <h3 className={styles.evalName}>review-quill replays</h3>
              <p>
                Eleven frozen cases from seven PRs in UserTold, MakeFX, Inventory and Subtitles, replayed through the real
                prompt in a throwaway worktree. Each is graded on the verdict, how many concerns it raised, no nits where none
                belong, findings anchored to changed lines, and required or forbidden markers.
              </p>
              <p className={styles.stationLinks}>
                <Outbound href={`${REPO}/tree/main/packages/review-quill/eval`}>cases</Outbound>
                <Outbound href="/posts/orchestrator-moved-into-the-session">post</Outbound>
              </p>
            </article>
            <article className={styles.evalCard}>
              <span className={styles.evalFigure}>34</span>
              <h3 className={styles.evalName}>merge-steward scenarios</h3>
              <p>
                patchrelay has no model eval yet. What it has around it is 34 merge-steward scenario suites (speculative
                cascades, a CI failure mid-chain, crash recovery, a broken <code>main</code>) and 134 test files in its own
                repo.
              </p>
              <p className={styles.stationLinks}>
                <Outbound href={`${REPO}/tree/main/packages/merge-steward/test/scenarios`}>scenarios</Outbound>
              </p>
            </article>
          </div>
        </section>

        <section className={styles.projects} aria-labelledby="projects-title">
          <h2 id="projects-title" className={styles.sectionTitle}>Running on the line</h2>
          <FactoryLine />
          <p className={styles.footnote}>Counts from GitHub and from review-quill’s and merge-steward’s own records, October 17, 2026.</p>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Aleksei Krasnoperov</span>
        <span className={styles.footerLinks}>
          <Link to="/posts" className={styles.link}>notes</Link>
          <a href={REPO} className={styles.link} rel="noreferrer">patchrelay</a>
          <a href="https://fellowmakers.app/people/snejink" className={styles.link} rel="noreferrer">fellowmakers</a>
          <a href="/feed.xml" className={styles.link}>rss</a>
        </span>
      </footer>
    </div>
  );
}
