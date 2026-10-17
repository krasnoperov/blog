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
  LEVEL_H,
  STACK_MAX,
  STACK_X,
  GONE_X,
  HOIST_X,
  FUNNEL_X0,
  MERGE_X,
  STOP_BACK,
  curveSAtX,
  CURVE_X0,
  LANES,
  P,
  PORTAL,
  UPPER_Z,
  curveAt,
  curveLength,
  REVIEW_X,
  TAP,
  TRUNK_Y,
  at,
  depth,
  dropX,
} from './layout';
import type { LaneIndex } from './layout';
import { curveSlats } from './art';

// The moving half of the figure. One small discrete model runs the line:
// issues spawn at each agent's intake, move on belts that accumulate (an
// item never closes within GAP of the one ahead), and dwell at machines. The
// three lanes run independently and meet at review-quill and the collector.

const SVG_NS = 'http://www.w3.org/2000/svg';
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
const ROUNDS_OF = [1, 2, 1, 1, 3, 1, 2, 1, 1, 2];
const CI_OF = [4.2, 6.8, 3.4, 5.6, 7.4, 3.9, 5.1];
const SPAWN_EVERY = [3.6, 4.4, 5.2];
// Some PRs fail CI on their own branch at the entry pad; some go red once in
// the stack, rebased on the PRs below them.
const FAILS_ENTRY = (id: number) => id % 13 === 4;
const FAILS_IN_STACK = (id: number) => id % 7 === 2;
const ENTRY_CI = 1.2;
// CI on a stacked candidate runs this much faster than on a lone branch.
const STACK_CI = 1.0;
const TRAVEL_Z = BELT_Z + STACK_MAX * LEVEL_H + 10;
const levelZ = (level: number) => BELT_Z + level * LEVEL_H;
// Stop lines before the funnel: arc length on the outer curves, x on the
// middle lane.
const CURVE_STOP = [curveSAtX(0, FUNNEL_X0) - STOP_BACK, 0, curveSAtX(2, FUNNEL_X0) - STOP_BACK];
const MIDDLE_STOP = FUNNEL_X0 - STOP_BACK;

type Path = 'drop' | 'belt' | 'liftUp' | 'upper' | 'liftDown' | 'curve' | 'trunk' | 'crane' | 'stack' | 'teleport' | 'gone';
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
  granted: boolean;
  waitT: number;
  // The merge aggregate: CI on the PR's own branch at the entry pad, its
  // place in the stack, a red candidate's countdown, and the teleport fade.
  pre: number;
  level: number;
  red: number;
  retried: boolean;
  fade: number;
  beamFrom: [number, number, number] | null;
  ci: number;
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
  ].join('');
}

function boxSvg() {
  const body = plan(-8, -7, 8, 7, 1.2);
  const [cx, cy] = at([4.2, 3.6, BOX_H]);
  return [
    S(k.slabOf(body, 0, BOX_H, P, 3, 0.5), { tone: 'hi', inner: k.lineSvg(k.sideSeam(body, 7.4, P, 3), { tone: 'faint' }) }),
    k.lineSvg(k.lineOnTop([-8, 0], [8, 0], BOX_H, P), { tone: 'faint' }),
    `<ellipse data-ci class="fx-ci" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="1.5" ry="0.8"/>`,
    `<g data-k="flag">${cyl(-5, -4, 0.5, BOX_H, BOX_H + 9, { crease: 'none' }, 8)}${box(-4.6, -4.4, 1.6, -3.6, BOX_H + 5, BOX_H + 9, { className: 'fx-flag' }, 0.2)}</g>`,
  ].join('');
}

function needleD(dial: { x: number; y: number; r: number; top: number }, turn: number) {
  const a = turn * TAU;
  return k.lineOnTop([dial.x - Math.sin(a) * 1.4, dial.y + Math.cos(a) * 1.4], [dial.x + Math.sin(a) * (dial.r - 2.2), dial.y - Math.cos(a) * (dial.r - 2.2)], dial.top + 0.2, P);
}

