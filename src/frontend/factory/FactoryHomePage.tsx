import type { ReactNode } from 'react';
import { Link } from '../components/Link';
import { QueueFigure } from './QueueFigure';
import { TraceFigure } from './TraceFigure';
import styles from './FactoryHomePage.module.css';

const REPO = 'https://github.com/krasnoperov/patchrelay';

interface Service {
  name: string;
  role: string;
  listens: ReactNode;
  runs: ReactNode;
  writes: ReactNode;
  links: Array<{ label: string; href: string }>;
}

// Each service, as the code has it: what wakes it, what it runs, and what it
// leaves on GitHub for the others to read. They never call each other.
const SERVICES: Service[] = [
  {
    name: 'Any coding session',
    role: 'Claude Code or Codex, driven by me',
    listens: <>Nothing. I open a session, the agent writes code.</>,
    runs: <><code>git push</code>, <code>gh pr create</code>, then the ship-pr skill blocks on <code>review-quill pr status --wait</code> and <code>merge-steward pr status --wait</code>.</>,
    writes: <>A branch and a pull request. From there it is the same line as everything else.</>,
    links: [{ label: 'ship-pr', href: 'https://github.com/krasnoperov/patchrelay-agents' }],
  },
  {
    name: 'patchrelay',
    role: 'the harness for delegated Linear issues',
    listens: <>Linear <code>AgentSessionEvent</code> and issue updates; GitHub <code>pull_request</code>, <code>pull_request_review</code>, <code>check_suite</code>, <code>check_run</code>. A 5-second reconcile loop watches queue candidates.</>,
    runs: <><code>codex app-server</code> over JSON-RPC, one thread and one worktree per issue: <code>implementation</code>, then <code>review_fix</code>, <code>ci_repair</code> or <code>integration_repair</code> resuming the same thread.</>,
    writes: <>Commits pushed by the agent, the PR it opens, Linear status. Repairs push only to the candidate ref, never force.</>,
    links: [{ label: 'post', href: '/posts/patchrelay' }, { label: 'source', href: REPO }],
  },
  {
    name: 'review-quill',
    role: 'review on the exact head',
    listens: <>Every <code>pull_request</code> action, plus check events when it waits for green; a full poll every 120 s. Drafts are skipped.</>,
    runs: <>A 20 s settle, a throwaway worktree at the head SHA from a cached bare clone, then a fresh Codex thread (<code>thread/start</code>, <code>turn/start</code>) returning a JSON verdict.</>,
    writes: <>A normal GitHub review, <code>APPROVE</code> or <code>REQUEST_CHANGES</code>, bound to <code>commit_id</code>, with inline comments. And <code>review-quill/integration</code> after a candidate repair.</>,
    links: [{ label: 'post', href: '/posts/review-quill' }, { label: 'npm', href: 'https://www.npmjs.com/package/review-quill' }],
  },
  {
    name: 'merge-steward',
    role: 'the speculative merge queue',
    listens: <><code>pull_request_review.submitted</code> (approved), <code>check_suite.completed</code>, <code>pull_request</code>, <code>push</code>, and ruleset changes.</>,
    runs: <>No model at all. <code>git merge --no-ff</code> in a worktree, <code>git push --force-with-lease</code> to <code>merge-steward/main/pr-&lt;n&gt;</code>, and CI does the rest.</>,
    writes: <>Candidate refs, then <code>git push origin &lt;sha&gt;:main</code>, a fast-forward with no force, only for a SHA whose checks passed.</>,
    links: [{ label: 'post', href: '/posts/merge-steward' }, { label: 'npm', href: 'https://www.npmjs.com/package/merge-steward' }],
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
    <div className={`fx-theme ${styles.page}`}>
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
          <h1 className={styles.headline}>How my code gets from an issue to production</h1>
          <p className={styles.lede}>
            UserTold and MakeFX ship through three small services that never talk to each other. Each one reacts to
            GitHub webhooks, does one job, and writes its result back to GitHub, where the next one picks it up.
            Two of them drive Codex through <code>codex app-server</code>; the third only moves git refs.
          </p>
        </section>

        <section className={styles.figure} aria-label="One issue, end to end">
          <TraceFigure />
        </section>

        <section className={styles.stations} aria-labelledby="services-title">
          <h2 id="services-title" className={styles.sectionTitle}>The parts</h2>
          <div className={styles.serviceTable}>
            <div className={styles.serviceHead} aria-hidden="true">
              <span />
              <span>wakes on</span>
              <span>runs</span>
              <span>leaves on GitHub</span>
            </div>
            {SERVICES.map((service) => (
              <article key={service.name} className={styles.service}>
                <header>
                  <h3 className={styles.stationName}>{service.name}</h3>
                  <p className={styles.serviceRole}>{service.role}</p>
                  <p className={styles.stationLinks}>
                    {service.links.map((link) => (
                      <Outbound key={link.href} href={link.href}>{link.label}</Outbound>
                    ))}
                  </p>
                </header>
                <p><span className={styles.cellLabel}>wakes on</span>{service.listens}</p>
                <p><span className={styles.cellLabel}>runs</span>{service.runs}</p>
                <p><span className={styles.cellLabel}>leaves on GitHub</span>{service.writes}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.queue} aria-labelledby="queue-title">
          <h2 id="queue-title" className={styles.sectionTitle}>The merge queue</h2>
          <p className={styles.sectionLede}>
            The queue is where speed and safety usually trade off. merge-steward doesn’t test a PR against today’s{' '}
            <code>main</code>; it tests it against the <code>main</code> it will land on, with every PR ahead of it
            already merged in. So several PRs are tested at once, and each lands as the exact SHA that passed.
          </p>
          <QueueFigure />
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
          <h2 id="projects-title" className={styles.sectionTitle}>Running on it</h2>
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
