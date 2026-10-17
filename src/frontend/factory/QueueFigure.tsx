import { useState } from 'react';
import type { ReactNode } from 'react';
import { StepControls } from './StepControls';
import { useStepper } from './useStepper';

// merge-steward's speculative queue as the git graph it really builds. Each
// candidate ref is a merge of the PR onto the candidate ahead of it, so every
// candidate is the exact future main it would become, and CI runs on all of
// them at once.

const ROW = { main: 80, 41: 160, 42: 230, 43: 300, heads: 390 } as const;

type CommitId = 'm1' | 'm2' | 'm3' | 'h41' | 'h42' | 'h43' | 'c41' | 'c42' | 'c43' | 'r42' | 'c43b';

const AT: Record<CommitId, { x: number; y: number; sha: string }> = {
  m1: { x: 230, y: ROW.main, sha: '' },
  m2: { x: 290, y: ROW.main, sha: '' },
  m3: { x: 350, y: ROW.main, sha: '4e1b07c' },
  h41: { x: 430, y: ROW.heads, sha: '#41' },
  h42: { x: 520, y: ROW.heads, sha: '#42' },
  h43: { x: 610, y: ROW.heads, sha: '#43' },
  c41: { x: 470, y: ROW[41], sha: '9a20f31' },
  c42: { x: 570, y: ROW[42], sha: 'd5c8e02' },
  c43: { x: 670, y: ROW[43], sha: '17be4a9' },
  r42: { x: 660, y: ROW[42], sha: 'e03a7d6' },
  c43b: { x: 760, y: ROW[43], sha: 'b8f9150' },
};

type Tone = 'running' | 'green' | 'red' | 'idle';
interface Lane { text: string; tone: Tone }
interface Frame {
  title: string;
  body: ReactNode;
  commits: CommitId[];
  ghosts?: CommitId[];
  links: Array<[CommitId, CommitId]>;
  states?: Partial<Record<CommitId, Tone>>;
  main: CommitId;
  landed: CommitId[];
  lanes: Record<41 | 42 | 43, Lane>;
  ci: { serial: number; queue: number };
}

const HEADS: CommitId[] = ['h41', 'h42', 'h43'];
const TRAIN: CommitId[] = ['c41', 'c42', 'c43'];
const TRAIN_LINKS: Array<[CommitId, CommitId]> = [['m3', 'c41'], ['h41', 'c41'], ['c41', 'c42'], ['h42', 'c42'], ['c42', 'c43'], ['h43', 'c43']];
const idle: Lane = { text: 'admitted', tone: 'idle' };

const SHARED: Frame[] = [
  {
    title: 'Three approved PRs',
    body: <>#41, #42 and #43 are each approved on their exact head with green checks, so merge-steward admits them in that order. Nothing has touched <code>main</code> yet.</>,
    commits: HEADS,
    links: [],
    main: 'm3',
    landed: [],
    lanes: { 41: idle, 42: idle, 43: idle },
    ci: { serial: 0, queue: 0 },
  },
  {
    title: 'Build the train',
    body: <>Each candidate is a <code>git merge --no-ff</code> of the PR onto the candidate ahead of it: #41 onto <code>main</code>, #42 onto #41’s candidate, #43 onto #42’s. Each is pushed to its own ref, <code>merge-steward/main/pr-&lt;n&gt;</code>.</>,
    commits: [...HEADS, ...TRAIN],
    links: TRAIN_LINKS,
    main: 'm3',
    landed: [],
    lanes: { 41: { text: 'pushed', tone: 'idle' }, 42: { text: 'pushed', tone: 'idle' }, 43: { text: 'pushed', tone: 'idle' } },
    ci: { serial: 0, queue: 0 },
  },
  {
    title: 'Test them all at once',
    body: <>Each push triggers CI on its candidate SHA. The three runs go in parallel, and each tests the exact commit <code>main</code> would become if everything ahead of it lands. Depth is a setting: three here, ten on UserTold.</>,
    commits: [...HEADS, ...TRAIN],
    links: TRAIN_LINKS,
    states: { c41: 'running', c42: 'running', c43: 'running' },
    main: 'm3',
    landed: [],
    lanes: { 41: { text: 'Tests · running', tone: 'running' }, 42: { text: 'Tests · running', tone: 'running' }, 43: { text: 'Tests · running', tone: 'running' } },
    ci: { serial: 1, queue: 1 },
  },
];

