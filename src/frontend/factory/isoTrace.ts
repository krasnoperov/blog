import * as k from './iso-kit';
import type { Plan, Point3 } from './iso-kit';
import { byDepth, parts } from './isoParts';

// Fig 1 as an isometric bench. Every service is a unit wired to GitHub: a
// low slab with an upright panel showing the PR as the services read it, and
// the git refs as rails with commits standing on them.

export const TRACE_W = 1200;
export const TRACE_H = 560;

export type TraceNode = 'linear' | 'session' | 'patchrelay' | 'prCodex' | 'github' | 'rq' | 'rqCodex' | 'ms' | 'msGit' | 'actions' | 'cf';
export type TraceEdge = 'linear-pr' | 'pr-codex' | 'codex-gh' | 'session-gh' | 'gh-pr' | 'gh-rq' | 'rq-codex' | 'gh-ms' | 'ms-git' | 'git-gh' | 'gh-actions' | 'actions-cf';

const BENCH: Plan = { x: -40, y: -26, w: 1010, d: 352, r: 10 };
const GH: Plan = { x: 280, y: 6, w: 360, d: 296, r: 3 };
const GH_TOP = 8;
const PANEL: Plan = { x: 292, y: 12, w: 336, d: 10, r: 1.5 };
const PANEL_TOP = 196;
const FACE_Y = PANEL.y + PANEL.d;

// Three rows on each side of GitHub. A service sits next to GitHub; the
// module it drives sits beside it, further out.
const ROW = [0, 116, 232];
const UNITS: Record<Exclude<TraceNode, 'github'>, { plan: Plan; h: number; name: string; small?: boolean }> = {
  linear: { plan: { x: 104, y: ROW[0], w: 130, d: 50, r: 2 }, h: 34, name: 'Linear' },
  patchrelay: { plan: { x: 104, y: ROW[1], w: 130, d: 50, r: 2 }, h: 40, name: 'patchrelay' },
  prCodex: { plan: { x: -10, y: ROW[1] + 6, w: 100, d: 40, r: 2 }, h: 28, name: 'codex app-server', small: true },
  session: { plan: { x: 104, y: ROW[2], w: 130, d: 50, r: 2 }, h: 34, name: 'any coding session' },
  rq: { plan: { x: 686, y: ROW[0], w: 130, d: 50, r: 2 }, h: 40, name: 'review-quill' },
  rqCodex: { plan: { x: 830, y: ROW[0] + 6, w: 100, d: 40, r: 2 }, h: 28, name: 'codex app-server', small: true },
  ms: { plan: { x: 686, y: ROW[1], w: 130, d: 50, r: 2 }, h: 40, name: 'merge-steward' },
  msGit: { plan: { x: 830, y: ROW[1] + 6, w: 100, d: 40, r: 2 }, h: 28, name: 'git worktree', small: true },
  actions: { plan: { x: 686, y: ROW[2], w: 130, d: 50, r: 2 }, h: 34, name: 'GitHub Actions' },
  cf: { plan: { x: 830, y: ROW[2] + 6, w: 100, d: 40, r: 2 }, h: 28, name: 'Cloudflare', small: true },
};

// Cables run on the bench as polylines; a packet travels along them in order.
type Route = Array<[number, number]>;
export const CABLES: Record<TraceEdge, { route: Route; optional?: boolean }> = {
  'linear-pr': { route: [[169, 50], [169, ROW[1]]] },
  'pr-codex': { route: [[104, ROW[1] + 26], [90, ROW[1] + 26]] },
  'codex-gh': { route: [[40, ROW[1] + 46], [40, ROW[1] + 72], [GH.x, ROW[1] + 72]] },
  'gh-pr': { route: [[GH.x, ROW[1] + 26], [234, ROW[1] + 26]] },
  'session-gh': { route: [[234, ROW[2] + 25], [GH.x, ROW[2] + 25]], optional: true },
  'gh-rq': { route: [[GH.x + GH.w, ROW[0] + 25], [686, ROW[0] + 25]] },
  'rq-codex': { route: [[816, ROW[0] + 26], [830, ROW[0] + 26]] },
  'gh-ms': { route: [[GH.x + GH.w, ROW[1] + 25], [686, ROW[1] + 25]] },
  'ms-git': { route: [[816, ROW[1] + 26], [830, ROW[1] + 26]] },
  'git-gh': { route: [[880, ROW[1] + 46], [880, ROW[1] + 72], [GH.x + GH.w, ROW[1] + 72]] },
  'gh-actions': { route: [[GH.x + GH.w, ROW[2] + 25], [686, ROW[2] + 25]] },
  'actions-cf': { route: [[816, ROW[2] + 26], [830, ROW[2] + 26]] },
};

