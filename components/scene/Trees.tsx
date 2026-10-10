import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '@/lib/campus';
import { toonRamp } from './pixel';

const GREENS = ['#2f9e44', '#3cb043', '#58c25a', '#228b3b'];
const trunk = new THREE.CylinderGeometry(0.35, 0.45, 1, 6);
const crown = new THREE.IcosahedronGeometry(1, 0);

// Cartoon tropical trees: a trunk and one or two chunky low-poly crowns, sized per position so they vary.
export function Trees({ at, scale = 1, slender = false }: { at: Point[]; scale?: number; slender?: boolean }) {
  const trees = useMemo(
    () =>
      at.map(([x, z], i) => {
        // slender: tall thin trunks with small high crowns, as along the street front (photo 14)
        const h = (slender ? 10 + ((i * 7) % 4) : 4 + ((i * 7) % 5)) * scale; // deterministic variety
        const r = (slender ? 1.3 + ((i * 3) % 3) * 0.3 : 1.8 + ((i * 3) % 4) * 0.4) * scale;
        return { x, z, h, r, green: GREENS[i % GREENS.length], twin: !slender && i % 3 === 0 };
      }),
    [at, scale, slender],
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
