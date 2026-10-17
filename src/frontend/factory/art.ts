import * as k from './iso-kit';
import type { Plan, Point3, SolidPaths, Tone } from './iso-kit';
import {
  BENCH_SHIFT,
  BUS,
  DOCK_X,
  EVAL_DIAL,
  CRANE,
  ENTRY_X,
  LEVEL_H,
  STACK_MAX,
  STACK_X,
  HEIGHT,
  HOIST_X,
  JOIN_HALF,
  JOIN_X,
  LANES,
  MAIN_X0,
  P,
  PLATE,
  PORTAL,
  UPPER_Z,
  REVIEW_X,
  TAP,
  TRUNK_Y,
  WIDTH,
  at,
  depth,
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

// The collector: a cross belt of rollers at the end of the lines, cut into
// pieces along y so each sits in the layer it belongs to. Walls go only
// where no belt enters or leaves.
function collector(y0: number, y1: number, walls: { right: boolean; left?: boolean; back?: boolean; front?: boolean }) {
  const x0 = JOIN_X - JOIN_HALF;
  const x1 = JOIN_X + JOIN_HALF;
  const back: string[] = [];
  const carry: string[] = [];
  const front: string[] = [];
  if (walls.back) back.push(box(x0 - 3, y0 - 3, x1 + 3, y0, BELT_TOP - 9, BELT_TOP + 0.8, {}, 0.5, 0.3));
  if (walls.left) back.push(box(x0 - 3, y0, x0, y1, BELT_TOP - 9, BELT_TOP + 0.8, {}, 0.4, 0.3));
  carry.push(box(x0, y0, x1, y1, BELT_TOP - 6, BELT_TOP, { tone: 'mid', crease: 'none' }, 0.3));
  const rollers: string[] = [];
  for (let y = Math.ceil((y0 + 1) / 3.5) * 3.5; y < y1 - 0.5; y += 3.5) rollers.push(k.lineOnTop([x0 + 0.6, y], [x1 - 0.6, y], BELT_TOP, P));
  carry.push(L(rollers.join(''), { tone: 'faint' }));
  if (walls.right) front.push(box(x1, y0, x1 + 3, y1, BELT_TOP - 9, BELT_TOP + 0.8, {}, 0.4, 0.3));
  if (walls.front) front.push(box(x0 - 3, y1, x1 + 3, y1 + 3, BELT_TOP - 9, BELT_TOP + 0.8, {}, 0.5, 0.3));
  return { back: back.join(''), carry: carry.join(''), front: front.join('') };
}

// Screens and trims that nod to the tools each line runs. No logos: only
// the motifs (a terminal prompt, an app window with a diff, an issue list)
// and each tool's accent colour.
const faceQuad = (y: number, x0: number, x1: number, z0: number, z1: number) =>
  k.pathOf([at([x0, y, z0]), at([x1, y, z0]), at([x1, y, z1]), at([x0, y, z1])], true);
const faceLine = (y: number, x0: number, x1: number, z: number) => k.segment([x0, y, z], [x1, y, z], P);
const engrave = (x: number, y: number, z: number, text: string, size = 4.2) =>
  k.faceTextSvg(k.sideMatrix([x, y], z, P, 'left'), text, { size, tone: 'mid' });

// A terminal: dark glass, output lines, a prompt and a block cursor.
function terminalScreen(y: number, x0: number, x1: number, z0: number, z1: number, name: string, rows = 5) {
  const out = [`<path class="fx-screen" d="${faceQuad(y, x0, x1, z0, z1)}"/>`];
  const lines: string[] = [];
  const step = (z1 - z0 - 6) / rows;
  const widths = [0.7, 0.45, 0.82, 0.3, 0.6, 0.5];
  for (let i = 0; i < rows - 1; i++) {
    const z = z1 - 4 - i * step;
    lines.push(faceLine(y, x0 + 3, x0 + 3 + (x1 - x0 - 6) * widths[i % widths.length], z));
  }
  out.push(`<path class="fx-screen-line" d="${lines.join('')}"/>`);
  const zp = z0 + 3.5;
  out.push(`<path class="fx-screen-prompt" d="${k.segment([x0 + 3, y, zp + 1.2], [x0 + 4.6, y, zp], P)}${k.segment([x0 + 4.6, y, zp], [x0 + 3, y, zp - 1.2], P)}"/>`);
  out.push(`<path class="fx-cursor" d="${faceQuad(y, x0 + 6.4, x0 + 8.8, zp - 1.4, zp + 1.4)}"/>`);
  return `<g data-screen="${name}">${out.join('')}</g>`;
}

// An app window: a title bar with three dots, a sidebar, and a diff.
function windowScreen(y: number, x0: number, x1: number, z0: number, z1: number, name: string) {
  const out = [`<path class="fx-screen fx-window" d="${faceQuad(y, x0, x1, z0, z1)}"/>`];
  out.push(`<path class="fx-screen-line" d="${faceLine(y, x0, x1, z1 - 5)}${k.segment([x0 + 12, y, z1 - 5], [x0 + 12, y, z0], P)}"/>`);
  out.push(k.dotsSvg([at([x0 + 3, y, z1 - 2.5]), at([x0 + 5.6, y, z1 - 2.5]), at([x0 + 8.2, y, z1 - 2.5])], { size: 0.8, tone: 'hi' }).replace('class="iso-dots"', 'class="iso-dots fx-window-dots"'));
  const side: string[] = [];
  for (let i = 0; i < 4; i++) side.push(faceLine(y, x0 + 2.5, x0 + 9.5 - (i % 2) * 2.5, z1 - 9 - i * 4));
  out.push(`<path class="fx-screen-line" d="${side.join('')}"/>`);
  const adds: string[] = [];
  const dels: string[] = [];
  const plain: string[] = [];
  const pattern = ['plain', 'del', 'add', 'add', 'plain', 'del', 'add', 'plain'];
  const widths = [0.8, 0.55, 0.7, 0.4, 0.62, 0.5, 0.75, 0.35];
  for (let i = 0; i < pattern.length; i++) {
    const z = z1 - 9 - i * 3.6;
    if (z < z0 + 2.5) break;
    const segment = faceLine(y, x0 + 15, x0 + 15 + (x1 - x0 - 18) * widths[i], z);
    (pattern[i] === 'add' ? adds : pattern[i] === 'del' ? dels : plain).push(segment);
  }
  out.push(`<path class="fx-screen-line" d="${plain.join('')}"/>`, `<path class="fx-diff-add" d="${adds.join('')}"/>`, `<path class="fx-diff-del" d="${dels.join('')}"/>`);
  return `<g data-screen="${name}">${out.join('')}</g>`;
}

// Intake for patchrelay: the Linear hopper, its face an issue list.
function hopper(x: number, y: number) {
  const out: string[] = [];
  for (const dx of [-17, 17]) out.push(box(x + dx - 1.4, y - 18.4, x + dx + 1.4, y - 15.6, 0, 70, { crease: 'none' }, 0.4));
  out.push('<g data-part="intake-0"></g>');
  out.push(box(x - 6, y - 6, x + 6, y + 6, 33, 50, {}, 0.8, 0.4));
  out.push(box(x - 12, y - 12, x + 12, y + 12, 50, 60, {}, 1, 0.5));
  out.push(box(x - 17, y - 17, x + 17, y + 17, 60, 70, {}, 1.2, 0.5));
  const body = plan(x - 20, y - 20, x + 20, y + 20, 1.6);
  const face = y + 20;
  const rows: string[] = [];
  const dots: string[] = [];
  [95, 89, 83, 77].forEach((z, index) => {
    dots.push(k.sideRing([x - 13, face, z], 1.5, 'y', P, 14));
    rows.push(faceLine(face, x - 9, x - 9 + [20, 14, 23, 10][index], z));
  });
  out.push(
    S(k.slabOf(body, 70, 30, P, 4, 0.8), {
      tone: 'mid',
      inner: `<path class="fx-linear-line" d="${dots.join('')}"/>` + L(rows.join(''), { tone: 'lo', free: true }),
    }),
  );
  out.push(`<path class="fx-linear" d="${faceQuad(face, x - 20, x + 20, 70, 71.6)}"/>`);
  out.push(engrave(x - 18, face, 72.6, 'LINEAR', 3.4));
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
  // Screen on top: a terminal for Claude Code, an app window for Codex.
  out.push(box(x - 14, back - 12, x + 14, back - 9, 41.6, 64, {}, 0.8, 0.4));
  out.push(lane === 1 ? terminalScreen(back - 9, x - 11, x + 11, 44.5, 61, `c${lane}`, 4) : windowScreen(back - 9, x - 11, x + 11, 44.5, 61, `c${lane}`));
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
  out.push(engrave(x - 18, face, 9, 'PATCHRELAY'));
  out.push(`<path class="fx-linear" d="${faceQuad(face, x - 26, x + 26, 49.6, 51)}"/>`);
  return out.join('');
}

function claudeMachine(x: number, y: number) {
  // Claude Code: a terminal cabinet the belt runs through, its front a big
  // screen with a prompt and a warm cursor, a warm trim along the top.
  const out: string[] = [];
  const body = plan(x - 26, y - 21, x + 26, y + 21, 2.4);
  const face = y + 21;
  out.push(box(x - 28, y - 23, x + 28, y + 23, 0, 2, { tone: 'lo' }, 2.4));
  out.push(
    S(k.slabOf(body, 2, 48, P, 4, 0.8), {
      tone: 'mid',
      inner: L(rectOnX(x + 26, y - 13, y + 13, 16, 34), { tone: 'lo' }),
    }),
  );
  out.push(`<path class="fx-screen-bezel" d="${faceQuad(face, x - 23, x + 17, 13, 47.5)}"/>`);
  out.push(terminalScreen(face, x - 21, x + 15, 15, 45.5, 'm1', 6));
  out.push(`<path class="fx-claude" d="${faceQuad(face, x - 26, x + 26, 48.4, 50)}"/>`);
  out.push(engrave(x - 21, face, 8, 'CLAUDE CODE'));
  out.push(L([20, 24, 28].map((dz) => faceLine(face, x + 19, x + 24, dz)).join(''), { tone: 'lo' }));
  const hood = plan(x - 23, y - 18, x + 23, y + 18, 3);
  out.push(S(k.slabOf(hood, 50, 4, P, 6, 0.6), { tone: 'mid' }));
  out.push(D(k.corners(hood, 4).map(([cx, cy]) => [cx, cy, 54] as Point3)));
  out.push(lamp('m1', x + 14, y - 8, 54));
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
  // Codex Desktop: the press head is a housing whose front is an app window
  // with a diff, high above the belt.
  const crown = plan(x - 26, y - HALF - 12, x + 26, y + HALF + 12, 1.6);
  const face = y + HALF + 12;
  out.push(S(k.slabOf(crown, 66, 34, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(crown, 70, P, 3), { tone: 'faint' }) }));
  out.push(`<path class="fx-screen-bezel" d="${faceQuad(face, x - 23, x + 23, 71.5, 98)}"/>`);
  out.push(windowScreen(face, x - 21.5, x + 21.5, 73, 96.5, 'm2'));
  out.push(engrave(x - 22, face, 67.6, 'CODEX', 3.4));
  out.push(lamp('m2', x + 18, y - 10, 100));
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

// The merge aggregate: an entry pad with a CI lamp, a guide frame standing
// on the start of the main track that holds the stack of rebased PRs with a
// lamp per level, and a crane that carries PRs from the pad to the stack.
const FRAME_TOP = BELT_TOP + STACK_MAX * LEVEL_H + 6;
function stackFrame(side: 'back' | 'front') {
  const y = TRUNK_Y + (side === 'back' ? -11 : 11);
  const out: string[] = [];
  for (const x of [STACK_X - 11, STACK_X + 11]) {
    out.push(box(x - 1.6, y - 1.6, x + 1.6, y + 1.6, 17, FRAME_TOP, { crease: 'none' }, 0.4));
    out.push(L([1, 2, 3].map((level) => k.segment([x - 1.6, y + 1.6, BELT_TOP + level * LEVEL_H - 0.6], [x + 1.6, y + 1.6, BELT_TOP + level * LEVEL_H - 0.6], P)).join(''), { tone: 'faint' }));
  }
  out.push(box(STACK_X - 13, y - 2, STACK_X + 13, y + 2, FRAME_TOP, FRAME_TOP + 3, {}, 0.5, 0.3));
  if (side === 'front') {
    // The level lamps: one per place in the stack, bottom one on main.
    const lx = STACK_X - 19;
    const ly = TRUNK_Y + 16;
    out.push(post(lx, ly, 3, 0, 1.2, { tone: 'lo' }, 16), post(lx, ly, 1, 1.2, FRAME_TOP, { crease: 'none' }, 10));
    for (let level = 0; level < STACK_MAX; level++) out.push(lamp(`lvl${level}`, lx, ly, BELT_TOP + level * LEVEL_H + 2, 2.2, 3.4));
    out.push(engrave(STACK_X - 9, y + 1.6, 19.4, 'MAIN', 3.2));
  }
  return out.join('');
}

function cranePosts(side: 'back' | 'front') {
  const y = TRUNK_Y + (side === 'back' ? -24 : 24);
  const out: string[] = [];
  for (const x of [CRANE.x0 - 14, CRANE.x1 + 18]) {
    out.push(box(x - 3.5, y - 3.5, x + 3.5, y + 3.5, 0, 1.4, { tone: 'lo' }, 0.6));
    out.push(box(x - 1.6, y - 1.6, x + 1.6, y + 1.6, 1.4, CRANE.z + 6, { crease: 'none' }, 0.3));
  }
  if (side === 'front') {
    for (const x of [CRANE.x0 - 14, CRANE.x1 + 18]) out.push(box(x - 2.5, TRUNK_Y - 26, x + 2.5, TRUNK_Y + 26, CRANE.z + 6, CRANE.z + 10, {}, 0.5, 0.3));
    out.push('<g data-part="crane"></g>');
    out.push(box(CRANE.x0 - 16, TRUNK_Y - 3, CRANE.x1 + 20, TRUNK_Y + 3, CRANE.z + 10, CRANE.z + 15, {}, 0.6, 0.4));
  }
  return out.join('');
}

function lane(i: LaneIndex) {
  const { y, intake, machine } = LANES[i];
  const isTrunk = i === 1;
  const x0 = intake - 30;
  const x1 = JOIN_X - JOIN_HALF;
  const out: string[] = [];
  // The stretch of collector between the lane behind and this one, and the
  // PRs crossing it, sit just before this lane.
  if (i > 0) {
    const gap = collector(LANES[i - 1].y + HALF, y - HALF, { left: true, right: true });
    out.push(gap.back, gap.carry, `<g data-part="gap-${i}"></g>`, gap.front);
  }
  const legXs: number[] = [];
  for (let x = x0 + 10; x < x1 - 4; x += 58) legXs.push(x);
  out.push(legs(legXs, y));
  if (i === 2) out.push(codexPress(machine, y, 'back'));
  out.push(liftPosts(HOIST_X, y, 'back'), liftPosts(dropX(i), y, 'back'));
  if (isTrunk) {
    out.push(cranePosts('back'));
    out.push(post(ENTRY_X, y - HALF - 10, 3.6, 0, 1.4, { tone: 'lo' }), post(ENTRY_X, y - HALF - 10, 1.3, 1.4, 34, { crease: 'none' }, 12));
    out.push(lamp('entry', ENTRY_X, y - HALF - 10, 34, 2.8, 5));
  }
  const main = belt(`belt-${i}`, x0, x1, y, BELT_TOP, false);
  const trunk = isTrunk ? belt('belt-t', JOIN_X + JOIN_HALF, ENTRY_X + 14, y, BELT_TOP, true) : null;
  // The middle lane runs straight through; the outer lanes end on it.
  const onLane = collector(y - HALF, y + HALF, { right: !isTrunk, back: i === 0, front: i === 2 });
  out.push(main.back, onLane.back, main.carry, onLane.carry);
  if (trunk) out.push(trunk.back, trunk.carry);
  if (isTrunk) {
    const pad = plan(ENTRY_X - 10, y - 10, ENTRY_X + 10, y + 10, 1);
    out.push(S(k.slabOf(pad, BELT_TOP, 0.8, P, 3, 0.3), { tone: 'lo' }));
    out.push(L(k.planOutline(k.insetPlan(pad, 2), BELT_TOP + 0.8, P, 3), { tone: 'faint' }));
    out.push(mainTrack(), stackFrame('back'));
  }
  out.push(`<g data-part="items-${i}"></g>`);
  if (isTrunk) out.push('<g data-part="stack"></g>');
  out.push(`<g data-part="lift-${i}"></g>`);
  out.push(main.front, onLane.front);
  if (trunk) {
    out.push(trunk.front, stackFrame('front'));
  }
  out.push(i === 0 ? hopper(intake, y) : sessionConsole(intake, y, i));
  if (i === 0) out.push(drop(TAP.patchrelay, [machine - 6, y - 20, 56]), patchrelayMachine(machine, y));
  if (i === 1) out.push(drop(TAP.claude, [machine, y - 23, 44]), claudeMachine(machine, y));
  if (i === 2) out.push(drop(TAP.codex, [machine, y - HALF - 12, 76]), codexPress(machine, y, 'front'));
  if (i === 0) out.push(k.wireSvg(at([intake + 20, y + 8, 100]), at([machine - 6, y + 8, 69]), { tone: 'mid', via: [at([intake + 40, y + 8, 120]), at([machine - 6, y + 8, 120])] }));
  if (isTrunk) out.push('<g data-part="links"></g>', cranePosts('front'));
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
  'An isometric software factory with three agent lines. patchrelay takes issues from a Linear hopper into a closed machining cell; Claude Code and Codex take theirs from session consoles into a terminal cabinet and an open press with an app window behind it. Pull requests from all three pass under one review-quill portal: approved ones ride on, rejected ones go up a lift onto an upper return belt and come back down a second lift just ahead of their own machine. A square collector at the end carries PRs from the outer lines across onto the middle one, where they queue up behind each other and run to the merge aggregate: a PR is admitted only once CI on its branch is green, then a crane stacks it on the PR ahead, so the bottom one sits on main and each one above is rebased on the one below. The bottom one rides off to the deploy dock as soon as it is green; one that goes red is teleported back to its own line, and the ones above it drop down and retest. An overhead GitHub bus carries the signals, and a front bench replays the evals.';

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