const GREEN: Frame[] = [
  ...SHARED,
  {
    title: 'All green',
    body: <>All three pass. Because each candidate already contains the ones ahead of it, no PR needs another run after the one in front of it lands.</>,
    commits: [...HEADS, ...TRAIN],
    links: TRAIN_LINKS,
    states: { c41: 'green', c42: 'green', c43: 'green' },
    main: 'm3',
    landed: [],
    lanes: { 41: { text: 'Tests ✓', tone: 'green' }, 42: { text: 'Tests ✓', tone: 'green' }, 43: { text: 'Tests ✓', tone: 'green' } },
    ci: { serial: 1, queue: 1 },
  },
  ...(['c41', 'c42', 'c43'] as const).map((id, index): Frame => ({
    title: `Land #${41 + index}`,
    body: index === 2
      ? <>Three PRs, one CI cycle. A serial queue would have spent three, one after another. Every commit <code>main</code> ever points at is a SHA that CI tested.</>
      : <>Before landing, merge-steward re-reads the PR (still open, same head, still approved) and checks the candidate is a fast-forward of <code>main</code>. Then <code>git push origin {AT[id].sha}:main</code>, no force.</>,
    commits: [...HEADS, ...TRAIN],
    links: TRAIN_LINKS,
    states: { c41: 'green', c42: 'green', c43: 'green' },
    main: id,
    landed: TRAIN.slice(0, index + 1),
    lanes: {
      41: { text: 'merged', tone: 'green' },
      42: { text: index >= 1 ? 'merged' : 'Tests ✓', tone: 'green' },
      43: { text: index >= 2 ? 'merged' : 'Tests ✓', tone: 'green' },
    },
    ci: { serial: 1 + index, queue: 1 },
  })),
];

