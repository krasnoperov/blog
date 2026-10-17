import * as k from './iso-kit';
import type { Plan, Point3, SolidPaths, Tone } from './iso-kit';
import {
  BENCH_SHIFT,
  BUS,
  DOCK_X,
  EVAL_DIAL,
  GATE_X,
  HEIGHT,
  HOIST_X,
  CURVE_X0,
  LANES,
  MAIN_X0,
  P,
  PADS,
  PLATE,
  PORTAL,
  UPPER_Z,
  REVIEW_X,
  TAP,
  TRUNK_Y,
  WIDTH,
  at,
  depth,
  curveAt,
  curveLength,
  dropX,
} from './layout';
import type { LaneIndex } from './layout';

// The static half of the figure: every part that never moves, drawn back to
// front lane by lane, with empty groups where the live model puts moving
// parts.

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
const lamp = (name: string, x: number, y: number, z: number, r = 2.6, h = 4) =>
  post(x, y, r + 0.8, z, z + 1.2, { tone: 'lo' }, 18) +
  S(k.cylinder(x, y, r, z + 1.2, h, P, 18), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', `<g data-lamp="${name}" `);
const rectOnY = (y: number, x0: number, x1: number, z0: number, z1: number) =>
  `${k.segment([x0, y, z0], [x1, y, z0], P)}${k.segment([x1, y, z0], [x1, y, z1], P)}${k.segment([x1, y, z1], [x0, y, z1], P)}${k.segment([x0, y, z1], [x0, y, z0], P)}`;
const rectOnX = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  `${k.segment([x, y0, z0], [x, y1, z0], P)}${k.segment([x, y1, z0], [x, y1, z1], P)}${k.segment([x, y1, z1], [x, y0, z1], P)}${k.segment([x, y0, z1], [x, y0, z0], P)}`;
const byDepth = <T extends { x: number; y: number }>(list: T[]) => [...list].sort((a, b) => depth(a.x, a.y) - depth(b.x, b.y));

const HALF = 11;
const BELT_TOP = 24;

function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -7, 7, P)}"/>`];
  out.push(S(k.slabOf(PLATE, -7, 7, P, 8, 1.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => [x, y, 0])));
  const front = PLATE.y + PLATE.d;
  const strip = plan(-20, front - 16, 780, front - 9, 1);
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  const ticks = k.topTicks(-16, 776, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  const label = plan(830, front - 26, 900, front - 10, 1.2);
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: 'faint' }));
  out.push(k.faceTextSvg(k.topMatrix([836, label.y + 6.5], 0.8, P, 'x'), 'KRASNOPEROV · LINE 2', { size: 3.2, tone: 'mid' }));
  out.push(L(k.lineOnTop([836, label.y + 10.5], [880, label.y + 10.5], 0.8, P), { tone: 'lo', free: true }));
  return out.join('');
}

