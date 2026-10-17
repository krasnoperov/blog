import * as k from './iso-kit';
import type { Plan, Point3 } from './iso-kit';
import { byDepth, parts } from './isoParts';

// Fig 2 as an isometric bench: one rail per ref, commits standing on them,
// parent links drawn on the bench, a CI lamp and a status plate per
// candidate, and two gauges counting CI cycles.

export const QUEUE_W = 1200;
export const QUEUE_H = 470;

export type Row = 'main' | 41 | 42 | 43 | 'heads';
export const ROW_Y: Record<Row, number> = { main: 20, 41: 84, 42: 148, 43: 212, heads: 286 };

const BENCH: Plan = { x: -20, y: -24, w: 900, d: 360, r: 10 };
const RAIL_X0 = 190;
const RAIL_X1 = 668;

// Commit positions are authored on a 230..760 scale; the bench is shorter.
export const qx = (x: number) => 230 + (x - 230) * 0.8;
const RAIL_Z = 2.4;
export const PUCK_Z = RAIL_Z;

const EXTREMES: Point3[] = [...k.boxCorners(BENCH, -8, 0), [800, ROW_Y.heads, 70]];
export const QUEUE_P = k.fitProjection(EXTREMES, QUEUE_W, QUEUE_H, { pad: 12, azimuth: 74, elevation: 38 });
const D = parts(QUEUE_P);

function plate(x: number, y: number, w: number, h = 13) {
  return D.S(k.slabOf(D.plan(x, y - 1.5, w, 3, 0.5), 0, h, QUEUE_P, 2, 0.3), { tone: 'mid' });
}

let cached: string | null = null;

export function queueStatic() {
  if (cached) return cached;
  const out = [D.bench(BENCH)];
  const names: Record<Row, string> = {
    main: 'main',
    41: 'merge-steward/main/pr-41',
    42: 'merge-steward/main/pr-42',
    43: 'merge-steward/main/pr-43',
    heads: 'PR heads, approved',
  };
  for (const row of ['main', 41, 42, 43, 'heads'] as Row[]) {
    const y = ROW_Y[row];
    out.push(plate(4, y, 170));
    out.push(D.face(8, y + 1.5, 4.4, names[row], 7.2, 'hi'));
    if (row !== 'heads') out.push(D.rail(RAIL_X0, RAIL_X1, y, 0));
  }
  // A lamp post and a status plate at the end of each candidate rail.
  for (const n of [41, 42, 43] as const) {
    const y = ROW_Y[n];
    out.push(D.cyl(690, y, 4.2, 0, 1.4, { tone: 'lo' }, 20));
    out.push(D.cyl(690, y, 1.6, 1.4, 16, { crease: 'none' }, 14));
    out.push(D.S(k.cylinder(690, y, 3.4, 16, 6, QUEUE_P, 22), { tone: 'mid', crease: 'none', className: 'fx-lamp' }).replace('<g ', `<g data-lane="${n}" `));
    out.push(D.cyl(690, y, 3.9, 22, 1.2, {}, 20, 0.3));
    out.push(plate(706, y, 150));
  }
  // Gauge bases for the CI-cycle counters.
  for (const x of [730, 792]) out.push(D.slab(D.plan(x - 12, ROW_Y.heads - 30, 24, 24, 2), 0, 2, { tone: 'lo' }, 0.4));
  cached = out.join('');
  return cached;
}

export interface QueueScene {
  commits: Array<{ id: string; x: number; row: Row; sha: string; state?: string }>;
  links: Array<{ from: [number, Row]; to: [number, Row]; landed: boolean }>;
  lanes: Record<41 | 42 | 43, { text: string; tone: string }>;
  ci: { serial: number; queue: number };
}

export function queueDynamic(scene: QueueScene) {
  const out: string[] = [];
  const pt = ([x, row]: [number, Row]): [number, number] => [qx(x), ROW_Y[row]];
  const plain = scene.links.filter((link) => !link.landed).map((link) => D.link(pt(link.from), pt(link.to), 0.3));
  const landed = scene.links.filter((link) => link.landed).map((link) => D.link(pt(link.from), pt(link.to), 0.3));
  out.push(D.L(plain.join(''), { tone: 'mid' }));
  out.push(`<path class="iso-line fx-landed" d="${landed.join('')}"/>`);
  const pucks = scene.commits.map((commit) => {
    const y = ROW_Y[commit.row];
    const cx = qx(commit.x);
    const svg = D.puck(cx, y, commit.row === 'heads' ? 0 : PUCK_Z, { className: 'fx-puck' }, 10).replace(
      'class="iso-solid fx-puck"',
      `class="iso-solid fx-puck"${commit.state ? ` data-state="${commit.state}"` : ''}`,
    );
    const label = commit.sha ? D.text(cx + 12, y + 14, 0, commit.sha, 8, 'mid') : '';
    return { key: D.depth(cx, y), svg: label + svg };
  });
  out.push(byDepth(pucks));
  for (const n of [41, 42, 43] as const) {
    const lane = scene.lanes[n];
    out.push(D.face(710, ROW_Y[n] + 1.5, 4.4, lane.text, 6.8, 'hi').replace('data-tone="hi"', `data-tone="${lane.tone === 'green' ? 'green' : lane.tone === 'red' ? 'red' : lane.tone === 'running' ? 'hi' : 'mid'}"`));
  }
  // Two gauges: CI cycles a serial queue would have waited, and what the
  // speculative queue actually waited.
  const bar = (x: number, cycles: number, tone: 'mid' | 'hi') =>
    cycles > 0 ? D.slab(D.plan(x - 7, ROW_Y.heads - 25, 14, 14, 1), 2, cycles * 11, { tone }, 0.5) : '';
  out.push(bar(730, scene.ci.serial, 'mid'), bar(792, scene.ci.queue, 'hi'), plate(706, ROW_Y.heads + 4, 150));
  out.push(D.face(710, ROW_Y.heads + 5.5, 4.4, `serial ${scene.ci.serial} · merge-steward ${scene.ci.queue} CI cycles`, 6.2, 'hi'));
  return out.join('');
}

export function queueTag() {
  const p = D.plan(-17, -5, 34, 10, 1.5);
  return D.slab(p, PUCK_Z + 7, 11, { tone: 'hi', lit: true }, 0.4) + D.face(0, 5, PUCK_Z + 10.5, 'main', 8, 'hi', 'middle');
}

export function queueShift(x: number, row: Row) {
  const [dx, dy] = k.axisVector(QUEUE_P, [qx(x), ROW_Y[row], 0]);
  return `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}
