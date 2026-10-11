import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { flatPolygon, mergeGeometries } from './geometry';
import { INK_WIDTH, toonRamp } from './pixel';
import { Court } from './Court';

export function pointInPolygon([x, z]: Point, poly: Point[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

const WALL = 0.3;

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
        const inside = courts.filter((c) => pointInPolygon(c[0], s.polygon));
        return { floor, walls: mergeGeometries(walls), courts: inside, depth: s.depth };
      }),
    [courts],
  );
  return (
    <>
      {zones.map((z, i) => (
        <group key={i}>
          <mesh geometry={z.floor} receiveShadow>
            <meshLambertMaterial color="#c4c0b7" /> {/* paving at the lower level, a shade darker than the street-level lot */}
          </mesh>
          <mesh geometry={z.walls} castShadow receiveShadow>
            <meshToonMaterial color="#cfc9bd" gradientMap={toonRamp} />
            <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH * 0.7} />
          </mesh>
          {z.courts.map((c, j) => (
            <Court key={j} polygon={c} y={-z.depth} />
          ))}
        </group>
      ))}
    </>
  );
}

