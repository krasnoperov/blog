import * as k from './iso-kit';
import type { Point3 } from './iso-kit';
import { HUB } from './art';
import { BOOTH, BUS, CI_HALL, DESK, ENTRY_X, GATE_X, LANES, PORTAL, PROD, STACK_X, TRUNK_Y, USERTOLD, at, ciX } from './layout';
import { STACK_MAX } from './layout';

// The machines you can point at. Each is a few world boxes; on screen it is
// the convex hull of their corners, which the live model hit-tests and
// spotlights, and a short note says what that machine does.

type Box = [number, number, number, number, number, number];

export interface StationNote {
  id: string;
  title: string;
  text: string;
  boxes: Box[];
}

const L0 = LANES[0];
const L1 = LANES[1];
const L2 = LANES[2];

export const STATION_NOTES: StationNote[] = [
  {
    id: 'intake',
    title: 'Linear · intake',
    text: 'Issues are written and split in Linear. A planner sets blockedBy before work starts, so dependent issues wait for their blockers.',
    boxes: [[L0.intake - 24, L0.y - 24, L0.intake + 24, L0.y + 24, 0, 110]],
  },
  {
    id: 'patchrelay',
    title: 'patchrelay',
    text: 'Takes issues delegated to it in Linear and runs Codex sessions in one durable worktree per issue. Opens the PR, then repairs it on review comments or red CI.',
    boxes: [[L0.machine - 20, L0.y - 40, L0.machine + 40, L0.y + 14, 0, 64]],
  },
  {
    id: 'claude',
    title: 'Claude Code',
    text: 'A session I start for an issue. It works the issue end to end and opens a PR into the same line as the agents.',
    boxes: [[L1.intake - 18, L1.y - 34, L1.intake + 18, L1.y + 8, 0, 66], [L1.machine - 20, L1.y - 40, L1.machine + 40, L1.y + 14, 0, 64]],
  },
  {
    id: 'codex',
    title: 'Codex',
    text: 'A Codex session I start; its press stamps the issue into a PR on the nearest, shortest line.',
    boxes: [[L2.intake - 18, L2.y - 34, L2.intake + 18, L2.y + 8, 0, 66], [L2.machine - 14, L2.y - 28, L2.machine + 40, L2.y + 24, 0, 82]],
  },
  {
    id: 'review',
    title: 'review-quill',
    text: 'Reviews every PR head. It approves, or requests changes and the PR goes up the lift and back to its agent. After three review fixes, a human is needed.',
    boxes: [[PORTAL.x0 - 4, PORTAL.y0 - 10, PORTAL.x1 + 4, PORTAL.y1 + 10, 0, PORTAL.z1 + 6]],
  },
  {
    id: 'gate',
    title: 'Admission gate',
    text: 'merge-steward admits a PR only when it is approved on its exact head and CI on its branch is green. Red branch CI goes back for ci_repair; changes to wrangler, auth, migrations or dependencies wait for a human.',
    boxes: [[GATE_X - 10, TRUNK_Y - 24, GATE_X + 10, TRUNK_Y + 24, 0, 58]],
  },
  {
    id: 'stack',
    title: 'Merge queue',
    text: 'Each PR is stacked on the one ahead: a candidate of main plus everything below it. The bottom lands on main the moment it is green. A conflict or red candidate is repaired in place on its candidate ref, then rechecked by a narrow integration review.',
    boxes: [[ENTRY_X - 14, TRUNK_Y - 28, STACK_X + 32, TRUNK_Y + 28, 0, 130]],
  },
  {
    id: 'ci',
    title: 'CI on candidates',
    text: 'One drum per level of the stack: CI runs on the exact candidate SHA, all at once. The dial fills as it runs; the lamp turns green or red.',
    boxes: [[ciX(0) - 16, CI_HALL.y - 16, ciX(STACK_MAX - 1) + 16, CI_HALL.y + 16, 0, 30]],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    text: 'A push to main deploys stage and production from the same SHA, each with its own smoke test. The issue is Done only when both pass.',
    boxes: [[BOOTH.x0 - 4, BOOTH.y0 - 4, BOOTH.x1 + 4, BOOTH.y1 + 4, 0, 60], [PROD.x0 - 4, PROD.y0 - 4, PROD.x1 + 4, PROD.y1 + 4, 0, PROD.z + 30]],
  },
  {
    id: 'usertold',
    title: 'usertold',
    text: 'Interviews the people using what shipped. What they say becomes evidence linked to Linear issues, and goes back to intake in a capsule.',
    boxes: [[USERTOLD.x0 - 4, USERTOLD.y0 - 4, USERTOLD.x1 + 4, USERTOLD.y1 + 4, 0, USERTOLD.z + 20]],
  },
  {
    id: 'desk',
    title: 'Human Needed',
    text: 'Where spent repair budgets and sensitive changes go. The andon is green while the line runs on its own, amber while it waits for an approval, red when a human is needed.',
    boxes: [[DESK.x0 - 4, DESK.y0 - 4, DESK.x1 + 14, DESK.y1 + 18, 0, 56]],
  },
  {
    id: 'bus',
    title: 'GitHub, the bus',
    text: 'The services never call each other. Webhooks wake them; every decision is re-read from GitHub: head SHA, reviews, checks, refs.',
    boxes: [[BUS.x0 - 4, BUS.y0 - 4, BUS.x1 + 4, BUS.y1 + 4, BUS.z0 - 6, BUS.z1 + 4], [HUB.x0, HUB.y0, HUB.x1, HUB.y1, 0, HUB.z]],
  },
];

// The eval bench is drawn shifted; its notes come with its own boxes.
export function benchNote(shift: readonly [number, number]): StationNote {
  return {
    id: 'evals',
    title: 'Evals',
    text: 'review-quill replays eleven frozen PRs through its real prompt; merge-steward runs 34 queue scenarios. A recurring miss becomes a new case.',
    boxes: [[196 + shift[0], 30 + shift[1], 404 + shift[0], 60 + shift[1], 0, 40]],
  };
}

export type Flat = [number, number];

// The screen hull of a station: every corner of every box, wrapped.
export function hullOf(note: StationNote): Flat[] {
  const points: Flat[] = [];
  for (const [x0, y0, x1, y1, z0, z1] of note.boxes) {
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) points.push(at([x, y, z] as Point3) as Flat);
  }
  return convexHull(points);
}

function convexHull(points: Flat[]): Flat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Flat[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Flat[] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function inside(point: Flat, hull: Flat[]) {
  let hit = false;
  for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) {
    const [xi, yi] = hull[i];
    const [xj, yj] = hull[j];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function areaOf(hull: Flat[]) {
  let sum = 0;
  for (let i = 0, j = hull.length - 1; i < hull.length; j = i++) sum += hull[j][0] * hull[i][1] - hull[i][0] * hull[j][1];
  return Math.abs(sum) / 2;
}

export const pathOfHull = (hull: Flat[]) => k.pathOf(hull, true);
