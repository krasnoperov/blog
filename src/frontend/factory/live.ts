import * as k from './iso-kit';
import type { Plan, SolidPaths } from './iso-kit';
import {
  BELT_Z,
  BOX_H,
  BUS,
  CARD_H,
  DIAL,
  EVAL_DIAL,
  HEAD_REST_BOTTOM,
  MERGE_X,
  P,
  PROBE,
  REAR_PATH,
  STATION,
  TAP,
  TURRET,
  at,
  depth,
} from './layout';

// The moving half of the figure. One small discrete model runs the line:
// issues spawn at the hopper, move on belts that accumulate (an item never
// closes within GAP of the one ahead), and dwell at stations. Every readout,
// lamp and counter is read from this model.

const SVG_NS = 'http://www.w3.org/2000/svg';
const SPEED = 46;
const GAP = 27;
const TAU = Math.PI * 2;

export const AGENTS = [
  { key: 'patchrelay', label: 'patchrelay → Codex' },
  { key: 'claude', label: 'Claude Code' },
  { key: 'codex', label: 'Codex' },
] as const;

// Who picks up each issue, how many review rounds it takes, and which ones
// triage bounces back for more input. Patterns, so the tour repeats.
const AGENT_OF = [0, 1, 0, 2, 0, 1, 2, 0];
const ROUNDS_OF = [1, 2, 1, 1, 3, 1, 2, 1, 1];
const REJECT_EVERY = 7;

type Lane = 'drop' | 'front' | 'rear' | 'reject' | 'gone';
type Stage = 'new' | 'triaged' | 'built' | 'changes' | 'fixing' | 'approved' | 'merged' | 'rejected';

interface Item {
  id: number;
  name: string;
  agent: number;
  rounds: number;
  reviews: number;
  rejected: boolean;
  lane: Lane;
  stage: Stage;
  s: number;
  x: number;
  y: number;
  z: number;
  t: number;
  busy: boolean;
  morph: number;
  ci: number;
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
  ].join('');
}

function head(index: number, cx: number, cy: number, bottom: number) {
  const top = bottom + 12;
  const neck = cyl(cx, cy, 1.5, top, TURRET.diskBottom, { crease: 'none' }, 12);
  const tip = cyl(cx, cy, 1.3, bottom, bottom + 2.6, {}, 12);
  const z0 = bottom + 2.6;
  let body: string;
  if (index === 0) {
    const hex: Array<[number, number]> = [];
    for (let i = 0; i < 6; i++) hex.push([cx + Math.cos((i * TAU) / 6) * 4.6, cy + Math.sin((i * TAU) / 6) * 4.6]);
    body = S(k.extrude(hex, z0, 8.4, P, { bevel: 0.4 }), { tone: 'mid' });
  } else if (index === 1) {
    body = cyl(cx, cy, 4.2, z0, z0 + 8.4, { inner: k.lineSvg(k.sideArc(cx, cy, 4.2, z0 + 4.2, P, 16), { tone: 'faint' }) }, 24, 0.4);
  } else {
    body = box(cx - 3.8, cy - 3.8, cx + 3.8, cy + 3.8, z0, z0 + 8.4, {}, 0.6, 0.4);
  }
  const collar = cyl(cx, cy, 2.6, top - 1.4, top, {}, 14);
  return tip + body + collar + neck;
}