const RED: Frame[] = [
  ...SHARED,
  {
    title: '#42 goes red',
    body: <>CI fails on #42’s candidate. It is not evicted; it is held for repair. #43 was built on top of it, so #43 drops back to waiting and will be rebuilt.</>,
    commits: [...HEADS, ...TRAIN],
    links: TRAIN_LINKS,
    states: { c41: 'green', c42: 'red', c43: 'idle' },
    main: 'm3',
    landed: [],
    lanes: { 41: { text: 'Tests ✓', tone: 'green' }, 42: { text: 'Tests ✗ · held', tone: 'red' }, 43: { text: 'waiting on #42', tone: 'idle' } },
    ci: { serial: 1, queue: 1 },
  },
  {
    title: 'Land #41, repair #42',
    body: <>#41 lands. patchrelay sees the red candidate and starts an <code>integration_repair</code> run in its own worktree. It may only add commits to <code>merge-steward/main/pr-42</code> with a non-force push, never to the PR branch.</>,
    commits: [...HEADS, ...TRAIN, 'r42'],
    links: [...TRAIN_LINKS, ['c42', 'r42']],
    states: { c41: 'green', c42: 'red', c43: 'idle', r42: 'running' },
    main: 'c41',
    landed: ['c41'],
    lanes: { 41: { text: 'merged', tone: 'green' }, 42: { text: 'repaired · re-testing', tone: 'running' }, 43: { text: 'waiting on #42', tone: 'idle' } },
    ci: { serial: 1, queue: 1 },
  },
  {
    title: 'Repair checked, #43 rebuilt',
    body: <>Because patchrelay changed the candidate, review-quill runs a narrow preservation review and publishes <code>review-quill/integration</code>. With that and Tests green, #42 is ready; #43 is rebuilt on the repaired candidate and tested again.</>,
    commits: [...HEADS, 'c41', 'c42', 'r42', 'c43b'],
    ghosts: ['c43'],
    links: [['m3', 'c41'], ['h41', 'c41'], ['c41', 'c42'], ['h42', 'c42'], ['c42', 'r42'], ['r42', 'c43b'], ['h43', 'c43b']],
    states: { c41: 'green', c42: 'red', r42: 'green', c43b: 'running' },
    main: 'c41',
    landed: ['c41'],
    lanes: { 41: { text: 'merged', tone: 'green' }, 42: { text: 'integration ✓ · Tests ✓', tone: 'green' }, 43: { text: 'rebuilt · Tests · running', tone: 'running' } },
    ci: { serial: 2, queue: 2 },
  },
  {
    title: 'Land #42, then #43',
    body: <>#42 lands as the repaired SHA, and #43 lands once its rebuilt candidate is green. One red PR cost one extra CI cycle, and never reached <code>main</code> untested.</>,
    commits: [...HEADS, 'c41', 'c42', 'r42', 'c43b'],
    ghosts: ['c43'],
    links: [['m3', 'c41'], ['h41', 'c41'], ['c41', 'c42'], ['h42', 'c42'], ['c42', 'r42'], ['r42', 'c43b'], ['h43', 'c43b']],
    states: { c41: 'green', c42: 'red', r42: 'green', c43b: 'green' },
    main: 'c43b',
    landed: ['c41', 'r42', 'c43b'],
    lanes: { 41: { text: 'merged', tone: 'green' }, 42: { text: 'merged', tone: 'green' }, 43: { text: 'merged', tone: 'green' } },
    ci: { serial: 4, queue: 2 },
  },
];

const SCENARIOS = { green: GREEN, red: RED } as const;

const FIRST_PARENT: Partial<Record<CommitId, CommitId>> = { c41: 'm3', c42: 'c41', c43: 'c42', r42: 'c42', c43b: 'r42' };

function curve([ax, ay]: [number, number], [bx, by]: [number, number]) {
  if (ay === by) return `M${ax} ${ay}L${bx} ${by}`;
  const mid = (ax + bx) / 2;
  return `M${ax} ${ay}C${mid} ${ay} ${mid} ${by} ${bx} ${by}`;
}

