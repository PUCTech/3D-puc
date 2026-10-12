import { useMemo } from 'react';
import * as THREE from 'three';
import { crispTexture } from './textures';

import type { Point } from '@/lib/campus';
import { extrude, mergeGeometries, orientedBox } from './geometry';

const EAVE = { overhang: 0.7, thickness: 0.3 }; // photos 13/14: thick slab projecting past the walls
const GABLE = { overhang: 0.6, rise: 1.2 }; // photo 15: shallow pitched roof on exposed rafters
// Drone video (docs/consolacao/pictures): Rino Levi blocks have terracotta clay-tile hipped roofs on a white eave.
const HIP = { overhang: 0.7, slope: 0.36, eave: 0.25 };
export const TILE_COLOR = '#c8693f';

// Grow a polygon outward by d (miter joins, capped for sharp corners).
function offset(points: Point[], d: number): Point[] {
  const area = points.reduce((s, [x, z], i) => s + x * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * z, 0);
  const sign = area > 0 ? -1 : 1; // pick the outward side for either winding
  const normal = ([x1, z1]: Point, [x2, z2]: Point): Point => {
    const len = Math.hypot(x2 - x1, z2 - z1) || 1;
    return [(sign * (z2 - z1)) / len, (-sign * (x2 - x1)) / len];
  };
  return points.map((p, i) => {
    const prev = points[(i - 1 + points.length) % points.length], next = points[(i + 1) % points.length];
    const [ax, az] = normal(prev, p), [bx, bz] = normal(p, next);
    const k = Math.min(2, 1 / Math.max(0.25, (1 + ax * bx + az * bz) / 2)); // miter scale, capped
    return [p[0] + ((ax + bx) / 2) * d * k, p[1] + ((az + bz) / 2) * d * k];
  });
}

// Photo 15: corrugated sheeting (ribs down the slope) and exposed rafter tails under the eave.
const RIB_EVERY = 1.2;
const RAFTER_EVERY = 0.9;
function gableDetails(points: Point[], height: number) {
  const { ux, uz, vx, vz, u, v } = orientedBox(points);
  const [u0, u1] = [u[0] - GABLE.overhang, u[1] + GABLE.overhang];
  const [v0, v1] = [v[0] - GABLE.overhang, v[1] + GABLE.overhang];
  const vm = (v0 + v1) / 2;
  const half = (v1 - v0) / 2;
  const slope = Math.atan2(GABLE.rise, half);
  const slant = Math.hypot(GABLE.rise, half);
  const yaw = Math.atan2(uz, ux); // u axis direction
  const ribs: THREE.BufferGeometry[] = [];
  const rafters: THREE.BufferGeometry[] = [];
  const place = (g: THREE.BufferGeometry, a: number, b: number, y: number, tilt: number) => {
    g.rotateX(tilt);
    g.rotateY(-yaw);
    g.translate(a * ux + b * vx, y, a * uz + b * vz);
    return g;
  };
  for (let a = u0 + 0.3; a < u1; a += RIB_EVERY)
    for (const side of [-1, 1]) {
      // rib along the slope, from eave to ridge, sitting on the roof plane
      ribs.push(place(new THREE.BoxGeometry(0.12, 0.06, slant), a, vm + (side * half) / 2, height + GABLE.rise / 2 + 0.04, side * slope));
    }
  for (let a = u[0]; a <= u[1]; a += RAFTER_EVERY)
    for (const side of [-1, 1]) rafters.push(place(new THREE.BoxGeometry(0.1, 0.14, GABLE.overhang), a, vm + side * (half - GABLE.overhang / 2), height - 0.08, 0));
  return { ribs: mergeGeometries(ribs), rafters: mergeGeometries(rafters) };
}

