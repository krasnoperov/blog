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

// The merge: a square collector, a cross belt at the end of the lines. The
// outer lines end on it and their PRs ride across onto the middle line,
// which carries on past it as the single queue. PRs queue on their belts
// behind whatever is ahead; nothing waits for a turn.
export const TRUNK_Y = LANES[1].y;
export const JOIN_X = 410;
export const JOIN_HALF = 12;

// The merge queue. A gate past the collector opens for a PR once it is
// approved and CI on its own branch is green; it then rides the queue belt
// to the head, where it leaves for main the moment its candidate is green.
// Every queued candidate is built on the one ahead and tested at the same
// time, read on a row of gauges, one per place in the queue.
export const GATE_X = 470;
export const QUEUE_GAP = 27;
export const HEAD_X = 762;
export const SLOTS = 10;
export const slotX = (slot: number) => HEAD_X - slot * QUEUE_GAP;
export const GAUGE = { y: TRUNK_Y - 21, z0: 25, z1: 52, r: 2.4 } as const;

// Deploy: main lands in a small stage booth, then reaches production, a
// building whose windows are the users.
export const BOOTH = { x0: 784, x1: 814, y0: TRUNK_Y - 17, y1: TRUNK_Y + 17, z: 38 } as const;
export const GONE_X = 799;
export const PROD = { x0: 828, x1: 904, y0: TRUNK_Y - 46, y1: TRUNK_Y + 46, z: 66 } as const;

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
  [PROD.x1, PROD.y1, 80],
  [BUS.x1 + 28, -178, 152],
];

export const P: Projection = k.fitProjection(EXTREMES, WIDTH, HEIGHT, { pad: 14, azimuth: AZIMUTH });

export const at = (point: Point3) => k.iso(point, P);
export const depth = (x: number, y: number, z = 0) => k.depthOf([x, y, z], P);
