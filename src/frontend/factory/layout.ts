import * as k from './iso-kit';
import type { Point3, Projection } from './iso-kit';

// World units are roughly one screen pixel of the real line. x runs along the
// belts, y toward the viewer, z up. Every moving part and every number the
// live model reports is placed from these constants.

export const WIDTH = 1240;
export const HEIGHT = 580;
export const AZIMUTH = 70;

export const BELT_Z = 24;
export const CARD_H = 2.2;
export const BOX_H = 10;

// Three agents, each on its own belt. Machines are staggered along x so the
// front ones never hide the ones behind.
export const LANES = [
  { key: 'patchrelay', y: -100, intake: 120, machine: 214 },
  { key: 'claude', y: -36, intake: 50, machine: 146 },
  { key: 'codex', y: 28, intake: -18, machine: 78 },
] as const;
export type LaneIndex = 0 | 1 | 2;

// review-quill: one portal across all three belts.
export const REVIEW_X = 312;
// Past the portal, a lift raises a rejected PR to an upper return belt that
// runs back over its machine; a second lift sets it down just ahead of it.
export const HOIST_X = 346;
export const UPPER_Z = 128;
export const dropX = (lane: LaneIndex) => LANES[lane].machine - 42;

// The merge: the outer lanes leave their straight run and curve smoothly
// into the middle lane, which carries on as the single queue.
export const TRUNK_Y = LANES[1].y;
export const CURVE_X0 = 372;
export const MERGE_X = 470;
// The funnel: one deck where the three belt ends converge. Only one PR is in
// it at a time; each lane waits at its own stop line just before it.
export const FUNNEL_X0 = 430;
export const STOP_BACK = 14;

// Points along a lane's merge curve, sampled evenly by arc length.
function sampleCurve(lane: LaneIndex) {
  const y0 = LANES[lane].y;
  const p0: [number, number] = [CURVE_X0, y0];
  const p1: [number, number] = [CURVE_X0 + 52, y0];
  const p2: [number, number] = [MERGE_X - 52, TRUNK_Y];
  const p3: [number, number] = [MERGE_X, TRUNK_Y];
  const raw: Array<[number, number]> = [];
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const u = 1 - t;
    raw.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  const lengths = [0];
  for (let i = 1; i < raw.length; i++) lengths.push(lengths[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  return { raw, lengths, total: lengths[lengths.length - 1] };
}
const CURVES = [sampleCurve(0), sampleCurve(1), sampleCurve(2)];
export const curveLength = (lane: LaneIndex) => CURVES[lane].total;
// Arc length along a lane's curve where it reaches x.
export function curveSAtX(lane: LaneIndex, x: number) {
  const { raw, lengths } = CURVES[lane];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i][0] >= x) {
      const f = (x - raw[i - 1][0]) / (raw[i][0] - raw[i - 1][0] || 1);
      return lengths[i - 1] + (lengths[i] - lengths[i - 1]) * f;
    }
  }
  return CURVES[lane].total;
}

export function curveAt(lane: LaneIndex, s: number): [number, number] {
  const { raw, lengths, total } = CURVES[lane];
  const at = Math.min(Math.max(s, 0), total);
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < at) i++;
  const f = (at - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
  return [raw[i - 1][0] + (raw[i][0] - raw[i - 1][0]) * f, raw[i - 1][1] + (raw[i][1] - raw[i - 1][1]) * f];
}

// The merge aggregate. A PR waits on the entry pad until CI on its own
// branch is green. A crane then sets it on top of the stack, which stands on
// the start of the main track: the bottom PR sits on main, each one above
// sits on the one below it, the way merge-steward rebases its candidates.
export const ENTRY_X = 506;
export const STACK_X = 588;
export const STACK_MAX = 4;
export const LEVEL_H = BOX_H + 1.2;
export const CRANE = { x0: ENTRY_X, x1: STACK_X, z: 112 } as const;
export const QUEUE_X = MERGE_X;
export const MAIN_X0 = 552;
export const DOCK_X = 806;
export const GONE_X = 840;

export const BUS = { x0: 30, x1: 900, y0: -168, y1: -158, z0: 132, z1: 140 } as const;
export const TAP = {
  patchrelay: LANES[0].machine,
  claude: LANES[1].machine,
  codex: LANES[2].machine,
  review: REVIEW_X,
  queue: 548,
  dock: 866,
} as const;

export const PORTAL = { x0: REVIEW_X - 9, x1: REVIEW_X + 9, y0: LANES[0].y - 22, y1: LANES[2].y + 24, z0: 62, z1: 70 } as const;

export const PLATE = { x: -56, y: -184, w: 996, d: 300, r: 12 };
// The eval bench is drawn at x 196..404, y 30..60 and slid into place.
export const BENCH_SHIFT = [396, 16] as const;
export const EVAL_DIAL = { x: 292, y: 45, r: 10, top: 31 } as const;

const EXTREMES: Point3[] = [
  ...k.boxCorners(PLATE, -7, 0),
  [BUS.x0, BUS.y0, BUS.z1 + 2],
  [BUS.x1, BUS.y0, BUS.z1 + 2],
  [DOCK_X + 92, TRUNK_Y + 48, 80],
];

export const P: Projection = k.fitProjection(EXTREMES, WIDTH, HEIGHT, { pad: 14, azimuth: AZIMUTH });

export const at = (point: Point3) => k.iso(point, P);
export const depth = (x: number, y: number, z = 0) => k.depthOf([x, y, z], P);
