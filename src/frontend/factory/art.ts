import * as k from './iso-kit';
import type { Plan, Point3, SolidPaths, Tone } from './iso-kit';
import {
  BUS,
  DEV_X,
  GANTRY,
  PADS,
  TROLLEY,
  DIAL,
  DOCK_X,
  BENCH_DX,
  EVAL_DIAL,
  FRONT_END,
  HEIGHT,
  MERGE_X,
  P,
  STATION,
  TAP,
  WIDTH,
  at,
  depth,
} from './layout';

// The static half of the figure: every part that never moves, drawn back to
// front in layers, with empty groups where the live model puts moving parts.

type Style = Parameters<typeof k.solidSvg>[1];

const S = (paths: SolidPaths, style: Style = {}) => k.solidSvg(paths, style);
const L = (d: string, style: Parameters<typeof k.lineSvg>[1] = {}) => k.lineSvg(d, style);
const D = (points: Point3[], size = 0.45, tone: Tone = 'mid') =>
  k.dotsSvg(points.map((point) => at(point)), { size, tone });

const plan = (x0: number, y0: number, x1: number, y1: number, r = 0.8): Plan => ({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r });
const box = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, style: Style = {}, r = 0.8, bevel = 0, steps = 3) =>
  S(k.slabOf(plan(x0, y0, x1, y1, r), z0, z1 - z0, P, steps, bevel), { tone: 'mid', ...style });
const post = (cx: number, cy: number, r: number, z0: number, z1: number, style: Style = {}, steps = 20, bevel = 0) =>
  S(k.cylinder(cx, cy, r, z0, z1 - z0, P, steps, bevel), { tone: 'mid', ...style });
const faceRect = (y: number, x0: number, x1: number, z0: number, z1: number, tone: Tone = 'lo') =>
  L(`${k.segment([x0, y, z0], [x1, y, z0], P)}${k.segment([x1, y, z0], [x1, y, z1], P)}${k.segment([x1, y, z1], [x0, y, z1], P)}${k.segment([x0, y, z1], [x0, y, z0], P)}`, { tone });
const byDepth = <T extends { x: number; y: number }>(list: T[]) => [...list].sort((a, b) => depth(a.x, a.y) - depth(b.x, b.y));

function floor() {
  const PLATE = plan(-24, -118, 932, 78, 10);
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -7, 7, P)}"/>`];
  out.push(S(k.slabOf(PLATE, -7, 7, P, 8, 1.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => [x, y, 0])));

  // A ruler along the front edge: the takt scale of the line.
  const strip = plan(20, 64, 800, 71, 1);
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(24, 796, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(D([[22, 67.5, 0.6], [798, 67.5, 0.6]]));

  // Label plate, front right.
  const label = plan(830, 52, 896, 68, 1.2);
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: 'faint' }));
  out.push(k.faceTextSvg(k.topMatrix([836, 58.5], 0.8, P, 'x'), 'KRASNOPEROV · LINE 1', { size: 3.2, tone: 'mid' }));
  out.push(L(k.lineOnTop([836, 62.5], [878, 62.5], 0.8, P), { tone: 'lo', free: true }));
  out.push(L(k.lineOnTop([836, 65], [864, 65], 0.8, P), { tone: 'lo', free: true }));
  out.push(D([[833, 55, 0.8], [893, 65, 0.8]], 0.4));
  return out.join('');
}

