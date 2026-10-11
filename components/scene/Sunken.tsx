import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { flatPolygon, mergeGeometries } from './geometry';
import { INK_WIDTH, toonRamp } from './pixel';

export function pointInPolygon([x, z]: Point, poly: Point[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

const WALL = 0.3;

// Court lines (court photo, 2018): outline, center line and center circle on each sunken pitch.
function courtLines(poly: Point[], y: number) {
  const parts: THREE.BufferGeometry[] = [];
  const line = (a: Point, b: Point) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const g = new THREE.PlaneGeometry(len, 0.12);
    g.rotateX(-Math.PI / 2);
    g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
    g.translate((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2);
    parts.push(g);
  };
  poly.forEach((p, i) => line(p, poly[(i + 1) % poly.length]));
  if (poly.length === 4) {
    const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    // center line joins the midpoints of the two long sides
    const sides = [0, 1, 2, 3].map((i) => [poly[i], poly[(i + 1) % 4]] as [Point, Point]);
    const long = sides.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
    const [s1, s2] = long[0] >= long[1] ? [sides[0], sides[2]] : [sides[1], sides[3]];
    const m1 = mid(...s1), m2 = mid(...s2);
    line(m1, m2);
    const c = mid(m1, m2);
    const ring = new THREE.RingGeometry(1.7, 1.82, 32);
    ring.rotateX(-Math.PI / 2);
    ring.translate(c[0], y, c[1]);
    parts.push(ring);
  }
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}

// Sunken zones: a lower floor and concrete retaining walls down from street level.
export function Sunken({ courts }: { courts: Point[][] }) {
  const zones = useMemo(
    () =>
      (campus.sunken ?? []).map((s) => {
        const floor = flatPolygon(s.polygon, -s.depth);
        const walls = s.polygon.map((a, i) => {
          const b = s.polygon[(i + 1) % s.polygon.length];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const g = new THREE.BoxGeometry(len, s.depth, WALL);
          g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0]));
          g.translate((a[0] + b[0]) / 2, -s.depth / 2, (a[1] + b[1]) / 2);
          return g;
        });
        const lines = courts.filter((c) => pointInPolygon(c[0], s.polygon)).map((c) => courtLines(c, -s.depth + 0.08));
        return { floor, walls: mergeGeometries(walls), lines };
      }),
    [courts],
  );
  return (
    <>
      {zones.map((z, i) => (
        <group key={i}>
          <mesh geometry={z.floor} receiveShadow>
            <meshLambertMaterial color="#9c968c" />
          </mesh>
          <mesh geometry={z.walls} castShadow receiveShadow>
            <meshToonMaterial color="#cfc9bd" gradientMap={toonRamp} />
            <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH * 0.7} />
          </mesh>
          {z.lines.map((g, j) => (
            <mesh key={j} geometry={g}>
              <meshBasicMaterial color="#f4f4ef" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

