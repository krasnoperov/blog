import * as k from './iso-kit';
import type { Plan, SolidPaths } from './iso-kit';
import {
  BELT_Z,
  BOX_H,
  BUS,
  CARD_H,
  EVAL_DIAL,
  CRANE,
  ENTRY_X,
  GATE_X,
  GONE_X,
  CI_HALL,
  REPAIR,
  USERTOLD,
  ciX,
  STACK_MAX,
  STACK_X,
  HOIST_X,
  JOIN_X,
  LANES,
  P,
  PORTAL,
  UPPER_Z,
  REVIEW_X,
  TAP,
  TRUNK_Y,
  at,
  depth,
  dropX,
} from './layout';
import type { LaneIndex } from './layout';
import { ARM_BASE, CHIMNEYS, CI_DIAL, GATE_SPAN, STAGE_DIAL, TUBE_FRONT_LEGS, TUBE_PATH, WINDOWS, levelZ } from './art';

// The moving half of the figure. One small discrete model runs the line:
// issues spawn at each agent's intake, move on belts that accumulate (an
// item never closes within GAP of the one ahead), and dwell at machines. The
// three lanes run independently and meet at review-quill and the collector.

const SVG_NS = 'http://www.w3.org/2000/svg';
const HALF_BELT = 11;
const SPEED = 46;
const GAP = 27;
const TAU = Math.PI * 2;

export const AGENTS = [
  { key: 'patchrelay', label: 'patchrelay → Codex' },
  { key: 'claude', label: 'Claude Code' },
  { key: 'codex', label: 'Codex' },
] as const;

// How many review rounds each PR takes, and how long its candidate's CI
// runs. Patterns, so the line repeats.
const ROUNDS_OF = [1, 2, 1, 1, 1, 3, 1, 1, 1, 1];
const CI_OF = [4.2, 6.8, 3.4, 5.6, 7.4, 3.9, 5.1];
const SPAWN_EVERY = [4.4, 5.2, 6.0];
// Some PRs fail CI on their own branch and are turned back at the gate;
// some go red in the queue, built on the PRs ahead of them.
const FAILS_ENTRY = (id: number) => id % 13 === 4;
const FAILS_IN_QUEUE = (id: number) => id % 11 === 3;
// CI on the PR's own branch starts when the PR is opened and runs while it
// is reviewed, so it is usually green by the time it reaches the gate.
const BRANCH_CI = 3.0;
// CI on a stacked candidate: each PR's own pattern, scaled.
const QUEUE_CI = 0.9;
const TRAVEL_Z = levelZ(STACK_MAX) + 10;
// A candidate that goes red is repaired in place on its candidate ref, then
// passes a narrow integration review, then tests again.
const FIX_TIME = 1.2;
const INTEGRATION_TIME = 0.7;
// Feedback capsules ride the tube at this speed, no more often than this.
const CAPSULE_SPEED = 200;
const CAPSULE_EVERY = 5;
// A deploy's smoke tests take this long; then it is Done, and the next one
// may start.
const SMOKE_DONE = 0.9;
type Path = 'drop' | 'belt' | 'liftUp' | 'upper' | 'liftDown' | 'cross' | 'trunk' | 'queue' | 'crane' | 'stack' | 'teleport' | 'deploy' | 'gone';
type Stage = 'new' | 'fixing' | 'built' | 'changes' | 'approved' | 'merged';

interface Item {
  id: number;
  name: string;
  lane: LaneIndex;
  path: Path;
  stage: Stage;
  rounds: number;
  reviews: number;
  x: number;
  y: number;
  z: number;
  t: number;
  s: number;
  morph: number;
  // The merge: CI on the PR's own branch, a red PR's countdown, a candidate
  // draining its CI to test again, and the teleport fade.
  pre: number;
  level: number;
  red: number;
  retest: boolean;
  retried: boolean;
  fade: number;
  beamFrom: [number, number, number] | null;
  ci: number;
  // Integration repair on the candidate: seconds into it, or -1.
  fix: number;
  // An issue that came from what users told usertold.
  fromUsers: boolean;
  ciNeed: number;
  flag: boolean;
  el: SVGGElement;
  card: SVGGElement;
  box: SVGGElement;
  ciDot: SVGElement;
  done: boolean;
}

const plan = (x0: number, y0: number, x1: number, y1: number, r = 0.8): Plan => ({ x: x0, y: y0, w: x1 - x0, d: y1 - y0, r });
const S = (paths: SolidPaths, style: Parameters<typeof k.solidSvg>[1] = {}) => k.solidSvg(paths, style);
const box = (x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, style: Parameters<typeof k.solidSvg>[1] = {}, r = 0.8, bevel = 0) =>
  S(k.slabOf(plan(x0, y0, x1, y1, r), z0, z1 - z0, P, 3, bevel), { tone: 'mid', ...style });
const cyl = (cx: number, cy: number, r: number, z0: number, z1: number, style: Parameters<typeof k.solidSvg>[1] = {}, steps = 20, bevel = 0) =>
  S(k.cylinder(cx, cy, r, z0, z1 - z0, P, steps, bevel), { tone: 'mid', ...style });
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

function cardSvg() {
  return [
    box(-8, -6, 8, 6, 0, CARD_H, { tone: 'hi' }, 1, 0.3),
    k.lineSvg(k.lineOnTop([-5.5, -2.4], [3.5, -2.4], CARD_H, P), { tone: 'lo', free: true }),
    k.lineSvg(k.lineOnTop([-5.5, 0.6], [0.5, 0.6], CARD_H, P), { tone: 'lo', free: true }),
    k.dotsSvg([at([5, 3, CARD_H])], { size: 0.7, tone: 'mid' }),
    usersMark(-4.4, 3.2, CARD_H),
  ].join('');
}

// The stamp on an issue that came from what users told usertold: a small
// microphone ring, shown only on those issues.
function usersMark(x: number, y: number, z: number) {
  return `<g class="fx-users">${k.lineSvg(k.ring(x, y, 1.5, z, P, 16), { tone: 'hi' })}${k.dotsSvg([at([x, y, z])], { size: 0.6, tone: 'hi' })}</g>`;
}

function boxSvg() {
  const body = plan(-8, -7, 8, 7, 1.2);
  const [cx, cy] = at([4.2, 3.6, BOX_H]);
  return [
    S(k.slabOf(body, 0, BOX_H, P, 3, 0.5), { tone: 'hi', inner: k.lineSvg(k.sideSeam(body, 7.4, P, 3), { tone: 'faint' }) }),
    k.lineSvg(k.lineOnTop([-8, 0], [8, 0], BOX_H, P), { tone: 'faint' }),
    `<ellipse data-ci class="fx-ci" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="1.5" ry="0.8"/>`,
    usersMark(-4.2, 3.6, BOX_H),
    `<g data-k="flag">${cyl(-5, -4, 0.5, BOX_H, BOX_H + 9, { crease: 'none' }, 8)}${box(-4.6, -4.4, 1.6, -3.6, BOX_H + 5, BOX_H + 9, { className: 'fx-flag' }, 0.2)}</g>`,
  ].join('');
}

function needleD(dial: { x: number; y: number; r: number; top: number }, turn: number) {
  const a = turn * TAU;
  return k.lineOnTop([dial.x - Math.sin(a) * 1.4, dial.y + Math.cos(a) * 1.4], [dial.x + Math.sin(a) * (dial.r - 2.2), dial.y - Math.cos(a) * (dial.r - 2.2)], dial.top + 0.2, P);
}

// Ribs on a turning drum: vertical lines round its side, drawn only on the
// half that faces the viewer and fading toward the silhouette.
const VIEW = k.towardViewer(P);
function ribsSvg(x: number, y: number, r: number, phase: number) {
  const faded: Array<[string, number]> = [];
  for (let i = 0; i < 14; i++) {
    const a = phase + (i / 14) * TAU;
    const facing = Math.cos(a) * VIEW[0] + Math.sin(a) * VIEW[1];
    if (facing < 0.15) continue;
    faded.push([k.segment([x + Math.cos(a) * r, y + Math.sin(a) * r, 7.4], [x + Math.cos(a) * r, y + Math.sin(a) * r, 20.2], P), Math.min(1, (facing - 0.15) * 3)]);
  }
  return k.fadedSvg(faded, { tone: 'lo' });
}

function probeSvg(y: number, tip: number) {
  return cyl(REVIEW_X, y, 0.9, tip + 2.4, PORTAL.z0, { crease: 'none' }, 12) + cyl(REVIEW_X, y, 2, tip, tip + 2.4, { tone: 'hi' }, 16);
}

function ramSvg(x: number, y: number, bottom: number) {
  return cyl(x, y, 2.4, bottom + 6, 66, { crease: 'none' }, 14) + box(x - 9, y - 9, x + 9, y + 9, bottom, bottom + 6, { tone: 'mid' }, 1, 0.5);
}

