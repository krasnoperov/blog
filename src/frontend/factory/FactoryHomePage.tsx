import type { ReactNode } from 'react';
import { Link } from '../components/Link';
import { FactoryFigure } from './FactoryFigure';
import styles from './FactoryHomePage.module.css';

const REPO = 'https://github.com/krasnoperov/patchrelay';

interface Station {
  n: string;
  name: string;
  body: ReactNode;
  links: Array<{ label: string; href: string }>;
}

const STATIONS: Station[] = [
  {
    n: '01',
    name: 'Intake',
    body: (
      <>Issues live in Linear. Delegating one to the patchrelay app is the only thing that lets patchrelay write code; undelegating stops the run.</>
    ),
    links: [{ label: 'linear.app', href: 'https://linear.app' }],
  },
  {
    n: '02',
    name: 'Triage',
    body: (
      <>A 45-second Codex pass returns one of six intents: <code>code_change</code>, <code>split_into_children</code>, <code>investigate</code>, <code>review</code>, <code>coordination</code> or <code>needs_input</code>. The last one goes back to Linear as a question.</>
    ),
    links: [{ label: 'patchrelay', href: REPO }],
  },
  {
    n: '03',
    name: 'Dev',
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
    body: (
      <>merge-steward admits a PR approved on its exact head with green checks, then builds future-main candidates, each on top of the one ahead, and runs CI on those SHAs in parallel.</>
    ),
    links: [
      { label: 'post', href: '/posts/merge-steward' },
      { label: 'npm', href: 'https://www.npmjs.com/package/merge-steward' },
    ],
  },
  {
    n: '06',
    name: 'Main',
    body: (
      <>Landing is a fast-forward of <code>main</code> to the SHA that passed. If <code>main</code> moved first, the candidate is relinked onto the new tip and tested again, not reviewed again.</>
    ),
    links: [{ label: 'post', href: '/posts/merge-trees' }],
  },
  {
    n: '07',
    name: 'Deploy',
    body: (
      <>A push to <code>main</code> runs the repo’s own Actions: stage first, then production on Cloudflare Workers. UserTold runs a smoke test after each.</>
    ),
    links: [{ label: 'post', href: '/posts/gates-not-autonomy' }],
  },
  {
    n: '—',
    name: 'GitHub, the bus',
    body: (
      <>The services never call each other. A webhook only wakes them; every decision is re-read from GitHub: head SHA, reviews, checks, refs.</>
    ),
    links: [{ label: 'source', href: REPO }],
  },
];

const PROJECTS = [
  {
    name: 'UserTold',
    href: 'https://usertold.ai',
    host: 'usertold.ai',
    line: 'AI-led user interviews and usability research.',
    numbers: [
      ['1,564', 'merged PRs since February'],
      ['498', 'by patchrelay'],
      ['1,395', 'reviewed by review-quill'],
      ['10', 'speculative depth'],
    ],
  },
  {
    name: 'MakeFX',
    href: 'https://makefx.app',
    host: 'makefx.app',
    line: 'Images, video and audio, made by an agent.',
    numbers: [
      ['289', 'merged PRs since November'],
      ['74', 'by patchrelay'],
      ['293', 'reviewed by review-quill'],
      ['3', 'speculative depth'],
    ],
  },
] as const;

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
            UserTold and MakeFX ship through one line. Issues go in through Linear, agents write the code,
            review-quill and merge-steward decide what lands, and GitHub carries every signal in between.
            The figure below is a simulation of those rules, not a live feed.
          </p>
        </section>

        <section className={styles.figure} aria-label="The factory">
          <FactoryFigure />
        </section>

        <section className={styles.stations} aria-labelledby="stations-title">
          <h2 id="stations-title" className={styles.sectionTitle}>Stations</h2>
          <ol className={styles.stationList}>
            {STATIONS.map((station) => (
              <li key={station.name} className={styles.station}>
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

        <section className={styles.evals} aria-labelledby="evals-title">
          <h2 id="evals-title" className={styles.sectionTitle}>Evals</h2>
          <div className={styles.evalGrid}>
            <article className={styles.evalCard}>
              <span className={styles.evalFigure}>11</span>
              <h3 className={styles.evalName}>review-quill replays</h3>
              <p>
                Eleven frozen PRs from UserTold, MakeFX, Inventory and Subtitles, replayed through the real prompt in a
                throwaway worktree. Each is graded on the verdict, how many concerns it raised, no nits where none belong,
                and findings anchored to changed lines.
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
                cascades, a CI failure mid-chain, crash recovery, a broken <code>main</code>) and 137 test files in its own
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
          <div className={styles.projectGrid}>
            {PROJECTS.map((project) => (
              <article key={project.name} className={styles.project}>
                <header className={styles.projectHead}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <a href={project.href} className={styles.link} rel="noreferrer">{project.host}</a>
                </header>
                <p className={styles.projectLine}>{project.line}</p>
                <dl className={styles.numbers}>
                  {project.numbers.map(([value, label]) => (
                    <div key={label} className={styles.number}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className={styles.footnote}>Counts from GitHub on October 17, 2026.</p>
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
