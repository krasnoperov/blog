import * as k from './iso-kit';
import type { Point3, Projection } from './iso-kit';

// World units are roughly one screen pixel of the real line. x runs along the
// conveyor, y toward the viewer, z up. Every moving part and every number the
// live model reports is placed from these constants.

export const WIDTH = 1240;
export const HEIGHT = 440;
export const AZIMUTH = 70;

export const BELT_Z = 24;
export const CARD_H = 2.2;
export const BOX_H = 10;

export const FRONT_END = 568;
export const DOCK_X = 816;

export const STATION = {
  spawn: 34,
  triage: 110,
  reject: 146,
  review: 380,
  divert: 425,
  queueStart: 452,
  gate: 538,
  gone: 846,
} as const;

// The rework loop: pushed off at the divert, back along the rear lane, and onto
// the front belt again just upstream of dev.
export const REAR_Y = -42;
export const MERGE_X = 165;
export const REAR_PATH: Array<[number, number]> = [
  [STATION.divert, 0],
  [STATION.divert, REAR_Y],
  [MERGE_X, REAR_Y],
  [MERGE_X, 0],
];

// Dev: three lift stations on one gantry, one per agent. A head grabs an
// issue, lifts it clear of the belt while it works, and lowers it back as a
// pull request, so other issues pass underneath and all three work at once.
export const DEV_X = [206, 258, 310] as const;
export const GANTRY = { x0: 186, x1: 334, top: 100 } as const;
export const HEAD_REST = 78;
export const LIFT_Z = 52;

// Merge queue: three test pads in front of the gate, each with a CI lamp. A
// repair trolley runs on a beam above them.
export const PADS = [538, 511, 484] as const;
export const TROLLEY = { x0: 470, x1: 552, y: -6, z: 78 } as const;

export const BUS = { x0: 70, x1: 904, y0: -106, y1: -96, z0: 122, z1: 130 } as const;
export const TAP = { dev: DEV_X[1], review: STATION.review, gate: 560, dock: 866 } as const;

export const PROBE = { x: STATION.review, y: 0, rest: 44 } as const;
export const DIAL = { x: STATION.review, y: -10, r: 8, top: 77 } as const;
// The eval bench is drawn around x = 200..400 and slid along x to its spot.
export const BENCH_DX = 404;
export const EVAL_DIAL = { x: 292, y: 45, r: 10, top: 31 } as const;

const EXTREMES: Point3[] = [
  ...k.boxCorners({ x: -24, y: -118, w: 956, d: 196, r: 10 }, -7, 0),
  [BUS.x0, BUS.y0, BUS.z1 + 2],
  [BUS.x1, BUS.y0, BUS.z1 + 2],
  [14, -22, 106],
  [DOCK_X + 92, 52, 80],
];

export const P: Projection = k.fitProjection(EXTREMES, WIDTH, HEIGHT, { pad: 14, azimuth: AZIMUTH });

export const at = (point: Point3) => k.iso(point, P);
export const depth = (x: number, y: number, z = 0) => k.depthOf([x, y, z], P);