// A teleport: a column of light with a bright core on a glowing pad, thin
// rays streaming up, rings sweeping up the column and sparks rising.
const TP_HEIGHT = 110;
function teleportSvg(x: number, y: number, z: number, env: number, time: number, seed: number) {
  const face = y + 8;
  const quad = (x0: number, x1: number, z0: number, z1: number) => k.pathOf([at([x0, face, z0]), at([x1, face, z0]), at([x1, face, z1]), at([x0, face, z1])], true);
  const out: string[] = [];
  out.push(`<path class="fx-tp-pad" style="opacity:${(0.9 * env).toFixed(2)}" d="${k.ring(x, y, 14, z, P, 32)}${k.ring(x, y, 10, z, P, 28)}"/>`);
  out.push(`<path fill="url(#fx-tp-glow)" style="opacity:${env.toFixed(2)}" d="${quad(x - 10, x + 10, z, z + TP_HEIGHT)}"/>`);
  out.push(`<path fill="url(#fx-tp-core)" style="opacity:${(0.85 * env).toFixed(2)}" d="${quad(x - 2.2, x + 2.2, z, z + TP_HEIGHT * 0.85)}"/>`);
  const rays = [-8, -5.5, -3, -0.8, 1.6, 4, 6.4, 8.4];
  rays.forEach((dx, index) => {
    const top = z + TP_HEIGHT * (0.55 + 0.45 * ((index * 37 + seed * 13) % 10) / 10);
    // The markup is rebuilt each frame, so the streaming comes from the
    // clock, not from a CSS animation that would restart every frame.
    const offset = -((time * 46 + index * 3.5) % 14);
    out.push(`<path class="fx-tp-ray" style="opacity:${env.toFixed(2)};stroke-dashoffset:${offset.toFixed(2)};stroke-width:${index % 3 === 0 ? 1.1 : 0.6}px" d="${k.segment([x + dx, face, z], [x + dx, face, top], P)}"/>`);
  });
  for (let index = 0; index < 3; index++) {
    const rise = ((time * 70 + index * 30) % (TP_HEIGHT * 0.75));
    const fade = env * (1 - rise / (TP_HEIGHT * 0.75));
    out.push(`<path class="fx-tp-ring" style="opacity:${fade.toFixed(2)}" d="${k.ring(x, y, 12 - index * 1.5, z + 4 + rise, P, 28)}"/>`);
  }
  const sparks: string[] = [];
  for (let index = 0; index < 12; index++) {
    const r1 = ((seed * 7 + index * 53) % 97) / 97;
    const r2 = ((seed * 11 + index * 31) % 89) / 89;
    const rise = ((time * (40 + r1 * 40) + index * 9) % 90);
    const [sx, sy] = at([x - 9 + r1 * 18, y - 7 + r2 * 14, z + rise]);
    sparks.push(`<circle class="fx-tp-spark" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(0.5 + r2 * 0.6).toFixed(2)}" style="opacity:${(env * (1 - rise / 90)).toFixed(2)}"/>`);
  }
  out.push(sparks.join(''));
  return `<g class="fx-tp">${out.join('')}</g>`;
}

// The crane's trolley on its beam, the hoist and a gripper.
function craneSvg(x: number, hook: number) {
  const y = TRUNK_Y;
  const trolley = box(x - 8, y - 6, x + 8, y + 6, CRANE.z + 4, CRANE.z + 10, {}, 0.8, 0.4);
  const rope = k.lineSvg(k.segment([x - 3, y, CRANE.z + 4], [x - 3, y, hook + 3], P) + k.segment([x + 3, y, CRANE.z + 4], [x + 3, y, hook + 3], P), { tone: 'mid' });
  const head = box(x - 9, y - 9, x + 9, y + 9, hook + 1, hook + 3.5, { tone: 'mid' }, 0.8, 0.3);
  const jaws = box(x - 9, y + 8, x + 9, y + 9.5, hook - 5, hook + 1, { tone: 'lo' }, 0.2);
  return rope + head + trolley + jaws;
}

// The SCARA arms: two horizontal links on a column, a wrist with a quill,
// and each agent's tool. Positions come from two-link inverse kinematics.
const ARM_L1 = 16;
const ARM_L2 = 14;
const SHOULDER_Z = 48;
// A link: a capsule between two joints, extruded flat.
function bar(a: [number, number], b: [number, number], width: number, z0: number, z1: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: [number, number] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const n: [number, number] = [-u[1], u[0]];
  const r = width / 2;
  const ring: Array<[number, number]> = [];
  const cap = (c: [number, number], from: number) => {
    for (let i = 0; i <= 6; i++) {
      const t = from + (i / 6) * Math.PI;
      ring.push([c[0] + r * (Math.cos(t) * u[0] + Math.sin(t) * n[0]), c[1] + r * (Math.cos(t) * u[1] + Math.sin(t) * n[1])]);
    }
  };
  cap(b, -Math.PI / 2);
  cap(a, Math.PI / 2);
  return S(k.extrude(ring, z0, z1 - z0, P, { bevel: 0.3 }), { tone: 'mid' });
}

function armSvg(lane: LaneIndex, tool: [number, number], quill: number) {
  const { machine, y } = LANES[lane];
  const [bx, by] = ARM_BASE(machine, y);
  let dx = tool[0] - bx;
  let dy = tool[1] - by;
  let d = Math.hypot(dx, dy);
  const reach = ARM_L1 + ARM_L2 - 0.5;
  if (d > reach) {
    dx *= reach / d;
    dy *= reach / d;
    d = reach;
  }
  const c2 = Math.max(-1, Math.min(1, (d * d - ARM_L1 * ARM_L1 - ARM_L2 * ARM_L2) / (2 * ARM_L1 * ARM_L2)));
  const t2 = -Math.acos(c2);
  const t1 = Math.atan2(dy, dx) - Math.atan2(ARM_L2 * Math.sin(t2), ARM_L1 + ARM_L2 * Math.cos(t2));
  const elbow: [number, number] = [bx + ARM_L1 * Math.cos(t1), by + ARM_L1 * Math.sin(t1)];
  const wrist: [number, number] = [elbow[0] + ARM_L2 * Math.cos(t1 + t2), elbow[1] + ARM_L2 * Math.sin(t1 + t2)];
  const toolTop = quill + 5;
  const toolBody =
    lane === 0
      ? S(k.extrude(Array.from({ length: 6 }, (_, i) => [wrist[0] + Math.cos((i * Math.PI) / 3) * 3.6, wrist[1] + Math.sin((i * Math.PI) / 3) * 3.6] as [number, number]), quill, 5, P, { bevel: 0.3 }), { tone: 'mid', className: 'fx-tool' })
      : cyl(wrist[0], wrist[1], 3.4, quill, toolTop, { className: 'fx-tool', inner: `<path class="fx-claude-ring" d="${k.sideArc(wrist[0], wrist[1], 3.4, quill + 2.5, P, 16)}"/>` }, 22, 0.3);
  return [
    bar([bx, by], elbow, 7, SHOULDER_Z, SHOULDER_Z + 3.5),
    cyl(bx, by, 4.4, SHOULDER_Z + 3.5, SHOULDER_Z + 6, {}, 24, 0.4),
    cyl(wrist[0], wrist[1], 1.3, toolTop, SHOULDER_Z + 3.5, { crease: 'none' }, 12),
    toolBody,
    cyl(elbow[0], elbow[1], 3.6, SHOULDER_Z - 0.5, SHOULDER_Z + 7, {}, 22, 0.4),
    bar(elbow, wrist, 5.6, SHOULDER_Z + 3.5, SHOULDER_Z + 7),
    cyl(wrist[0], wrist[1], 3.2, SHOULDER_Z + 3, SHOULDER_Z + 8.5, {}, 22, 0.4),
  ].join('');
}

// A lift platform: a deck with guide shoes reaching to the posts.
function platformSvg(x: number, y: number, z: number) {
  // A deck and a carriage that rides the mast behind the belt.
  const carriage = box(x - 5, y - HALF_BELT - 9, x + 5, y - 10, z - 6, z, { tone: 'lo' }, 0.3);
  return carriage + box(x - 10, y - 10, x + 10, y + 10, z - 2, z, { tone: 'mid' }, 0.6, 0.3);
}

export interface FactoryHandles {
  stage: HTMLElement;
  readout: HTMLElement | null;
  stats: HTMLElement | null;
}

