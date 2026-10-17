import * as k from './iso-kit';
import type { Plan, Point3, SolidPaths, Tone } from './iso-kit';
import {
  BENCH_SHIFT,
  BUS,
  BOOTH,
  EVAL_DIAL,
  CRANE,
  DESK,
  DESK_TRAY,
  ENTRY_X,
  GATE_X,
  CI_HALL,
  ciX,
  LEVEL_H,
  MAIN_X0,
  PROD,
  REPAIR,
  TUBE,
  USERTOLD,
  STACK_MAX,
  STACK_X,
  HEIGHT,
  HOIST_X,
  JOIN_HALF,
  JOIN_X,
  LANES,
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
const byDepth = <T extends { x: number; y: number }>(list: T[]) => [...list].sort((a, b) => depth(a.x, a.y) - depth(b.x, b.y));

const HALF = 11;
const TAU_ART = Math.PI * 2;
const BELT_TOP = 24;

function floor() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -7, 7, P)}"/>`];
  out.push(S(k.slabOf(PLATE, -7, 7, P, 8, 1.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: 'lo' }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => [x, y, 0])));
  return out.join('');
}

function bus() {
  const out: string[] = [];
  const y = (BUS.y0 + BUS.y1) / 2;
  for (const x of [60, 240, 420, 600, 780]) {
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
  for (const x of Object.values(TAP)) {
    out.push(box(x - 6, BUS.y1, x + 6, BUS.y1 + 3, BUS.z0 - 1, BUS.z1 - 0.5, {}, 0.6, 0.3));
    out.push(D([[x - 3.5, BUS.y1 + 3, 137], [x + 3.5, BUS.y1 + 3, 137]], 0.4));
  }
  out.push('<g data-part="pulses"></g>');
  return out.join('');
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
function drum(x: number, y: number, zc: number, r: number, half = HALF, dir = 1) {
  const front: Point3[] = [];
  const back: Point3[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI / 2 - (i / 12) * Math.PI;
    front.push([x + dir * Math.cos(a) * r, y + half, zc + Math.sin(a) * r]);
    back.push([x + dir * Math.cos(a) * r, y - half, zc + Math.sin(a) * r]);
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
    drum(x0, y, zc, r, half, -1),
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
// The hopper stands astride the belt: its back legs go behind the belt,
// the rest is drawn after it.
function hopperBack(x: number, y: number) {
  return [-17, 17].map((dx) => box(x + dx - 1.4, y - 18.4, x + dx + 1.4, y - 15.6, 0, 70, { crease: 'none' }, 0.4)).join('');
}
function hopper(x: number, y: number) {
  const out: string[] = [];
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
// A console stands behind the belt; only its arm and chute reach over it.
function consoleBack(x: number, y: number, lane: LaneIndex) {
  const out: string[] = [];
  const back = y - HALF - 4;
  out.push(box(x - 16, back - 16, x + 16, back, 0, 1.6, { tone: 'lo' }, 1));
  out.push(S(k.slabOf(plan(x - 14, back - 14, x + 14, back - 2, 1.2), 1.6, 40, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(plan(x - 14, back - 14, x + 14, back - 2, 1.2), 30, P, 3), { tone: 'faint' }) }));
  // Screen on top: a terminal for Claude Code, an app window for Codex.
  out.push(box(x - 14, back - 12, x + 14, back - 9, 41.6, 64, {}, 0.8, 0.4));
  out.push(lane === 1 ? terminalScreen(back - 9, x - 11, x + 11, 44.5, 61, `c${lane}`, 4) : windowScreen(back - 9, x - 11, x + 11, 44.5, 61, `c${lane}`));
  return out.join('');
}
function sessionConsole(x: number, y: number, lane: LaneIndex) {
  const out: string[] = [];
  const back = y - HALF - 4;
  // Arm and chute over the belt.
  out.push(box(x - 4, back - 4, x + 4, y + 2, 40, 44, {}, 0.6, 0.3));
  out.push(`<g data-part="intake-${lane}"></g>`);
  out.push(box(x - 6, y - 6, x + 6, y + 6, 33, 44, {}, 0.8, 0.4));
  out.push(D([[x - 4, y + 6, 40], [x + 4, y + 6, 40]], 0.4));
  return out.join('');
}

// An issue list on dark glass, for patchrelay's pod: it works from Linear.
function issueScreen(y: number, x0: number, x1: number, z0: number, z1: number, name: string) {
  const out = [`<path class="fx-screen" d="${faceQuad(y, x0, x1, z0, z1)}"/>`];
  const dots: string[] = [];
  const rows: string[] = [];
  for (let i = 0; i < 4; i++) {
    const z = z1 - 3.5 - i * ((z1 - z0 - 5) / 3.4);
    dots.push(k.sideRing([x0 + 3.2, y, z], 1, 'y', P, 10));
    rows.push(faceLine(y, x0 + 6, x0 + 6 + (x1 - x0 - 9) * [0.8, 0.55, 0.9, 0.4][i], z));
  }
  out.push(`<path class="fx-linear-line" d="${dots.join('')}"/>`, `<path class="fx-screen-line" d="${rows.join('')}"/>`);
  return `<g data-screen="${name}">${out.join('')}</g>`;
}

// A small pod on a stand behind the belt: the agent's screen, its name and a
// status lamp. It replaces the big cabinets so the line stays visible.
function screenPod(x: number, y: number, lane: LaneIndex) {
  const out: string[] = [];
  const y1 = y - HALF - 12;
  const y0 = y1 - 5;
  const x0 = x + 12;
  const x1 = x + 38;
  out.push(box(x0 + 9, y0 - 2, x1 - 9, y1 + 1, 0, 1.4, { tone: 'lo' }, 0.6));
  out.push(box(x0 + 11.5, y0 + 1, x1 - 11.5, y1 - 1, 1.4, 22, { crease: 'none' }, 0.4));
  out.push(S(k.slabOf(plan(x0, y0, x1, y1, 1.2), 22, 24, P, 3, 0.5), { tone: 'mid' }));
  out.push(`<path class="fx-screen-bezel" d="${faceQuad(y1, x0 + 1.5, x1 - 1.5, 26.5, 44.5)}"/>`);
  const screen = lane === 0 ? issueScreen : lane === 1 ? terminalScreen : windowScreen;
  out.push(screen(y1, x0 + 2.8, x1 - 2.8, 27.6, 43.4, `m${lane}`));
  out.push(engrave(x0 + 2, y1, 23.2, ['PATCHRELAY', 'CLAUDE CODE', 'CODEX'][lane], 2.6));
  if (lane === 0) out.push(`<path class="fx-linear" d="${faceQuad(y1, x0, x1, 45, 46)}"/>`);
  if (lane === 1) out.push(`<path class="fx-claude" d="${faceQuad(y1, x0, x1, 45, 46)}"/>`);
  out.push(lamp(`m${lane}`, x1 - 4, y0 + 2.5, 46, 2, 3));
  return out.join('');
}

// A SCARA arm: a column behind the belt and two horizontal links that the
// live model swings over the work. Only the column is drawn here.
export const ARM_BASE = (x: number, y: number) => [x - 4, y - HALF - 14] as const;
function armColumn(x: number, y: number) {
  const [bx, by] = ARM_BASE(x, y);
  const out: string[] = [];
  out.push(post(bx, by, 8, 0, 2, { tone: 'lo' }, 32));
  out.push(D(k.corners(plan(bx - 6, by - 6, bx + 6, by + 6, 1), 0).map(([cx, cy]) => [cx, cy, 2] as Point3), 0.4));
  out.push(post(bx, by, 4.6, 2, 44, { crease: 'none', inner: L([16, 30].map((z) => k.sideArc(bx, by, 4.6, z, P, 20)).join(''), { tone: 'faint' }) }, 28));
  out.push(post(bx, by, 6, 44, 48, {}, 32, 0.5));
  out.push(L(k.knurl(bx, by, 6, 44.4, 47.6, 36, P, 0.3), { tone: 'lo' }));
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
  // The guide rack the ram's pinion climbs, bolted to the column.
  const rackY = y + HALF + 10.8;
  const teeth: string[] = [];
  for (let z = 10; z <= 56; z += 2.5) teeth.push(k.segment([x - 1.6, rackY, z], [x + 1.6, rackY, z], P));
  out.push(S(k.slabOf(plan(x - 1.6, y + HALF + 10, x + 1.6, rackY, 0.2), 8, 50, P, 2), { tone: 'mid', inner: L(teeth.join(''), { tone: 'faint' }) }));
  out.push(D([[x - 4.2, y + HALF + 10, 5], [x + 4.2, y + HALF + 10, 5], [x - 4.2, y + HALF + 10, 62], [x + 4.2, y + HALF + 10, 62]], 0.45));
  out.push('<g data-part="ram"></g>');
  const crown = plan(x - 12, y - HALF - 12, x + 12, y + HALF + 12, 1.4);
  out.push(S(k.slabOf(crown, 66, 10, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(crown, 71, P, 3), { tone: 'faint' }) }));
  out.push(post(x, y - 12, 9, 76, 80, {}, 40, 0.5));
  out.push(L(k.knurl(x, y - 12, 9, 76.6, 79.4, 48, P, 0.3), { tone: 'lo' }));
  return out.join('');
}

// A lift: one slim mast behind the belt, a platform that rides it like a
// forklift carriage, and a short arm at the top that carries the end of the
// upper return belt. Nothing stands in front of the belt.
const MAST_Y = HALF + 8;
function liftMast(x: number, y: number) {
  const my = y - MAST_Y;
  const out: string[] = [];
  out.push(box(x - 6, my - 4, x + 6, my + 3, 0, 1.4, { tone: 'lo' }, 0.6));
  for (const rx of [x - 4, x + 4]) out.push(box(rx - 1, my - 1, rx + 1, my + 1, 1.4, UPPER_Z + 4, { crease: 'none' }, 0.3));
  for (const z of [28, 56, 84, 112]) out.push(box(x - 3, my - 0.5, x + 3, my + 0.5, z - 0.5, z + 0.5, { crease: 'none' }, 0.2));
  out.push(box(x - 5, my - 1.5, x + 5, y - 6, UPPER_Z - 4, UPPER_Z - 1.5, {}, 0.4, 0.2));
  out.push(box(x - 5.5, my - 2, x + 5.5, my + 2, UPPER_Z + 4, UPPER_Z + 6, {}, 0.4, 0.3));
  return out.join('');
}

// A support for a long upper return belt: one post behind the line and a
// bracket under the belt, like a lift mast without the lift.
const UPPER_POSTS: Record<LaneIndex, number[]> = { 0: [200], 1: [230], 2: [] };
function upperPost(x: number, y: number) {
  const my = y - MAST_Y;
  return [
    box(x - 4, my - 3, x + 4, my + 3, 0, 1.4, { tone: 'lo' }, 0.6),
    box(x - 1.4, my - 1.4, x + 1.4, my + 1.4, 1.4, UPPER_Z - 1.5, { crease: 'none' }, 0.4),
    box(x - 3, my - 1.5, x + 3, y - 6, UPPER_Z - 4, UPPER_Z - 1.5, {}, 0.4, 0.2),
  ].join('');
}

// The merge queue. A gate past the collector: two posts, a bar that rises
// once the PR before it is approved and green on its own branch, and a lamp
// for each of the two. Behind the queue belt, a rail of glass gauges, one
// per place in the queue, fills as each candidate's CI runs.
export const GATE_SPAN = HALF + 6;
function gate(side: 'back' | 'front') {
  const y = TRUNK_Y + (side === 'back' ? -GATE_SPAN : GATE_SPAN);
  const out: string[] = [];
  out.push(box(GATE_X - 3.5, y - 3.5, GATE_X + 3.5, y + 3.5, 0, 1.4, { tone: 'lo' }, 0.6));
  out.push(box(GATE_X - 1.8, y - 1.8, GATE_X + 1.8, y + 1.8, 1.4, 48, { crease: 'none' }, 0.4));
  if (side === 'front') {
    out.push('<g data-part="gate-bar"></g>');
    out.push(box(GATE_X - 3, TRUNK_Y - GATE_SPAN - 3, GATE_X + 3, TRUNK_Y + GATE_SPAN + 3, 48, 52, {}, 0.6, 0.4));
    out.push(lamp('gate-review', GATE_X, TRUNK_Y - 6, 52, 2.4, 3.4));
    out.push(lamp('gate-ci', GATE_X, TRUNK_Y + 6, 52, 2.4, 3.4));
  }
  return out.join('');
}

// The stack: a guide frame standing on the start of the main track. Beside
// it, a panel with one bar gauge per level fills as that level's CI runs.
const FRAME_TOP = BELT_TOP + STACK_MAX * LEVEL_H + 6;
export const levelZ = (level: number) => BELT_TOP + level * LEVEL_H;
function stackFrame(side: 'back' | 'front') {
  const y = TRUNK_Y + (side === 'back' ? -11 : 11);
  const out: string[] = [];
  // A light frame: guide posts with level collars at the back, and only
  // slim rods at the front so the stack stays in view.
  const r = side === 'back' ? 1.4 : 0.7;
  for (const x of [STACK_X - 11, STACK_X + 11]) {
    out.push(box(x - r, y - r, x + r, y + r, 17, FRAME_TOP, { crease: 'none' }, 0.3));
    if (side === 'back') for (let level = 1; level < STACK_MAX; level++) out.push(box(x - 2, y - 2, x + 2, y + 2, levelZ(level) - 1, levelZ(level) - 0.3, { crease: 'none' }, 0.4));
  }
  out.push(box(STACK_X - 12.5, y - r - 0.4, STACK_X + 12.5, y + r + 0.4, FRAME_TOP, FRAME_TOP + (side === 'back' ? 3 : 1.6), {}, 0.4, 0.3));
  if (side === 'front') {
    // The repair slide: a post with a carriage the live model moves to the
    // level being repaired.
    const { x: rx, y: ry } = REPAIR;
    out.push(box(rx - 3.5, ry - 3.5, rx + 3.5, ry + 3.5, 0, 1.4, { tone: 'lo' }, 0.6));
    out.push(box(rx - 1.4, ry - 1.4, rx + 1.4, ry + 1.4, 1.4, FRAME_TOP + 4, { crease: 'none' }, 0.4));
    out.push(box(rx - 2.4, ry - 2.4, rx + 2.4, ry + 2.4, FRAME_TOP + 4, FRAME_TOP + 6, {}, 0.4, 0.3));
    out.push('<g data-part="repair"></g>');
  }
  return out.join('');
}

// The CI hall: a plinth behind the stack with a test drum per level. Each
// drum has a dial on top whose needle the live model sweeps as CI runs, ribs
// the live model turns while it spins, and a lamp.
export const CI_DIAL = (level: number) => ({ x: ciX(level), y: CI_HALL.y, r: 6.6, top: 26 }) as const;
function ciHall() {
  const { y, r } = CI_HALL;
  const out: string[] = [];
  const x0 = ciX(0) - 16;
  const x1 = ciX(STACK_MAX - 1) + 16;
  const base = plan(x0, y - 16, x1, y + 16, 1.2);
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 4, P)}"/>`);
  out.push(S(k.slabOf(base, 0, 4, P, 3, 0.5), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(base, 3), 4, P, 3), { tone: 'faint' }));
  out.push(D(k.corners(base, 3.5).map(([cx, cy]) => [cx, cy, 4] as Point3), 0.45));
  // The harness: a cable from the back of each drum, along behind the row
  // and out at its end to that drum's level of the stack.
  for (let level = STACK_MAX - 1; level >= 0; level--) {
    const z = 9 + level * 2.2;
    const from = at([ciX(level), y - r + 0.2, z]);
    out.push(k.wireSvg(from, at([STACK_X + 11, TRUNK_Y - 12.6, levelZ(level) + 5]), { tone: 'lo', size: 0.7, ends: 'to', via: [at([ciX(0) - 4, y - r - 1, z])] }));
  }
  for (let level = 0; level < STACK_MAX; level++) {
    const x = ciX(level);
    out.push(post(x, y, r + 2, 4, 5.6, { tone: 'lo' }, 36, 0.3));
    out.push(S(k.cylinder(x, y, r, 5.6, 16.4, P, 36), { tone: 'mid', crease: 'none', inner: L([7.4, 20.2].map((z) => k.sideArc(x, y, r, z, P, 28)).join(''), { tone: 'faint' }) }));
    out.push(`<g data-part="ci-ribs-${level}"></g>`);
    out.push(post(x, y, r + 0.6, 22, 24.4, {}, 36, 0.4));
    const { r: dr, top } = CI_DIAL(level);
    out.push(post(x, y, dr, 24.4, top, { tone: 'hi', crease: 'lo' }, 40, 0.4));
    out.push(L(k.ring(x, y, dr - 1.4, top, P, 36), { tone: 'lo' }));
    const ticks = k.radialTicks(x, y, dr - 1.8, 24, 4, top, [0.7, 1.5], P, -Math.PI * 0.75, Math.PI * 1.5);
    out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
    out.push(`<path data-part="ci-needle-${level}" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:0.9" d=""/>`);
    out.push(L(k.ring(x, y, 0.9, top, P, 12), { tone: 'mid' }));
    out.push(lamp(`ci${level}`, x + 10, y + 11, 4, 1.8, 2.8));
  }
  return out.join('');
}

