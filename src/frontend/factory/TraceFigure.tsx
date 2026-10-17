import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import * as k from './iso-kit';
import { COMMITS, TRACE_H, TRACE_P, TRACE_W, cablePath, mainTag, traceDynamic, traceStatic } from './isoTrace';
import type { TraceEdge, TraceNode, TraceState } from './isoTrace';
import { StepControls } from './StepControls';
import { useStepper } from './useStepper';

// One issue, end to end, through the services that actually run it. Every
// event name, Codex call and git command below is the one the code uses.

const EDGE_NODES: Record<TraceEdge, [TraceNode, TraceNode]> = {
  'linear-pr': ['linear', 'patchrelay'],
  'pr-codex': ['patchrelay', 'prCodex'],
  'codex-gh': ['prCodex', 'github'],
  'gh-pr': ['github', 'patchrelay'],
  'session-gh': ['session', 'github'],
  'gh-rq': ['github', 'rq'],
  'rq-codex': ['rq', 'rqCodex'],
  'gh-ms': ['github', 'ms'],
  'ms-git': ['ms', 'msGit'],
  'git-gh': ['msGit', 'github'],
  'gh-actions': ['github', 'actions'],
  'actions-cf': ['actions', 'cf'],
};

interface PrState { head: string; review: string; checks: string; queue: string }
interface Step {
  title: string;
  event: string;
  edges: Array<{ id: TraceEdge; back?: boolean }>;
  log: string;
  pr: PrState;
  body: ReactNode;
}

const NONE: PrState = { head: '—', review: '—', checks: '—', queue: '—' };