function turretSvg(angle: number, active: number, extension: number) {
  const heads = AGENTS.map((_, index) => {
    const theta = angle + (index * TAU) / 3;
    const cx = TURRET.x + Math.sin(theta) * TURRET.r;
    const cy = TURRET.y + Math.cos(theta) * TURRET.r;
    const bottom = HEAD_REST_BOTTOM - (index === active ? extension : 0);
    return { index, cx, cy, bottom, key: depth(cx, cy) };
  }).sort((a, b) => a.key - b.key);
  const centre = depth(TURRET.x, TURRET.y);
  const disk = [
    cyl(TURRET.x, TURRET.y, 14, TURRET.diskBottom, TURRET.diskTop, { inner: k.lineSvg(k.knurl(TURRET.x, TURRET.y, 14, TURRET.diskBottom + 0.6, TURRET.diskTop - 0.6, 64, P), { tone: 'lo' }) }, 56, 0.6),
    k.lineSvg(k.radialTicks(TURRET.x, TURRET.y, 12.6, 3, 1, TURRET.diskTop, [0, 3.2], P, -angle + Math.PI).major, { tone: 'mid' }),
    k.lineSvg(k.ring(TURRET.x, TURRET.y, 8, TURRET.diskTop, P, 40), { tone: 'faint' }),
    cyl(TURRET.x, TURRET.y, 5, TURRET.diskTop, 99, {}, 28, 0.4),
  ].join('');
  return [
    ...heads.filter((h) => h.key < centre).map((h) => head(h.index, h.cx, h.cy, h.bottom)),
    disk,
    ...heads.filter((h) => h.key >= centre).map((h) => head(h.index, h.cx, h.cy, h.bottom)),
  ].join('');
}

function scannerSvg(drop: number) {
  return box(104, -6, 116, 6, 52 - drop, 62, { tone: 'mid' }, 1, 0.4) + cyl(110, 0, 3, 50.4 - drop, 52 - drop, { tone: 'lo' }, 18);
}

function probeSvg(tip: number) {
  return cyl(PROBE.x, PROBE.y, 0.9, tip + 2.4, 66, { crease: 'none' }, 12) + cyl(PROBE.x, PROBE.y, 2, tip, tip + 2.4, { tone: 'hi' }, 16);
}

function needleD(dial: { x: number; y: number; r: number; top: number }, turn: number) {
  const a = turn * TAU;
  return k.lineOnTop([dial.x - Math.sin(a) * 1.6, dial.y + Math.cos(a) * 1.6], [dial.x + Math.sin(a) * (dial.r - 2.6), dial.y - Math.cos(a) * (dial.r - 2.6)], dial.top + 0.2, P);
}

function rearPoint(s: number): [number, number] {
  let rest = s;
  for (let i = 0; i < REAR_PATH.length - 1; i++) {
    const [ax, ay] = REAR_PATH[i];
    const [bx, by] = REAR_PATH[i + 1];
    const length = Math.hypot(bx - ax, by - ay);
    if (rest <= length) return [ax + ((bx - ax) * rest) / length, ay + ((by - ay) * rest) / length];
    rest -= length;
  }
  return REAR_PATH[REAR_PATH.length - 1];
}

