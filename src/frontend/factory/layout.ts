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
// Past the portal, a rejected PR is hoisted onto its lane's overhead rail.
export const HOIST_X = 346;
export const RAIL_Z = 104;
export const HANG_Z = 78;
// Where a returned PR is set back down: just ahead of its machine.
export const dropX = (lane: LaneIndex) => LANES[lane].machine - 42;

// The collector: a cross belt that brings every lane onto one trunk.
export const JOIN_X = 398;
export const TRUNK_Y = LANES[1].y;
export const LANE_END = JOIN_X + 12;

// The single queue: three test pads in front of the gate, then main.
export const PADS = [530, 503, 476] as const;
export const QUEUE_X = 452;
export const GATE_X = PADS[0] + 13;
export const MAIN_X0 = 552;
export const DOCK_X = 806;
export const GONE_X = 840;

export const BUS = { x0: 30, x1: 900, y0: -168, y1: -158, z0: 132, z1: 140 } as const;
export const TAP = {
  patchrelay: LANES[0].machine,
  claude: LANES[1].machine,
  codex: LANES[2].machine,
  review: REVIEW_X,
  queue: 500,
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