const STEPS: Step[] = [
  {
    title: 'Delegation',
    event: 'AgentSessionEvent · created',
    edges: [{ id: 'linear-pr' }],
    log: 'linear  AgentSessionEvent.created  USE-1412',
    pr: NONE,
    body: <>I delegate USE-1412 to the PatchRelay app in Linear. The webhook is the only thing that authorizes it: <code>issue.delegateId</code> equals the app’s actor, so patchrelay derives a <code>run:implementation</code> task.</>,
  },
  {
    title: 'Implementation run',
    event: 'thread/start · thread/goal/set · turn/start',
    edges: [{ id: 'pr-codex' }],
    log: 'patchrelay  run implementation  USE-1412',
    pr: NONE,
    body: <>patchrelay runs <code>git worktree add --detach … origin/main</code> into a worktree named after the issue, starts a fresh Codex thread over the <code>codex app-server</code> JSON-RPC, sets the issue’s goal, and starts the turn. A Linear comment during the run arrives as <code>turn/steer</code>.</>,
  },
  {
    title: 'Pull request',
    event: 'git push · gh pr create',
    edges: [{ id: 'codex-gh' }, { id: 'session-gh' }, { id: 'gh-actions' }],
    log: 'github  pull_request.opened  #1601 @ a1f3c9e',
    pr: { head: 'a1f3c9e', review: '—', checks: 'Tests · running', queue: '—' },
    body: <>The agent itself pushes <code>usertold/USE-1412-export-csv</code> and opens PR #1601. A Claude Code or Codex session I drive by hand enters at exactly this point, the same way. The push starts the repo’s own CI.</>,
  },
  {
    title: 'Review',
    event: 'pull_request → thread/start · turn/start',
    edges: [{ id: 'gh-rq' }, { id: 'rq-codex' }],
    log: 'github  pull_request.opened → review-quill',
    pr: { head: 'a1f3c9e', review: 'reviewing a1f3c9e', checks: 'Tests · running', queue: '—' },
    body: <>review-quill waits 20 s for the head to settle, fetches <code>refs/pull/1601/head</code> into a cached bare clone, checks out <code>a1f3c9e</code> in a throwaway worktree, and asks a fresh Codex thread for a JSON verdict against <code>REVIEW_WORKFLOW.md</code>.</>,
  },
  {
    title: 'Changes requested',
    event: 'POST /pulls/1601/reviews · REQUEST_CHANGES',
    edges: [{ id: 'gh-rq', back: true }],
    log: 'review-quill  REQUEST_CHANGES  commit_id a1f3c9e',
    pr: { head: 'a1f3c9e', review: 'changes requested @ a1f3c9e', checks: 'Tests ✓', queue: '—' },
    body: <>The verdict goes out as an ordinary GitHub review bound to <code>commit_id</code>, with up to 20 inline comments. Only a blocking finding turns into <code>REQUEST_CHANGES</code>.</>,
  },
  {
    title: 'Review fix',
    event: 'pull_request_review.submitted → thread/resume · turn/start',
    edges: [{ id: 'gh-pr' }, { id: 'pr-codex' }, { id: 'codex-gh' }],
    log: 'github  pull_request.synchronize  #1601 @ b72d0e4',
    pr: { head: 'b72d0e4', review: 'stale (head moved)', checks: 'Tests · running', queue: '—' },
    body: <>patchrelay reads the review and starts a <code>review_fix</code> run: same worktree, the issue’s Codex thread resumed. The agent pushes <code>b72d0e4</code>; a repair that doesn’t change the patch isn’t pushed.</>,
  },
  {
    title: 'Approved',
    event: 'pull_request.synchronize → APPROVE',
    edges: [{ id: 'gh-rq' }, { id: 'rq-codex' }, { id: 'gh-rq', back: true }],
    log: 'review-quill  APPROVE  commit_id b72d0e4',
    pr: { head: 'b72d0e4', review: 'approved @ b72d0e4', checks: 'Tests ✓', queue: '—' },
    body: <>A new head, a new review. Approval sticks to that SHA; if a later push has the same <code>patch_id</code>, review-quill carries the approval forward instead of reviewing again.</>,
  },
  {
    title: 'Admitted',
    event: 'pull_request_review.submitted · check_suite.completed',
    edges: [{ id: 'gh-ms' }],
    log: 'merge-steward  admit #1601  approved + green @ b72d0e4',
    pr: { head: 'b72d0e4', review: 'approved @ b72d0e4', checks: 'Tests ✓', queue: 'queued · position 1' },
    body: <>merge-steward admits a PR only when the live head is the approved head and the required checks from the branch ruleset pass on it. Labels like <code>queue:testing</code> are decoration; the queue reads GitHub, not labels.</>,
  },
  {
    title: 'Candidate',
    event: 'git merge --no-ff · git push --force-with-lease',
    edges: [{ id: 'ms-git' }, { id: 'git-gh' }, { id: 'gh-actions' }],
    log: 'github  push  merge-steward/main/pr-1601 @ c90e1aa',
    pr: { head: 'b72d0e4', review: 'approved @ b72d0e4', checks: 'Tests · running on c90e1aa', queue: 'testing candidate' },
    body: <>It builds tomorrow’s <code>main</code> before it exists: a merge commit of the PR onto the current tip, pushed to <code>merge-steward/main/pr-1601</code>. That push is what triggers CI, on the exact SHA that would land.</>,
  },
  {
    title: 'Landing',
    event: 'git push origin c90e1aa:main',
    edges: [{ id: 'ms-git' }, { id: 'git-gh' }],
    log: 'github  push  main → c90e1aa  (fast-forward)',
    pr: { head: 'b72d0e4', review: 'approved @ b72d0e4', checks: 'Tests ✓ on c90e1aa', queue: 'merged' },
    body: <>Green on the candidate. It re-reads everything (still open, same head, still approved, still a fast-forward of <code>main</code>) and pushes the tested SHA to <code>main</code> without force. If <code>main</code> had moved, it would rebuild and test again instead.</>,
  },
  {
    title: 'Deploy',
    event: 'push main → Deploy · stage → production',
    edges: [{ id: 'gh-actions' }, { id: 'actions-cf' }, { id: 'gh-pr' }],
    log: 'actions  Deploy  stage ✓  production ✓',
    pr: { head: 'b72d0e4', review: 'approved @ b72d0e4', checks: 'Deploy ✓', queue: 'merged' },
    body: <>The push to <code>main</code> runs the repo’s Deploy workflow: stage, then production. patchrelay sees <code>pull_request.closed</code> as merged and moves the Linear issue on.</>,
  },
];

const LOG_DEPTH = 4;
const TAG = mainTag();

function tone(value: string): 'green' | 'red' | undefined {
  if (/✓|approved|merged/.test(value)) return 'green';
  if (/changes/.test(value)) return 'red';
  return undefined;
}

function shift([x, y]: [number, number]) {
  const [dx, dy] = k.axisVector(TRACE_P, [x, y, 0]);
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}