const REAR_LENGTH = REAR_PATH.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - REAR_PATH[i][0], point[1] - REAR_PATH[i][1]), 0);
const PUSHED = 22;

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
  const layers = { rear: part('rear-items'), front: part('items'), bin: part('bin'), links: part('links'), pulses: part('pulses') };
  const turretEl = part('turret');
  const scannerEl = part('scanner');
  const probeEl = part('probe');
  const divertEl = part('divert');
  const needleEl = part('needle');
  const evalNeedleEl = part('eval-needle');
  const slatsFront = part('slats-front');
  const slatsRear = part('slats-rear');
  const cases = Array.from(svg.querySelectorAll<SVGGElement>('[data-case]'));
  const pegs = Array.from(svg.querySelectorAll<SVGGElement>('[data-peg]'));
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CARD = cardSvg();
  const BOX = boxSvg();

  // Moving machine parts that share the item layer, sorted by depth with it.
  const pusher = document.createElementNS(SVG_NS, 'g');
  const blade = document.createElementNS(SVG_NS, 'g');
  blade.innerHTML = box(STATION.gate + 9.8, -11, STATION.gate + 12.2, 11, 24.6, 44, { tone: 'mid' }, 0.4, 0.3);
  layers.front.appendChild(pusher);
  layers.front.appendChild(blade);

  const items: Item[] = [];
  let serial = 0;
  let clock = 0;
  let spawnWait = 0;
  let tracked: Item | null = null;
  let trackWait = 0;
  let merged = 0;
  let deployed = 0;
  let reviewsDone = 0;
  let rejectedCount = 0;
  let binCount = 0;
  let mergeLock: Item | null = null;
  let gateOpen = 0;
  let verdict: { kind: 'approve' | 'changes'; t: number } | null = null;
  let beacon = { t: 99 };
  let rejectPush = { t: 99 };
  let divertPush = { t: 99 };
  const turret = { angle: 0, target: 0, active: 0, extension: 0 };
  let scanDrop = 0;
  let probeTip = PROBE.rest;
  let dialTurn = 0;
  let dialTarget = 0;
  const pulses: Array<{ from: number; to: number; t: number; el: SVGCircleElement }> = [];
  let lastTurretKey = '';
  let lastPusherKey = '';
  let lastDivertKey = '';
  let lastScanKey = '';
  let lastProbeKey = '';
  let lastBinKey = -1;
  let lastText = '';
  let lastStats = '';

  const ahead = (item: Item) => {
    let best: Item | null = null;
    for (const other of items) {
      if (other === item || other.lane !== 'front' || other.done) continue;
      if (other.x > item.x && (!best || other.x < best.x)) best = other;
    }
    return best;
  };

  function pulse(from: number, to: number) {
    if (still.matches) return;
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('class', 'fx-pulse');
    el.setAttribute('r', '1.6');
    layers.pulses.appendChild(el);
    pulses.push({ from, to, t: 0, el });
  }

  function spawn() {
    const id = serial++;
    const usertold = id % 3 !== 1;
    const name = usertold ? `USE-${1640 + Math.floor(id * 0.7) * 3 + (id % 2)}` : `FX-${352 + id}`;
    const el = document.createElementNS(SVG_NS, 'g');
    el.setAttribute('class', 'fx-item');
    el.innerHTML = `<g data-k="card">${CARD}</g><g data-k="box" style="display:none">${BOX}</g>`;
    const card = el.querySelector('[data-k="card"]') as SVGGElement;
    const boxEl = el.querySelector('[data-k="box"]') as SVGGElement;
    const item: Item = {
      id,
      name,
      agent: AGENT_OF[id % AGENT_OF.length],
      rounds: ROUNDS_OF[id % ROUNDS_OF.length],
      reviews: 0,
      rejected: id % REJECT_EVERY === 3,
      lane: 'drop',
      stage: 'new',
      s: 0,
      x: STATION.spawn,
      y: 0,
      z: BELT_Z + 12,
      t: 0,
      busy: false,
      morph: 0,
      ci: 0,
      el,
      card,
      box: boxEl,
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
    layers.front.appendChild(el);
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
    item.lane = 'gone';
    item.el.remove();
    items.splice(items.indexOf(item), 1);
  }

  function stopFor(item: Item): number {
    switch (item.stage) {
      case 'new':
        return item.x <= STATION.triage + 0.01 ? STATION.triage : STATION.reject;
      case 'rejected':
        return STATION.reject;
      case 'triaged':
      case 'fixing':
        return STATION.dev;
      case 'built':
        return STATION.review;
      case 'changes':
        return STATION.divert;
      case 'approved':
        return STATION.gate;
      case 'merged':
        return STATION.gone + 40;
    }
  }

  // Station work. Returns true while the item must stay put.
  function work(item: Item, dt: number): boolean {
    item.t += dt;
    const t = item.t;
    if (item.stage === 'new' && Math.abs(item.x - STATION.triage) < 0.01) {
      scanDrop = 6 * ease(t / 0.35) * (1 - ease((t - 1.0) / 0.35));
      if (t < 1.4) return true;
      item.stage = item.rejected ? 'rejected' : 'triaged';
      item.t = 0;
      return false;
    }
    if (item.stage === 'rejected' && Math.abs(item.x - STATION.reject) < 0.01) {
      if (t === dt) rejectPush = { t: 0 };
      // The pusher crosses the belt, then the card drops into the bin.
      item.y = Math.max(0, -13 + 25 * ease(t / 0.7) + 7);
      if (t < 0.7) return true;
      item.lane = 'reject';
      item.s = item.y;
      item.t = 0;
      return false;
    }
    if ((item.stage === 'triaged' || item.stage === 'fixing') && Math.abs(item.x - STATION.dev) < 0.01) {
      const fixing = item.stage === 'fixing';
      if (t === dt) {
        turret.active = item.agent;
        const goal = (-item.agent * TAU) / 3;
        let delta = (goal - turret.angle) % TAU;
        if (delta > Math.PI) delta -= TAU;
        if (delta < -Math.PI) delta += TAU;
        turret.target = turret.angle + delta;
        item.busy = Math.abs(delta) > 0.01;
      }
      const turn = item.busy ? 0.7 : 0;
      const reach = HEAD_REST_BOTTOM - (BELT_Z + (fixing ? BOX_H : CARD_H));
      const press = fixing ? 1.0 : 1.6;
      const down = clamp01((t - turn) / 0.45);
      const up = clamp01((t - turn - 0.45 - press) / 0.45);
      turret.extension = reach * (ease(down) - ease(up));
      if (!fixing) item.morph = ease((t - turn - 0.45 - press * 0.3) / (press * 0.5));
      if (t < turn + 0.9 + press) return true;
      item.stage = 'built';
      item.morph = 1;
      item.t = 0;
      pulse(TAP.dev, TAP.review);
      return false;
    }
    if (item.stage === 'built' && Math.abs(item.x - STATION.review) < 0.01) {
      const down = ease(t / 0.4);
      const up = ease((t - 1.9) / 0.4);
      probeTip = PROBE.rest - (PROBE.rest - (BELT_Z + BOX_H)) * (down - up);
      const passing = item.reviews + 1 >= item.rounds;
      dialTarget = t < 0.4 ? 0 : t < 1.6 ? 0.12 + 0.06 * Math.sin(t * 9) + 0.1 * (t - 0.4) : passing ? 0.86 : 0.34;
      if (t < 2.3) return true;
      item.reviews += 1;
      reviewsDone += 1;
      item.stage = passing ? 'approved' : 'changes';
      verdict = { kind: passing ? 'approve' : 'changes', t: 0 };
      dialTarget = 0;
      item.t = 0;
      pulse(TAP.review, passing ? TAP.gate : TAP.dev);
      return false;
    }
    if (item.stage === 'changes' && Math.abs(item.x - STATION.divert) < 0.01) {
      if (t === dt && items.some((other) => other.lane === 'rear' && other.s < PUSHED + GAP)) {
        item.t = 0;
        return true;
      }
      if (t === dt) divertPush = { t: 0 };
      const push = ease(clamp01((t - 0.25) / 0.6));
      item.y = -PUSHED * push;
      if (t < 0.85) return true;
      item.lane = 'rear';
      item.s = PUSHED;
      item.t = 0;
      return false;
    }
    if (item.stage === 'approved' && Math.abs(item.x - STATION.gate) < 0.01) {
      const mainClear = !items.some((other) => other !== item && other.stage === 'merged' && other.x < STATION.gate + GAP + 14);
      if (item.ci < 1 || !mainClear) return true;
      item.stage = 'merged';
      merged += 1;
      gateOpen = 1.1;
      item.t = 0;
      pulse(TAP.gate, TAP.dock);
      return false;
    }
    return false;
  }

  function step(dt: number) {
    clock += dt;
    spawnWait -= dt;
    const active = items.filter((item) => !item.done && item.lane !== 'reject').length;
    const hopperClear = !items.some((item) => (item.lane === 'front' || item.lane === 'drop') && item.x < STATION.spawn + GAP);
    const upstream = items.filter((item) => (item.lane === 'front' || item.lane === 'drop') && (item.stage === 'new' || item.stage === 'triaged')).length;
    if (spawnWait <= 0 && active < 9 && upstream < 3 && hopperClear) {
      spawn();
      spawnWait = 3.4;
    }

    // Front belt, front to back so each item sees where the one ahead settled.
    const front = items.filter((item) => item.lane === 'front' || item.lane === 'drop').sort((a, b) => b.x - a.x);
    for (const item of front) {
      if (item.lane === 'drop') {
        item.t += dt;
        item.z = BELT_Z + 12 * (1 - ease(item.t / 0.4));
        if (item.t >= 0.4) {
          item.lane = 'front';
          item.z = BELT_Z;
          item.t = 0;
        }
        continue;
      }
      if (item.stage === 'approved' && item.x > STATION.queueStart && item.ci < 1) item.ci = Math.min(1, item.ci + dt / 2.8);
      const stop = stopFor(item);
      const atStop = Math.abs(item.x - stop) < 0.01;
      if (atStop && work(item, dt)) continue;
      let limit = stopFor(item);
      const next = ahead(item);
      if (next) limit = Math.min(limit, next.x - GAP);
      if (mergeLock && item.x < MERGE_X - 1) limit = Math.min(limit, MERGE_X - GAP);
      if (limit > item.x) item.x = Math.min(limit, item.x + SPEED * dt);
      if (item.stage === 'merged' && item.x >= STATION.gone) {
        deployed += 1;
        beacon = { t: 0 };
        finish(item);
      }
    }

    // The rework loop.
    const rear = items.filter((item) => item.lane === 'rear').sort((a, b) => b.s - a.s);
    for (let i = 0; i < rear.length; i++) {
      const item = rear[i];
      let limit = REAR_LENGTH;
      if (i > 0) limit = Math.min(limit, rear[i - 1].s - GAP);
      const entry = REAR_LENGTH - 14;
      const beltClear = !items.some((other) => other.lane === 'front' && Math.abs(other.x - MERGE_X) < GAP);
      if (mergeLock !== item && (!beltClear || mergeLock)) limit = Math.min(limit, entry);
      if (item.s >= entry - 0.01 && limit > entry && !mergeLock) mergeLock = item;
      if (limit > item.s) item.s = Math.min(limit, item.s + SPEED * dt);
      [item.x, item.y] = rearPoint(item.s);
      if (item.s >= REAR_LENGTH - 0.01) {
        item.lane = 'front';
        item.stage = 'fixing';
        item.x = MERGE_X;
        item.y = 0;
        if (mergeLock === item) mergeLock = null;
      }
    }

    // Rejected cards: lift over the rail, drop into the bin.
    for (const item of items.filter((candidate) => candidate.lane === 'reject')) {
      item.t += dt;
      const t = clamp01(item.t / 0.6);
      const lifted = BELT_Z + 1.6;
      const landed = 1.4 + Math.min(binCount, 2) * CARD_H;
      const fall = clamp01((t - 0.35) / 0.65);
      item.y = item.s + (31 - item.s) * ease(t);
      item.z = t < 0.35 ? BELT_Z + 1.6 * ease(t / 0.35) : lifted - (lifted - landed) * fall * fall;
      if (item.t >= 0.6) {
        rejectedCount += 1;
        binCount = binCount >= 3 ? 1 : binCount + 1;
        finish(item);
      }
    }

    // Machines.
    if (!still.matches || Math.abs(turret.target - turret.angle) > 0.001) turret.angle += (turret.target - turret.angle) * (1 - Math.exp(-dt / 0.18));
    if (Math.abs(turret.target - turret.angle) < 0.002) turret.angle = turret.target;
    if (!items.some((item) => item.lane === 'front' && Math.abs(item.x - STATION.triage) < 0.01 && item.stage === 'new')) scanDrop *= Math.exp(-dt / 0.1);
    if (!items.some((item) => item.lane === 'front' && Math.abs(item.x - STATION.review) < 0.01 && item.stage === 'built')) {
      probeTip += (PROBE.rest - probeTip) * (1 - Math.exp(-dt / 0.12));
      dialTarget = 0;
    }
    dialTurn += (dialTarget - dialTurn) * (1 - Math.exp(-dt / 0.16));
    rejectPush.t += dt;
    divertPush.t += dt;
    beacon.t += dt;
    gateOpen = Math.max(0, gateOpen - dt);
    if (verdict) verdict.t += dt;
    for (const p of pulses) p.t += dt;

    if (tracked && tracked.done) {
      trackWait += dt;
      if (trackWait > 1.4) {
        const next = [...items].filter((item) => !item.done && item.lane !== 'reject').sort((a, b) => b.id - a.id)[0];
        if (next) follow(next);
      }
    }
  }

  function phaseOf(item: Item): string {
    const agent = AGENTS[item.agent].label;
    if (item.done) return item.stage === 'merged' ? 'deployed · stage → production' : 'needs input · back in Linear';
    if (item.lane === 'drop') return 'filed in Linear';
    if (item.lane === 'reject') return 'needs input · back in Linear';
    if (item.lane === 'rear') return `changes requested · back to ${agent}`;
    const here = (x: number) => Math.abs(item.x - x) < 0.01;
    switch (item.stage) {
      case 'new':
        return here(STATION.triage) ? 'triage · classifying the issue' : 'to triage';
      case 'rejected':
        return 'triage · needs input';
      case 'triaged':
        return here(STATION.dev) ? `dev · ${agent}` : `delegated · ${agent}`;
      case 'fixing':
        return here(STATION.dev) ? `fixing review · ${agent}` : `review fix · ${agent}`;
      case 'built':
        return here(STATION.review) ? `review-quill · round ${item.reviews + 1}` : `PR opened · review requested`;
      case 'changes':
        return `changes requested · round ${item.reviews}`;
      case 'approved':
        if (item.x <= STATION.queueStart) return 'approved · to the merge queue';
        return item.ci < 1 ? 'merge queue · candidate CI running' : here(STATION.gate) ? 'merge queue · green, landing next' : 'merge queue · green, waiting';
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

  function render() {
    // Items.
    const rearList: Item[] = [];
    const frontList: Array<{ el: Element; key: number }> = [];
    for (const item of items) {
      const z = item.lane === 'drop' || item.lane === 'reject' ? item.z : BELT_Z;
      item.el.setAttribute('transform', k.translateAlong(P, [item.x, item.y, z]));
      const morph = item.morph;
      item.card.style.display = morph >= 1 ? 'none' : '';
      item.box.style.display = morph <= 0 ? 'none' : '';
      item.card.style.opacity = morph > 0 && morph < 1 ? String(1 - morph) : '';
      item.box.style.opacity = morph > 0 && morph < 1 ? String(morph) : '';
      item.ciDot.setAttribute('data-state', item.stage === 'merged' || item.ci >= 1 ? 'green' : item.ci > 0 ? 'running' : 'none');
      if (item.lane === 'reject' && item.y > 14) {
        if (item.el.parentNode !== layers.bin) layers.bin.appendChild(item.el);
      } else if (item.y < -13) rearList.push(item);
      else frontList.push({ el: item.el, key: depth(item.x, item.y) });
    }
    rearList.sort((a, b) => depth(a.x, a.y) - depth(b.x, b.y));
    for (const item of rearList) if (layers.rear.lastChild !== item.el) layers.rear.appendChild(item.el);

    const pushOut = rejectPush.t < 0.7 ? ease(rejectPush.t / 0.7) : 1 - ease((rejectPush.t - 0.75) / 0.5);
    const plateY = -13 + 25 * pushOut;
    const pusherKey = plateY.toFixed(2);
    if (pusherKey !== lastPusherKey) {
      lastPusherKey = pusherKey;
      pusher.innerHTML = box(STATION.reject - 1.2, -15, STATION.reject + 1.2, plateY - 1, 26.4, 28.6, { crease: 'none' }, 0.4) + box(STATION.reject - 7, plateY - 1, STATION.reject + 7, plateY + 1, 25.2, 30.5, { tone: 'mid' }, 0.4, 0.3);
    }
    frontList.push({ el: pusher, key: depth(STATION.reject, plateY - 2) });
    blade.setAttribute('transform', k.translateAlong(P, [0, 0, 20 * ease(Math.min(1, gateOpen * 3, (1.1 - gateOpen) * 4 + 0.001))]));
    frontList.push({ el: blade, key: depth(STATION.gate + 11, 0) });
    frontList.sort((a, b) => a.key - b.key);
    const current = Array.from(layers.front.children);
    if (frontList.some((entry, i) => current[i] !== entry.el)) for (const entry of frontList) layers.front.appendChild(entry.el);

    // Links: speculative candidates are dotted to the item ahead, main is solid.
    const chain = items.filter((item) => item.lane === 'front' && item.x > STATION.queueStart - 4 && (item.stage === 'approved' || item.stage === 'merged')).sort((a, b) => a.x - b.x);
    let links = '';
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i];
      const b = chain[i + 1];
      if (b.x > STATION.gone - 30) continue;
      const solid = a.stage === 'merged';
      const from = at([a.x + 8, a.y, BELT_Z + 5]);
      const to = at([b.x - 8, b.y, BELT_Z + 5]);
      links += k.wireSvg(from, to, { tone: solid ? 'hi' : 'mid', dotted: !solid, size: 0.9 });
    }
    if (chain.length && chain[chain.length - 1].stage === 'approved') {
      // The front candidate links to wherever main currently ends: the gate.
      const head = chain[chain.length - 1];
      links += k.wireSvg(at([head.x + 8, head.y, BELT_Z + 5]), at([STATION.gate + 9.6, 0, BELT_Z + 5]), { tone: 'mid', dotted: true, size: 0.9 });
    }
    if (layers.links.innerHTML !== links) layers.links.innerHTML = links;

    // Machines.
    const turretKey = `${turret.angle.toFixed(3)}:${turret.extension.toFixed(2)}:${turret.active}`;
    if (turretKey !== lastTurretKey) {
      lastTurretKey = turretKey;
      turretEl.innerHTML = turretSvg(turret.angle, turret.active, turret.extension);
    }
    const scanKey = scanDrop.toFixed(2);
    if (scanKey !== lastScanKey) {
      lastScanKey = scanKey;
      scannerEl.innerHTML = scannerSvg(scanDrop);
    }
    const probeKey = probeTip.toFixed(2);
    if (probeKey !== lastProbeKey) {
      lastProbeKey = probeKey;
      probeEl.innerHTML = probeSvg(probeTip);
    }
    needleEl.setAttribute('d', needleD(DIAL, dialTurn));
    const divertOut = divertPush.t < 0.85 ? ease(clamp01((divertPush.t - 0.25) / 0.6)) : 1 - ease((divertPush.t - 0.9) / 0.6);
    const plate = 15 - (PUSHED + 7) * divertOut;
    const divertKey = plate.toFixed(2);
    if (divertKey !== lastDivertKey) {
      lastDivertKey = divertKey;
      divertEl.innerHTML = box(STATION.divert - 1.4, plate + 1, STATION.divert + 1.4, 17, 29.4, 32, { crease: 'none' }, 0.4) + box(STATION.divert - 8, plate - 1, STATION.divert + 8, plate + 1, 26.4, 35, { tone: 'mid' }, 0.4, 0.3);
    }
    if (binCount !== lastBinKey) {
      lastBinKey = binCount;
      const stack: string[] = [];
      for (let i = 0; i < binCount; i++) stack.push(`<g transform="${k.translateAlong(P, [146 + (i % 2) * 1.5, 31 - i, 1.4 + i * CARD_H])}">${CARD}</g>`);
      const flying = Array.from(layers.bin.querySelectorAll('.fx-item'));
      layers.bin.innerHTML = stack.join('');
      for (const el of flying) layers.bin.appendChild(el);
    }

    // Lamps.
    const triaging = items.some((item) => item.lane === 'front' && item.stage === 'new' && Math.abs(item.x - STATION.triage) < 0.01);
    setLamp('triage', triaging ? 'lit' : null);
    setLamp('verdict', verdict && verdict.t < 1.6 ? (verdict.kind === 'approve' ? 'lit' : 'red') : null);
    const atGate = items.find((item) => item.lane === 'front' && item.stage === 'approved' && Math.abs(item.x - STATION.gate) < 0.01);
    setLamp('approved', atGate ? 'lit' : null);
    setLamp('ci', atGate && atGate.ci >= 1 ? 'green' : null);
    setLamp('stage', beacon.t < 0.9 ? 'lit' : null);
    setLamp('production', beacon.t > 0.6 && beacon.t < 1.7 ? 'lit' : null);

    // Bus pulses.
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const span = Math.abs(p.to - p.from);
      const t = clamp01((p.t * 340) / Math.max(span, 1));
      const [x, y] = at([p.from + (p.to - p.from) * ease(t), BUS.y1 + 0.2, 126]);
      p.el.setAttribute('cx', x.toFixed(1));
      p.el.setAttribute('cy', y.toFixed(1));
      p.el.style.opacity = String(Math.min(1, (1 - t) * 6, p.t * 8));
      if (t >= 1) {
        p.el.remove();
        pulses.splice(i, 1);
      }
    }

    // Belts.
    const travel = still.matches ? 0 : clock * SPEED;
    slatsFront.setAttribute('transform', k.translateAlong(P, [travel % 8, 0, 0]));
    slatsRear.setAttribute('transform', k.translateAlong(P, [-(travel % 8), 0, 0]));

    // Eval bench: review-quill replays its eleven cases, the scenario pegs run.
    const caseAt = Math.floor(clock / 1.3) % 11;
    cases.forEach((el, i) => {
      const lifted = i === caseAt;
      if (lifted !== el.hasAttribute('data-on')) {
        if (lifted) el.setAttribute('data-on', '');
        else el.removeAttribute('data-on');
        el.setAttribute('transform', lifted ? k.translateAlong(P, [0, 0, 2.4]) : '');
      }
    });
    const caseT = (clock % 1.3) / 1.3;
    evalNeedleEl.setAttribute('d', needleD(EVAL_DIAL, -0.375 + 0.75 * (0.15 + 0.7 * ease(caseT * 1.6) - 0.7 * ease((caseT - 0.75) * 4))));
    const pegAt = Math.floor(clock / 0.18) % 44;
    pegs.forEach((el, i) => {
      const on = i <= pegAt && pegAt < 34 + 6;
      if (on !== el.hasAttribute('data-on')) {
        if (on) el.setAttribute('data-on', '');
        else el.removeAttribute('data-on');
      }
    });

    // Readout and counters.
    const text = tracked ? `${tracked.name} · ${phaseOf(tracked)}` : 'warming up';
    if (readout && text !== lastText) {
      lastText = text;
      readout.textContent = text;
    }
    const statsText = `${merged} merged · ${deployed} deployed · ${reviewsDone} reviews · ${rejectedCount} back to Linear`;
    if (stats && statsText !== lastStats) {
      lastStats = statsText;
      stats.textContent = statsText;
    }
  }

  // Warm the line up so the first frame is already busy.
  for (let i = 0; i < 26 * 30; i++) step(1 / 30);
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
    pusher.remove();
    blade.remove();
    for (const p of pulses) p.el.remove();
  };
}