// The right-hand posts stand clear of the stack so it stays in view.
function cranePosts(side: 'back' | 'front') {
  const y = TRUNK_Y + (side === 'back' ? -24 : 24);
  const out: string[] = [];
  for (const x of [CRANE.x0 - 14, CRANE.x1 + 34]) {
    out.push(box(x - 3.5, y - 3.5, x + 3.5, y + 3.5, 0, 1.4, { tone: 'lo' }, 0.6));
    out.push(box(x - 1.6, y - 1.6, x + 1.6, y + 1.6, 1.4, CRANE.z + 6, { crease: 'none' }, 0.3));
  }
  if (side === 'front') {
    for (const x of [CRANE.x0 - 14, CRANE.x1 + 34]) out.push(box(x - 2.5, TRUNK_Y - 26, x + 2.5, TRUNK_Y + 26, CRANE.z + 6, CRANE.z + 10, {}, 0.5, 0.3));
    out.push('<g data-part="crane"></g>');
    out.push(box(CRANE.x0 - 16, TRUNK_Y - 3, CRANE.x1 + 36, TRUNK_Y + 3, CRANE.z + 10, CRANE.z + 15, {}, 0.6, 0.4));
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
  out.push(screenPod(machine, y, i));
  if (i === 2) out.push(codexPress(machine, y, 'back'));
  else out.push(armColumn(machine, y));
  out.push(liftMast(dropX(i), y), liftMast(HOIST_X, y), ...UPPER_POSTS[i].map((x) => upperPost(x, y)));
  out.push(i === 0 ? hopperBack(intake, y) : consoleBack(intake, y, i));
  if (isTrunk) {
    out.push(legs([JOIN_X + 50], y), gate('back'), cranePosts('back'));
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
  if (trunk) out.push(trunk.front, gate('front'), stackFrame('front'));
  out.push(i === 0 ? hopper(intake, y) : sessionConsole(intake, y, i));
  if (i < 2) out.push(`<g data-part="arm-${i}"></g>`);
  if (i === 2) out.push(codexPress(machine, y, 'front'));
  if (isTrunk) out.push('<g data-part="links"></g>', cranePosts('front'), '<g data-part="beams"></g>');
  out.push(`<g data-part="probe-${i}"></g>`);
  // The upper return belt, from the lift past review back to the lift ahead
  // of the machine.
  // Kept slim, so the line underneath stays readable.
  const upper = belt(`ubelt-${i}`, dropX(i) - 10, HOIST_X + 10, y, UPPER_Z, true, 6, true);
  out.push(upper.back, upper.carry, `<g data-part="upper-${i}"></g>`, upper.front);
  return out.join('');
}

function mainTrack() {
  const y = TRUNK_Y;
  const out: string[] = [];
  const bed = plan(MAIN_X0 - 2, y - 15, BOOTH.x0 + 4, y + 15, 1);
  out.push(S(k.slabOf(bed, 0, 17, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(bed, 4, P, 3), { tone: 'faint' }) }));
  const sleepers: string[] = [];
  for (let x = MAIN_X0 + 6; x <= BOOTH.x0; x += 11) sleepers.push(box(x - 2.2, y - 12, x + 2.2, y + 12, 17, 19.6, { tone: 'lo' }, 0.4));
  out.push(sleepers.join(''));
  for (const dy of [-7, 5]) out.push(box(MAIN_X0 - 2, y + dy, BOOTH.x0 + 4, y + dy + 2.6, 19.6, 24, {}, 0.4, 0.3));
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
  // A reading head on a little gantry over the rack: it stops over each
  // case as it is replayed.
  for (const x of [204, 270]) {
    out.push(post(x, 44, 2.6, 18, 19, { tone: 'lo' }, 14));
    out.push(box(x - 1.2, 42.8, x + 1.2, 45.2, 19, 44, { crease: 'none' }, 0.3));
  }
  out.push(box(202, 42, 272, 46, 44, 47, {}, 0.5, 0.3));
  out.push('<g data-part="eval-head"></g>');
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

const rectOnX = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  `${k.segment([x, y0, z0], [x, y1, z0], P)}${k.segment([x, y1, z0], [x, y1, z1], P)}${k.segment([x, y1, z1], [x, y0, z1], P)}${k.segment([x, y0, z1], [x, y0, z0], P)}`;

// Deploy. main lands in a small stage booth with one window and a dial on
// its roof; then production, a building whose windows are its users, lights
// up window by window.
export const WINDOWS: Array<{ face: 'front' | 'side'; a: number; z: number; col: number }> = [];
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 7; col++) WINDOWS.push({ face: 'front', a: PROD.x0 + 6 + col * 10, z: 16 + row * 12, col });
  for (let col = 0; col < 6; col++) WINDOWS.push({ face: 'side', a: PROD.y1 - 14 - col * 13, z: 16 + row * 12, col: 7 + col });
}
export const STAGE_DIAL = { x: (BOOTH.x0 + BOOTH.x1) / 2, y: (BOOTH.y0 + BOOTH.y1) / 2, r: 7, top: BOOTH.z + 6 } as const;
function booth() {
  const { x0, x1, y0, y1, z } = BOOTH;
  const out: string[] = [];
  out.push(box(x0 - 3, y0 - 3, x1 + 3, y1 + 3, 0, 2, { tone: 'lo' }, 0.8, 0.4));
  const body = plan(x0, y0, x1, y1, 1);
  out.push(S(k.slabOf(body, 2, z - 2, P, 3, 0.6), { tone: 'mid', inner: L(rectOnY(y1, x0 + 5, x1 - 5, 14, 31), { tone: 'lo' }) + L(k.sideSeam(body, 9, P), { tone: 'faint' }) }));
  out.push(`<path class="fx-pane" data-window="stage" d="${faceQuad(y1, x0 + 6, x1 - 6, 15, 30)}"/>`);
  out.push(L(faceLine(y1, x0 + 6, x1 - 6, 22.5), { tone: 'lo' }));
  out.push(D([[x0 + 2.5, y1, 5], [x1 - 2.5, y1, 5], [x1, y1 - 2.5, 5], [x1, y0 + 2.5, 5]], 0.45));
  out.push(box(x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, z, z + 3, {}, 1, 0.5));
  const { x, y, r, top } = STAGE_DIAL;
  out.push(post(x, y, r + 1, z + 3, z + 4, { tone: 'lo' }, 36));
  out.push(post(x, y, r, z + 4, top, { tone: 'hi', crease: 'lo' }, 48, 0.5));
  out.push(L(k.ring(x, y, r - 1.6, top, P, 40), { tone: 'lo' }));
  const ticks = k.radialTicks(x, y, r - 2, 28, 4, top, [0.8, 1.8], P, -Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push('<path data-part="stage-needle" class="iso-line" data-tone="hi" data-free="start" style="stroke-width:0.9" d=""/>');
  out.push(L(k.ring(x, y, 1, top, P, 12), { tone: 'mid' }));
  out.push(chimney(x0 + 5, y0 + 5, z + 3, 11, 'smoke-stage'));
  return out.join('');
}

// A smoke-test chimney: a flue with a cap and a lamp beside it. The live
// model puffs smoke from it while the smoke test runs, then lights the lamp.
export const CHIMNEYS = [
  { x: BOOTH.x0 + 5, y: BOOTH.y0 + 5, top: BOOTH.z + 3 + 11 },
  { x: PROD.x1 - 10, y: PROD.y0 + 10, top: PROD.z + 3 + 14 },
] as const;
function chimney(x: number, y: number, z: number, h: number, name: string) {
  return [
    post(x, y, 2.6, z, z + 1, { tone: 'lo' }, 18),
    post(x, y, 1.8, z + 1, z + h - 1.2, {}, 18),
    post(x, y, 2.4, z + h - 1.2, z + h, {}, 18, 0.3),
    lamp(name, x + 5, y + 2, z, 1.6, 2.4),
  ].join('');
}

function production() {
  const { x0, x1, y0, y1, z } = PROD;
  const out: string[] = [];
  out.push(box(x0 - 4, y0 - 4, x1 + 4, y1 + 4, 0, 3, { tone: 'lo' }, 1, 0.4));
  const body = plan(x0, y0, x1, y1, 1.4);
  const floors = [12, 24, 36, 48].map((level) => k.sideSeam(body, level + 1.5, P)).join('');
  out.push(
    S(k.slabOf(body, 3, z - 3, P, 3, 0.8), {
      tone: 'mid',
      inner: L(floors, { tone: 'faint' }) + L(rectOnY(y1, (x0 + x1) / 2 - 7, (x0 + x1) / 2 + 7, 3, 12), { tone: 'lo' }),
    }),
  );
  for (const w of WINDOWS) {
    const d =
      w.face === 'front'
        ? faceQuad(y1, w.a, w.a + 6, w.z, w.z + 6)
        : k.pathOf([at([x1, w.a, w.z]), at([x1, w.a - 7, w.z]), at([x1, w.a - 7, w.z + 6]), at([x1, w.a, w.z + 6])], true);
    out.push(`<path class="fx-pane" data-window="${w.col}" d="${d}"/>`);
  }
  out.push(D([[x0 + 3, y1, 6], [x1 - 3, y1, 6], [x1, y1 - 3, 6], [x1, y0 + 3, 6]], 0.45));
  // Parapet, the drop's junction box, a condenser with a fan, a mast.
  out.push(box(x0 - 2, y0 - 2, x1 + 2, y1 + 2, z, z + 3, {}, 1.2, 0.6));
  out.push(box(TAP.dock - 5, y0 + 2, TAP.dock + 5, y0 + 8, z + 3, z + 10, {}, 0.5, 0.3));
  const unit = plan(x0 + 8, y0 + 14, x0 + 40, y0 + 40, 1);
  const fins: string[] = [];
  for (let x = x0 + 11; x <= x0 + 37; x += 3) fins.push(k.segment([x, y0 + 40, z + 3], [x, y0 + 40, z + 11], P));
  out.push(S(k.slabOf(unit, z + 3, 8, P, 3, 0.5), { tone: 'mid', inner: L(fins.join(''), { tone: 'faint' }) }));
  const [fx, fy] = [x0 + 24, y0 + 27];
  out.push(post(fx, fy, 8, z + 11, z + 12.2, { tone: 'lo' }, 36));
  out.push(L(k.ring(fx, fy, 6.6, z + 12.2, P, 32), { tone: 'lo' }));
  out.push(L([0, 1, 2].map((i) => {
    const a = (i / 3) * TAU_ART + 0.4;
    return k.lineOnTop([fx + Math.cos(a) * 1.4, fy + Math.sin(a) * 1.4], [fx + Math.cos(a) * 6.6, fy + Math.sin(a) * 6.6], z + 12.2, P);
  }).join(''), { tone: 'faint' }));
  out.push(L(k.ring(fx, fy, 1.4, z + 12.2, P, 12), { tone: 'mid' }));
  out.push(post(x1 - 14, y1 - 16, 3, z + 3, z + 4.4, { tone: 'lo' }, 16));
  out.push(post(x1 - 14, y1 - 16, 0.9, z + 4.4, z + 26, { crease: 'none' }, 10));
  out.push(lamp('mast', x1 - 14, y1 - 16, z + 26, 1.8, 2.6));
  out.push(chimney(x1 - 10, y0 + 10, z + 3, 14, 'smoke-production'));
  out.push('<g data-part="smoke"></g>');
  return out.join('');
}

// Human Needed: a desk at the front of the floor. Escalations land in its
// tray; a console with two screens, a stamp for approvals, a stool, and an
// andon tower whose lamps say whether the line needs a human.
export const STAMP = { x: DESK.x1 - 7, y: DESK.y1 - 5 } as const;
export const ANDON = { x: DESK.x1 + 9, y: DESK.y0 + 3 } as const;
function desk() {
  const { x0, x1, y0, y1, top } = DESK;
  const out: string[] = [];
  const slab = plan(x0, y0, x1, y1, 1.2);
  out.push(`<path class="iso-halo" d="${k.haloOf(slab, 0, top, P)}"/>`);
  for (const { x, y } of byDepth(k.corners(slab, 3).map(([x, y]) => ({ x, y })))) {
    out.push(post(x, y, 2.4, 0, 1, { tone: 'lo' }, 16), post(x, y, 1.2, 1, top - 1.6, { crease: 'none' }, 12));
  }
  out.push(S(k.slabOf(slab, top - 1.6, 1.6, P, 3, 0.4), { tone: 'mid', inner: L(k.planOutline(k.insetPlan(slab, 2.5), top, P, 3), { tone: 'faint' }) }));
  // The console along the back edge, its two screens facing the stool.
  const face = y0 + 7;
  out.push(box(x0 + 4, y0 + 1, x1 - 4, face, top, top + 15, {}, 0.8, 0.4));
  const mid = (x0 + x1) / 2;
  out.push(`<g data-screen="desk">${terminalScreen(face, x0 + 7, mid - 2, top + 3, top + 13, 'desk-a', 3)}${windowScreen(face, mid + 2, x1 - 7, top + 3, top + 13, 'desk-b')}</g>`);
  // The tray where escalated PRs land.
  const tray = plan(DESK_TRAY.x - 10, DESK_TRAY.y - 8.5, DESK_TRAY.x + 10, DESK_TRAY.y + 8.5, 0.8);
  out.push(S(k.slabOf(tray, top, 1, P, 3, 0.3), { tone: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(tray, 1.5), top + 1, P, 3), { tone: 'faint' }));
  out.push('<g data-part="desk-items"></g>', '<g data-part="beams-desk"></g>');
  // The stamp: a post with a head the live model presses on approvals.
  out.push(post(STAMP.x, STAMP.y - 4, 2.4, top, top + 1, { tone: 'lo' }, 16), post(STAMP.x, STAMP.y - 4, 0.8, top + 1, top + 16, { crease: 'none' }, 10));
  out.push(box(STAMP.x - 1, STAMP.y - 4, STAMP.x + 1, STAMP.y, top + 14, top + 15.5, {}, 0.3));
  out.push('<g data-part="stamp"></g>');
  // The stool in front, where the human sits.
  const [sx, sy] = [mid + 4, y1 + 11];
  out.push(post(sx, sy, 4, 0, 1, { tone: 'lo' }, 20), post(sx, sy, 0.9, 1, 13, { crease: 'none' }, 10), post(sx, sy, 5.2, 13, 15, {}, 28, 0.5));
  // The andon tower: green when the line runs on its own, amber when it
  // waits for an approval, red when a human is needed.
  const { x: ax, y: ay } = ANDON;
  out.push(post(ax, ay, 3.4, 0, 1.4, { tone: 'lo' }, 18), post(ax, ay, 0.9, 1.4, 40, { crease: 'none' }, 10));
  for (const [name, z] of [['andon-green', 40], ['andon-amber', 44], ['andon-red', 48]] as const) out.push(lamp(name, ax, ay, z, 2.2, 3.4));
  out.push(post(ax, ay, 2.6, 52.6, 54, {}, 18, 0.3));
  return out.join('');
}

// usertold: an interview booth behind production with a microphone and a
// screen whose waveform moves while it listens to the users.
function usertold() {
  const { x0, x1, y0, y1, z } = USERTOLD;
  const out: string[] = [];
  out.push(box(x0 - 3, y0 - 2, x1 + 3, y1 + 3, 0, 2, { tone: 'lo' }, 0.8, 0.4));
  const body = plan(x0, y0, x1, y1, 1);
  out.push(S(k.slabOf(body, 2, z - 2, P, 3, 0.6), { tone: 'mid', inner: L(k.sideSeam(body, 8, P), { tone: 'faint' }) }));
  out.push(`<path class="fx-screen" d="${faceQuad(y1, x0 + 5, x1 - 5, 13, 29)}"/>`);
  out.push(`<path data-part="ut-wave" class="fx-wave" d=""/>`);
  out.push(engrave(x0 + 5, y1, 9.5, 'USERTOLD', 2.6));
  out.push(D([[x0 + 2.5, y1, 4], [x1 - 2.5, y1, 4], [x1, y1 - 2.5, 4], [x1, y0 + 2.5, 4]], 0.45));
  out.push(box(x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, z, z + 2.5, {}, 1, 0.5));
  const mx = (x0 + x1) / 2 - 6;
  const my = (y0 + y1) / 2 + 4;
  out.push(post(mx, my, 3, z + 2.5, z + 3.5, { tone: 'lo' }, 16));
  out.push(post(mx, my, 0.7, z + 3.5, z + 14, { crease: 'none' }, 10));
  out.push(post(mx, my, 2.4, z + 14, z + 19, { tone: 'hi', crease: 'lo' }, 22, 0.8));
  out.push(L(k.knurl(mx, my, 2.4, z + 14.6, z + 18.4, 20, P, 0.25), { tone: 'lo' }));
  out.push(lamp('listen', x1 - 5, y1 - 5, z + 2.5, 1.6, 2.4));
  out.push(feedbackTubeFront());
  return out.join('');
}

// The feedback tube: up out of usertold, back over production's roof, along
// the floor behind the lines on brackets from the bus posts, forward over
// the far line and down into the Linear hopper.
export const TUBE_PATH: Point3[] = [
  [TUBE.x, TUBE.outY, USERTOLD.z + 2.5],
  [TUBE.x, TUBE.outY, TUBE.z],
  [TUBE.x, TUBE.y, TUBE.z],
  [TUBE.inX, TUBE.y, TUBE.z],
  [TUBE.inX, TUBE.inY, TUBE.z],
  [TUBE.inX, TUBE.inY, TUBE.inZ],
];
// The first two legs are in front, drawn with usertold; the rest at the back.
export const TUBE_FRONT_LEGS = 2;
const TUBE_R = 1.6;
function tubeSeg(a: Point3, b: Point3) {
  const r = TUBE_R;
  const flat = a[2] === b[2];
  return box(Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.min(a[2], b[2]) - (flat ? r : 0), Math.max(a[2], b[2]) + (flat ? r : 0), { crease: 'none' }, 0.6);
}
const tubeJoint = (p: Point3) => box(p[0] - TUBE_R - 0.6, p[1] - TUBE_R - 0.6, p[0] + TUBE_R + 0.6, p[1] + TUBE_R + 0.6, p[2] - TUBE_R - 0.6, p[2] + TUBE_R + 0.6, {}, 0.6, 0.3);
function feedbackTube() {
  const out: string[] = [];
  for (const x of [60, 240, 420, 600, 780]) out.push(box(x - 1, (BUS.y0 + BUS.y1) / 2 + 2, x + 1, TUBE.y, TUBE.z - 1, TUBE.z + 1, { crease: 'none' }, 0.3));
  const p = TUBE_PATH;
  out.push(tubeSeg(p[2], p[3]), tubeSeg(p[3], p[4]), tubeJoint(p[2]), tubeJoint(p[3]));
  out.push('<g data-part="capsules-back"></g>');
  out.push(tubeSeg(p[4], p[5]), tubeJoint(p[4]));
  return out.join('');
}
function feedbackTubeFront() {
  const p = TUBE_PATH;
  return [tubeSeg(p[1], p[2]), tubeSeg(p[0], p[1]), '<g data-part="capsules-front"></g>', tubeJoint(p[1])].join('');
}


// GitHub: a hub cabinet at the end of the bus, with a column of port lights.
export const HUB = { x0: BUS.x1, x1: BUS.x1 + 28, y0: -178, y1: -146, z: 152 } as const;
function hub() {
  const { x0, x1, y0, y1, z } = HUB;
  const out: string[] = [];
  out.push(box(x0 - 2, y0 - 2, x1 + 2, y1 + 2, 0, 2, { tone: 'lo' }, 0.8, 0.4));
  const body = plan(x0, y0, x1, y1, 1.2);
  const vents: string[] = [];
  for (let z0 = 112; z0 <= 132; z0 += 4) vents.push(k.segment([x1, y0 + 8, z0], [x1, y1 - 8, z0], P));
  out.push(
    S(k.slabOf(body, 2, z - 6, P, 3, 0.8), {
      tone: 'mid',
      inner:
        L(rectOnY(y1, x0 + 4, x1 - 4, 10, 100), { tone: 'lo' }) +
        L(rectOnX(x1, y0 + 6, y1 - 6, 108, 136), { tone: 'lo' }) +
        L(vents.join(''), { tone: 'faint' }) +
        L(k.sideSeam(body, 104, P), { tone: 'faint' }),
    }),
  );
  out.push(box(x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5, z - 4, z, {}, 1, 0.5));
  const leds: Point3[] = [];
  for (let row = 0; row < 8; row++) for (const dx of [9, 14, 19]) leds.push([x0 + dx, y1, 90 - row * 5]);
  out.push(k.dotsSvg(leds.map((point) => at(point)), { size: 0.6, tone: 'hi', pulse: true }));
  return out.join('');
}

export const FIGURE_LABEL =
  'An isometric software factory with three agent lines. patchrelay takes issues from a Linear hopper; Claude Code and Codex take theirs from session consoles. patchrelay and Claude Code each work with a SCARA arm that swings over the issue on the belt; Codex works with a small stamping press. Each has a small screen pod beside it. Pull requests from all three pass under one review-quill portal: approved ones ride on, rejected ones go up a lift onto an upper return belt and come back down a second lift just ahead of their own machine. A square collector at the end carries PRs from the outer lines across onto the middle one. A gate on it opens for each PR that is approved and green on its own branch, without a wait; a red one is teleported back. A crane sets each admitted PR on top of a stack standing on main: the bottom one sits on main and each one above is built on the one below. Behind it, a CI hall has a test drum per level, wired to it: every drum spins at once while the CI of its candidate runs, its dial filling, and its lamp turns green. The bottom PR leaves for main the moment it is green, and the ones above, often green already, drop down and follow. A candidate that conflicts with the ones below floats askew above its place, and the crane holds the next PR until it is fixed. A candidate that conflicts or goes red is repaired in place: a torch on a slide beside the stack fixes it on its candidate ref, a lamp blinks for the narrow integration review, and it tests again with the ones above it. At the front of the floor stands a Human Needed desk with a stool, a stamp and an andon tower: a PR that has spent its review_fix or ci_repair budget is teleported into its tray and the tower turns red until the human sends it back to its line; a PR touching wrangler, auth, migrations or dependencies carries a warning stripe and waits at the gate, the tower amber, until the human stamps it. Main deploys to a small stage booth and to production, a building whose windows are its users, at the same time; each puffs smoke from its chimney for its smoke test and then lights a green lamp. In front of production, usertold listens to the users and sends what it hears back in a capsule, up over the roof and along a tube at the back of the floor, into the Linear hopper. An overhead GitHub bus runs from a hub cabinet and carries the signals, and on a front bench a reading head replays the evals case by case.';

let cached: string | null = null;

export function factorySvg() {
  if (cached) return cached;
  const body = [
    // Gradients for the teleport light: a glow that fades upward, a bright core.
    '<defs><linearGradient id="fx-tp-glow" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="fx-tp-a"/><stop offset="0.55" class="fx-tp-b"/><stop offset="1" class="fx-tp-c"/></linearGradient><linearGradient id="fx-tp-core" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="fx-tp-core-a"/><stop offset="1" class="fx-tp-core-b"/></linearGradient></defs>',
    floor(),
    feedbackTube(),
    bus(),
    hub(),
    portalBack(),
    lane(0),
    ciHall(),
    lane(1),
    lane(2),
    portalFront(),
    desk(),
    booth(),
    production(),
    usertold(),
    `<g transform="${k.translateAlong(P, [BENCH_SHIFT[0], BENCH_SHIFT[1], 0])}">${evalBench()}</g>`,
  ];
  // A group, not an image: the items inside are buttons you can follow.
  cached = k.figureSvg({ width: WIDTH, height: HEIGHT, label: FIGURE_LABEL, body, className: 'fx-svg' }).replace('role="img"', 'role="group"');
  return cached;
}
