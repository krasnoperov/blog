import styles from './FactoryLine.module.css';

// What runs on the line: numbers for the whole factory, merged pull requests
// per month by who wrote them, and every product it has built. Counts come
// from GitHub and the review-quill and merge-steward databases on
// October 17, 2026.

const NUMBERS = [
  ['6,863', 'pull requests merged since March, across 11 repositories'],
  ['83%', 'of them reviewed by review-quill and landed by merge-steward'],
  ['14,284', 'review passes; about half asked for changes'],
  ['96%', 'written by agents in the last 30 days'],
] as const;

// Merged pull requests per month: pushed from a person's account (mine, and
// Elena's on Mafia), by patchrelay, and by the coding-agent sessions I start. October runs to the 17th.
const MONTHS: Array<{ month: string; mine: number; patchrelay: number; sessions: number }> = [
  { month: 'Mar', mine: 243, patchrelay: 220, sessions: 0 },
  { month: 'Apr', mine: 561, patchrelay: 275, sessions: 0 },
  { month: 'May', mine: 772, patchrelay: 563, sessions: 0 },
  { month: 'Jun', mine: 1071, patchrelay: 328, sessions: 0 },
  { month: 'Jul', mine: 1127, patchrelay: 143, sessions: 0 },
  { month: 'Aug', mine: 527, patchrelay: 19, sessions: 53 },
  { month: 'Sep', mine: 24, patchrelay: 157, sessions: 520 },
  { month: 'Oct', mine: 5, patchrelay: 0, sessions: 233 },
];

interface Product {
  name: string;
  href: string;
  host: string;
  line: string;
  merged: string;
  status: 'live' | 'open source';
  note?: string;
}

const PRODUCTS: Product[] = [
  { name: 'UserTold', href: 'https://usertold.ai', host: 'usertold.ai', line: 'Voice interviews with your real users, inside your product.', merged: '1,565', status: 'live' },
  { name: 'MakeFX', href: 'https://makefx.app', host: 'makefx.app', line: 'Images, video and audio made with your agent on one canvas.', merged: '290', status: 'live', note: 'rebuilt from Make Effects, 1,234 PRs' },
  { name: 'Learn, Speak, Repeat', href: 'https://learnspeakrepeat.com', host: 'learnspeakrepeat.com', line: 'A Spanish notebook for speaking, not just understanding.', merged: '178', status: 'live', note: 'rebuilt from v1, 2,534 PRs' },
  { name: 'Mi Granja', href: 'https://granja.learnspeakrepeat.com', host: 'granja.learnspeakrepeat.com', line: 'A cozy farm game for Spanish vocabulary.', merged: '35', status: 'live' },
  { name: 'FellowMakers', href: 'https://fellowmakers.app', host: 'fellowmakers.app', line: 'A landscape of founders, drawn only from what they wrote themselves.', merged: '99', status: 'live' },
  { name: 'Mafia Nights', href: 'https://mafia.elen.red', host: 'mafia.elen.red', line: 'A game-master app for Mafia and Werewolf nights.', merged: '194', status: 'live' },
  { name: 'krasnoperov.me', href: '/', host: 'krasnoperov.me', line: 'This site, figure included.', merged: '73', status: 'live' },
  { name: 'patchrelay', href: 'https://github.com/krasnoperov/patchrelay', host: 'github.com/krasnoperov/patchrelay', line: 'The factory itself: patchrelay, review-quill and merge-steward.', merged: '650', status: 'open source' },
  { name: 'UserTold CLI', href: 'https://usertold.ai/docs/cli', host: 'usertold.ai/docs/cli', line: 'Review interview evidence and turn it into prioritized work.', merged: '11', status: 'open source' },
];

const SERIES = [
  { key: 'mine', label: 'from a person’s account' },
  { key: 'patchrelay', label: 'by patchrelay (Codex)' },
  { key: 'sessions', label: 'by agent sessions I start' },
] as const;

function MonthlyChart() {
  const width = 640;
  const height = 210;
  const base = 176;
  const top = 22;
  const max = Math.max(...MONTHS.map((m) => m.mine + m.patchrelay + m.sessions));
  const step = width / MONTHS.length;
  const bar = step * 0.56;
  const scale = (base - top) / max;
  return (
    <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Merged pull requests per month, March to October 2026, by who wrote them">
      <line className={styles.axis} x1={0} x2={width} y1={base + 0.5} y2={base + 0.5} />
      {MONTHS.map((m, i) => {
        const x = i * step + (step - bar) / 2;
        let y = base;
        const total = m.mine + m.patchrelay + m.sessions;
        return (
          <g key={m.month}>
            {SERIES.map((s) => {
              const h = m[s.key] * scale;
              y -= h;
              return h > 0 ? <rect key={s.key} className={styles[s.key]} x={x} y={y} width={bar} height={h} /> : null;
            })}
            <text className={styles.total} x={x + bar / 2} y={base - total * scale - 6}>{total.toLocaleString('en-US')}</text>
            <text className={styles.month} x={x + bar / 2} y={base + 18}>{m.month === 'Oct' ? 'Oct 1–17' : m.month}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function FactoryLine() {
  return (
    <>
      <dl className={styles.numbers}>
        {NUMBERS.map(([value, label]) => (
          <div key={label} className={styles.number}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <figure className={styles.chartFigure}>
        <MonthlyChart />
        <figcaption className={styles.keys}>
          {SERIES.map((s) => (
            <span key={s.key} className={styles.key}><span className={`${styles.swatch} ${styles[s.key]}`} />{s.label}</span>
          ))}
        </figcaption>
      </figure>
      <p className={styles.note}>
        Since Opus 5.5, a Claude Code session carries an issue to a pull request on its own, and those sessions have taken
        over most of what patchrelay’s Codex runs used to do: in October every agent PR came from one. The delivery pipeline
        stayed. Review, the merge queue and the deploy are still what land the work, whoever wrote it. The spring and summer
        peak includes building two products twice; both first versions are still counted.
      </p>
      <ul className={styles.products}>
        {PRODUCTS.map((product) => (
          <li key={product.name} className={styles.product}>
            <div className={styles.productHead}>
              <a href={product.href} className={styles.productName} rel="noreferrer">{product.name}</a>
              <span className={styles.status}>{product.status}</span>
            </div>
            <p className={styles.line}>{product.line}</p>
            <p className={styles.meta}>
              <span>{product.host}</span>
              <span>{product.merged} PRs{product.note ? ` · ${product.note}` : ''}</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