export const AZIMUTH = 77;
const EXTREMES: Point3[] = [...k.boxCorners(BENCH, -8, 0), [PANEL.x, PANEL.y, PANEL_TOP + 4], [PANEL.x + PANEL.w, PANEL.y, PANEL_TOP + 4]];
export const TRACE_P = k.fitProjection(EXTREMES, TRACE_W, TRACE_H, { pad: 12, azimuth: AZIMUTH });
const D = parts(TRACE_P);

// Git rails on the slab: main, the issue branch, the candidate ref.
export const RAIL_Y = { main: 200, branch: 240, cand: 280 } as const;
export const COMMITS = {
  m1: [420, RAIL_Y.main],
  m2: [460, RAIL_Y.main],
  m3: [500, RAIL_Y.main],
  b1: [520, RAIL_Y.branch],
  b2: [560, RAIL_Y.branch],
  c: [612, RAIL_Y.cand],
} as const satisfies Record<string, [number, number]>;
export const PUCK_Z = GH_TOP + 2.4;

function cable(id: TraceEdge) {
  const { route, optional } = CABLES[id];
  const out: string[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const [a, b] = [route[i], route[i + 1]];
    const [x0, x1] = [Math.min(a[0], b[0]) - 1.6, Math.max(a[0], b[0]) + 1.6];
    const [y0, y1] = [Math.min(a[1], b[1]) - 1.6, Math.max(a[1], b[1]) + 1.6];
    out.push(D.slab(D.plan(x0, y0, x1 - x0, y1 - y0, 1.2), 0, 1.2, { tone: 'lo', crease: 'none' }, 0));
  }
  return `${out.join('')}<path class="iso-line fx-wire" data-edge="${id}"${optional ? ' data-optional=""' : ''} d="${D.top(route, 1.3)}"/>`;
}

// Screen points of a cable, for packets that travel along it.
export function cablePath(id: TraceEdge, back = false): Array<[number, number]> {
  const route = back ? [...CABLES[id].route].reverse() : CABLES[id].route;
  return route.map(([x, y]) => k.iso([x, y, 4], TRACE_P) as [number, number]);
}

function github() {
  const out = [D.S(k.slabOf(GH, 0, GH_TOP, TRACE_P, 3, 1), { tone: 'mid', className: 'fx-unit' }).replace('<g ', '<g data-node="github" ')];
  out.push(D.L(k.planOutline(k.insetPlan(GH, 4), GH_TOP, TRACE_P, 3), { tone: 'faint' }));
  out.push(D.dots(k.corners(GH, 8).map(([x, y]) => [x, y, GH_TOP] as Point3)));
  // The upright panel: GitHub's state as every service reads it.
  for (const x of [PANEL.x + 14, PANEL.x + PANEL.w - 14]) out.push(D.slab(D.plan(x - 6, PANEL.y + PANEL.d, 12, 8, 1), GH_TOP, 6, {}, 0.3));
  out.push(D.S(k.slabOf(PANEL, GH_TOP, PANEL_TOP - GH_TOP, TRACE_P, 3, 0.8), { tone: 'mid', inner: D.L(k.sideSeam(PANEL, PANEL_TOP - 6, TRACE_P, 3), { tone: 'faint' }) }));
  const screen = [[PANEL.x + 8, PANEL.x + PANEL.w - 8]] as const;
  for (const [x0, x1] of screen) {
    const rect = (z0: number, z1: number) =>
      k.segment([x0, FACE_Y, z0], [x1, FACE_Y, z0], TRACE_P) + k.segment([x1, FACE_Y, z0], [x1, FACE_Y, z1], TRACE_P) + k.segment([x1, FACE_Y, z1], [x0, FACE_Y, z1], TRACE_P) + k.segment([x0, FACE_Y, z1], [x0, FACE_Y, z0], TRACE_P);
    out.push(D.L(rect(GH_TOP + 8, PANEL_TOP - 10), { tone: 'lo' }));
  }
  out.push(D.face(PANEL.x + 18, FACE_Y, PANEL_TOP - 24, 'GitHub', 13, 'hi'));
  out.push(D.face(PANEL.x + 78, FACE_Y, PANEL_TOP - 24, 'the only state the services share', 7, 'mid'));
  // Ref rails, each with a name plate standing at its start.
  const names = { main: 'main', branch: 'usertold/USE-1412-…', cand: 'merge-steward/main/pr-1601' };
  for (const key of ['main', 'branch', 'cand'] as const) {
    const y = RAIL_Y[key];
    out.push(D.rail(398, GH.x + GH.w - 10, y, GH_TOP));
    out.push(D.S(k.slabOf(D.plan(288, y - 1.5, 104, 3, 0.5), GH_TOP, 13, TRACE_P, 2, 0.3), { tone: 'mid' }));
    out.push(D.face(292, y + 1.5, GH_TOP + 4.2, names[key], 6.4, 'hi'));
  }
  return out.join('');
}

