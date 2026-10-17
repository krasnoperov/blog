import { useState } from 'react';
import type { ReactNode } from 'react';
import { QUEUE_H, QUEUE_W, queueDynamic, queueShift, queueStatic, queueTag } from './isoQueue';
import type { QueueScene, Row } from './isoQueue';
import { StepControls } from './StepControls';
import { useStepper } from './useStepper';

// merge-steward's speculative queue as the git graph it really builds. Each
// candidate ref is a merge of the PR onto the candidate ahead of it, so every
// candidate is the exact future main it would become, and CI runs on all of
// them at once.


type CommitId = 'm1' | 'm2' | 'm3' | 'h41' | 'h42' | 'h43' | 'c41' | 'c42' | 'c43' | 'r42' | 'c43b';

const AT: Record<CommitId, { x: number; row: Row; sha: string }> = {
  m1: { x: 230, row: 'main', sha: '' },
  m2: { x: 290, row: 'main', sha: '' },
  m3: { x: 350, row: 'main', sha: '4e1b07c' },
  h41: { x: 430, row: 'heads', sha: '#41' },
  h42: { x: 520, row: 'heads', sha: '#42' },
  h43: { x: 610, row: 'heads', sha: '#43' },
  c41: { x: 470, row: 41, sha: '9a20f31' },
  c42: { x: 570, row: 42, sha: 'd5c8e02' },
  c43: { x: 670, row: 43, sha: '17be4a9' },
  r42: { x: 660, row: 42, sha: 'e03a7d6' },
  c43b: { x: 760, row: 43, sha: 'b8f9150' },
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
const TAG = queueTag();

const FIRST_PARENT: Partial<Record<CommitId, CommitId>> = { c41: 'm3', c42: 'c41', c43: 'c42', r42: 'c42', c43b: 'r42' };

export function QueueFigure() {
  const [scenario, setScenario] = useState<keyof typeof SCENARIOS>('green');
  const frames = SCENARIOS[scenario];
  const { step, playing, setPlaying, go, rootRef, hold } = useStepper(frames.length, 3600);
  const frame = frames[Math.min(step, frames.length - 1)];
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

  const scene: QueueScene = {
    commits: [
      ...(['m1', 'm2', 'm3'] as CommitId[]).map((id) => ({ id, x: AT[id].x, row: AT[id].row, sha: id === 'm3' ? AT[id].sha : '' })),
      ...(frame.ghosts ?? []).map((id) => ({ id, x: AT[id].x, row: AT[id].row, sha: '', state: 'ghost' })),
      ...frame.commits.map((id) => ({ id, x: AT[id].x, row: AT[id].row, sha: AT[id].sha, state: frame.states?.[id] })),
    ],
    links: [
      { from: [200, 'main'], to: [AT.m3.x, 'main'], landed: true },
      ...frame.links.map(([from, to]) => ({ from: [AT[from].x, AT[from].row] as [number, Row], to: [AT[to].x, AT[to].row] as [number, Row], landed: landedLinks.has(`${from}-${to}`) })),
    ],
    lanes: frame.lanes,
    ci: frame.ci,
  };

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
          <svg
            className="iso-svg fx-svg"
            viewBox={`0 0 ${QUEUE_W} ${QUEUE_H}`}
            role="img"
            aria-label={`Merge queue, ${scenario === 'green' ? 'all green' : 'one red candidate'}: ${frame.title}.`}
            data-lane-41={frame.lanes[41].tone}
            data-lane-42={frame.lanes[42].tone}
            data-lane-43={frame.lanes[43].tone}
          >
            <g dangerouslySetInnerHTML={{ __html: queueStatic() }} />
            <g dangerouslySetInnerHTML={{ __html: queueDynamic(scene) }} />
            <g className="fx-iso-tag" style={{ transform: queueShift(AT[frame.main].x, AT[frame.main].row) }} dangerouslySetInnerHTML={{ __html: TAG }} />
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