export function startFactory({ stage, readout, stats }: FactoryHandles) {
  const svg = stage.querySelector('svg');
  if (!svg) return () => undefined;
  const part = (name: string) => svg.querySelector(`[data-part="${name}"]`) as SVGGElement;
  const lamp = (name: string) => svg.querySelector(`[data-lamp="${name}"]`) as SVGGElement | null;
  const laneItems = [part('items-0'), part('items-1'), part('items-2')];
  const gaps = [part('gap-1'), part('gap-2')];
  const intakes = [part('intake-0'), part('intake-1'), part('intake-2')];
  const probes = [part('probe-0'), part('probe-1'), part('probe-2')];
  const needles = [part('needle-0'), part('needle-1'), part('needle-2')];
  const liftEls = [part('lift-0'), part('lift-1'), part('lift-2')];
  const upperEls = [part('upper-0'), part('upper-1'), part('upper-2')];
  const slats = [part('belt-0'), part('belt-1'), part('belt-2'), part('belt-t')];
  const upperSlats = [part('ubelt-0'), part('ubelt-1'), part('ubelt-2')];
  const ramEl = part('ram');
  const armEls = [part('arm-0'), part('arm-1')];
  // Where each arm's tool is, where its quill bottom sits, and a timer for
  // the work motion. At rest the arm folds back toward its column.
  const armRest = (lane: LaneIndex): [number, number] => {
    const [bx, by] = ARM_BASE(LANES[lane].machine, LANES[lane].y);
    return [bx - 9, by + 9];
  };
  const arms = [0, 1].map((lane) => ({ tool: armRest(lane as LaneIndex), quill: SHOULDER_Z - 12, t: 0, key: '' }));
  const screens = [0, 1, 2].map((lane) => svg.querySelector(`[data-screen="m${lane}"]`));
  const linksEl = part('links');
  const pulsesEl = part('pulses');
  const evalNeedleEl = part('eval-needle');
  // The eval reader is drawn once over the first case and slid along.
  const CASE0 = 212.9;
  const evalHead = part('eval-head');
  evalHead.innerHTML =
    box(CASE0 - 3, 40.5, CASE0 + 3, 47.5, 43, 48.5, {}, 0.5, 0.3) +
    cyl(CASE0, 44, 0.6, 35.2, 43, { crease: 'none' }, 10) +
    cyl(CASE0, 44, 1.2, 34, 35.2, { tone: 'hi' }, 12);
  let headX = 0;
  // The queue's gauges, the gate's bar, and deploy: the stage booth's window
  // and dial, production's windows.
  // The CI hall: a drum per level of the stack, its dial, its spin.
  const drums = Array.from({ length: STACK_MAX }, (_, level) => ({
    ribs: part(`ci-ribs-${level}`),
    needle: part(`ci-needle-${level}`),
    level: 0,
    state: 'none',
    spin: 0,
    phase: 0,
    key: '',
  }));
  const gateBar = part('gate-bar');
  let gateOpen = 0;
  let gateKey = '';
  const stageNeedle = part('stage-needle');
  const repairEl = part('repair');
  const smokeEl = part('smoke');
  const waveEl = part('ut-wave');
  const capsulesFront = part('capsules-front');
  const capsulesBack = part('capsules-back');
  const CAPSULE = box(-2.6, -2.6, 2.6, 2.6, -2.6, 2.6, { tone: 'hi' }, 0.8, 0.4);
  const stagePane = svg.querySelector('[data-window="stage"]');
  const panes = WINDOWS.map((w) => ({ col: w.col, el: svg.querySelectorAll(`[data-window="${w.col}"]`) }));
  const cases = Array.from(svg.querySelectorAll<SVGGElement>('[data-case]'));
  const pegs = Array.from(svg.querySelectorAll<SVGGElement>('[data-peg]'));
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CARD = cardSvg();
  const BOX = boxSvg();

  const beams = part('beams');
  const stackEl = part('stack');
  const craneEl = part('crane');
  const craneRig = document.createElementNS(SVG_NS, 'g');
  const craneCargo = document.createElementNS(SVG_NS, 'g');
  craneEl.appendChild(craneRig);
  craneEl.appendChild(craneCargo);
  const stack: Item[] = [];
  const crane = { x: ENTRY_X as number, hook: CRANE.z - 8, item: null as Item | null, phase: 'idle', t: 0, key: '', target: 0 };

  // Two lifts per lane: one past review that raises a rejected PR to the
  // upper return belt, one ahead of the machine that sets it back down.
  const lifts = LANES.map((_, lane) => {
    const make = (x: number, z: number) => {
      const deck = document.createElementNS(SVG_NS, 'g');
      const cargo = document.createElementNS(SVG_NS, 'g');
      liftEls[lane].appendChild(deck);
      liftEls[lane].appendChild(cargo);
      return { x, z, rest: z, deck, cargo, key: '', item: null as Item | null };
    };
    // Paint the nearer (larger x) lift last.
    const down = make(dropX(lane as LaneIndex), UPPER_Z);
    const up = make(HOIST_X, BELT_Z);
    return { up, down };
  });

  const items: Item[] = [];
  let serial = 0;
  let clock = 0;
  const spawnWait = [0, 1.4, 2.6];
  let tracked: Item | null = null;
  let trackWait = 0;
  let merged = 0;
  let deployed = 0;
  let reviewsDone = 0;
  let returned = 0;
  let beacon = 99;
  let repaired = 0;
  // The repair carriage's height, and usertold: how long it still listens,
  // when it last sent a capsule, the capsules in the tube.
  let repairZ = levelZ(STACK_MAX);
  let repairKey = '';
  let listenLeft = 0;
  let sinceCapsule = CAPSULE_EVERY;
  let fromUsersWaiting = 0;
  const takeFromUsers = () => (fromUsersWaiting > 0 ? (fromUsersWaiting--, true) : false);
  const capsules: Array<{ d: number; el: SVGGElement }> = [];
  const tubeLengths = TUBE_PATH.slice(1).map((point, i) => Math.hypot(point[0] - TUBE_PATH[i][0], point[1] - TUBE_PATH[i][1], point[2] - TUBE_PATH[i][2]));
  const tubeLength = tubeLengths.reduce((a, b) => a + b, 0);
  const alongTube = (d: number): [number, number, number] => {
    let left = d;
    for (let i = 0; i < tubeLengths.length; i++) {
      if (left <= tubeLengths[i]) {
        const t = left / tubeLengths[i];
        const [a, b] = [TUBE_PATH[i], TUBE_PATH[i + 1]];
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      }
      left -= tubeLengths[i];
    }
    return TUBE_PATH[TUBE_PATH.length - 1] as [number, number, number];
  };
  const probeTip = [44, 44, 44];
  const dialTurn = [0, 0, 0];
  const dialTarget = [0, 0, 0];
  const verdict: Array<{ kind: 'approve' | 'changes'; t: number } | null> = [null, null, null];
  let ramBottom = 52;
  const pulses: Array<{ from: number; to: number; t: number; el: SVGCircleElement }> = [];
  const keys = { probe: ['', '', ''], ram: '' };
  let lastText = '';
  let lastStats = '';

  const onBelt = (item: Item) => item.path === 'belt' || item.path === 'trunk' || item.path === 'queue';
  const onTrunk = (item: Item) => item.path === 'trunk' || item.path === 'queue';
  // The junction: the cell where the collector meets the middle line. One
  // PR in it at a time; everyone else simply queues on their own belt.
  const inJunction = (item: Item) =>
    (item.path === 'cross' && Math.abs(item.y - TRUNK_Y) < GAP) ||
    (item.path === 'belt' && item.lane === 1 && item.x > JOIN_X - GAP) ||
    (item.path === 'trunk' && item.x < JOIN_X + GAP);
  const junctionBusy = (except: Item) => items.some((other) => other !== except && inJunction(other));

  const ahead = (item: Item) => {
    let best: Item | null = null;
    for (const other of items) {
      if (other === item || other.done || !onBelt(other)) continue;
      const sameStretch = onTrunk(item) ? onTrunk(other) : (other.lane === item.lane && other.path === 'belt') || (item.lane === 1 && onTrunk(other));
      if (!sameStretch) continue;
      if (other.x > item.x && (!best || other.x < best.x)) best = other;
    }
    return best;
  };

  function pulse(from: number, to: number) {
    if (still.matches) return;
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('class', 'fx-pulse');
    el.setAttribute('r', '1.6');
    pulsesEl.appendChild(el);
    pulses.push({ from, to, t: 0, el });
  }

  function spawn(lane: LaneIndex) {
    const id = serial++;
    const name = lane === 0 ? `USE-${1640 + id * 3}` : lane === 1 ? `FX-${360 + id}` : `USE-${1641 + id * 3}`;
    const el = document.createElementNS(SVG_NS, 'g');
    el.setAttribute('class', 'fx-item');
    el.innerHTML = `<g data-k="card">${CARD}</g><g data-k="box" style="display:none">${BOX}</g>`;
    const item: Item = {
      id,
      name,
      lane,
      path: 'drop',
      stage: 'new',
      rounds: ROUNDS_OF[id % ROUNDS_OF.length],
      reviews: 0,
      x: LANES[lane].intake,
      y: LANES[lane].y,
      z: BELT_Z + 12,
      t: 0,
      s: 0,
      morph: 0,
      pre: 0,
      level: -1,
      red: -1,
      retest: false,
      retried: false,
      fade: 1,
      beamFrom: null,
      ci: 0,
      fix: -1,
      fromUsers: lane === 0 && takeFromUsers(),
      ciNeed: CI_OF[id % CI_OF.length],
      flag: false,
      el,
      card: el.querySelector('[data-k="card"]') as SVGGElement,
      box: el.querySelector('[data-k="box"]') as SVGGElement,
      ciDot: el.querySelector('[data-ci]') as SVGElement,
      done: false,
    };
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `Follow ${name}${item.fromUsers ? ', from what users told usertold' : ''}`);
    el.toggleAttribute('data-users', item.fromUsers);
    el.addEventListener('click', () => follow(item));
    el.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      follow(item);
    });
    intakes[lane].appendChild(el);
    items.push(item);
    if (!tracked) follow(item);
  }

  function follow(item: Item) {
    if (tracked) tracked.el.querySelectorAll('.iso-solid').forEach((solid) => solid.removeAttribute('data-lit'));
    tracked = item;
    item.el.querySelectorAll('.iso-solid').forEach((solid) => solid.setAttribute('data-lit', ''));
    trackWait = 0;
    render();
  }

  function finish(item: Item) {
    item.done = true;
    item.path = 'gone';
    item.el.remove();
    items.splice(items.indexOf(item), 1);
  }

  function stopFor(item: Item): number {
    if (item.path === 'trunk') return GATE_X - 10;
    if (item.path === 'queue') return item.stage === 'merged' ? GONE_X + 40 : ENTRY_X;
    switch (item.stage) {
      case 'new':
      case 'fixing':
        return LANES[item.lane].machine;
      case 'built':
        return REVIEW_X;
      case 'changes':
        return HOIST_X;
      default:
        return JOIN_X;
    }
  }


  // Station work. Returns true while the item must stay put.
  function work(item: Item, dt: number): boolean {
    item.t += dt;
    const t = item.t;
    const lane = item.lane;
    if (item.path === 'belt' && (item.stage === 'new' || item.stage === 'fixing')) {
      const length = item.stage === 'fixing' ? 1.8 : 2.8;
      if (item.stage === 'new') item.morph = ease((t - length * 0.3) / (length * 0.4));
      if (t < length) return true;
      item.morph = 1;
      item.flag = false;
      item.stage = 'built';
      item.t = 0;
      pulse(TAP[LANES[lane].key], TAP.review);
      return false;
    }
    if (item.path === 'belt' && item.stage === 'built') {
      const down = ease(t / 0.4);
      const up = ease((t - 1.6) / 0.4);
      probeTip[lane] = 44 - (44 - (BELT_Z + BOX_H)) * (down - up);
      const passing = item.reviews + 1 >= item.rounds;
      dialTarget[lane] = t < 0.4 ? 0 : t < 1.4 ? 0.12 + 0.06 * Math.sin(t * 9) + 0.1 * (t - 0.4) : passing ? 0.86 : 0.34;
      if (t < 2.0) return true;
      item.reviews += 1;
      reviewsDone += 1;
      item.stage = passing ? 'approved' : 'changes';
      item.flag = !passing;
      // Changes requested: the fix is a new revision, so its branch CI starts
      // over, and a failure on the old one counts as the one this PR had.
      if (!passing) {
        if (item.red >= 0) item.retried = true;
        item.red = -1;
        item.pre = 0;
      }
      verdict[lane] = { kind: passing ? 'approve' : 'changes', t: 0 };
      dialTarget[lane] = 0;
      item.t = 0;
      pulse(TAP.review, passing ? TAP.queue : TAP[LANES[lane].key]);
      return false;
    }
    if (item.path === 'belt' && item.stage === 'changes') {
      const lift = lifts[lane].up;
      if (lift.item || Math.abs(lift.z - BELT_Z) > 0.5) return true;
      // Don't raise a PR into the spot where a teleported one is landing.
      if (items.some((other) => other.lane === lane && other.path === 'teleport' && other.beamFrom === null)) return true;
      lift.item = item;
      item.path = 'liftUp';
      item.t = 0;
      returned += 1;
      return true;
    }
    if (item.path === 'belt' && item.stage === 'approved') {
      if (lane !== 1) {
        // At the end of an outer line: step onto the collector once the PR
        // ahead on it has moved on.
        if (items.some((other) => other.lane === lane && other.path === 'cross' && Math.abs(other.y - LANES[lane].y) < GAP)) return true;
        item.path = 'cross';
        item.t = 0;
        return true;
      }
      item.path = 'trunk';
      item.t = 0;
      return false;
    }
    // At the gate: wait for CI on the branch; admission is in runMerge.
    if (item.path === 'trunk') return true;
    // On the pad: the crane takes the PR as soon as it is free and the stack
    // has room.
    if (item.path === 'queue' && item.stage === 'approved') {
      if (crane.item || crane.phase !== 'idle' || stack.length >= STACK_MAX) return true;
      crane.item = item;
      crane.phase = 'grab';
      crane.t = 0;
      item.path = 'crane';
      return true;
    }
    return false;
  }

  function runLifts(dt: number) {
    lifts.forEach(({ up, down }, index) => {
      const lane = index as LaneIndex;
      // Up: raise the PR to the upper belt, hand it over, come back down.
      if (up.item) {
        const item = up.item;
        item.t += dt;
        item.z = BELT_Z + (UPPER_Z - BELT_Z) * ease(item.t / 1.1);
        up.z = item.z;
        if (item.t >= 1.1) {
          item.z = UPPER_Z;
          item.path = 'upper';
          item.t = 0;
          up.item = null;
        }
      } else up.z += (BELT_Z - up.z) * (1 - Math.exp(-dt / 0.25));
      // Down: wait at the top; take the PR at the end of the upper belt and
      // lower it once the belt below is clear.
      if (down.item) {
        const item = down.item;
        if (item.t < 0) {
          const clear = !items.some((other) => other.lane === lane && other.path === 'belt' && Math.abs(other.x - item.x) < GAP);
          if (clear) item.t = 0;
        } else {
          item.t += dt;
          item.z = UPPER_Z + (BELT_Z - UPPER_Z) * ease(item.t / 1.1);
          down.z = item.z;
          if (item.t >= 1.1) {
            item.z = BELT_Z;
            item.path = 'belt';
            item.stage = 'fixing';
            item.t = 0;
            down.item = null;
          }
        }
      } else down.z += (UPPER_Z - down.z) * (1 - Math.exp(-dt / 0.25));
    });

    // The upper belts run backward; PRs accumulate at the down lift.
    for (const index of [0, 1, 2] as LaneIndex[]) {
      const riding = items.filter((item) => item.lane === index && item.path === 'upper').sort((a, b) => a.x - b.x);
      riding.forEach((item, order) => {
        const drop = dropX(index);
        let limit = drop;
        if (order > 0) limit = Math.max(limit, riding[order - 1].x + GAP);
        if (item.x > limit) item.x = Math.max(limit, item.x - SPEED * dt);
        const down = lifts[index].down;
        if (Math.abs(item.x - drop) < 0.01 && !down.item && Math.abs(down.z - UPPER_Z) < 0.5) {
          down.item = item;
          item.path = 'liftDown';
          item.t = -1;
        }
      });
    }
  }

  // Send a PR back to its own line: fade out where it is, then fade in on the
  // far end of its upper return belt, flagged, to ride back to its machine.
  function teleport(item: Item) {
    item.path = 'teleport';
    item.t = 0;
    item.fade = 1;
    item.beamFrom = [item.x, item.y, item.z];
    item.stage = 'changes';
    item.flag = true;
    item.retried = true;
    item.red = -1;
    item.ci = 0;
    item.pre = 0;
    item.retest = false;
    returned += 1;
    pulse(TAP.queue, TAP[LANES[item.lane].key]);
  }

  function runMerge(dt: number) {
    // CI on each PR's own branch runs from the moment it is opened.
    for (const item of items) {
      if ((item.stage === 'built' || item.stage === 'approved') && (item.path === 'belt' || item.path === 'cross' || item.path === 'trunk') && item.pre < 1) {
        item.pre = Math.min(1, item.pre + dt / BRANCH_CI);
        if (item.pre >= 1 && FAILS_ENTRY(item.id) && !item.retried) item.red = 0;
      }
    }
    // The gate: an approved PR with a green branch is admitted as it comes
    // up to the gate, without stopping; a red one is turned back from it.
    for (const item of items) {
      if (item.path !== 'trunk') continue;
      const atGate = Math.abs(item.x - (GATE_X - 10)) < 0.5;
      if (item.red >= 0) {
        if (atGate) item.red += dt;
        if (item.red > 0.9) teleport(item);
      } else if (item.pre >= 1 && item.x >= GATE_X - 40) {
        item.path = 'queue';
        item.ci = 0;
      }
    }
    // The crane: grab from the pad, lift clear of the frame, carry, set the
    // PR down on top of the stack, come back.
    crane.t += dt;
    const item = crane.item;
    const rest = CRANE.z - 8;
    if (item) {
      if (crane.phase === 'grab') {
        crane.x = ENTRY_X;
        crane.hook = rest + (BELT_Z + BOX_H - rest) * ease(crane.t / 0.15);
        if (crane.t >= 0.15) Object.assign(crane, { phase: 'lift', t: 0 });
      } else if (crane.phase === 'lift') {
        item.z = BELT_Z + (TRAVEL_Z - BELT_Z) * ease(crane.t / 0.22);
        crane.hook = item.z + BOX_H;
        if (crane.t >= 0.22) Object.assign(crane, { phase: 'carry', t: 0 });
      } else if (crane.phase === 'carry') {
        item.x = ENTRY_X + (STACK_X - ENTRY_X) * ease(crane.t / 0.34);
        crane.x = item.x;
        // Hover until the stack has settled: nothing leaving the frame, no
        // red PR fading out of it, every level at rest.
        const settled =
          !items.some((other) => (other.stage === 'merged' && other.path === 'queue' && other.x < STACK_X + 18) || (other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[0] - STACK_X) < 1)) &&
          stack.every((candidate, level) => candidate.z === levelZ(level));
        if (crane.t >= 0.34 && settled) Object.assign(crane, { phase: 'lower', t: 0, target: levelZ(stack.length) });
      } else if (crane.phase === 'lower') {
        item.z = TRAVEL_Z + (crane.target - TRAVEL_Z) * ease(crane.t / 0.22);
        crane.hook = item.z + BOX_H;
        if (crane.t >= 0.22) {
          item.z = crane.target;
          item.path = 'stack';
          item.level = stack.length;
          item.ci = 0;
          stack.push(item);
          crane.item = null;
          Object.assign(crane, { phase: 'rise', t: 0 });
        }
      }
    } else if (crane.phase === 'rise') {
      crane.hook += (rest - crane.hook) * (1 - Math.exp(-dt / 0.12));
      if (crane.t >= 0.1) Object.assign(crane, { phase: 'return', t: 0 });
    } else if (crane.phase === 'return') {
      crane.x = STACK_X + (ENTRY_X - STACK_X) * ease(crane.t / 0.26);
      if (crane.t >= 0.26) Object.assign(crane, { phase: 'idle', t: 0 });
    } else {
      crane.hook += (rest - crane.hook) * (1 - Math.exp(-dt / 0.12));
    }

    // The stack: every level tests at once, each rebased on the one below.
    // A delivered PR has to clear the frame before the stack settles onto
    // main behind it.
    const leaving =
      items.some((other) => other.stage === 'merged' && other.path === 'queue' && other.x < STACK_X + 18) ||
      items.some((other) => other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[0] - STACK_X) < 1);
    stack.forEach((candidate, level) => {
      candidate.level = level;
      // While anything is leaving the frame, the stack holds still.
      const target = leaving ? candidate.z : levelZ(level);
      candidate.z += (target - candidate.z) * (1 - Math.exp(-dt / 0.1));
      if (Math.abs(candidate.z - target) < 0.05) candidate.z = target;
      if (candidate.fix >= 0) {
        candidate.fix += dt;
        if (candidate.fix >= FIX_TIME + INTEGRATION_TIME) {
          // Repaired and re-reviewed: test again, and so does everything
          // built on it.
          candidate.fix = -1;
          candidate.red = -1;
          candidate.retried = true;
          candidate.ci = 0;
          for (const above of stack.slice(level + 1)) above.retest = true;
          repaired += 1;
        }
        return;
      }
      if (candidate.red >= 0) {
        candidate.red += dt;
        if (candidate.red > 0.6 && !stack.some((other) => other.fix >= 0)) candidate.fix = 0;
        return;
      }
      if (candidate.retest) {
        candidate.ci = Math.max(0, candidate.ci - dt * 3);
        if (candidate.ci === 0) candidate.retest = false;
        return;
      }
      if (candidate.ci < 1) {
        candidate.ci = Math.min(1, candidate.ci + dt / (candidate.ciNeed * QUEUE_CI));
        if (candidate.ci >= 1 && FAILS_IN_QUEUE(candidate.id) && !candidate.retried) candidate.red = 0;
      }
    });
    // Nothing leaves the stack while the crane is setting a PR down on it.
    const lowering = crane.phase === 'lower';
    // The repair carriage rides to the level it works on, home otherwise.
    const fixing = stack.find((candidate) => candidate.fix >= 0 || candidate.red >= 0);
    const repairTarget = fixing ? fixing.z + 3 : levelZ(STACK_MAX);
    repairZ = still.matches ? repairTarget : repairZ + (repairTarget - repairZ) * (1 - Math.exp(-dt / 0.15));
    // The bottom PR sits on main: once it is green, it is delivered.
    const bottom = stack[0];
    const mainClear = !items.some((other) => other.stage === 'merged' && other.path === 'queue' && other.x < STACK_X + GAP + 6);
    if (!lowering && bottom && bottom.z === levelZ(0) && bottom.ci >= 1 && bottom.red < 0 && !bottom.retest && mainClear) {
      stack.shift();
      bottom.path = 'queue';
      bottom.stage = 'merged';
      bottom.level = -1;
      bottom.x = STACK_X;
      bottom.t = 0;
      merged += 1;
      pulse(TAP.queue, TAP.dock);
    }

    // The gate's bar rises while a PR is being let through.
    const passing = items.some((item) => item.path === 'queue' && item.stage === 'approved' && item.x > GATE_X - 40 && item.x < GATE_X + 12);
    gateOpen = still.matches ? (passing ? 1 : 0) : gateOpen + ((passing ? 1 : 0) - gateOpen) * (1 - Math.exp(-dt / 0.08));
    // Each drum tests the candidate on its level: it spins up while CI runs,
    // its needle follows the progress, and it spins down when it is done.
    drums.forEach((drum, level) => {
      const here = stack[level];
      const target = here && here.z === levelZ(level) ? here.ci : here ? drum.level : 0;
      drum.state = !here ? 'none' : here.red >= 0 ? 'red' : here.ci >= 1 ? 'green' : 'running';
      drum.level = still.matches ? target : drum.level + (target - drum.level) * (1 - Math.exp(-dt / 0.1));
      const spinning = drum.state === 'running' && !still.matches;
      drum.spin += ((spinning ? 1 : 0) - drum.spin) * (1 - Math.exp(-dt / 0.35));
      drum.phase += drum.spin * dt * 5;
    });

    // Teleports: fade out, wait for room at the far end of the upper belt,
    // fade in there.
    for (const item of items.filter((candidate) => candidate.path === 'teleport')) {
      item.t += dt;
      if (item.beamFrom) {
        item.fade = Math.max(0, 1 - item.t / 0.6);
        if (item.t < 0.6) continue;
        const lane = item.lane;
        // Land only on a clear spot: no PR riding there, none still landing
        // from another teleport, and the lift not handing one up.
        const landingBusy = items.some(
          (other) =>
            other !== item &&
            other.lane === lane &&
            ((other.path === 'upper' && other.x > HOIST_X - GAP) || (other.path === 'teleport' && other.beamFrom === null)),
        );
        const room = !lifts[lane].up.item && !landingBusy;
        if (!room) continue;
        item.beamFrom = null;
        item.x = HOIST_X;
        item.y = LANES[lane].y;
        item.z = UPPER_Z;
        item.t = 0;
      } else {
        item.fade = Math.min(1, item.t / 0.6);
        if (item.t >= 0.6) {
          item.fade = 1;
          item.path = 'upper';
          item.t = 0;
        }
      }
    }
  }

  function step(dt: number) {
    clock += dt;
    // Each agent picks up work on its own clock.
    LANES.forEach((laneInfo, index) => {
      const lane = index as LaneIndex;
      spawnWait[lane] -= dt;
      const intakeClear = !items.some((item) => item.lane === lane && (item.path === 'belt' || item.path === 'drop') && item.x < laneInfo.intake + GAP);
      const busy = items.filter((item) => item.lane === lane && item.path !== 'trunk' && item.path !== 'gone').length;
      if (spawnWait[lane] <= 0 && intakeClear && busy < 4) {
        spawn(lane);
        spawnWait[lane] = SPAWN_EVERY[lane] + (serial % 3) * 0.7;
      }
    });

    const belts = items.filter((item) => item.path === 'belt' || item.path === 'trunk' || item.path === 'queue' || item.path === 'drop').sort((a, b) => b.x - a.x);
    for (const item of belts) {
      if (item.path === 'drop') {
        item.t += dt;
        item.z = BELT_Z + 12 * (1 - ease(item.t / 0.4));
        if (item.t >= 0.4) {
          item.path = 'belt';
          item.z = BELT_Z;
          item.t = 0;
        }
        continue;
      }
      const stop = stopFor(item);
      if (Math.abs(item.x - stop) < 0.01 && work(item, dt)) continue;
      if (!onBelt(item)) continue;
      let limit = stopFor(item);
      const next = ahead(item);
      if (next) limit = Math.min(limit, next.x - GAP);
      // An outer line holds back while the PR ahead of it is still stepping
      // off its end onto the collector.
      if (item.path === 'belt' && item.lane !== 1 && items.some((other) => other.lane === item.lane && other.path === 'cross' && Math.abs(other.y - LANES[item.lane].y) < GAP)) limit = Math.min(limit, JOIN_X - GAP);
      // The middle line holds back while a PR crosses into the junction.
      if (item.path === 'belt' && item.lane === 1 && item.x <= JOIN_X - GAP + 0.01 && items.some((other) => other.path === 'cross' && Math.abs(other.y - TRUNK_Y) < GAP)) limit = Math.min(limit, JOIN_X - GAP);
      // Nothing passes the gate until its bar is up, and nothing moves into
      // the spot of a red PR that is still leaving.
      if (item.path === 'queue' && item.x <= GATE_X - 10 + 0.01 && gateOpen < 0.9) limit = Math.min(limit, GATE_X - 10);
      // The pad stays clear while the crane is still low over it.
      if (item.path === 'queue' && item.stage === 'approved' && crane.item !== null && crane.item.z < BELT_Z + BOX_H + 6 && Math.abs(crane.item.x - ENTRY_X) < 1) limit = Math.min(limit, ENTRY_X - GAP);
      if (onTrunk(item)) {
        for (const other of items) {
          if (other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[1] - TRUNK_Y) < 1 && other.beamFrom[0] > item.x) limit = Math.min(limit, other.beamFrom[0] - GAP);
        }
      }
      // Hold back for a returned PR being set down ahead of the machine, and
      // for a lift that is still low where it stands.
      const lift = lifts[item.lane];
      if (item.path === 'belt' && lift.down.item && lift.down.item.t >= 0 && item.x < dropX(item.lane) - 1) limit = Math.min(limit, dropX(item.lane) - GAP);
      if (item.path === 'belt' && lift.up.item && lift.up.z < BELT_Z + 16 && item.x < HOIST_X - 1) limit = Math.min(limit, HOIST_X - GAP);
      // Deploys run one at a time, like the deploy workflow: the next merged
      // PR waits at the booth until the smoke tests of the one before pass.
      if (item.stage === 'merged' && items.some((other) => other.path === 'deploy')) limit = Math.min(limit, GONE_X - GAP);
      if (limit > item.x) item.x = Math.min(limit, item.x + SPEED * dt);
      // Into the booth: the deploy starts. The PR is Done only once the
      // smoke tests on stage and production have both passed.
      if (item.stage === 'merged' && item.x >= GONE_X) {
        item.path = 'deploy';
        item.t = 0;
        beacon = 0;
      }
    }

    // The collector: PRs from the outer lines ride across onto the trunk,
    // each behind the one ahead, and into the junction once it is free.
    for (const index of [0, 2] as LaneIndex[]) {
      const riding = items.filter((item) => item.lane === index && item.path === 'cross').sort((a, b) => Math.abs(a.y - TRUNK_Y) - Math.abs(b.y - TRUNK_Y));
      riding.forEach((item, order) => {
        const distance = Math.abs(item.y - TRUNK_Y);
        let limit = 0;
        if (order > 0) limit = Math.max(limit, Math.abs(riding[order - 1].y - TRUNK_Y) + GAP);
        if (distance >= GAP - 0.01 && junctionBusy(item)) limit = Math.max(limit, GAP);
        if (distance > limit) {
          const next = Math.max(limit, distance - SPEED * dt);
          item.y = TRUNK_Y + Math.sign(item.y - TRUNK_Y) * next;
        }
        if (Math.abs(item.y - TRUNK_Y) < 0.01) {
          item.y = TRUNK_Y;
          item.path = 'trunk';
          item.x = JOIN_X;
          item.t = 0;
        }
      });
    }

    runLifts(dt);
    runMerge(dt);

    // The arms: swing over the issue being worked and tap it, trace small
    // circles while they work, fold back when idle.
    arms.forEach((arm, index) => {
      const lane = index as LaneIndex;
      arm.t += dt;
      const work = items.find((item) => item.lane === lane && item.path === 'belt' && (item.stage === 'new' || item.stage === 'fixing') && Math.abs(item.x - LANES[lane].machine) < 0.01);
      let target = armRest(lane);
      let quill = SHOULDER_Z - 12;
      if (work && !still.matches) {
        const top = BELT_Z + (work.morph >= 0.5 ? BOX_H : CARD_H);
        target = [LANES[lane].machine + 2.4 * Math.cos(arm.t * 3.2), LANES[lane].y + 2.4 * Math.sin(arm.t * 3.2)];
        quill = top + 0.6 + 5 * (0.5 + 0.5 * Math.sin(arm.t * 8));
      } else if (work) {
        target = [LANES[lane].machine, LANES[lane].y];
        quill = BELT_Z + BOX_H + 2;
      }
      const follow = 1 - Math.exp(-dt / 0.16);
      arm.tool = [arm.tool[0] + (target[0] - arm.tool[0]) * follow, arm.tool[1] + (target[1] - arm.tool[1]) * follow];
      arm.quill += (quill - arm.quill) * (1 - Math.exp(-dt / 0.08));
    });

    // Machines and gauges.
    const pressing = items.find((item) => item.lane === 2 && item.path === 'belt' && item.stage !== 'built' && Math.abs(item.x - LANES[2].machine) < 0.01 && (item.stage === 'new' || item.stage === 'fixing'));
    const rest = 52;
    if (pressing && !still.matches) {
      const contact = BELT_Z + (pressing.morph >= 0.5 ? BOX_H : CARD_H);
      const stroke = (1 - Math.cos(pressing.t * TAU * 1.1)) / 2;
      ramBottom = rest - (rest - contact) * stroke;
    } else ramBottom += (rest - ramBottom) * (1 - Math.exp(-dt / 0.12));
    LANES.forEach((_, lane) => {
      const reviewing = items.some((item) => item.lane === lane && item.path === 'belt' && item.stage === 'built' && Math.abs(item.x - REVIEW_X) < 0.01);
      if (!reviewing) {
        probeTip[lane] += (44 - probeTip[lane]) * (1 - Math.exp(-dt / 0.12));
        dialTarget[lane] = 0;
      }
      dialTurn[lane] += (dialTarget[lane] - dialTurn[lane]) * (1 - Math.exp(-dt / 0.16));
      const v = verdict[lane];
      if (v) v.t += dt;
    });
    beacon += dt;
    for (const item of items.filter((candidate) => candidate.path === 'deploy')) {
      item.t += dt;
      if (item.t < SMOKE_DONE) continue;
      // Smoke tests pass on both: this issue is Done in Linear, and once
      // production's users have it, usertold listens.
      deployed += 1;
      pulse(TAP.dock, TAP.patchrelay);
      if (listenLeft <= 0) listenLeft = 1.8;
      finish(item);
    }
    sinceCapsule += dt;
    if (listenLeft > 0) {
      listenLeft -= dt;
      if (listenLeft <= 0 && sinceCapsule >= CAPSULE_EVERY && !still.matches) {
        const el = document.createElementNS(SVG_NS, 'g');
        el.innerHTML = CAPSULE;
        capsulesFront.appendChild(el);
        capsules.push({ d: 0, el });
        sinceCapsule = 0;
      }
    }
    for (let i = capsules.length - 1; i >= 0; i--) {
      const capsule = capsules[i];
      capsule.d += CAPSULE_SPEED * dt;
      if (capsule.d >= tubeLength) {
        capsule.el.remove();
        capsules.splice(i, 1);
        fromUsersWaiting += 1;
      }
    }
    // The eval reader follows the case being replayed, and jumps home.
    const headTarget = (Math.floor(clock / 1.3) % 11) * 4.8;
    headX = still.matches || headTarget < headX - 1 ? headTarget : headX + (headTarget - headX) * (1 - Math.exp(-dt / 0.12));
    for (const p of pulses) p.t += dt;

    if (tracked && tracked.done) {
      trackWait += dt;
      if (trackWait > 1.4) {
        const next = [...items].sort((a, b) => b.id - a.id).find((item) => !item.done);
        if (next) follow(next);
      }
    }
  }

  function phaseOf(item: Item): string {
    const phase = phaseText(item);
    return item.fromUsers && item.path !== 'drop' ? `${phase} · from users` : phase;
  }

  function phaseText(item: Item): string {
    const agent = AGENTS[item.lane].label;
    if (item.done) return 'deployed · stage and production · smoke tests green · Done';
    if (item.path === 'deploy') return 'deploying · stage and production · smoke tests running';
    if (item.path === 'drop') return item.fromUsers ? `from what users told usertold · ${agent}` : `picked up · ${agent}`;
    if (item.path === 'liftUp' || item.path === 'upper' || item.path === 'liftDown') return `changes requested · back to ${agent}`;
    if (item.path === 'teleport') return `branch CI red · back to ${agent}`;
    if (item.path === 'cross') return 'approved · crossing to the queue';
    const here = (x: number) => Math.abs(item.x - x) < 0.01;
    switch (item.stage) {
      case 'new':
        return here(LANES[item.lane].machine) ? `coding · ${agent}` : `to ${agent}`;
      case 'fixing':
        return here(LANES[item.lane].machine) ? `fixing review · ${agent}` : `review fix · ${agent}`;
      case 'built':
        return here(REVIEW_X) ? `review-quill · round ${item.reviews + 1}` : 'PR opened · review requested';
      case 'changes':
        return `changes requested · round ${item.reviews}`;
      case 'approved':
        if (item.path === 'crane') return 'merge queue · stacking on the PR ahead';
        if (item.path === 'stack') {
          const below = stack[item.level - 1];
          const base = below ? `built on ${below.name}` : 'on main';
          const state =
            item.fix >= FIX_TIME ? 'review-quill/integration' : item.fix >= 0 ? 'integration repair on its candidate ref' : item.red >= 0 ? 'red' : item.retest ? 'testing again' : item.ci < 1 ? 'CI running' : item.level === 0 ? 'green, to main' : 'green';
          return `merge queue · level ${item.level + 1} · ${base} · ${state}`;
        }
        if (item.path === 'queue') return here(ENTRY_X) ? 'admitted · waiting for the crane' : 'admitted · to the merge queue';
        if (item.path !== 'trunk') return item.pre < 1 ? 'approved · branch CI running' : 'approved · to the queue';
        if (Math.abs(item.x - (GATE_X - 10)) < 0.5) return item.red >= 0 ? 'branch CI red · back to the line' : 'at the gate · branch CI running';
        return 'approved · to the merge queue';
      case 'merged':
        return item.x < STACK_X + 40 ? 'main · fast-forwarded' : 'deploying · stage and production';
    }
  }

  function setLamp(name: string, on: string | null) {
    const el = lamp(name);
    if (!el) return;
    if (on) {
      if (el.getAttribute('data-on') !== on) el.setAttribute('data-on', on);
    } else if (el.hasAttribute('data-on')) el.removeAttribute('data-on');
  }

  function layerOf(item: Item): SVGGElement {
    if (item.path === 'drop') return item.z > BELT_Z + 3 ? intakes[item.lane] : laneItems[item.lane];
    if (item.path === 'liftUp') return lifts[item.lane].up.cargo;
    if (item.path === 'liftDown') return lifts[item.lane].down.cargo;
    if (item.path === 'upper') return upperEls[item.lane];
    if (item.path === 'cross') {
      if (item.y < LANES[1].y - 11) return item.y < LANES[0].y + 11 ? laneItems[0] : gaps[0];
      if (item.y > LANES[1].y + 11) return item.y > LANES[2].y - 11 ? laneItems[2] : gaps[1];
      return laneItems[1];
    }
    if (item.path === 'stack') return stackEl;
    if (item.path === 'crane') return craneCargo;
    if (item.path === 'teleport') return item.beamFrom ? (item.level >= 0 || item.z > BELT_Z + 1 ? stackEl : laneItems[1]) : upperEls[item.lane];
    if (item.path === 'trunk' || item.path === 'queue' || item.path === 'deploy') return laneItems[1];
    return laneItems[item.lane];
  }

  function render() {
    const groups = new Map<SVGGElement, Array<{ el: Element; key: number }>>();
    for (const item of items) {
      item.el.setAttribute('transform', k.translateAlong(P, [item.x, item.y, item.z]));
      const morph = item.morph;
      item.card.style.display = morph >= 1 ? 'none' : '';
      item.box.style.display = morph <= 0 ? 'none' : '';
      item.card.style.opacity = morph > 0 && morph < 1 ? String(1 - morph) : '';
      item.box.style.opacity = morph > 0 && morph < 1 ? String(morph) : '';
      // The dot shows the branch's CI, then the candidate's in the queue.
      const ci = item.path === 'stack' ? item.ci : item.pre;
      const running = item.stage === 'built' || item.stage === 'approved';
      item.ciDot.setAttribute('data-state', item.red >= 0 ? 'red' : item.stage === 'merged' || ci >= 1 ? 'green' : running ? 'running' : 'none');
      item.el.toggleAttribute('data-flag', item.flag);
      // A teleporting box flickers as it dematerialises and comes back.
      const flicker = item.path === 'teleport' ? 0.72 + 0.28 * Math.sin(clock * 55 + item.id) : 1;
      item.el.style.opacity = item.fade < 1 ? (item.fade * flicker).toFixed(2) : '';
      const layer = layerOf(item);
      if (!groups.has(layer)) groups.set(layer, []);
      // In the stack, paint bottom to top.
      groups.get(layer)?.push({ el: item.el, key: layer === stackEl ? item.z : depth(item.x, item.y) });
    }
    for (const [layer, list] of groups) {
      list.sort((a, b) => a.key - b.key);
      const children = Array.from(layer.children).filter((child) => list.some((entry) => entry.el === child));
      if (children.length !== list.length || list.some((entry, i) => children[i] !== entry.el)) for (const entry of list) layer.appendChild(entry.el);
    }

    // Links on main: the PRs just merged, each fast-forwarded onto the one
    // ahead, chained solid.
    const chain = items.filter((item) => item.path === 'queue' && item.stage === 'merged').sort((a, b) => a.x - b.x);
    let links = '';
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      if (b.x > GONE_X - 20 || b.x - a.x > GAP * 2) continue;
      links += k.wireSvg(at([a.x + 8, a.y, BELT_Z + 5]), at([b.x - 8, b.y, BELT_Z + 5]), { tone: 'hi', size: 0.9 });
    }
    if (linksEl.innerHTML !== links) linksEl.innerHTML = links;

    // Lifts, probes, the press.
    lifts.forEach(({ up, down }, lane) => {
      for (const lift of [down, up]) {
        const key = lift.z.toFixed(2);
        if (key !== lift.key) {
          lift.key = key;
          lift.deck.innerHTML = platformSvg(lift.x, LANES[lane].y, lift.z);
        }
      }
      const probeKey = probeTip[lane].toFixed(2);
      if (probeKey !== keys.probe[lane]) {
        keys.probe[lane] = probeKey;
        probes[lane].innerHTML = probeSvg(LANES[lane].y, probeTip[lane]);
      }
      needles[lane].setAttribute('d', needleD({ x: REVIEW_X, y: LANES[lane].y - 6, r: 7.2, top: PORTAL.z1 + 4 }, dialTurn[lane]));
      const v = verdict[lane];
      setLamp(`verdict${lane}`, v && v.t < 1.6 ? (v.kind === 'approve' ? 'lit' : 'red') : null);
      const working = items.some((item) => item.lane === lane && item.path === 'belt' && (item.stage === 'new' || item.stage === 'fixing') && Math.abs(item.x - LANES[lane].machine) < 0.01);
      setLamp(`m${lane}`, working ? 'lit' : null);
      // The machine's screen wakes while it works.
      const screen = screens[lane];
      if (screen && screen.hasAttribute('data-on') !== working) screen.toggleAttribute('data-on', working);
    });
    arms.forEach((arm, lane) => {
      const key = `${arm.tool[0].toFixed(1)}:${arm.tool[1].toFixed(1)}:${arm.quill.toFixed(1)}`;
      if (key !== arm.key) {
        arm.key = key;
        armEls[lane].innerHTML = armSvg(lane as LaneIndex, arm.tool, arm.quill);
      }
    });
    const ramKey = ramBottom.toFixed(2);
    if (ramKey !== keys.ram) {
      keys.ram = ramKey;
      ramEl.innerHTML = ramSvg(LANES[2].machine, LANES[2].y, ramBottom);
    }

    // The gate: a lamp for the review, one for the branch's CI, and the bar.
    const atGate = items.find((item) => (item.path === 'trunk' && item.x > GATE_X - 40) || (item.path === 'queue' && item.stage === 'approved' && item.x < GATE_X + 12));
    setLamp('gate-review', atGate ? 'green' : null);
    setLamp('gate-ci', !atGate ? null : atGate.red >= 0 ? 'red' : atGate.path === 'queue' || atGate.pre >= 1 ? 'green' : 'blink');
    const barKey = gateOpen.toFixed(3);
    if (barKey !== gateKey) {
      gateKey = barKey;
      const lift = 16 * gateOpen;
      gateBar.innerHTML = box(GATE_X - 1.5, TRUNK_Y - GATE_SPAN + 1.8, GATE_X + 1.5, TRUNK_Y + GATE_SPAN - 1.8, 27 + lift, 30.5 + lift, {}, 0.4, 0.3);
    }
    // The CI hall: needles, turning ribs, lamps.
    drums.forEach((drum, level) => {
      setLamp(`ci${level}`, drum.state === 'none' ? null : drum.state === 'running' ? 'blink' : drum.state);
      const key = `${drum.level.toFixed(3)}:${drum.phase.toFixed(2)}`;
      if (key === drum.key) return;
      drum.key = key;
      drum.needle.setAttribute('d', needleD(CI_DIAL(level), -0.375 + 0.75 * drum.level));
      drum.ribs.innerHTML = ribsSvg(ciX(level), CI_HALL.y, CI_HALL.r, drum.phase);
    });
    // The crane.
    const craneKey = `${crane.x.toFixed(1)}:${crane.hook.toFixed(1)}`;
    if (craneKey !== crane.key) {
      crane.key = craneKey;
      craneRig.innerHTML = craneSvg(crane.x, crane.hook);
    }
    let beamSvg = '';
    for (const item of items) {
      if (item.path !== 'teleport') continue;
      const [bx, by, bz] = item.beamFrom ?? [item.x, item.y, item.z];
      // The light swells and fades over each half: leaving, then arriving.
      const env = Math.sin(Math.PI * clamp01(item.t / 0.6));
      if (env > 0.01) beamSvg += teleportSvg(bx, by, bz, env, clock, item.id);
    }
    if (beams.innerHTML !== beamSvg) beams.innerHTML = beamSvg;
    // Deploy: the stage booth lights and its dial swings, then production's
    // windows light up column by column, round the corner, and go back.
    // Stage and production get the same SHA at once; each runs its smoke test
    // (smoke from the chimney), then its lamp goes green.
    stagePane?.toggleAttribute('data-on', beacon < 1.8);
    stageNeedle.setAttribute('d', needleD(STAGE_DIAL, -0.375 + 0.75 * (ease(beacon / 0.5) - ease((beacon - 1.4) / 0.5)) * 0.85));
    let wave = false;
    for (const pane of panes) {
      const at0 = 0.15 + pane.col * 0.06;
      const on = beacon >= at0 && beacon < at0 + 1.6;
      wave ||= on;
      pane.el.forEach((el) => el.toggleAttribute('data-on', on));
    }
    setLamp('mast', wave ? 'lit' : null);
    const smokeGreen = beacon >= SMOKE_DONE && beacon < SMOKE_DONE + 1.4 ? 'green' : null;
    setLamp('smoke-stage', smokeGreen);
    setLamp('smoke-production', smokeGreen);
    let smoke = '';
    if (beacon > 0.05 && beacon < SMOKE_DONE + 0.2 && !still.matches) {
      const env = Math.min(1, (beacon - 0.05) * 5, (SMOKE_DONE + 0.2 - beacon) * 5);
      for (const chimney of CHIMNEYS) {
        for (let i = 0; i < 4; i++) {
          const p = ((beacon - 0.05) * 1.8 + i / 4) % 1;
          const [cx, cy] = at([chimney.x + p * 4, chimney.y - p * 2, chimney.top + 1 + p * 14]);
          smoke += `<circle class="fx-puff" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(1.2 + p * 2.6).toFixed(2)}" style="opacity:${((1 - p) * env).toFixed(2)}"/>`;
        }
      }
    }
    if (smokeEl.innerHTML !== smoke) smokeEl.innerHTML = smoke;
    // usertold: the waveform moves while it listens; capsules in the tube.
    setLamp('listen', listenLeft > 0 ? 'blink' : null);
    const bars: string[] = [];
    for (let i = 0; i < 13; i++) {
      const h = listenLeft > 0 && !still.matches ? 1 + 6 * (0.5 + 0.5 * Math.sin(clock * 11 + i * 1.7) * Math.sin(clock * 3 + i)) : 0.8;
      bars.push(k.segment([USERTOLD.x0 + 8 + i * 1.6, USERTOLD.y1, 21 - h / 2], [USERTOLD.x0 + 8 + i * 1.6, USERTOLD.y1, 21 + h / 2], P));
    }
    waveEl.setAttribute('d', bars.join(''));
    const frontLength = tubeLengths.slice(0, TUBE_FRONT_LEGS).reduce((a, b) => a + b, 0);
    for (const capsule of capsules) {
      capsule.el.setAttribute('transform', k.translateAlong(P, alongTube(capsule.d)));
      // Over production the capsule is in front; past it, behind the lines.
      const layer = capsule.d < frontLength ? capsulesFront : capsulesBack;
      if (capsule.el.parentNode !== layer) layer.appendChild(capsule.el);
    }
    // The repair carriage, its torch and sparks, and the integration lamp.
    const working = stack.find((candidate) => candidate.fix >= 0);
    const torch = working && working.fix < FIX_TIME;
    const reviewing = working && working.fix >= FIX_TIME;
    const key = `${repairZ.toFixed(2)}:${torch ? Math.floor(clock * 20) : 0}:${reviewing ? 1 : 0}`;
    if (key !== repairKey) {
      repairKey = key;
      const { x, y } = REPAIR;
      const z = repairZ;
      // The carriage on its post, an arm reaching left to the stack, and a
      // torch pointed at the candidate's front.
      let html =
        box(x - 3.4, y - 3.4, x + 3.4, y + 3.4, z - 3, z + 5, {}, 0.6, 0.4) +
        box(x - 19, y - 1.2, x - 3.4, y + 1.2, z + 1, z + 3, {}, 0.3, 0.2) +
        box(x - 20, y - 9, x - 17, y + 1.2, z + 1, z + 3, {}, 0.3, 0.2) +
        cyl(x - 18.5, y - 9.8, 1.3, z + 0.4, z + 3.6, { tone: 'hi' }, 12, 0.3);
      const lampSvg = cyl(x, y, 1.6, z + 5, z + 7.4, { className: 'fx-lamp', crease: 'none' }, 14);
      html += reviewing ? lampSvg.replace('<g ', '<g data-on="blink" ') : lampSvg;
      if (torch && !still.matches) {
        const [fx, fy] = at([x - 18.5, y - 11.4, z + 2]);
        html += `<circle class="fx-flash" cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(2.2 + Math.sin(clock * 47) * 0.6).toFixed(2)}"/>`;
        for (let i = 0; i < 10; i++) {
          const a = clock * 30 + i * 2.1;
          const reach = 1 + ((clock * 7 + i * 0.37) % 1) * 5;
          const [sx, sy] = at([x - 18.5 + Math.cos(a) * reach, y - 11.5 + Math.sin(a * 0.7), z + 2 + Math.sin(a * 1.3) * reach * 0.6]);
          html += `<circle class="fx-spark" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(0.45 + (i % 3) * 0.25).toFixed(2)}"/>`;
        }
      }
      repairEl.innerHTML = html;
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const span = Math.abs(p.to - p.from);
      const t = clamp01((p.t * 340) / Math.max(span, 1));
      const [x, y] = at([p.from + (p.to - p.from) * ease(t), BUS.y1 + 0.2, 136]);
      p.el.setAttribute('cx', x.toFixed(1));
      p.el.setAttribute('cy', y.toFixed(1));
      p.el.style.opacity = String(Math.min(1, (1 - t) * 6, p.t * 8));
      if (t >= 1) {
        p.el.remove();
        pulses.splice(i, 1);
      }
    }

    const travel = still.matches ? 0 : clock * SPEED;
    for (const el of slats) el.setAttribute('transform', k.translateAlong(P, [travel % 6, 0, 0]));
    for (const el of upperSlats) el.setAttribute('transform', k.translateAlong(P, [-(travel % 6), 0, 0]));

    const caseAt = Math.floor(clock / 1.3) % 11;
    cases.forEach((el, i) => {
      const lifted = i === caseAt;
      if (lifted !== el.hasAttribute('data-on')) {
        el.toggleAttribute('data-on', lifted);
        el.setAttribute('transform', lifted ? k.translateAlong(P, [0, 0, 2.4]) : '');
      }
    });
    evalHead.setAttribute('transform', k.translateAlong(P, [headX, 0, 0]));
    const caseT = (clock % 1.3) / 1.3;
    evalNeedleEl.setAttribute('d', needleD(EVAL_DIAL, -0.375 + 0.75 * (0.15 + 0.7 * ease(caseT * 1.6) - 0.7 * ease((caseT - 0.75) * 4))));
    const pegAt = Math.floor(clock / 0.18) % 44;
    pegs.forEach((el, i) => el.toggleAttribute('data-on', i <= pegAt && pegAt < 40));

    const text = tracked ? `${tracked.name} · ${phaseOf(tracked)}` : 'warming up';
    if (readout && text !== lastText) {
      lastText = text;
      readout.textContent = text;
    }
    const statsText = `${merged} merged · ${deployed} deployed · ${reviewsDone} reviews · ${returned} sent back · ${repaired} repaired in the queue`;
    if (stats && statsText !== lastStats) {
      lastStats = statsText;
      stats.textContent = statsText;
    }
  }

  // A read-only snapshot of where every item is, for tests.
  Object.assign(stage, { factoryState: () => items.map((item) => ({ id: item.id, lane: item.lane, path: item.path, stage: item.stage, level: item.level, ci: item.path === 'stack' ? item.ci : null, x: item.x, y: item.y, z: item.z })) });

  // Warm the line up so the first frame is already busy.
  for (let i = 0; i < 30 * 30; i++) step(1 / 30);
  render();

  let frame = 0;
  let last = 0;
  let visible = false;
  const tick = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    step(dt);
    render();
    frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
  };
  const run = () => {
    if (!frame && visible && !still.matches && !document.hidden) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) run();
    },
    { rootMargin: '120px 0px' },
  );
  observer.observe(stage);
  const onVisibility = () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else run();
  };
  document.addEventListener('visibilitychange', onVisibility);
  const onMotion = () => run();
  still.addEventListener('change', onMotion);

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    still.removeEventListener('change', onMotion);
    if (frame) cancelAnimationFrame(frame);
    while (items.length) finish(items[0]);
    lifts.forEach(({ up, down }) => [up, down].forEach((lift) => { lift.deck.remove(); lift.cargo.remove(); }));
    for (const p of pulses) p.el.remove();
  };
}