function probeSvg(y: number, tip: number) {
  return cyl(REVIEW_X, y, 0.9, tip + 2.4, PORTAL.z0, { crease: 'none' }, 12) + cyl(REVIEW_X, y, 2, tip, tip + 2.4, { tone: 'hi' }, 16);
}

function ramSvg(x: number, y: number, bottom: number) {
  return cyl(x, y, 2.4, bottom + 6, 66, { crease: 'none' }, 14) + box(x - 9, y - 9, x + 9, y + 9, bottom, bottom + 6, { tone: 'mid' }, 1, 0.5);
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

// A lift platform: a deck with guide shoes reaching to the posts.
function platformSvg(x: number, y: number, z: number) {
  return box(x - 13, y - 9, x - 10, y + 9, z - 4, z, { tone: 'lo' }, 0.3) + box(x + 10, y - 9, x + 13, y + 9, z - 4, z, { tone: 'lo' }, 0.3) + box(x - 10, y - 10, x + 10, y + 10, z - 2, z, { tone: 'mid' }, 0.6, 0.3);
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
  const slats = [part('belt-0'), part('belt-1'), part('belt-2'), part('belt-t'), part('belt-f')];
  const upperSlats = [part('ubelt-0'), part('ubelt-1'), part('ubelt-2')];
  const curveSlatEls = Array.from(svg.querySelectorAll<SVGPathElement>('[data-curve-slats]')).map((el) => ({
    el,
    lane: Number(el.dataset.curveSlats) as LaneIndex,
    lo: Number(el.dataset.lo),
    hi: Number(el.dataset.hi),
  }));
  let lastSlatPhase = -1;
  const ramEl = part('ram');
  const screens = [0, 1, 2].map((lane) => svg.querySelector(`[data-screen="m${lane}"]`));
  const linksEl = part('links');
  const pulsesEl = part('pulses');
  const evalNeedleEl = part('eval-needle');
  const cases = Array.from(svg.querySelectorAll<SVGGElement>('[data-case]'));
  const pegs = Array.from(svg.querySelectorAll<SVGGElement>('[data-peg]'));
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CARD = cardSvg();
  const BOX = boxSvg();

  const stackEl = part('stack');
  const craneEl = part('crane');
  const craneRig = document.createElementNS(SVG_NS, 'g');
  const craneCargo = document.createElementNS(SVG_NS, 'g');
  craneEl.appendChild(craneRig);
  craneEl.appendChild(craneCargo);
  const beams = document.createElementNS(SVG_NS, 'g');
  craneEl.appendChild(beams);
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
  const probeTip = [44, 44, 44];
  const dialTurn = [0, 0, 0];
  const dialTarget = [0, 0, 0];
  const verdict: Array<{ kind: 'approve' | 'changes'; t: number } | null> = [null, null, null];
  let ramBottom = 52;
  const pulses: Array<{ from: number; to: number; t: number; el: SVGCircleElement }> = [];
  const keys = { probe: ['', '', ''], ram: '' };
  let lastText = '';
  let lastStats = '';

  const onBelt = (item: Item) => item.path === 'belt' || item.path === 'trunk';
  // The funnel admits one PR at a time, and only when the queue has room
  // behind its last PR. Whoever has waited longest at a stop line goes next.
  const atStopLine = (item: Item) =>
    !item.granted &&
    ((item.path === 'curve' && item.s >= CURVE_STOP[item.lane] - 0.01) ||
      (item.path === 'belt' && item.lane === 1 && item.stage === 'approved' && item.x >= MIDDLE_STOP - 0.01));
  function admit() {
    const occupied = items.some((item) => item.granted);
    const room = !items.some((item) => item.path === 'trunk' && item.x < MERGE_X + GAP);
    if (occupied || !room) return;
    const waiting = items.filter(atStopLine).sort((a, b) => b.waitT - a.waitT);
    if (waiting.length) waiting[0].granted = true;
  }
  // The next item ahead on the same stretch of belt. Lane 1 feeds the trunk
  // directly, so its items see the trunk ahead of them.
  const ahead = (item: Item) => {
    let best: Item | null = null;
    for (const other of items) {
      if (other === item || other.done || !onBelt(other)) continue;
      const sameStretch = item.path === 'trunk' ? other.path === 'trunk' : other.lane === item.lane && other.path === 'belt' || (item.lane === 1 && other.path === 'trunk');
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
      granted: false,
      waitT: 0,
      pre: 0,
      level: -1,
      red: -1,
      retried: false,
      fade: 1,
      beamFrom: null,
      ci: 0,
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
    el.setAttribute('aria-label', `Follow ${name}`);
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
    if (item.path === 'trunk') return item.stage === 'merged' ? GONE_X + 40 : ENTRY_X;
    switch (item.stage) {
      case 'new':
      case 'fixing':
        return LANES[item.lane].machine;
      case 'built':
        return REVIEW_X;
      case 'changes':
        return HOIST_X;
      default:
        return item.lane === 1 ? (item.granted ? MERGE_X : MIDDLE_STOP) : CURVE_X0;
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
        if (items.some((other) => other.lane === lane && other.path === 'curve' && other.s < GAP)) return true;
        item.path = 'curve';
        item.s = 0;
        item.t = 0;
        return true;
      }
      if (!item.granted) {
        item.waitT += dt;
        return true;
      }
      item.path = 'trunk';
      item.granted = false;
      item.t = 0;
      return false;
    }
    if (item.path === 'trunk' && item.stage === 'approved') {
      // The entry pad: CI on the PR's own branch must be green first.
      if (item.pre < 1 || item.red >= 0) return true;
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
    item.granted = false;
    returned += 1;
    pulse(TAP.queue, TAP[LANES[item.lane].key]);
  }

  function runMerge(dt: number) {
    // CI on each queued PR's own branch runs while it waits; a red one leaves
    // from the pad.
    for (const item of items) {
      if (item.path === 'trunk' && item.stage === 'approved' && item.pre < 1) {
        item.pre = Math.min(1, item.pre + dt / ENTRY_CI);
        if (item.pre >= 1 && FAILS_ENTRY(item.id) && !item.retried) item.red = 0;
      }
    }
    for (const item of items) {
      if (item.path === 'trunk' && item.red >= 0 && Math.abs(item.x - ENTRY_X) < 0.5) {
        item.red += dt;
        if (item.red > 0.9) teleport(item);
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
        crane.hook = rest + (BELT_Z + BOX_H - rest) * ease(crane.t / 0.3);
        if (crane.t >= 0.3) Object.assign(crane, { phase: 'lift', t: 0 });
      } else if (crane.phase === 'lift') {
        item.z = BELT_Z + (TRAVEL_Z - BELT_Z) * ease(crane.t / 0.45);
        crane.hook = item.z + BOX_H;
        if (crane.t >= 0.45) Object.assign(crane, { phase: 'carry', t: 0 });
      } else if (crane.phase === 'carry') {
        item.x = ENTRY_X + (STACK_X - ENTRY_X) * ease(crane.t / 0.7);
        crane.x = item.x;
        // Hover until the stack has settled: nothing leaving the frame, no
        // red PR fading out of it, every level at rest.
        const settled =
          !items.some((other) => (other.stage === 'merged' && other.path === 'trunk' && other.x < STACK_X + 18) || (other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[0] - STACK_X) < 1)) &&
          stack.every((candidate, level) => candidate.z === levelZ(level));
        if (crane.t >= 0.7 && settled) Object.assign(crane, { phase: 'lower', t: 0, target: levelZ(stack.length) });
      } else if (crane.phase === 'lower') {
        item.z = TRAVEL_Z + (crane.target - TRAVEL_Z) * ease(crane.t / 0.45);
        crane.hook = item.z + BOX_H;
        if (crane.t >= 0.45) {
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
      if (crane.t >= 0.25) Object.assign(crane, { phase: 'return', t: 0 });
    } else if (crane.phase === 'return') {
      crane.x = STACK_X + (ENTRY_X - STACK_X) * ease(crane.t / 0.55);
      if (crane.t >= 0.55) Object.assign(crane, { phase: 'idle', t: 0 });
    } else {
      crane.hook += (rest - crane.hook) * (1 - Math.exp(-dt / 0.12));
    }

    // The stack: every level tests at once, each rebased on the one below.
    // A delivered PR has to clear the frame before the stack settles onto
    // main behind it.
    const leaving =
      items.some((other) => other.stage === 'merged' && other.path === 'trunk' && other.x < STACK_X + 18) ||
      items.some((other) => other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[0] - STACK_X) < 1);
    stack.forEach((candidate, level) => {
      candidate.level = level;
      // While anything is leaving the frame, the stack holds still.
      const target = leaving ? candidate.z : levelZ(level);
      candidate.z += (target - candidate.z) * (1 - Math.exp(-dt / 0.1));
      if (Math.abs(candidate.z - target) < 0.05) candidate.z = target;
      if (candidate.red >= 0) {
        candidate.red += dt;
        return;
      }
      if (candidate.ci < 1) {
        candidate.ci = Math.min(1, candidate.ci + dt / (candidate.ciNeed * STACK_CI));
        if (candidate.ci >= 1 && FAILS_IN_STACK(candidate.id) && !candidate.retried) candidate.red = 0;
      }
    });
    // A red candidate goes back; everything above it was built on it, so it
    // drops a level and tests again.
    // Nothing leaves the stack while the crane is setting a PR down on it.
    const lowering = crane.phase === 'lower';
    const red = lowering ? undefined : stack.find((candidate) => candidate.red > 1.0);
    if (red) {
      const at = stack.indexOf(red);
      stack.splice(at, 1);
      for (const above of stack.slice(at)) above.ci = 0;
      teleport(red);
    }
    // The bottom PR sits on main: once it is green, it is delivered.
    const bottom = stack[0];
    const mainClear = !items.some((other) => other.stage === 'merged' && other.path === 'trunk' && other.x < STACK_X + GAP + 6);
    if (!lowering && !red && bottom && bottom.z === levelZ(0) && bottom.ci >= 1 && bottom.red < 0 && mainClear) {
      stack.shift();
      bottom.path = 'trunk';
      bottom.stage = 'merged';
      bottom.level = -1;
      bottom.x = STACK_X;
      bottom.t = 0;
      merged += 1;
      pulse(TAP.queue, TAP.dock);
    }

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

    admit();
    const belts = items.filter((item) => item.path === 'belt' || item.path === 'trunk' || item.path === 'drop').sort((a, b) => b.x - a.x);
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
      if (item.path !== 'belt' && item.path !== 'trunk') continue;
      let limit = stopFor(item);
      const next = ahead(item);
      if (next) limit = Math.min(limit, next.x - GAP);
      // An outer lane's belt sees the PRs on its curve as the ones ahead.
      if (item.path === 'belt' && item.lane !== 1) {
        const onCurve = items.filter((other) => other.lane === item.lane && other.path === 'curve');
        if (onCurve.length) limit = Math.min(limit, CURVE_X0 + Math.min(...onCurve.map((other) => other.s)) - GAP);
      }
      // The pad stays clear while the crane is still low over it or a red PR
      // is leaving from it.
      if (item.path === 'trunk' && item.stage === 'approved') {
        const padBusy = (crane.item !== null && crane.item.z < BELT_Z + BOX_H + 6 && Math.abs(crane.item.x - ENTRY_X) < 1) ||
          items.some((other) => other.path === 'teleport' && other.beamFrom !== null && Math.abs(other.beamFrom[0] - ENTRY_X) < 1);
        if (padBusy) limit = Math.min(limit, ENTRY_X - GAP);
      }
      // Hold back for a returned PR being set down ahead of the machine, and
      // for a lift that is still low where it stands.
      const lift = lifts[item.lane];
      if (item.path === 'belt' && lift.down.item && lift.down.item.t >= 0 && item.x < dropX(item.lane) - 1) limit = Math.min(limit, dropX(item.lane) - GAP);
      if (item.path === 'belt' && lift.up.item && lift.up.z < BELT_Z + 16 && item.x < HOIST_X - 1) limit = Math.min(limit, HOIST_X - GAP);
      if (limit > item.x) item.x = Math.min(limit, item.x + SPEED * dt);
      if (item.stage === 'merged' && item.x >= GONE_X) {
        deployed += 1;
        beacon = 0;
        finish(item);
      }
    }

    // The merge curves: each outer lane flows into the trunk.
    for (const index of [0, 2] as LaneIndex[]) {
      const total = curveLength(index);
      const riding = items.filter((item) => item.lane === index && item.path === 'curve').sort((a, b) => b.s - a.s);
      riding.forEach((item, order) => {
        let limit = total;
        if (order > 0) limit = Math.min(limit, riding[order - 1].s - GAP);
        if (!item.granted) limit = Math.min(limit, CURVE_STOP[index]);
        if (atStopLine(item)) item.waitT += dt;
        if (limit > item.s) item.s = Math.min(limit, item.s + SPEED * dt);
        [item.x, item.y] = curveAt(index, item.s);
        if (item.s >= total - 0.01) {
          item.path = 'trunk';
          item.granted = false;
          item.x = MERGE_X;
          item.y = TRUNK_Y;
          item.t = 0;
        }
      });
    }

    runLifts(dt);
    runMerge(dt);

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
    const agent = AGENTS[item.lane].label;
    if (item.done) return 'deployed · stage → production';
    if (item.path === 'drop') return `picked up · ${agent}`;
    if (item.path === 'liftUp' || item.path === 'upper' || item.path === 'liftDown') return `changes requested · back to ${agent}`;
    if (item.path === 'teleport') return `red in the queue · teleported back to ${agent}`;
    if (item.path === 'curve') return item.granted ? 'approved · merging into the queue' : 'approved · waiting to merge';
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
          const base = below ? `rebased on ${below.name}` : 'rebased on main';
          return `merge queue · level ${item.level + 1} · ${base} · ${item.red >= 0 ? 'red' : item.ci < 1 ? 'CI running' : item.level === 0 ? 'green, delivering' : 'green, waiting'}`;
        }
        if (item.path !== 'trunk') return 'approved · to the queue';
        if (Math.abs(item.x - ENTRY_X) < 0.5) return item.red >= 0 ? 'branch CI red · back to the line' : item.pre < 1 ? 'merge queue · branch CI running' : 'merge queue · branch green, waiting for the crane';
        return 'approved · to the merge queue';
      case 'merged':
        return 'main · fast-forwarded · deploying';
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
    if (item.path === 'curve') {
      if (item.x > FUNNEL_X0 - 12) return laneItems[1];
      if (item.lane === 0) return item.y < LANES[0].y + 11 ? laneItems[0] : item.y < LANES[1].y - 11 ? gaps[0] : laneItems[1];
      return item.y > LANES[2].y - 11 ? laneItems[2] : item.y > LANES[1].y + 11 ? gaps[1] : laneItems[1];
    }
    if (item.path === 'stack') return stackEl;
    if (item.path === 'crane') return craneCargo;
    if (item.path === 'teleport') return item.beamFrom ? (item.level >= 0 || item.z > BELT_Z + 1 ? stackEl : laneItems[1]) : upperEls[item.lane];
    if (item.path === 'trunk') return laneItems[1];
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
      item.ciDot.setAttribute('data-state', item.stage === 'merged' || item.ci >= 1 ? 'green' : item.ci > 0 ? 'running' : 'none');
      item.el.toggleAttribute('data-flag', item.flag);
      item.el.style.opacity = item.fade < 1 ? item.fade.toFixed(2) : '';
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

    // Links on the trunk: queued candidates dotted to the one ahead, main solid.
    const chain = items.filter((item) => item.path === 'trunk' && item.stage === 'merged').sort((a, b) => a.x - b.x);
    let links = '';
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      if (b.x > GONE_X - 30) continue;
      const solid = a.stage === 'merged';
      links += k.wireSvg(at([a.x + 8, a.y, BELT_Z + 5]), at([b.x - 8, b.y, BELT_Z + 5]), { tone: solid ? 'hi' : 'mid', dotted: !solid, size: 0.9 });
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
    const ramKey = ramBottom.toFixed(2);
    if (ramKey !== keys.ram) {
      keys.ram = ramKey;
      ramEl.innerHTML = ramSvg(LANES[2].machine, LANES[2].y, ramBottom);
    }

    const onPad = items.find((item) => item.path === 'trunk' && item.stage === 'approved' && Math.abs(item.x - ENTRY_X) < 0.5);
    setLamp('entry', !onPad ? null : onPad.red >= 0 ? 'red' : onPad.pre >= 1 ? 'green' : 'blink');
    for (let level = 0; level < STACK_MAX; level++) {
      const candidate = stack[level];
      setLamp(`lvl${level}`, !candidate ? null : candidate.red >= 0 ? 'red' : candidate.ci >= 1 ? 'green' : 'blink');
    }
    // The crane, and the beams of PRs teleporting back.
    const craneKey = `${crane.x.toFixed(1)}:${crane.hook.toFixed(1)}`;
    if (craneKey !== crane.key) {
      crane.key = craneKey;
      craneRig.innerHTML = craneSvg(crane.x, crane.hook);
    }
    let beamSvg = '';
    for (const item of items) {
      if (item.path !== 'teleport') continue;
      const [bx, by, bz] = item.beamFrom ?? [item.x, item.y, item.z];
      const strength = item.beamFrom ? 1 - item.fade : item.fade;
      beamSvg += `<path class="fx-beam" style="opacity:${(0.85 * Math.sin(Math.PI * Math.min(1, strength + 0.15))).toFixed(2)}" d="${k.pathOf([at([bx - 6, by + 7, bz]), at([bx + 6, by + 7, bz]), at([bx + 6, by + 7, bz + 90]), at([bx - 6, by + 7, bz + 90])], true)}"/>`;
    }
    if (beams.innerHTML !== beamSvg) beams.innerHTML = beamSvg;
    setLamp('stage', beacon < 0.9 ? 'lit' : null);
    setLamp('production', beacon > 0.6 && beacon < 1.7 ? 'lit' : null);

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
    const phase = Math.round((travel % 6) * 4) / 4;
    if (phase !== lastSlatPhase) {
      lastSlatPhase = phase;
      for (const curve of curveSlatEls) curve.el.setAttribute('d', curveSlats(curve.lane, curve.lo, curve.hi, phase));
    }

    const caseAt = Math.floor(clock / 1.3) % 11;
    cases.forEach((el, i) => {
      const lifted = i === caseAt;
      if (lifted !== el.hasAttribute('data-on')) {
        el.toggleAttribute('data-on', lifted);
        el.setAttribute('transform', lifted ? k.translateAlong(P, [0, 0, 2.4]) : '');
      }
    });
    const caseT = (clock % 1.3) / 1.3;
    evalNeedleEl.setAttribute('d', needleD(EVAL_DIAL, -0.375 + 0.75 * (0.15 + 0.7 * ease(caseT * 1.6) - 0.7 * ease((caseT - 0.75) * 4))));
    const pegAt = Math.floor(clock / 0.18) % 44;
    pegs.forEach((el, i) => el.toggleAttribute('data-on', i <= pegAt && pegAt < 40));

    const text = tracked ? `${tracked.name} · ${phaseOf(tracked)}` : 'warming up';
    if (readout && text !== lastText) {
      lastText = text;
      readout.textContent = text;
    }
    const statsText = `${merged} merged · ${deployed} deployed · ${reviewsDone} reviews · ${returned} sent back`;
    if (stats && statsText !== lastStats) {
      lastStats = statsText;
      stats.textContent = statsText;
    }
  }

  // A read-only snapshot of where every item is, for tests.
  Object.assign(stage, { factoryState: () => items.map((item) => ({ id: item.id, lane: item.lane, path: item.path, stage: item.stage, granted: item.granted, level: item.level, x: item.x, y: item.y, z: item.z })) });

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
