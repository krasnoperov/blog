import type { CSSProperties, ReactNode } from 'react';
import { StepControls } from './StepControls';
import { useStepper } from './useStepper';

// One issue, end to end, through the services that actually run it. Every
// event name, Codex call and git command below is the one the code uses.

type NodeId = 'linear' | 'session' | 'patchrelay' | 'prCodex' | 'github' | 'rq' | 'rqCodex' | 'ms' | 'msGit' | 'actions' | 'cf';

interface Box { x: number; y: number; w: number; h: number; title: string; sub: string }

const NODES: Record<Exclude<NodeId, 'github'>, Box> = {
  linear: { x: 20, y: 40, w: 190, h: 64, title: 'Linear', sub: 'issue delegated' },
  session: { x: 20, y: 236, w: 190, h: 64, title: 'Any coding session', sub: 'Claude Code · Codex, by hand' },
  patchrelay: { x: 260, y: 40, w: 220, h: 64, title: 'patchrelay', sub: 'Linear + GitHub webhooks' },
  prCodex: { x: 260, y: 136, w: 220, h: 64, title: 'codex app-server', sub: 'thread + worktree per issue' },
  rq: { x: 940, y: 40, w: 240, h: 64, title: 'review-quill', sub: 'pull_request webhooks' },
  rqCodex: { x: 940, y: 136, w: 240, h: 64, title: 'codex app-server', sub: 'fresh thread per review' },
  ms: { x: 940, y: 236, w: 240, h: 64, title: 'merge-steward', sub: 'reviews · check suites · push' },
  msGit: { x: 940, y: 332, w: 240, h: 64, title: 'git worktree', sub: 'merge --no-ff · push candidate' },
  actions: { x: 940, y: 428, w: 240, h: 64, title: 'GitHub Actions', sub: 'CI on every pushed ref' },
  cf: { x: 940, y: 524, w: 240, h: 56, title: 'Cloudflare Workers', sub: 'stage → production' },
};

const GH = { x: 530, y: 20, w: 360, h: 560 };

type EdgeId = 'linear-pr' | 'pr-codex' | 'codex-gh' | 'session-gh' | 'gh-pr' | 'gh-rq' | 'rq-codex' | 'gh-ms' | 'ms-git' | 'git-gh' | 'gh-actions' | 'actions-cf';

const EDGES: Record<EdgeId, { a: [number, number]; b: [number, number]; nodes: NodeId[] }> = {
  'linear-pr': { a: [210, 72], b: [260, 72], nodes: ['linear', 'patchrelay'] },
  'pr-codex': { a: [370, 104], b: [370, 136], nodes: ['patchrelay', 'prCodex'] },
  'codex-gh': { a: [480, 168], b: [530, 168], nodes: ['prCodex', 'github'] },
  'gh-pr': { a: [530, 72], b: [480, 72], nodes: ['github', 'patchrelay'] },
  'session-gh': { a: [210, 268], b: [530, 268], nodes: ['session', 'github'] },
  'gh-rq': { a: [890, 72], b: [940, 72], nodes: ['github', 'rq'] },
  'rq-codex': { a: [1060, 104], b: [1060, 136], nodes: ['rq', 'rqCodex'] },
  'gh-ms': { a: [890, 268], b: [940, 268], nodes: ['github', 'ms'] },
  'ms-git': { a: [1060, 300], b: [1060, 332], nodes: ['ms', 'msGit'] },
  'git-gh': { a: [940, 364], b: [890, 364], nodes: ['msGit', 'github'] },
  'gh-actions': { a: [890, 460], b: [940, 460], nodes: ['github', 'actions'] },
  'actions-cf': { a: [1060, 492], b: [1060, 524], nodes: ['actions', 'cf'] },
};