// Packets: one dot per active cable, run along the cable's route in turn.
function usePackets(ref: React.RefObject<SVGGElement | null>, step: number, edges: Step['edges']) {
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return undefined;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runs = edges.map((edge, index) => {
      const points = cablePath(edge.id, edge.back);
      const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
      const total = lengths.reduce((sum, value) => sum + value, 0);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3.4');
      dot.setAttribute('class', 'fx-packet-dot');
      layer.appendChild(dot);
      return { points, lengths, total, dot, delay: index * 350 };
    });
    const place = (run: (typeof runs)[number], t: number) => {
      let rest = t * run.total;
      for (let i = 0; i < run.lengths.length; i++) {
        if (rest <= run.lengths[i] || i === run.lengths.length - 1) {
          const f = run.lengths[i] ? Math.min(1, rest / run.lengths[i]) : 1;
          const [a, b] = [run.points[i], run.points[i + 1]];
          run.dot.setAttribute('cx', (a[0] + (b[0] - a[0]) * f).toFixed(1));
          run.dot.setAttribute('cy', (a[1] + (b[1] - a[1]) * f).toFixed(1));
          return;
        }
        rest -= run.lengths[i];
      }
    };
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      let busy = false;
      for (const run of runs) {
        const t = Math.min(1, Math.max(0, (now - start - run.delay) / 750));
        const eased = t * t * (3 - 2 * t);
        place(run, eased);
        run.dot.style.opacity = t <= 0 ? '0' : t >= 1 ? '0' : '1';
        if (t < 1) busy = true;
      }
      frame = busy ? requestAnimationFrame(tick) : 0;
    };
    if (still) runs.forEach((run) => { place(run, 1); run.dot.style.opacity = '1'; });
    else frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      runs.forEach((run) => run.dot.remove());
    };
  }, [ref, step, edges]);
}

export function TraceFigure() {
  const { step, playing, setPlaying, go, rootRef, hold } = useStepper(STEPS.length, 4200);
  const current = STEPS[step];
  const packetsRef = useRef<SVGGElement>(null);
  usePackets(packetsRef, step, current.edges);
  const art = traceStatic();
  const active = new Set<TraceNode>();
  for (const edge of current.edges) for (const node of EDGE_NODES[edge.id]) active.add(node);
  const state: TraceState = {
    rows: (['head', 'review', 'checks', 'queue'] as const).map((key) => [key, current.pr[key], tone(current.pr[key])]),
    log: STEPS.slice(Math.max(0, step - LOG_DEPTH + 1), step + 1).map((entry) => entry.log),
    commits: [...(step >= 2 ? ['b1' as const] : []), ...(step >= 5 ? ['b2' as const] : []), ...(step >= 8 ? ['c' as const] : [])],
    candidate: step >= 9 ? 'green' : 'running',
  };
  const tagAt: [number, number] = step >= 9 ? [...COMMITS.c] : [...COMMITS.m3];

  return (
    <div className="fx-figure" ref={rootRef} {...hold}>
      <div className="fx-plate">
        <div className="fx-corners" aria-hidden="true">
          <span>Fig 1 · one issue, end to end</span>
          <span>{current.event}</span>
        </div>
        <div className="fx-scroll">
          <svg
            className="iso-svg fx-svg"
            viewBox={`0 0 ${TRACE_W} ${TRACE_H}`}
            role="img"
            aria-label={`Step ${step + 1} of ${STEPS.length}: ${current.title}. ${current.event}.`}
            data-active={[...active].join(' ')}
            data-edges={current.edges.map((edge) => edge.id).join(' ')}
          >
            <g dangerouslySetInnerHTML={{ __html: art.back }} />
            <g dangerouslySetInnerHTML={{ __html: traceDynamic(state) }} />
            <g className="fx-iso-tag" style={{ transform: shift(tagAt) }} dangerouslySetInnerHTML={{ __html: TAG }} />
            <g dangerouslySetInnerHTML={{ __html: art.front }} />
            <g ref={packetsRef} />
          </svg>
        </div>
      </div>
      <div className="fx-steps">
        <ol className="fx-step-list">
          {STEPS.map((entry, index) => (
            <li key={entry.title}>
              <button type="button" className="fx-step" data-active={index === step || undefined} onClick={() => go(index)}>
                <span className="fx-step-n">{String(index + 1).padStart(2, '0')}</span>
                <span className="fx-step-title">{entry.title}</span>
                <span className="fx-step-event">{entry.event}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="fx-caption">
          <StepControls step={step} count={STEPS.length} playing={playing} onPlay={setPlaying} onGo={go} />
          <h3 className="fx-caption-title">{current.title}</h3>
          <p className="fx-caption-event"><code>{current.event}</code></p>
          <p className="fx-caption-body">{current.body}</p>
        </div>
      </div>
    </div>
  );
}