export function QueueFigure() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>('green');
  const frames = SCENARIOS[scenario];
  const { step, playing, setPlaying, go, rootRef, hold } = useStepper(frames.length, 3600);
  const frame = frames[Math.min(step, frames.length - 1)];
  const main = AT[frame.main];
  // What main now contains: walk first parents back from every landed commit.
  const landedLinks = new Set<string>();
  for (const id of frame.landed) {
    let at: CommitId | undefined = id;
    while (at && FIRST_PARENT[at]) {
      const parent: CommitId = FIRST_PARENT[at] as CommitId;
      landedLinks.add(`${parent}-${at}`);
      at = parent;
    }
  }

  const pick = (next: keyof typeof SCENARIOS) => {
    setScenario(next);
    go(0);
  };

  return (
    <div className="fx-figure" ref={rootRef} {...hold}>
      <div className="fx-plate">
        <div className="fx-corners" aria-hidden="true">
          <span>Fig 2 · the merge queue</span>
          <span>speculativeDepth 3 · UserTold runs 10</span>
        </div>
        <div className="fx-scroll">
          <svg className="fx-svg" viewBox="0 0 1200 440" role="img" aria-label={`Merge queue, ${scenario === 'green' ? 'all green' : 'one red candidate'}: ${frame.title}.`}>
            <text x={20} y={ROW.main + 4} className="fx-ref">main</text>
            {([41, 42, 43] as const).map((n) => (
              <text key={n} x={20} y={ROW[n] + 4} className="fx-ref">merge-steward/main/pr-{n}</text>
            ))}
            <text x={20} y={ROW.heads + 4} className="fx-ref">PR heads, approved</text>
            <line x1={200} y1={ROW.main} x2={350} y2={ROW.main} className="fx-edge-line" />
            {frame.links.map(([from, to]) => (
              <path key={`${from}-${to}`} d={curve([AT[from].x, AT[from].y], [AT[to].x, AT[to].y])} className="fx-edge-line" data-landed={landedLinks.has(`${from}-${to}`) || undefined} />
            ))}
            {(['m1', 'm2', 'm3'] as const).map((id) => <circle key={id} cx={AT[id].x} cy={AT[id].y} r={5} className="fx-commit" />)}
            {(frame.ghosts ?? []).map((id) => <circle key={id} cx={AT[id].x} cy={AT[id].y} r={6} className="fx-commit" data-ghost />)}
            {frame.commits.map((id) => (
              <g key={id}>
                <circle cx={AT[id].x} cy={AT[id].y} r={id.startsWith('h') ? 5 : 6} className="fx-commit" data-state={frame.states?.[id]} data-landed={frame.landed.includes(id) || undefined} />
                {id.startsWith('h')
                  ? <text x={AT[id].x} y={AT[id].y + 22} className="fx-sha" textAnchor="middle">{AT[id].sha}</text>
                  : <text x={AT[id].x + 11} y={AT[id].y + 18} className="fx-sha">{AT[id].sha}</text>}
              </g>
            ))}
            <text x={AT.m3.x} y={ROW.main + 22} className="fx-sha" textAnchor="middle">{AT.m3.sha}</text>
            <g className="fx-tag" style={{ transform: `translate(${main.x}px, ${main.y - 20}px)` }}>
              <rect x={-20} y={-10} width={40} height={16} rx={2} />
              <text x={0} y={2} textAnchor="middle">main</text>
            </g>
            {([41, 42, 43] as const).map((n) => (
              <text key={n} x={850} y={ROW[n] + 4} className="fx-lane" data-tone={frame.lanes[n].tone}>{frame.lanes[n].text}</text>
            ))}
            <g className="fx-meter">
              <text x={850} y={ROW.heads - 22} className="fx-key">CI cycles of waiting</text>
              <text x={850} y={ROW.heads} className="fx-key">serial queue</text>
              <rect x={960} y={ROW.heads - 9} width={200} height={10} className="fx-meter-track" />
              <rect x={960} y={ROW.heads - 9} width={(200 * frame.ci.serial) / 4} height={10} className="fx-meter-fill" data-tone="idle" />
              <text x={1168} y={ROW.heads} className="fx-key">{frame.ci.serial}</text>
              <text x={850} y={ROW.heads + 22} className="fx-key">merge-steward</text>
              <rect x={960} y={ROW.heads + 13} width={200} height={10} className="fx-meter-track" />
              <rect x={960} y={ROW.heads + 13} width={(200 * frame.ci.queue) / 4} height={10} className="fx-meter-fill" />
              <text x={1168} y={ROW.heads + 22} className="fx-key">{frame.ci.queue}</text>
            </g>
          </svg>
        </div>
      </div>
      <div className="fx-steps fx-steps-queue">
        <div className="fx-tabs" role="group" aria-label="Scenario">
          <button type="button" className="fx-button" aria-pressed={scenario === 'green'} onClick={() => pick('green')}>all green</button>
          <button type="button" className="fx-button" aria-pressed={scenario === 'red'} onClick={() => pick('red')}>one goes red</button>
        </div>
        <div className="fx-caption">
          <StepControls step={step} count={frames.length} playing={playing} onPlay={setPlaying} onGo={go} />
          <h3 className="fx-caption-title">{frame.title}</h3>
          <p className="fx-caption-body">{frame.body}</p>
        </div>
      </div>
    </div>
  );
}
