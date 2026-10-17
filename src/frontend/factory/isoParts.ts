import * as k from './iso-kit';
import type { Plan, Point3, Projection, SolidPaths, Tone } from './iso-kit';

// Small drawing vocabulary shared by both isometric figures: plates, units,
// pucks, rails and engraved text, all painted with the Anatomy kit.

export type Style = Parameters<typeof k.solidSvg>[1];

export function parts(P: Projection) {
  const at = (point: Point3) => k.iso(point, P);
  const depth = (x: number, y: number, z = 0) => k.depthOf([x, y, z], P);
  const plan = (x: number, y: number, w: number, d: number, r = 0.8): Plan => ({ x, y, w, d, r });
  const S = (paths: SolidPaths, style: Style = {}) => k.solidSvg(paths, { tone: 'mid', ...style });
  const L = (d: string, style: Parameters<typeof k.lineSvg>[1] = {}) => k.lineSvg(d, style);
  const dots = (points: Point3[], size = 0.45, tone: Tone = 'mid') => k.dotsSvg(points.map(at), { size, tone });
  const slab = (p: Plan, z: number, h: number, style: Style = {}, bevel = 0.5, steps = 3) => S(k.slabOf(p, z, h, P, steps, bevel), style);
  const cyl = (x: number, y: number, r: number, z: number, h: number, style: Style = {}, steps = 24, bevel = 0) =>
    S(k.cylinder(x, y, r, z, h, P, steps, bevel), style);
  const text = (x: number, y: number, z: number, value: string, size: number, tone: Tone = 'mid', anchor: 'start' | 'middle' | 'end' = 'start') =>
    k.faceTextSvg(k.topMatrix([x, y], z, P, 'x'), value, { size, tone, anchor });
  const top = (points: Array<[number, number]>, z: number) => k.onTop(points, z, P);
  // Text on a face that looks toward +y (the side facing the reader).
  const face = (x: number, y: number, z: number, value: string, size: number, tone: Tone = 'mid', anchor: 'start' | 'middle' | 'end' = 'start') =>
    k.faceTextSvg(k.sideMatrix([x, y], z, P, 'left'), value, { size, tone, anchor });

  // A bench plate on feet, with a groove and corner screws.
  function bench(p: Plan, thickness = 8) {
    const out = [`<path class="iso-halo" d="${k.haloOf(p, -thickness, thickness, P)}"/>`];
    out.push(slab(p, -thickness, thickness, {}, 1.4, 8));
    out.push(L(k.planOutline(k.insetPlan(p, 6), 0, P), { tone: 'lo' }));
    const screws = k.corners(p, 12);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }));
    out.push(dots(screws.map(([x, y]) => [x, y, 0])));
    return out.join('');
  }

  // A service: a cased unit with an engraved name, vents on the front face, a
  // status lamp and screws on the lid. `node` ties the lamp to live state.
  function unit(p: Plan, h: number, name: string, node: string, small = false) {
    const lid = h;
    const vents: string[] = [];
    const faceY = p.y + p.d;
    const slots = small ? 3 : 5;
    for (let i = 0; i < slots; i++) {
      const x0 = p.x + p.w - 12 - i * 6;
      vents.push(k.segment([x0, faceY, 4], [x0, faceY, Math.min(h - 6, 14)], P));
    }
    const out = [
      S(k.slabOf(p, 0, h, P, 3, 0.8), { tone: 'mid', inner: L(k.sideSeam(p, h - 3, P, 3), { tone: 'faint' }) + L(vents.join(''), { tone: 'lo' }), className: 'fx-unit' }).replace('<g ', `<g data-node="${node}" `),
      L(k.planOutline(k.insetPlan(p, 3.5), lid, P, 3), { tone: 'faint' }),
      dots(k.corners(p, 6).map(([x, y]) => [x, y, lid] as Point3), 0.45),
      face(p.x + 8, faceY, h - (small ? 8 : 10), name, small ? 7 : 9.5, 'hi'),
    ];
    const lx = p.x + p.w - 12;
    const ly = p.y + 11;
    out.push(cyl(lx, ly, 3.6, lid, 1, { tone: 'lo' }, 18));
    out.push(S(k.cylinder(lx, ly, 2.8, lid + 1, 2.8, P, 18), { tone: 'mid', crease: 'none', className: 'fx-lamp' }).replace('<g ', `<g data-lamp-node="${node}" `));
    return out.join('');
  }

  // A commit: a short puck standing on a rail.
  function puck(x: number, y: number, z: number, style: Style = {}, r = 6.5) {
    const h = r * 0.7;
    return cyl(x, y, r, z, h, { tone: 'hi', ...style }, 32, 0.5) + L(k.ring(x, y, r * 0.46, z + h, P, 20), { tone: 'faint' });
  }

  // A rail along x for a git ref.
  function rail(x0: number, x1: number, y: number, z: number) {
    return slab(plan(x0, y - 3, x1 - x0, 6, 1.5), z, 2.4, { tone: 'mid' }, 0.3);
  }

  // Cubic curve in plan, sampled, for parent links drawn on a face.
  function link(a: [number, number], b: [number, number], z: number) {
    if (Math.abs(a[1] - b[1]) < 0.01) return top([a, b], z);
    const points: Array<[number, number]> = [];
    const mid = (a[0] + b[0]) / 2;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const u = 1 - t;
      points.push([
        u * u * u * a[0] + 3 * u * u * t * mid + 3 * u * t * t * mid + t * t * t * b[0],
        u * u * u * a[1] + 3 * u * u * t * a[1] + 3 * u * t * t * b[1] + t * t * t * b[1],
      ]);
    }
    return top(points, z);
  }

  return { at, depth, plan, S, L, dots, slab, cyl, text, face, top, bench, unit, puck, rail, link };
}

// Paint a list of solids back to front by the depth of a reference point.
export function byDepth(items: Array<{ key: number; svg: string }>) {
  return [...items].sort((a, b) => a.key - b.key).map((item) => item.svg).join('');
}