function gable(points: Point[], height: number) {
  const { ux, uz, vx, vz, u, v } = orientedBox(points);
  const [u0, u1] = [u[0] - GABLE.overhang, u[1] + GABLE.overhang];
  const [v0, v1] = [v[0] - GABLE.overhang, v[1] + GABLE.overhang];
  const vm = (v0 + v1) / 2;
  const at = (a: number, b: number, y: number) => [a * ux + b * vx, y, a * uz + b * vz];
  // 6 vertices: two eave lines and the ridge, at both ends.
  const pos = [...at(u0, v0, height), ...at(u1, v0, height), ...at(u1, vm, height + GABLE.rise), ...at(u0, vm, height + GABLE.rise), ...at(u0, v1, height), ...at(u1, v1, height)];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4, 0, 3, 4, 1, 5, 2]); // two slopes + two gable ends
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

// Clay tile courses: 1-px darker lines every ~0.35 m down the slope.
function tileTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 4, 4);
  g.fillStyle = '#c9b4a8'; // multiplied by the tile color: a darker course line
  g.fillRect(0, 3, 4, 1);
  g.fillRect(1, 0, 1, 3);
  const t = crispTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Hipped roof over the oriented box: ridge along the long axis, triangular hips at both ends.
function hip(points: Point[], height: number, fixedRise?: number) {
  const { ux, uz, vx, vz, u, v } = orientedBox(points);
  const [u0, u1] = [u[0] - HIP.overhang, u[1] + HIP.overhang];
  const [v0, v1] = [v[0] - HIP.overhang, v[1] + HIP.overhang];
  const half = (v1 - v0) / 2;
  const vm = v0 + half;
  const rise = fixedRise ?? half * HIP.slope;
  const inset = Math.min(half, (u1 - u0) / 2); // ridge stops `half` from each end (pyramid when square)
  const at = (a: number, b: number, y: number) => new THREE.Vector3(a * ux + b * vx, y, a * uz + b * vz);
  const top = height + HIP.eave;
  const c = [at(u0, v0, top), at(u1, v0, top), at(u1, v1, top), at(u0, v1, top)];
  const r = [at(u0 + inset, vm, top + rise), at(u1 - inset, vm, top + rise)];
  const tris: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
    [c[0], c[1], r[1]], [c[0], r[1], r[0]], // long slope
    [c[2], c[3], r[0]], [c[2], r[0], r[1]], // other long slope
    [c[1], c[2], r[1]], [c[3], c[0], r[0]], // hips
  ];
  const pos: number[] = [];
  const uv: number[] = [];
  for (const tri of tris)
    for (const p of tri) {
      pos.push(p.x, p.y, p.z);
      // planar UV in meters: along the ridge, and up the slope (via height)
      uv.push((p.x * ux + p.z * uz) / 0.5, (p.y - top) / (rise || 1) * (half / 0.35));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

export function Roof({ kind, footprint, height, color, opacity, rise }: { kind: 'eave' | 'gable' | 'hip'; footprint: Point[]; height: number; color: THREE.Color; opacity: number; rise?: number }) {
  const tiles = useMemo(() => (kind === 'hip' ? tileTexture() : null), [kind]);
  const eaveSlab = useMemo(() => {
    if (kind !== 'hip') return null;
    const g = extrude(offset(footprint, HIP.overhang), HIP.eave);
    g.translate(0, height, 0);
    return g;
  }, [kind, footprint, height]);
  const geometry = useMemo(() => {
    if (kind === 'hip') return hip(footprint, height, rise);
    if (kind === 'gable') return gable(footprint, height);
    const g = extrude(offset(footprint, EAVE.overhang), EAVE.thickness);
    g.translate(0, height - EAVE.thickness + 0.02, 0);
    return g;
  }, [kind, footprint, height, rise]);
  const details = useMemo(() => (kind === 'gable' ? gableDetails(footprint, height) : null), [kind, footprint, height]);
  return (
    <>
    {details && (
      <>
        <mesh geometry={details.ribs}>
          <meshStandardMaterial color={color.clone().multiplyScalar(0.82)} transparent opacity={opacity} />
        </mesh>
        <mesh geometry={details.rafters}>
          <meshStandardMaterial color="#6b6258" transparent opacity={opacity} />
        </mesh>
      </>
    )}
    {eaveSlab && (
      <mesh geometry={eaveSlab} castShadow receiveShadow>
        <meshStandardMaterial color="#f3f1ec" transparent opacity={opacity} />
      </mesh>
    )}
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} map={tiles} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
    </>
  );
}
