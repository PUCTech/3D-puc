import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import type { Point } from '@/lib/campus';
import { extrude, mergeGeometries } from './geometry';
import { INK_WIDTH, toonRamp } from './pixel';

const EAVE = { overhang: 0.7, thickness: 0.3 }; // photos 13/14: thick slab projecting past the walls
const GABLE = { overhang: 0.6, rise: 1.2 }; // photo 15: shallow pitched roof on exposed rafters

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

// Oriented bounding box via the longest edge's direction: good enough for bar-shaped blocks.
function orientedBox(points: Point[]) {
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

export function Roof({ kind, footprint, height, color, opacity }: { kind: 'eave' | 'gable'; footprint: Point[]; height: number; color: THREE.Color; opacity: number }) {
  const geometry = useMemo(() => {
    if (kind === 'gable') return gable(footprint, height);
    const g = extrude(offset(footprint, EAVE.overhang), EAVE.thickness);
    g.translate(0, height - EAVE.thickness + 0.02, 0);
    return g;
  }, [kind, footprint, height]);
  const details = useMemo(() => (kind === 'gable' ? gableDetails(footprint, height) : null), [kind, footprint, height]);
  return (
    <>
    {details && (
      <>
        <mesh geometry={details.ribs}>
          <meshToonMaterial color={color.clone().multiplyScalar(0.82)} gradientMap={toonRamp} transparent opacity={opacity} />
        </mesh>
        <mesh geometry={details.rafters}>
          <meshToonMaterial color="#6b6258" gradientMap={toonRamp} transparent opacity={opacity} />
        </mesh>
      </>
    )}
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshToonMaterial color={color} gradientMap={toonRamp} side={THREE.DoubleSide} transparent opacity={opacity} />
      {opacity === 1 && <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH * 0.8} />}
    </mesh>
    </>
  );
}