function bus() {
  const out: string[] = [];
  const y = (BUS.y0 + BUS.y1) / 2;
  for (const x of [60, 240, 420, 600, 780, 890]) {
    out.push(post(x, y, 5.6, 0, 1.6, { tone: 'lo' }, 24));
    out.push(post(x, y, 2.6, 1.6, BUS.z0 - 4, { crease: 'none' }, 18));
    out.push(L([40, 90].map((z) => k.sideArc(x, y, 2.6, z, P, 12)).join(''), { tone: 'faint' }));
    out.push(box(x - 5, BUS.y0 + 0.5, x + 5, BUS.y1 - 0.5, BUS.z0 - 4, BUS.z0, {}, 0.6));
  }
  out.push(box(BUS.x0 - 4, BUS.y0 - 1.5, BUS.x0, BUS.y1 + 1.5, BUS.z0 - 1.5, BUS.z1 + 1.5, {}, 0.8, 0.4));
  out.push(
    S(k.slabOf(plan(BUS.x0, BUS.y0, BUS.x1, BUS.y1, 1.2), BUS.z0, BUS.z1 - BUS.z0, P, 3, 0.5), {
      tone: 'mid',
      inner: L([134, 136, 138].map((z) => k.segment([BUS.x0 + 1, BUS.y1, z], [BUS.x1 - 1, BUS.y1, z], P)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(box(BUS.x1, BUS.y0 - 1.5, BUS.x1 + 4, BUS.y1 + 1.5, BUS.z0 - 1.5, BUS.z1 + 1.5, {}, 0.8, 0.4));
  for (const x of Object.values(TAP)) {
    out.push(box(x - 6, BUS.y1, x + 6, BUS.y1 + 3, BUS.z0 - 1, BUS.z1 - 0.5, {}, 0.6, 0.3));
    out.push(D([[x - 3.5, BUS.y1 + 3, 137], [x + 3.5, BUS.y1 + 3, 137]], 0.4));
  }
  out.push('<g data-part="pulses"></g>');
  return out.join('');
}

// Drops from the bus land on the back edge of what they serve; they are
// drawn just before the thing they land on.
function drop(x: number, to: Point3) {
  return k.wireSvg(at([x, BUS.y1 + 3, BUS.z0 - 1]), at(to), { tone: 'lo', via: [at([x, BUS.y1 + 3, to[2] + 30])] });
}

function legs(xs: number[], y: number) {
  const out: string[] = [];
  for (const x of xs) {
    for (const ly of [y - HALF - 1.6, y + HALF + 1.6]) {
      out.push(box(x - 3, ly - 2.6, x + 3, ly + 2.6, 0, 1.2, { tone: 'lo' }, 0.6));
      out.push(box(x - 1.4, ly - 1.2, x + 1.4, ly + 1.2, 1.2, 17, { crease: 'none' }, 0.4));
    }
    out.push(box(x - 0.9, y - HALF, x + 0.9, y + HALF, 6, 7.6, { tone: 'lo' }, 0.3));
  }
  return out.join('');
}

// A belt conveyor, drawn in three passes around the items it carries: the
// return strand and back frame, then the carrying side with its end drums,
// then the front frame with the idler axles along it.
function drum(x: number, y: number, zc: number, r: number, half = HALF) {
  const front: Point3[] = [];
  const back: Point3[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI / 2 - (i / 12) * Math.PI;
    front.push([x + Math.cos(a) * r, y + half, zc + Math.sin(a) * r]);
    back.push([x + Math.cos(a) * r, y - half, zc + Math.sin(a) * r]);
  }
  const ring = [...front, ...back.reverse()].map((point) => at(point));
  const d = k.pathOf(ring, true);
  return `<g class="iso-solid"><path class="iso-fill" d="${d}"/><path class="iso-shade" data-shade="2" d="${d}"/><path class="iso-line iso-edge" data-tone="mid" d="${d}"/></g>`;
}

function belt(id: string, x0: number, x1: number, y: number, top: number, endDrum = true, half = HALF, light = false) {
  const z0 = top - (light ? 4 : 9);
  const r = light ? 2.4 : 4;
  const zc = top - r;
  const back = light
    ? box(x0, y - half - 2, x1, y - half, z0, top + 0.8, {}, 0.4, 0.2)
    : [
        box(x0 + 2, y - half + 1.5, x1 - 2, y + half - 1.5, z0, z0 + 1, { tone: 'lo', crease: 'none' }, 0.3),
        box(x0, y - half - 3, x1, y - half, z0, top + 0.8, {}, 0.5, 0.3),
      ].join('');
  const surface = k.onTop([[x0, y - half], [x1, y - half], [x1, y + half], [x0, y + half]], top, P, true);
  const slats: string[] = [];
  for (let x = x0 - 8; x <= x1 + 8; x += 6) slats.push(k.lineOnTop([x, y - half], [x, y + half], top, P));
  const edges = [k.lineOnTop([x0, y - half + 1.4], [x1, y - half + 1.4], top, P), k.lineOnTop([x0, y + half - 1.4], [x1, y + half - 1.4], top, P)].join('');
  const carry = [
    box(x0, y - half, x1, y + half, zc - 1, top, { tone: 'mid', crease: 'none' }, 0.3),
    `<clipPath id="${id}"><path d="${surface}"/></clipPath>`,
    `<g clip-path="url(#${id})"><g data-part="${id}">${L(slats.join(''), { tone: 'faint' })}</g></g>`,
    L(edges, { tone: 'lo' }),
    endDrum ? drum(x1, y, zc, r, half) : '',
  ].join('');
  const face = y + half + (light ? 2 : 3);
  const idlers: string[] = [];
  if (!light) for (let x = x0 + 10; x < x1 - 6; x += 14) idlers.push(k.sideRing([x, face, zc - 1], 1.2, 'y', P, 12));
  const hubs = [k.sideRing([x0 + r, face, zc], r * 0.6, 'y', P, 16), k.sideRing([x1 - r, face, zc], r * 0.6, 'y', P, 16)];
  const front = [
    S(k.slabOf(plan(x0, y + half, x1, face, 0.4), z0, top + 0.8 - z0, P, 3, 0.3), {
      tone: 'mid',
      inner: L(idlers.join(''), { tone: 'lo' }) + L(hubs.join(''), { tone: 'mid' }),
    }),
    D([[x0 + r, face, zc], [x1 - r, face, zc]], 0.45),
  ].join('');
  return { back, carry, front };
}

// One lane's merge curve: a curved belt from the end of its straight run into
// the trunk. Pieces are cut by y so each lands in the layer it belongs to.
function curvePieces(lane: LaneIndex, from: number, to: number) {
  const total = curveLength(lane);
  const steps = 40;
  const samples: Array<{ p: [number, number]; n: [number, number] }> = [];
  for (let i = 0; i <= steps; i++) {
    const s0 = (total * i) / steps;
    const p = curveAt(lane, s0);
    const q = curveAt(lane, Math.min(total, s0 + 0.5));
    const b = curveAt(lane, Math.max(0, s0 - 0.5));
    const dx = q[0] - b[0];
    const dy = q[1] - b[1];
    const len = Math.hypot(dx, dy) || 1;
    samples.push({ p, n: [-dy / len, dx / len] });
  }
  const inBand = samples.map(({ p }) => p[1] >= from && p[1] <= to);
  const out = { carry: '', front: '' };
  let i = 0;
  while (i < samples.length) {
    if (!inBand[i]) { i++; continue; }
    const start = Math.max(0, i - 1);
    while (i < samples.length && inBand[i]) i++;
    const end = Math.min(samples.length - 1, i);
    const piece = samples.slice(start, end + 1);
    if (piece.length < 2) continue;
    const off = (d: number) => piece.map(({ p, n }) => [p[0] + n[0] * d, p[1] + n[1] * d] as [number, number]);
    const left = off(-HALF);
    const right = off(HALF);
    const ring = [...left, ...right.reverse()];
    out.carry += S(k.extrude(ring, BELT_TOP - 5, 5, P, { convex: false }), { tone: 'mid', crease: 'none' });
    const slats = piece.map(({ p, n }) => k.lineOnTop([p[0] - n[0] * HALF, p[1] - n[1] * HALF], [p[0] + n[0] * HALF, p[1] + n[1] * HALF], BELT_TOP, P));
    out.carry += L(slats.join(''), { tone: 'faint' });
    out.carry += L(k.onTop(off(-HALF + 1.4), BELT_TOP, P) + k.onTop(off(HALF - 1.4), BELT_TOP, P), { tone: 'lo' });
    // The outer frame: a low wall along the side nearer the viewer.
    const wall = [...off(HALF), ...off(HALF + 3).reverse()];
    out.front += S(k.extrude(wall, BELT_TOP - 9, 9.8, P, { convex: false }), { tone: 'mid' });
  }
  return out;
}

function hopper(x: number, y: number) {
  const out: string[] = [];
  for (const dx of [-17, 17]) out.push(box(x + dx - 1.4, y - 18.4, x + dx + 1.4, y - 15.6, 0, 70, { crease: 'none' }, 0.4));
  out.push('<g data-part="intake-0"></g>');
  out.push(box(x - 6, y - 6, x + 6, y + 6, 33, 50, {}, 0.8, 0.4));
  out.push(box(x - 12, y - 12, x + 12, y + 12, 50, 60, {}, 1, 0.5));
  out.push(box(x - 17, y - 17, x + 17, y + 17, 60, 70, {}, 1.2, 0.5));
  const body = plan(x - 20, y - 20, x + 20, y + 20, 1.6);
  const ribs = [-12, -4, 4, 12].map((dx) => k.segment([x + dx, y + 20, 70], [x + dx, y + 20, 88], P)).join('');
  out.push(S(k.slabOf(body, 70, 30, P, 4, 0.8), { tone: 'mid', inner: L(k.sideSeam(body, 88, P, 4) + ribs, { tone: 'faint' }) }));
  const rim = plan(x - 22, y - 22, x + 22, y + 22, 1.8);
  out.push(S(k.slabOf(rim, 100, 3, P, 4, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(rim, 3.5), 103, P, 4), { tone: 'lo' }));
  for (const [dx, dy, z1] of [[-15, -14, 105.6], [-9, -6, 107.2], [-1, -12, 106.2], [-5, 4, 104.8]] as const)
    out.push(box(x + dx, y + dy, x + dx + 16, y + dy + 12, 103, z1, { tone: 'hi' }, 1, 0.3));
  for (const dx of [-17, 17]) out.push(box(x + dx - 1.4, y + 15.6, x + dx + 1.4, y + 18.4, 0, 70, { crease: 'none' }, 0.4));
  return out.join('');
}

// Intake for Claude Code and Codex: a console where I start a session. Its
// arm reaches over the belt and drops the issue.
function sessionConsole(x: number, y: number, lane: LaneIndex) {
  const out: string[] = [];
  const back = y - HALF - 4;
  out.push(box(x - 16, back - 16, x + 16, back, 0, 1.6, { tone: 'lo' }, 1));
  out.push(S(k.slabOf(plan(x - 14, back - 14, x + 14, back - 2, 1.2), 1.6, 40, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(plan(x - 14, back - 14, x + 14, back - 2, 1.2), 30, P, 3), { tone: 'faint' }) }));
  // Screen: a tilted-back panel on top, with a prompt line.
  out.push(box(x - 13, back - 12, x + 13, back - 9, 41.6, 62, {}, 0.8, 0.4));
  out.push(L(rectOnY(back - 9, x - 10, x + 10, 45, 59), { tone: 'lo' }));
  out.push(L(k.segment([x - 8, back - 9, 55], [x + 2, back - 9, 55], P), { tone: 'mid', free: true }));
  out.push(L(k.segment([x - 8, back - 9, 51], [x - 2, back - 9, 51], P), { tone: 'lo', free: true }));
  // Arm and chute over the belt.
  out.push(box(x - 4, back - 4, x + 4, y + 2, 40, 44, {}, 0.6, 0.3));
  out.push(`<g data-part="intake-${lane}"></g>`);
  out.push(box(x - 6, y - 6, x + 6, y + 6, 33, 44, {}, 0.8, 0.4));
  out.push(D([[x - 4, y + 6, 40], [x + 4, y + 6, 40]], 0.4));
  return out.join('');
}

// patchrelay: a closed machining cell with a window, a hex spindle on top.
function patchrelayMachine(x: number, y: number) {
  const out: string[] = [];
  const body = plan(x - 26, y - 20, x + 26, y + 20, 1.6);
  const face = y + 20;
  out.push(
    S(k.slabOf(body, 0, 56, P, 3, 0.8), {
      tone: 'mid',
      inner:
        L(k.sideSeam(body, 48, P, 3), { tone: 'faint' }) +
        L(rectOnY(face, x - 18, x + 10, 30, 44), { tone: 'lo' }) +
        L(rectOnX(x + 26, y - 13, y + 13, 18, 34), { tone: 'lo' }) +
        L([14, 18, 22].map((dx) => k.segment([x + dx, face, 6], [x + dx, face, 22], P)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(L(k.planOutline(k.insetPlan(body, 4), 56, P, 3), { tone: 'faint' }));
  out.push(D(k.corners(body, 5).map(([cx, cy]) => [cx, cy, 56] as Point3)));
  const hex: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) hex.push([x - 6 + Math.cos((i * Math.PI) / 3) * 9, y + Math.sin((i * Math.PI) / 3) * 9]);
  out.push(S(k.extrude(hex, 56, 9, P, { bevel: 0.5 }), { tone: 'mid' }));
  out.push(post(x - 6, y, 4, 65, 69, {}, 20, 0.4));
  out.push(lamp('m0', x + 16, y - 10, 56));
  return out.join('');
}

// Claude Code: a round drum the belt runs through, with a stepped dome.
function claudeMachine(x: number, y: number) {
  const out: string[] = [];
  out.push(post(x, y, 25, 0, 2, { tone: 'lo' }, 64));
  out.push(
    S(k.cylinder(x, y, 23, 2, 44, P, 64, 0.8), {
      tone: 'mid',
      inner: L([14, 32].map((z) => k.sideArc(x, y, 23, z, P, 40)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(L(k.knurl(x, y, 23, 38, 44, 72, P, 0.3), { tone: 'lo' }));
  out.push(post(x, y, 19, 46, 51, {}, 56, 0.6));
  out.push(post(x, y, 13, 51, 55, {}, 48, 0.5));
  out.push(post(x, y, 7, 55, 58, {}, 32, 0.4));
  out.push(L(k.ring(x, y, 16, 51, P, 48), { tone: 'faint' }));
  out.push(lamp('m1', x, y, 58));
  return out.join('');
}

// Codex: an open stamping press; the ram comes down on the belt.
function codexPress(x: number, y: number, part: 'back' | 'front') {
  const out: string[] = [];
  if (part === 'back') {
    out.push(box(x - 10, y - HALF - 12, x + 10, y - HALF - 2, 0, 1.6, { tone: 'lo' }, 0.6));
    out.push(box(x - 6, y - HALF - 10, x + 6, y - HALF - 4, 1.6, 66, {}, 0.6, 0.4));
    return out.join('');
  }
  out.push(box(x - 10, y + HALF + 2, x + 10, y + HALF + 12, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(x - 6, y + HALF + 4, x + 6, y + HALF + 10, 1.6, 66, {}, 0.6, 0.4));
  out.push('<g data-part="ram"></g>');
  const crown = plan(x - 12, y - HALF - 12, x + 12, y + HALF + 12, 1.4);
  out.push(S(k.slabOf(crown, 66, 10, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(crown, 71, P, 3), { tone: 'faint' }) }));
  out.push(post(x, y - 12, 9, 76, 80, {}, 40, 0.5));
  out.push(L(k.knurl(x, y - 12, 9, 76.6, 79.4, 48, P, 0.3), { tone: 'lo' }));
  out.push(lamp('m2', x + 4, y + 14, 76));
  return out.join('');
}

// A lift: four posts and a platform that runs between the belt and the
// upper return belt. Back posts sit behind the belt, front posts in front.
function liftPosts(x: number, y: number, side: 'back' | 'front') {
  const py = side === 'back' ? y - HALF - 6 : y + HALF + 6;
  const out: string[] = [];
  for (const px of [x - 12, x + 12]) {
    out.push(box(px - 3.5, py - 3.5, px + 3.5, py + 3.5, 0, 1.4, { tone: 'lo' }, 0.6));
    out.push(box(px - 1.2, py - 1.2, px + 1.2, py + 1.2, 1.4, UPPER_Z + 6, { crease: 'none' }, 0.3));
    out.push(L([30, 60, 90].map((z) => k.segment([px - 1.2, py + 1.2, z], [px + 1.2, py + 1.2, z], P)).join(''), { tone: 'faint' }));
  }
  out.push(box(x - 14, py - 2, x + 14, py + 2, UPPER_Z + 6, UPPER_Z + 10, {}, 0.5, 0.3));
  if (side === 'front') {
    out.push(box(x - 14, y - HALF - 8, x - 10, y + HALF + 8, UPPER_Z + 6, UPPER_Z + 10, {}, 0.5, 0.3));
    out.push(box(x + 10, y - HALF - 8, x + 14, y + HALF + 8, UPPER_Z + 6, UPPER_Z + 10, {}, 0.5, 0.3));
    out.push(D([[x - 12, py, UPPER_Z + 10], [x + 12, py, UPPER_Z + 10]], 0.4));
  }
  return out.join('');
}

function lane(i: LaneIndex) {
  const { y, intake, machine } = LANES[i];
  const isTrunk = i === 1;
  const x0 = intake - 30;
  const x1 = isTrunk ? MAIN_X0 : CURVE_X0;
  const out: string[] = [];
  const band = (lo: number, hi: number) => {
    const pieces = [curvePieces(0, lo, hi), curvePieces(2, lo, hi)];
    return { carry: pieces.map((p) => p.carry).join(''), front: pieces.map((p) => p.front).join('') };
  };
  // The stretch of merge curve between the lane behind and this one, and
  // the items riding it, sit just before this lane.
  if (i > 0) {
    const gap = band(LANES[i - 1].y + HALF, y - HALF);
    out.push(gap.carry, `<g data-part="gap-${i}"></g>`, gap.front);
  }
  const legXs: number[] = [];
  for (let x = x0 + 10; x < x1 - 4; x += 58) legXs.push(x);
  out.push(legs(legXs, y));
  if (i === 2) out.push(codexPress(machine, y, 'back'));
  out.push(liftPosts(HOIST_X, y, 'back'), liftPosts(dropX(i), y, 'back'));
  if (isTrunk) {
    PADS.forEach((x, index) => {
      out.push(post(x - 6, y - HALF - 10, 3.6, 0, 1.4, { tone: 'lo' }));
      out.push(post(x - 6, y - HALF - 10, 1.3, 1.4, 34, { crease: 'none' }, 12));
      out.push(lamp(`pad${index}`, x - 6, y - HALF - 10, 34));
    });
    out.push(box(GATE_X - 3, y - HALF - 13, GATE_X + 3, y - HALF - 7, 0, 58, {}, 0.5, 0.3));
  }
  const main = belt(`belt-${i}`, x0, x1, y, BELT_TOP, isTrunk);
  const onLane = band(y - HALF, y + HALF);
  out.push(main.back, main.carry, onLane.carry);
  if (isTrunk) {
    for (const x of PADS) {
      const pad = plan(x - 10, y - 10, x + 10, y + 10, 1);
      out.push(S(k.slabOf(pad, BELT_TOP, 0.8, P, 3, 0.3), { tone: 'lo' }));
      out.push(L(k.planOutline(k.insetPlan(pad, 2), BELT_TOP + 0.8, P, 3), { tone: 'faint' }));
    }
    out.push(mainTrack());
  }
  out.push(`<g data-part="items-${i}"></g>`);
  out.push(`<g data-part="lift-${i}"></g>`);
  out.push(main.front, onLane.front);
  out.push(i === 0 ? hopper(intake, y) : sessionConsole(intake, y, i));
  if (i === 0) out.push(drop(TAP.patchrelay, [machine - 6, y - 20, 56]), patchrelayMachine(machine, y));
  if (i === 1) out.push(drop(TAP.claude, [machine, y - 23, 44]), claudeMachine(machine, y));
  if (i === 2) out.push(drop(TAP.codex, [machine, y - HALF - 12, 76]), codexPress(machine, y, 'front'));
  if (i === 0) out.push(k.wireSvg(at([intake + 20, y + 8, 100]), at([machine - 6, y + 8, 69]), { tone: 'mid', via: [at([intake + 40, y + 8, 120]), at([machine - 6, y + 8, 120])] }));
  if (isTrunk) {
    out.push(box(GATE_X - 3, y + HALF + 7, GATE_X + 3, y + HALF + 13, 0, 58, {}, 0.5, 0.3));
    out.push(box(GATE_X - 4, y - HALF - 14, GATE_X + 4, y + HALF + 14, 58, 63, {}, 0.8, 0.4));
    out.push(D([[GATE_X, y - HALF - 11, 63], [GATE_X, y + HALF + 11, 63]], 0.4));
    out.push('<g data-part="links"></g>');
  }
  out.push(`<g data-part="probe-${i}"></g>`);
  out.push(liftPosts(HOIST_X, y, 'front'), liftPosts(dropX(i), y, 'front'));
  // The upper return belt, from the lift past review back to the lift ahead
  // of the machine.
  const upper = belt(`ubelt-${i}`, dropX(i) - 10, HOIST_X + 10, y, UPPER_Z, true, 8, true);
  out.push(upper.back, upper.carry, `<g data-part="upper-${i}"></g>`, upper.front);
  return out.join('');
}

function mainTrack() {
  const y = TRUNK_Y;
  const out: string[] = [];
  const bed = plan(MAIN_X0 - 2, y - 15, DOCK_X + 20, y + 15, 1);
  out.push(S(k.slabOf(bed, 0, 17, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(bed, 4, P, 3), { tone: 'faint' }) }));
  const sleepers: string[] = [];
  for (let x = MAIN_X0 + 6; x <= DOCK_X + 16; x += 11) sleepers.push(box(x - 2.2, y - 12, x + 2.2, y + 12, 17, 19.6, { tone: 'lo' }, 0.4));
  out.push(sleepers.join(''));
  for (const dy of [-7, 5]) out.push(box(MAIN_X0 - 2, y + dy, DOCK_X + 20, y + dy + 2.6, 19.6, 24, {}, 0.4, 0.3));
  return out.join('');
}

// review-quill: a portal over all three belts, a gauge over each lane.
function portalBack() {
  const out: string[] = [];
  out.push(box(PORTAL.x0 - 2, PORTAL.y0 - 10, PORTAL.x1 + 2, PORTAL.y0, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(PORTAL.x0 + 2, PORTAL.y0 - 8, PORTAL.x1 - 2, PORTAL.y0 - 2, 1.6, PORTAL.z0, {}, 0.5, 0.4));
  return out.join('');
}

function portalFront() {
  const out: string[] = [];
  out.push(box(PORTAL.x0 - 2, PORTAL.y1, PORTAL.x1 + 2, PORTAL.y1 + 10, 0, 1.6, { tone: 'lo' }, 0.6));
  out.push(box(PORTAL.x0 + 2, PORTAL.y1 + 2, PORTAL.x1 - 2, PORTAL.y1 + 8, 1.6, PORTAL.z0, {}, 0.5, 0.4));
  const beam = plan(PORTAL.x0, PORTAL.y0 - 10, PORTAL.x1, PORTAL.y1 + 10, 1);
  out.push(S(k.slabOf(beam, PORTAL.z0, PORTAL.z1 - PORTAL.z0, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(beam, PORTAL.z0 + 4, P, 3), { tone: 'faint' }) }));
  out.push(drop(TAP.review, [REVIEW_X, PORTAL.y0 - 10, PORTAL.z1]));
  LANES.forEach((laneInfo, i) => {
    const y = laneInfo.y - 6;
    const top = PORTAL.z1 + 4;
    out.push(post(REVIEW_X, y, 8, PORTAL.z1, PORTAL.z1 + 1.2, { tone: 'lo' }, 36));
    out.push(post(REVIEW_X, y, 7.2, PORTAL.z1 + 1.2, top, { tone: 'hi', crease: 'lo' }, 48, 0.5));
    out.push(L(k.ring(REVIEW_X, y, 5.6, top, P, 40), { tone: 'lo' }));
    const ticks = k.radialTicks(REVIEW_X, y, 5.2, 32, 4, top, [0.8, 1.8], P);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(`<path data-part="needle-${i}" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:0.9" d=""/>`);
    out.push(L(k.ring(REVIEW_X, y, 1, top, P, 12), { tone: 'mid' }));
    out.push(lamp(`verdict${i}`, REVIEW_X, laneInfo.y + 12, PORTAL.z1, 2.2, 3));
  });
  return out.join('');
}

function evalBench() {
  const out: string[] = [];
  const top = plan(196, 30, 404, 60, 2);
  for (const { x, y } of byDepth(k.corners(top, 5).map(([x, y]) => ({ x, y })))) {
    out.push(post(x, y, 3, 0, 1.2, { tone: 'lo' }, 18));
    out.push(post(x, y, 1.7, 1.2, 14, { crease: 'none' }, 14));
  }
  out.push(S(k.slabOf(top, 14, 4, P, 4, 0.6), { tone: 'mid', inner: L(k.sideSeam(top, 15.6, P, 4), { tone: 'faint' }) }));
  // review-quill: eleven frozen PRs replayed through the real prompt.
  out.push(box(208, 36, 266, 52, 18, 21, {}, 0.8, 0.4));
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
  const y0 = TRUNK_Y - 48;
  const y1 = TRUNK_Y + 48;
  const out: string[] = [drop(TAP.dock, [TAP.dock, y0, 70])];
  out.push(box(x0 - 4, y0 - 4, x1 + 4, y1 + 4, 0, 3, { tone: 'lo' }, 1, 0.4));
  const body = plan(x0, y0, x1, y1, 1.4);
  const door: string[] = [];
  for (let z = 7; z <= 39; z += 4) door.push(k.segment([x0 + 16, y1, z], [x0 + 62, y1, z], P));
  out.push(
    S(k.slabOf(body, 3, 63, P, 3, 0.8), {
      tone: 'mid',
      inner:
        L(rectOnY(y1, x0 + 14, x0 + 64, 3, 43), { tone: 'lo' }) +
        L(door.join(''), { tone: 'faint' }) +
        L(rectOnY(y1, x0 + 74, x0 + 86, 50, 58), { tone: 'lo' }) +
        L([16, 32, 48].map((z) => k.segment([x1, y0 + 2, z], [x1, y1 - 2, z], P)).join(''), { tone: 'faint' }),
    }),
  );
  out.push(box(x0 - 3, y0 - 3, x1 + 3, y1 + 3, 66, 70, {}, 1.2, 0.6));
  for (const [x, name] of [[x0 + 44, 'stage'], [x0 + 70, 'production']] as const) {
    out.push(post(x, y1 - 18, 4, 70, 72, { tone: 'lo' }, 20));
    out.push(S(k.cylinder(x, y1 - 18, 3, 72, 6, P, 22), { tone: 'mid', className: 'fx-lamp', crease: 'none' }).replace('<g ', `<g data-lamp="${name}" `));
    out.push(post(x, y1 - 18, 3.6, 78, 79.6, {}, 20, 0.3));
  }
  return out.join('');
}

export const FIGURE_LABEL =
  'An isometric software factory with three agent lines. patchrelay takes issues from a Linear hopper into a closed machining cell; Claude Code and Codex take theirs from session consoles into a round drum and an open press. Pull requests from all three pass under one review-quill portal: approved ones ride on, rejected ones go up a lift onto an upper return belt and come back down a second lift just ahead of their own machine. The outer lines curve smoothly into the middle one, which becomes the single queue, where candidates test on pads at the same time and each passes the gate as soon as it is green, onto the main track and into the deploy dock. An overhead GitHub bus carries the signals, and a front bench replays the evals.';

let cached: string | null = null;

export function factorySvg() {
  if (cached) return cached;
  const body = [
    floor(),
    bus(),
    portalBack(),
    lane(0),
    lane(1),
    lane(2),
    portalFront(),
    dock(),
    `<g transform="${k.translateAlong(P, [BENCH_SHIFT[0], BENCH_SHIFT[1], 0])}">${evalBench()}</g>`,
  ];
  // A group, not an image: the items inside are buttons you can follow.
  cached = k.figureSvg({ width: WIDTH, height: HEIGHT, label: FIGURE_LABEL, body, className: 'fx-svg' }).replace('role="img"', 'role="group"');
  return cached;
}