function bus() {
  const out: string[] = [];
  const posts = [86, 246, 406, 566, 726, 892].map((x) => ({ x, y: -101 }));
  for (const { x, y } of byDepth(posts)) {
    out.push(post(x, y, 5.6, 0, 1.6, { tone: 'lo' }, 24));
    out.push(post(x, y, 2.6, 1.6, BUS.z0 - 4, { crease: 'none' }, 18));
    out.push(L([40, 80].map((z) => k.sideArc(x, y, 2.6, z, P, 12)).join(''), { tone: 'faint' }));
    out.push(box(x - 5, BUS.y0 + 0.5, x + 5, BUS.y1 - 0.5, BUS.z0 - 4, BUS.z0, {}, 0.6));
  }
  out.push(box(BUS.x0 - 4, BUS.y0 - 1.5, BUS.x0, BUS.y1 + 1.5, BUS.z0 - 1.5, BUS.z1 + 1.5, {}, 0.8, 0.4));
  out.push(
    S(k.slabOf(plan(BUS.x0, BUS.y0, BUS.x1, BUS.y1, 1.2), BUS.z0, BUS.z1 - BUS.z0, P, 3, 0.5), {
      tone: 'mid',
      inner: L([124, 126, 128].map((z) => k.segment([BUS.x0 + 1, BUS.y1, z], [BUS.x1 - 1, BUS.y1, z], P)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(box(BUS.x1, BUS.y0 - 1.5, BUS.x1 + 4, BUS.y1 + 1.5, BUS.z0 - 1.5, BUS.z1 + 1.5, {}, 0.8, 0.4));
  for (const x of Object.values(TAP)) {
    out.push(box(x - 6, BUS.y1, x + 6, BUS.y1 + 3, BUS.z0 - 1, BUS.z1 - 0.5, {}, 0.6, 0.3));
    out.push(D([[x - 3.5, BUS.y1 + 3, 127], [x + 3.5, BUS.y1 + 3, 127]], 0.4));
  }
  out.push('<g data-part="pulses"></g>');
  // Drops: GitHub reaches each station that reads or writes it.
  const drop = (x: number, to: Point3) =>
    k.wireSvg(at([x, BUS.y1 + 3, BUS.z0 - 1]), at(to), { tone: 'lo', via: [at([x, BUS.y1 + 3, to[2] + 26])] });
  out.push(drop(TAP.dev, [TAP.dev, -5, 108]));
  out.push(drop(TAP.review, [TAP.review, -30, 74]));
  out.push(drop(TAP.gate, [TAP.gate, -26, 82.5]));
  out.push(drop(TAP.dock, [TAP.dock, -48, 70]));
  return out.join('');
}

function legs(xs: number[], y0: number, y1: number, top: number) {
  const out: string[] = [];
  for (const x of xs) {
    for (const y of [y0, y1]) {
      out.push(box(x - 3, y - 2.6, x + 3, y + 2.6, 0, 1.2, { tone: 'lo' }, 0.6));
      out.push(box(x - 1.4, y - 1.2, x + 1.4, y + 1.2, 1.2, top, { crease: 'none' }, 0.4));
    }
    out.push(box(x - 0.9, y0 + 1.2, x + 0.9, y1 - 1.2, 6, 7.6, { tone: 'lo' }, 0.3));
  }
  return out.join('');
}

function beltTop(id: string, x0: number, x1: number, y0: number, y1: number, part: string) {
  const top = k.onTop([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 24, P, true);
  const slats: string[] = [];
  for (let x = x0 - 8; x <= x1 + 8; x += 8) slats.push(k.lineOnTop([x, y0], [x, y1], 24, P));
  return [
    box(x0, y0, x1, y1, 18, 24, { tone: 'mid' }, 0.5),
    `<clipPath id="${id}"><path d="${top}"/></clipPath>`,
    `<g clip-path="url(#${id})"><g data-part="${part}">${L(slats.join(''), { tone: 'faint' })}</g></g>`,
  ].join('');
}

function back() {
  const out: string[] = [];
  // Hopper legs (back pair).
  for (const x of [17, 51]) out.push(box(x - 1.4, -18.4, x + 1.4, -15.6, 0, 70, { crease: 'none' }, 0.4));
  out.push(box(17, -17.8, 51, -16.2, 30, 32, { tone: 'lo' }, 0.3));

  // Triage portal, back post.
  out.push(box(103, -27, 117, -17, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(107, -24.5, 113, -19.5, 1.6, 62, {}, 0.5, 0.4));
  out.push(D([[104.5, -18, 1.6], [115.5, -18, 1.6]], 0.4));

  // Reject pusher, behind the belt.
  out.push(box(139, -31, 153, -23, 0, 1.4, { tone: 'lo' }, 0.6));
  out.push(box(143, -29, 149, -24, 1.4, 22, { tone: 'lo' }, 0.5));
  out.push(
    S(k.slabOf(plan(140, -26, 152, -15, 1.4), 22, 9, P, 3, 0.4), {
      tone: 'lo',
      inner: L(k.sideSeam(plan(140, -26, 152, -15, 1.4), 26.5, P, 3), { tone: 'faint' }),
    }),
  );

  // Dev gantry, back posts.
  for (const x of [GANTRY.x0 + 4, GANTRY.x1 - 4]) {
    out.push(box(x - 5, -37, x + 5, -27, 0, 1.6, { tone: 'lo' }, 0.6));
    out.push(box(x - 3, -35, x + 3, -29, 1.6, GANTRY.top, {}, 0.5, 0.4));
  }

  // A CI lamp behind each test pad of the merge queue.
  PADS.forEach((x, index) => {
    const lx = x - 8;
    out.push(post(lx, -21, 3.8, 0, 1.4, { tone: 'lo' }));
    out.push(post(lx, -21, 1.3, 1.4, 34, { crease: 'none' }, 12));
    out.push(S(k.cylinder(lx, -21, 2.8, 34, 6, P, 20), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', `<g data-lamp="pad${index}" `));
    out.push(post(lx, -21, 3.2, 40, 41, {}, 18, 0.3));
  });

  // The repair trolley's post, behind the queue.
  out.push(box(TROLLEY.x0 - 10, -30, TROLLEY.x0 + 2, -22, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(TROLLEY.x0 - 7, -28, TROLLEY.x0 - 1, -24, 1.6, TROLLEY.z + 8, {}, 0.5, 0.3));

  // Review pillar.
  out.push(box(370, -32, 390, -20, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(
    S(k.slabOf(plan(373, -30, 387, -22, 0.8), 1.6, 72.4, P, 3, 0.5), {
      tone: 'mid',
      inner: L(k.sideSeam(plan(373, -30, 387, -22, 0.8), 30, P, 3), { tone: 'faint' }),
    }),
  );

  // Gate back post and the lamp tower: CI above, review approval below it.
  out.push(box(STATION.gate + 8, -24, STATION.gate + 14, -18, 0, 58, {}, 0.5, 0.3));
  out.push(post(TAP.gate, -26, 4.8, 0, 1.6, { tone: 'lo' }));
  out.push(post(TAP.gate, -26, 1.8, 1.6, 62, { crease: 'none' }, 14));
  out.push(post(TAP.gate, -26, 3.8, 62, 64.4, {}, 20));
  out.push(S(k.cylinder(TAP.gate, -26, 3.4, 64.4, 7.2, P, 24), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', '<g data-lamp="approved" '));
  out.push(post(TAP.gate, -26, 3.8, 71.6, 72.6, {}, 20));
  out.push(S(k.cylinder(TAP.gate, -26, 3.4, 72.6, 7.2, P, 24), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', '<g data-lamp="ci" '));
  out.push(post(TAP.gate, -26, 4.2, 79.8, 82.5, {}, 20, 0.4));
  return out.join('');
}

function rearLane() {
  const x0 = 152;
  const x1 = 438;
  const out: string[] = [];
  out.push(legs([162, 228, 295, 362, 428], -52, -32, 17));
  out.push(box(x0, -54, x1, -51, 16, 24.8, {}, 0.5, 0.3));
  out.push(beltTop('fx-rear', x0, x1, -51, -33, 'slats-rear'));
  // Transfer tables at both ends of the loop: rollers across y.
  for (const cx of [MERGE_X, STATION.divert]) {
    const t0 = cx - 13;
    const t1 = cx + 13;
    for (const x of [t0 + 1.5, t1 - 1.5]) out.push(box(x - 1.2, -30, x + 1.2, -15, 0, 17, { crease: 'none' }, 0.3));
    out.push(box(t0, -31, t0 + 2, -14, 16, 23.4, {}, 0.4));
    const rollers: string[] = [];
    for (let y = -29.5; y <= -15.5; y += 3.5) rollers.push(box(t0 + 2, y - 1.1, t1 - 2, y + 1.1, 21.4, 23.4, { tone: 'lo', crease: 'none' }, 1));
    out.push(rollers.join(''));
    out.push(box(t1 - 2, -31, t1, -14, 16, 23.4, {}, 0.4));
  }
  return out.join('');
}

function rearRail() {
  return box(152, -33, 438, -31, 16, 24.8, {}, 0.5, 0.3);
}

function frontLane() {
  const out: string[] = [];
  out.push(legs([12, 70, 128, 186, 244, 302, 360, 418, 476, 534], -12.6, 12.6, 17));
  out.push(box(0, -14, FRONT_END, -11, 16, 24.8, {}, 0.5, 0.3));
  out.push(beltTop('fx-front', 0, FRONT_END, -11, 11, 'slats-front'));
  // Main: a track, not a belt. Merged work rides it to the dock.
  out.push(
    S(k.slabOf(plan(FRONT_END - 2, -15, DOCK_X + 20, 15, 1), 0, 17, P, 3, 0.6), {
      tone: 'mid',
      inner: L(k.sideSeam(plan(FRONT_END - 2, -15, DOCK_X + 20, 15, 1), 4, P, 3), { tone: 'faint' }),
    }),
  );
  const sleepers: string[] = [];
  for (let x = FRONT_END + 6; x <= DOCK_X + 16; x += 11) sleepers.push(box(x - 2.2, -12, x + 2.2, 12, 17, 19.6, { tone: 'lo' }, 0.4));
  out.push(sleepers.join(''));
  for (const y of [-7, 5]) out.push(box(FRONT_END - 2, y, DOCK_X + 20, y + 2.6, 19.6, 24, {}, 0.4, 0.3));
  return out.join('');
}

function hopper() {
  const out: string[] = [];
  out.push(box(28, -6, 40, 6, 33, 50, {}, 0.8, 0.4));
  out.push(box(22, -12, 46, 12, 50, 60, {}, 1, 0.5));
  out.push(box(17, -17, 51, 17, 60, 70, {}, 1.2, 0.5));
  const body = plan(14, -20, 54, 20, 1.6);
  const ribs = [22, 30, 38, 46].map((x) => k.segment([x, 20, 70], [x, 20, 88], P)).join('');
  out.push(S(k.slabOf(body, 70, 30, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(body, 88, P, 4) + ribs, { tone: 'faint' }) }));
  const rim = plan(12, -22, 56, 22, 1.8);
  out.push(S(k.slabOf(rim, 100, 3, P, 4, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(rim, 3.5), 103, P, 4), { tone: 'lo' }));
  // Issues waiting in the hopper, standing proud of the rim.
  for (const [x0, y0, z1] of [[19, -14, 105.6], [25, -6, 107.2], [33, -12, 106.2], [29, 4, 104.8]] as const)
    out.push(box(x0, y0, x0 + 16, y0 + 12, 103, z1, { tone: 'hi' }, 1, 0.3));
  out.push(D([[15, 19, 103], [53, 19, 103], [15, -19, 103], [53, -19, 103]], 0.45));
  for (const x of [17, 51]) out.push(box(x - 1.4, 15.6, x + 1.4, 18.4, 0, 70, { crease: 'none' }, 0.4));
  out.push(box(17, 16.2, 51, 17.8, 30, 32, { tone: 'lo' }, 0.3));
  return out.join('');
}

function triage() {
  const out: string[] = [];
  out.push(box(103, 16, 117, 26, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(107, 18.5, 113, 23.5, 1.6, 62, {}, 0.5, 0.4));
  out.push(D([[104.5, 25, 1.6], [115.5, 25, 1.6]], 0.4));
  out.push('<g data-part="scanner"></g>');
  out.push(box(97, -25, 123, 25, 62, 70, {}, 1, 0.5));
  out.push(D([[99, -23, 70], [121, -23, 70], [99, 23, 70], [121, 23, 70]], 0.4));
  out.push(post(STATION.triage, 15, 3, 70, 71.2, { tone: 'lo' }, 18));
  out.push(S(k.cylinder(STATION.triage, 15, 2.4, 71.2, 3.6, P, 18), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', '<g data-lamp="triage" '));
  return out.join('');
}

function dev() {
  const out: string[] = [];
  for (const x of [GANTRY.x0 + 4, GANTRY.x1 - 4]) {
    out.push(box(x - 5, 17, x + 5, 27, 0, 1.6, { tone: 'lo' }, 0.6));
    out.push(box(x - 3, 19, x + 3, 25, 1.6, GANTRY.top, {}, 0.5, 0.4));
    out.push(box(x - 4, -37, x + 4, 27, GANTRY.top, GANTRY.top + 8, {}, 0.8, 0.5));
    out.push(D([[x, -34, GANTRY.top + 8], [x, 24, GANTRY.top + 8]], 0.45));
  }
  // The heads and the issues they hold hang under the beam.
  out.push('<g data-part="dev"></g>');
  const beam = plan(GANTRY.x0 + 8, -6, GANTRY.x1 - 8, 6, 0.8);
  out.push(S(k.slabOf(beam, GANTRY.top, 8, P, 3, 0.5), { tone: 'mid', inner: L(k.sideSeam(beam, GANTRY.top + 4, P, 3), { tone: 'faint' }) }));
  // A motor over each station, and the box where the Linear line lands.
  for (const x of DEV_X) {
    out.push(box(x - 6, -4, x + 6, 4, GANTRY.top + 8, GANTRY.top + 16, {}, 0.8, 0.5));
    out.push(L(k.ring(x, 0, 2.2, GANTRY.top + 16, P, 16), { tone: 'lo' }));
  }
  out.push(box(320, -4, 330, 4, GANTRY.top + 8, GANTRY.top + 13, {}, 0.6, 0.4));
  out.push(D([[322, 2, GANTRY.top + 13], [328, 2, GANTRY.top + 13]], 0.4));
  return out.join('');
}

function queueRack() {
  // Test pads on the belt, and the repair trolley's beam above them.
  const out: string[] = [];
  for (const x of PADS) {
    const pad = plan(x - 10, -10, x + 10, 10, 1);
    out.push(S(k.slabOf(pad, 24, 0.8, P, 3, 0.3), { tone: 'lo' }));
    out.push(L(k.planOutline(k.insetPlan(pad, 2), 24.8, P, 3), { tone: 'faint' }));
  }
  return out.join('');
}

function trolleyBeam() {
  const out: string[] = ['<g data-part="trolley"></g>'];
  out.push(box(TROLLEY.x0 - 8, -28, TROLLEY.x0, 4, TROLLEY.z + 8, TROLLEY.z + 14, {}, 0.6, 0.4));
  const beam = plan(TROLLEY.x0 - 2, TROLLEY.y - 4, TROLLEY.x1, TROLLEY.y + 4, 0.6);
  out.push(S(k.slabOf(beam, TROLLEY.z + 8, 5, P, 3, 0.4), { tone: 'mid' }));
  out.push(box(TROLLEY.x1 - 2, TROLLEY.y - 5, TROLLEY.x1 + 1, TROLLEY.y + 5, TROLLEY.z + 6, TROLLEY.z + 14, {}, 0.4));
  return out.join('');
}

function review() {
  const out: string[] = [];
  out.push('<g data-part="probe"></g>');
  const arm = plan(374, -22, 386, 4, 0.8);
  out.push(S(k.slabOf(arm, 66, 6, P, 3, 0.4), { tone: 'mid' }));
  out.push(post(DIAL.x, DIAL.y, DIAL.r + 1, 72, 73.4, { tone: 'lo' }, 40));
  out.push(post(DIAL.x, DIAL.y, DIAL.r, 73.4, DIAL.top, { tone: 'hi', crease: 'lo' }, 56, 0.6));
  out.push(L(k.knurl(DIAL.x, DIAL.y, DIAL.r, DIAL.top - 2.4, DIAL.top, 60, P, 0.3), { tone: 'lo' }));
  out.push(L(k.ring(DIAL.x, DIAL.y, DIAL.r - 1.6, DIAL.top, P, 48), { tone: 'lo' }));
  const ticks = k.radialTicks(DIAL.x, DIAL.y, DIAL.r - 2.2, 40, 5, DIAL.top, [1, 2.2], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push('<path data-part="needle" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:0.9" d=""/>');
  out.push(L(k.ring(DIAL.x, DIAL.y, 1.1, DIAL.top, P, 14), { tone: 'mid' }));
  // Verdict lamp on the pillar: lit for approve, red for changes requested.
  out.push(post(380, -26, 3.4, 74, 75.2, { tone: 'lo' }, 18));
  out.push(S(k.cylinder(380, -26, 2.8, 75.2, 4, P, 18), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', '<g data-lamp="verdict" '));
  return out.join('');
}

function divert() {
  const out: string[] = ['<g data-part="divert"></g>'];
  out.push(box(STATION.divert - 9, 15, STATION.divert + 9, 31, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(STATION.divert - 6, 18, STATION.divert + 6, 28, 1.6, 26, {}, 0.5));
  const body = plan(STATION.divert - 7, 16, STATION.divert + 7, 30, 1.4);
  out.push(S(k.slabOf(body, 26, 10, P, 3, 0.4), { tone: 'mid', inner: L(k.sideSeam(body, 31, P, 3), { tone: 'faint' }) }));
  out.push(D([[STATION.divert - 5, 28, 36], [STATION.divert + 5, 28, 36]], 0.4));
  return out.join('');
}

function gate() {
  const g = STATION.gate + 11;
  const out: string[] = [];
  out.push(box(g - 3, 18, g + 3, 24, 0, 58, {}, 0.5, 0.3));
  out.push(box(g - 4, -26, g + 4, 26, 58, 63, {}, 0.8, 0.4));
  out.push(D([[g, -23, 63], [g, 23, 63]], 0.4));
  return out.join('');
}

function bin() {
  const out: string[] = [];
  out.push(box(132, 18, 160, 46, 0, 1.4, { tone: 'lo' }, 1));
  out.push(box(132, 18, 160, 20, 1.4, 13, {}, 0.4, 0.3));
  out.push(box(132, 20, 134, 44, 1.4, 13, {}, 0.4, 0.3));
  out.push('<g data-part="bin"></g>');
  out.push(box(158, 20, 160, 44, 1.4, 13, {}, 0.4, 0.3));
  out.push(box(132, 44, 160, 46, 1.4, 13, {}, 0.4, 0.3));
  return out.join('');
}

function evalBench() {
  const out: string[] = [];
  const top = plan(196, 30, 404, 60, 2);
  for (const [x, y] of byDepth(k.corners(top, 5).map(([x, y]) => ({ x, y }))).map(({ x, y }) => [x, y])) {
    out.push(post(x, y, 3, 0, 1.2, { tone: 'lo' }, 18));
    out.push(post(x, y, 1.7, 1.2, 14, { crease: 'none' }, 14));
  }
  out.push(S(k.slabOf(top, 14, 4, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(top, 15.6, P, 4), { tone: 'faint' }) }));

  // review-quill: eleven frozen PRs replayed through the real prompt.
  out.push(box(208, 36, 266, 52, 18, 21, {}, 0.8, 0.4));
  out.push(D([[210, 50, 21], [264, 50, 21]], 0.4));
  const cases: string[] = [];
  for (let i = 0; i < 11; i++) {
    const x = 212 + i * 4.8;
    cases.push(`<g data-case="${i}">${box(x, 38, x + 1.8, 50, 21, 31, { tone: 'hi' }, 0.3)}</g>`);
  }
  out.push(cases.join(''));
  out.push(post(EVAL_DIAL.x, EVAL_DIAL.y, 4, 18, 26, {}, 20));
  out.push(post(EVAL_DIAL.x, EVAL_DIAL.y, EVAL_DIAL.r, 26, EVAL_DIAL.top, { tone: 'hi', crease: 'lo' }, 56, 0.6));
  out.push(L(k.ring(EVAL_DIAL.x, EVAL_DIAL.y, EVAL_DIAL.r - 1.8, EVAL_DIAL.top, P, 48), { tone: 'lo' }));
  const ticks = k.radialTicks(EVAL_DIAL.x, EVAL_DIAL.y, EVAL_DIAL.r - 2.4, 44, 4, EVAL_DIAL.top, [1, 2.2], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push('<path data-part="eval-needle" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:0.9" d=""/>');
  out.push(L(k.ring(EVAL_DIAL.x, EVAL_DIAL.y, 1.1, EVAL_DIAL.top, P, 14), { tone: 'mid' }));

  // merge-steward: 34 queue scenarios, one peg each.
  const board = plan(314, 35, 396, 55, 1);
  out.push(S(k.slabOf(board, 18, 2, P, 3, 0.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(board, 1.6), 20, P, 3), { tone: 'faint' }));
  const pegs: Array<{ x: number; y: number; i: number }> = [];
  for (let i = 0; i < 34; i++) pegs.push({ x: 319 + (i % 17) * 4.5, y: i < 17 ? 41 : 49, i });
  for (const peg of byDepth(pegs)) out.push(`<g data-peg="${peg.i}">${post(peg.x, peg.y, 1.2, 20, 23.4, { tone: 'hi' }, 12)}</g>`);
  return out.join('');
}

function dock() {
  const x0 = DOCK_X;
  const x1 = DOCK_X + 92;
  const out: string[] = [];
  out.push(box(x0 - 4, -52, x1 + 4, 52, 0, 3, { tone: 'lo' }, 1, 0.4));
  const body = plan(x0, -48, x1, 48, 1.4);
  const door: string[] = [];
  for (let z = 7; z <= 39; z += 4) door.push(k.segment([832, 48, z], [878, 48, z], P));
  out.push(
    S(k.slabOf(body, 3, 63, P, 3, 0.8), {
      tone: 'mid',
      inner:
        faceRect(48, 830, 880, 3, 43) +
        L(door.join(''), { tone: 'faint' }) +
        faceRect(48, 890, 902, 50, 58, 'lo') +
        faceRect(48, 822, 826, 10, 58, 'faint') +
        L([16, 32, 48].map((z) => k.segment([x1, -48 + 2, z], [x1, 48 - 2, z], P)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(box(x0 - 3, -51, x1 + 3, 51, 66, 70, {}, 1.2, 0.6));
  out.push(D([[x0 - 1, 49, 70], [x1 + 1, 49, 70], [x1 + 1, -49, 70]], 0.45));
  // Two beacons: stage, then production.
  for (const [x, name] of [[850, 'stage'], [876, 'production']] as const) {
    out.push(post(x, 30, 4, 70, 72, { tone: 'lo' }, 20));
    out.push(S(k.cylinder(x, 30, 3, 72, 6, P, 22), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', `<g data-lamp="${name}" `));
    out.push(post(x, 30, 3.6, 78, 79.6, {}, 20, 0.3));
  }
  return out.join('');
}

function linearLine() {
  // The Linear line: issues are filed upstream, and patchrelay hears about
  // delegation over it.
  return k.wireSvg(at([54, 8, 100]), at([325, 0, GANTRY.top + 13]), {
    tone: 'mid',
    via: [at([86, 8, 132]), at([325, 0, 132])],
  });
}

export const FIGURE_LABEL =
  'An isometric software factory. Issues drop from a Linear hopper onto a conveyor, pass a triage scanner, and reach three dev stations working side by side: patchrelay, Claude Code and Codex, each lifting its issue off the belt while it works. Each issue leaves as a pull request, gets measured by the review-quill gauge, and loops back on a rear return lane when changes are requested. Approved work is tested on three pads at once in the merge queue, a red candidate gets patched and the ones behind it retest, and each green one passes the gate, links onto the main track and rides into the deploy dock. An overhead GitHub bus carries every signal between the stations, and a front bench replays the evals.';

let cached: string | null = null;

export function factorySvg() {
  if (cached) return cached;
  const body = [
    floor(),
    bus(),
    back(),
    rearLane(),
    '<g data-part="rear-items"></g>',
    rearRail(),
    frontLane(),
    queueRack(),
    '<g data-part="items"></g>',
    box(0, 11, FRONT_END, 14, 16, 24.8, {}, 0.5, 0.3),
    hopper(),
    triage(),
    dev(),
    review(),
    divert(),
    gate(),
    trolleyBeam(),
    '<g data-part="links"></g>',
    linearLine(),
    bin(),
    dock(),
    `<g transform="${k.translateAlong(P, [BENCH_DX, 0, 0])}">${evalBench()}</g>`,
  ];
  // A group, not an image: the items inside are buttons you can follow.
  cached = k.figureSvg({ width: WIDTH, height: HEIGHT, label: FIGURE_LABEL, body, className: 'fx-svg' }).replace('role="img"', 'role="group"');
  return cached;
}