let cached: { back: string; front: string } | null = null;

export function traceStatic() {
  if (cached) return cached;
  const ghKey = D.depth(GH.x + GH.w / 2, GH.y + GH.d / 2);
  const items = (Object.keys(UNITS) as Array<keyof typeof UNITS>).map((id) => {
    const unit = UNITS[id];
    return { key: D.depth(unit.plan.x + unit.plan.w / 2, unit.plan.y + unit.plan.d / 2), svg: D.unit(unit.plan, unit.h, unit.name, id, unit.small) };
  });
  const cables = (Object.keys(CABLES) as TraceEdge[]).map(cable).join('');
  cached = {
    back: D.bench(BENCH) + cables + byDepth(items.filter((item) => item.key < ghKey)) + github(),
    front: byDepth(items.filter((item) => item.key >= ghKey)),
  };
  return cached;
}

export interface TraceState {
  rows: Array<[string, string, 'green' | 'red' | undefined]>;
  log: string[];
  commits: Array<keyof typeof COMMITS>;
  candidate?: 'running' | 'green';
}

// What changes with the step: the panel's text and the commits on the rails.
export function traceDynamic(state: TraceState) {
  const out: string[] = [];
  const left = PANEL.x + 18;
  out.push(D.face(left, FACE_Y, PANEL_TOP - 42, 'PR #1601', 8.4, 'hi'));
  state.rows.forEach(([label, value, tone], index) => {
    const z = PANEL_TOP - 58 - index * 14;
    out.push(D.face(left, FACE_Y, z, label, 7, 'mid'));
    out.push(D.face(left + 56, FACE_Y, z, value, 7.4, 'hi').replace('data-tone="hi"', `data-tone="${tone ?? 'hi'}"`));
  });
  out.push(D.face(left, FACE_Y, PANEL_TOP - 122, 'webhook deliveries', 7.4, 'hi'));
  state.log.forEach((line, index, all) => {
    out.push(D.face(left, FACE_Y, PANEL_TOP - 138 - index * 13, line, 6.4, index === all.length - 1 ? 'hi' : 'mid'));
  });

  const has = (id: keyof typeof COMMITS) => state.commits.includes(id);
  const links: string[] = [D.top([[398, RAIL_Y.main], [COMMITS.m3[0], RAIL_Y.main]], GH_TOP + 2.5)];
  if (has('b1')) links.push(D.link(COMMITS.m2, COMMITS.b1, GH_TOP + 0.3));
  if (has('b2')) links.push(D.top([COMMITS.b1, COMMITS.b2], GH_TOP + 2.5));
  if (has('c')) links.push(D.link(COMMITS.m3, COMMITS.c, GH_TOP + 0.3), D.link(COMMITS.b2, COMMITS.c, GH_TOP + 0.3));
  out.push(D.L(links.join(''), { tone: 'mid' }));
  const shas: Record<string, string> = { b1: 'a1f3c9e', b2: 'b72d0e4', c: 'c90e1aa' };
  const pucks = (['m1', 'm2', 'm3', ...state.commits] as Array<keyof typeof COMMITS>).map((id) => {
    const [x, y] = COMMITS[id];
    const tone = id === 'c' ? state.candidate : undefined;
    const svg = D.puck(x, y, PUCK_Z, { className: 'fx-puck' }).replace('class="iso-solid fx-puck"', `class="iso-solid fx-puck"${tone ? ` data-state="${tone}"` : ''}`);
    const label = shas[id] ? D.text(x - 10, y + 13, GH_TOP, shas[id], 6, 'mid') : '';
    return { key: D.depth(x, y), svg: label + svg };
  });
  out.push(byDepth(pucks));
  return out.join('');
}

// The `main` marker, built at the origin and moved with a transform.
export function mainTag() {
  const p = D.plan(-14, -4, 28, 8, 1.5);
  return D.slab(p, PUCK_Z + 5, 9, { tone: 'hi', lit: true }, 0.4) + D.face(0, 4, PUCK_Z + 8, 'main', 6.4, 'hi', 'middle');
}

export function screen(point: Point3) {
  return k.iso(point, TRACE_P);
}