interface PrState { head: string; review: string; checks: string; queue: string }
interface Step {
  title: string;
  event: string;
  edges: Array<{ id: EdgeId; back?: boolean }>;
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

const LOG_DEPTH = 6;

function NodeBox({ id, active }: { id: Exclude<NodeId, 'github'>; active: boolean }) {
  const node = NODES[id];
  return (
    <g className="fx-node" data-active={active || undefined}>
      <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={3} />
      <text x={node.x + 14} y={node.y + 27} className="fx-node-title">{node.title}</text>
      <text x={node.x + 14} y={node.y + 47} className="fx-node-sub">{node.sub}</text>
    </g>
  );
}

function Graph({ step }: { step: number }) {
  // Rows: main, the issue branch, the candidate ref.
  const rows = { main: 400, branch: 460, cand: 520 };
  const b1 = step >= 2;
  const b2 = step >= 5;
  const cand = step >= 8;
  const landed = step >= 9;
  const mainAt: [number, number] = landed ? [845, rows.cand] : [700, rows.main];
  return (
    <g className="fx-graph">
      <text x={548} y={rows.main - 14} className="fx-ref">main</text>
      <text x={548} y={rows.branch - 14} className="fx-ref">usertold/USE-1412</text>
      <text x={548} y={rows.cand - 14} className="fx-ref">merge-steward/main/pr-1601</text>
      <line x1={560} y1={rows.main} x2={700} y2={rows.main} className="fx-edge-line" />
      {b1 && <path d={`M650 ${rows.main} C 665 ${rows.main} 675 ${rows.branch} 690 ${rows.branch} L 720 ${rows.branch}`} className="fx-edge-line" />}
      {b2 && <line x1={720} y1={rows.branch} x2={780} y2={rows.branch} className="fx-edge-line" />}
      {cand && (
        <>
          <path d={`M700 ${rows.main} C 790 ${rows.main} 800 ${rows.cand} 845 ${rows.cand}`} className="fx-edge-line" />
          <path d={`M780 ${rows.branch} C 815 ${rows.branch} 820 ${rows.cand} 845 ${rows.cand}`} className="fx-edge-line" />
        </>
      )}
      {[600, 650, 700].map((x) => <circle key={x} cx={x} cy={rows.main} r={5} className="fx-commit" />)}
      {b1 && <circle cx={720} cy={rows.branch} r={5} className="fx-commit" data-new={step === 2 || undefined} />}
      {b1 && <text x={720} y={rows.branch + 22} className="fx-sha" textAnchor="middle">a1f3c9e</text>}
      {b2 && <circle cx={780} cy={rows.branch} r={5} className="fx-commit" data-new={step === 5 || undefined} />}
      {b2 && <text x={780} y={rows.branch + 22} className="fx-sha" textAnchor="middle">b72d0e4</text>}
      {cand && <circle cx={845} cy={rows.cand} r={6} className="fx-commit" data-state={landed ? 'green' : 'running'} />}
      {cand && <text x={845} y={rows.cand + 24} className="fx-sha" textAnchor="middle">c90e1aa</text>}
      <g className="fx-tag" style={{ transform: `translate(${mainAt[0]}px, ${mainAt[1] - 22}px)` }}>
        <rect x={-20} y={-10} width={40} height={16} rx={2} />
        <text x={0} y={2} textAnchor="middle">main</text>
      </g>
    </g>
  );
}

export function TraceFigure() {
  const { step, playing, setPlaying, go, rootRef, hold } = useStepper(STEPS.length, 4200);
  const current = STEPS[step];
  const active = new Set<NodeId>();
  for (const edge of current.edges) for (const node of EDGES[edge.id].nodes) active.add(node);
  const log = STEPS.slice(Math.max(0, step - LOG_DEPTH + 1), step + 1).map((entry) => entry.log);
  const rows: Array<[string, string]> = [
    ['head', current.pr.head],
    ['review', current.pr.review],
    ['checks', current.pr.checks],
    ['queue', current.pr.queue],
  ];

  return (
    <div className="fx-figure" ref={rootRef} {...hold}>
      <div className="fx-plate">
        <div className="fx-corners" aria-hidden="true">
          <span>Fig 1 · one issue, end to end</span>
          <span>{current.event}</span>
        </div>
        <div className="fx-scroll">
          <svg className="fx-svg" viewBox="0 0 1200 600" role="img" aria-label={`Step ${step + 1} of ${STEPS.length}: ${current.title}. ${current.event}.`}>
            {(Object.keys(EDGES) as EdgeId[]).map((id) => {
              const edge = EDGES[id];
              const on = current.edges.some((entry) => entry.id === id);
              return <line key={id} x1={edge.a[0]} y1={edge.a[1]} x2={edge.b[0]} y2={edge.b[1]} className="fx-wire" data-active={on || undefined} data-optional={id === 'session-gh' || undefined} />;
            })}
            <g className="fx-node fx-github" data-active={active.has('github') || undefined}>
              <rect x={GH.x} y={GH.y} width={GH.w} height={GH.h} rx={3} />
              <text x={GH.x + 18} y={GH.y + 30} className="fx-node-title">GitHub</text>
              <text x={GH.x + 18} y={GH.y + 50} className="fx-node-sub">the only state the services share</text>
              <text x={GH.x + 18} y={GH.y + 86} className="fx-ref">PR #1601</text>
              {rows.map(([label, value], index) => (
                <g key={label}>
                  <text x={GH.x + 18} y={GH.y + 110 + index * 20} className="fx-key">{label}</text>
                  <text x={GH.x + 90} y={GH.y + 110 + index * 20} className="fx-value" data-tone={/✓|approved|merged/.test(value) ? 'green' : /changes/.test(value) ? 'red' : undefined}>{value}</text>
                </g>
              ))}
              <text x={GH.x + 18} y={GH.y + 210} className="fx-ref">webhook deliveries</text>
              {log.map((line, index) => (
                <text key={`${step}-${index}`} x={GH.x + 18} y={GH.y + 232 + index * 17} className="fx-log" data-latest={index === log.length - 1 || undefined}>{line}</text>
              ))}
              <Graph step={step} />
            </g>
            {(Object.keys(NODES) as Array<Exclude<NodeId, 'github'>>).map((id) => <NodeBox key={id} id={id} active={active.has(id)} />)}
            {current.edges.map((entry, index) => {
              const edge = EDGES[entry.id];
              const [from, to] = entry.back ? [edge.b, edge.a] : [edge.a, edge.b];
              const style = { '--x1': `${from[0]}px`, '--y1': `${from[1]}px`, '--x2': `${to[0]}px`, '--y2': `${to[1]}px`, animationDelay: `${index * 0.35}s` } as CSSProperties;
              return <circle key={`${step}-${index}`} r={4} className="fx-packet" style={style} />;
            })}
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
