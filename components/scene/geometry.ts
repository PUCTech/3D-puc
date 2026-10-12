import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Point, Terrain } from '@/lib/campus';

// Footprints are (x east, z south). Shapes live in XY and are laid flat with rotateX(-90°),
// which maps shape y to -z, so we feed -z.
const shapeOf = (points: Point[]) => new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));

// Extruded footprint. ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls; wall UVs are in meters.
export function extrude(points: Point[], height: number) {
  const g = new THREE.ExtrudeGeometry(shapeOf(points), { depth: height, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

// Make wall faces shorter than maxLength plain: their UVs move to the window-free texel (0,0).
// For bar-shaped blocks this blanks the end walls, as in photo 08. Side faces are quads of 6 vertices.
export function blankShortWalls(g: THREE.BufferGeometry, maxLength: number) {
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const { start, count } = g.groups[1];
  for (let q = start; q < start + count; q += 6) {
    let len = 0;
    for (let v = q; v < q + 6; v++) len = Math.max(len, Math.hypot(pos.getX(v) - pos.getX(q), pos.getZ(v) - pos.getZ(q)));
    if (len < maxLength) for (let v = q; v < q + 6; v++) uv.setXY(v, 0, 0);
  }
  return g;
}

// Flat polygon on the ground at height y, optionally with holes (e.g. where the ground is sunken).
export function flatPolygon(points: Point[], y: number, holes: Point[][] = []) {
  const shape = shapeOf(points);
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

// Paths (streets, footways) as flat strips `width` meters wide, merged into one geometry.
export function ribbons(paths: Point[][], width: number, y: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (const path of paths)
    for (let i = 1; i < path.length; i++) {
      const [x1, z1] = path[i - 1], [x2, z2] = path[i];
      const len = Math.hypot(x2 - x1, z2 - z1);
      if (!len) continue;
      const g = new THREE.PlaneGeometry(len + width, width); // + width covers the gap at bends
      g.rotateX(-Math.PI / 2);
      g.rotateY(-Math.atan2(z2 - z1, x2 - x1));
      g.translate((x1 + x2) / 2, y, (z1 + z2) / 2);
      parts.push(g);
    }
  return parts.length ? mergeGeometries(parts) : null;
}

// Oriented bounding box via the longest edge's direction (unit axes u along it, v across, and the extent on each):
// good enough for bar-shaped blocks and rooms.
export function orientedBox(points: Point[]) {
  let best = { len: 0, ux: 1, uz: 0 };
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (len > best.len) best = { len, ux: (q[0] - p[0]) / len, uz: (q[1] - p[1]) / len };
  });
  const { ux, uz } = best;
  const [vx, vz] = [-uz, ux];
  const us = points.map(([x, z]) => x * ux + z * uz), vs = points.map(([x, z]) => x * vx + z * vz);
  return { ux, uz, vx, vz, u: [Math.min(...us), Math.max(...us)], v: [Math.min(...vs), Math.max(...vs)] };
}

// Bilinear ground height at (x, z); clamps outside the grid.
export function terrainAt(t: Terrain, x: number, z: number) {
  const fx = Math.min(t.cols - 1.001, Math.max(0, (x - t.x0) / t.step));
  const fz = Math.min(t.rows - 1.001, Math.max(0, (z - t.z0) / t.step));
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
  const h = (a: number, b: number) => t.h[b * t.cols + a];
  return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - v) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * v;
}

// Sloped ground clipped to a polygon (grid cells whose centre is inside), plus a skirt down from `top` along the
// polygon's edges so the slope meets the flat levels around it without a gap.
export function terrainGeometry(t: Terrain, polygon: Point[], top: number, inside: (p: Point, poly: Point[]) => boolean) {
  const pos: number[] = [];
  const v = (a: number, b: number) => [t.x0 + a * t.step, t.h[b * t.cols + a], t.z0 + b * t.step];
  for (let j = 0; j < t.rows - 1; j++)
    for (let i = 0; i < t.cols - 1; i++) {
      if (!inside([t.x0 + (i + 0.5) * t.step, t.z0 + (j + 0.5) * t.step], polygon)) continue;
      const [a, b, c, d] = [v(i, j), v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)];
      pos.push(...a, ...c, ...b, ...a, ...d, ...c); // counter-clockwise seen from above
    }
  polygon.forEach((p, k) => {
    const q = polygon[(k + 1) % polygon.length];
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
    for (let s = 0; s < n; s++) {
      const [x1, z1] = [p[0] + ((q[0] - p[0]) * s) / n, p[1] + ((q[1] - p[1]) * s) / n];
      const [x2, z2] = [p[0] + ((q[0] - p[0]) * (s + 1)) / n, p[1] + ((q[1] - p[1]) * (s + 1)) / n];
      const [h1, h2] = [terrainAt(t, x1, z1), terrainAt(t, x2, z2)];
      pos.push(x1, top, z1, x2, top, z2, x2, h2, z2, x1, top, z1, x2, h2, z2, x1, h1, z1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export { mergeGeometries };
