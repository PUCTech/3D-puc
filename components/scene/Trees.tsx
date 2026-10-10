import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '@/lib/campus';
import { toonRamp } from './pixel';

const GREENS = ['#2f9e44', '#3cb043', '#58c25a', '#228b3b'];
const trunk = new THREE.CylinderGeometry(0.35, 0.45, 1, 6);
const crown = new THREE.IcosahedronGeometry(1, 0);

// Cartoon tropical trees: a trunk and one or two chunky low-poly crowns, sized per position so they vary.
export function Trees({ at, scale = 1 }: { at: Point[]; scale?: number }) {
  const trees = useMemo(
    () =>
      at.map(([x, z], i) => {
        const h = (4 + ((i * 7) % 5)) * scale; // 4–8 m, deterministic
        return { x, z, h, r: (1.8 + ((i * 3) % 4) * 0.4) * scale, green: GREENS[i % GREENS.length], twin: i % 3 === 0 };
      }),
    [at, scale],
  );
  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh geometry={trunk} position-y={t.h / 2} scale={[scale, t.h, scale]} castShadow>
            <meshToonMaterial color="#8b5a2b" gradientMap={toonRamp} />
          </mesh>
          <mesh geometry={crown} position-y={t.h} scale={t.r} castShadow>
            <meshToonMaterial color={t.green} gradientMap={toonRamp} />
          </mesh>
          {t.twin && (
            <mesh geometry={crown} position={[t.r * 0.6, t.h - t.r * 0.5, 0]} scale={t.r * 0.7} castShadow>
              <meshToonMaterial color={t.green} gradientMap={toonRamp} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
}
