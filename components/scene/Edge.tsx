import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { mergeGeometries, ribbons } from './geometry';
import { toonRamp } from './pixel';

// Upright strips along a path: walls (thick, opaque) and fences (thin, see-through bars).
function barrier(path: Point[], height: number, thickness: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 1; i < path.length; i++) {
    const [x1, z1] = path[i - 1], [x2, z2] = path[i];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const g = new THREE.BoxGeometry(len, height, thickness);
    g.rotateY(-Math.atan2(z2 - z1, x2 - x1));
    g.translate((x1 + x2) / 2, height / 2, (z1 + z2) / 2);
    parts.push(g);
  }
  return mergeGeometries(parts);
}

function Pillar({ at: [x, z], height = 3 }: { at: Point; height?: number }) {
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <boxGeometry args={[0.8, height, 0.8]} />
      <meshToonMaterial color="#d8d2c6" gradientMap={toonRamp} />
    </mesh>
  );
}

// The campus edge: OSM walls, fences and gates, plus the hand-placed main entrance and its walk.
export function Edge() {
  const walls = useMemo(() => (campus.barriers ?? []).filter((b) => b.kind === 'wall').map((b) => barrier(b.path, b.height, 0.4)), []);
  const fences = useMemo(() => (campus.barriers ?? []).filter((b) => b.kind !== 'wall').map((b) => barrier(b.path, b.height, 0.08)), []);
  const entrance = campus.entrance;
  const walk = useMemo(() => (entrance ? ribbons([entrance.path], 3.5, 0.045) : null), [entrance]);
  return (
    <>
      {walls.map((g, i) => (
        <mesh key={`w${i}`} geometry={g} castShadow receiveShadow>
          <meshToonMaterial color="#cfc6b6" gradientMap={toonRamp} />
        </mesh>
      ))}
      {fences.map((g, i) => (
        <mesh key={`f${i}`} geometry={g}>
          <meshToonMaterial color="#2f3440" gradientMap={toonRamp} transparent opacity={0.55} />
        </mesh>
      ))}
      {(campus.gates ?? []).map((g, i) => (
        <group key={`g${i}`}>
          <Pillar at={[g[0] - 1.6, g[1]]} height={2.4} />
          <Pillar at={[g[0] + 1.6, g[1]]} height={2.4} />
        </group>
      ))}
      {entrance && (
        <group>
          {walk && (
            <mesh geometry={walk} receiveShadow>
              <meshLambertMaterial color="#f1e6cf" />
            </mesh>
          )}
          <Pillar at={[entrance.at[0], entrance.at[1] - 2.2]} />
          <Pillar at={[entrance.at[0], entrance.at[1] + 2.2]} />
          <Html position={[entrance.at[0], 4.2, entrance.at[1]]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
            <span className="block whitespace-nowrap rounded-sm bg-[#c0392b] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white shadow-[2px_2px_0_#000]">
              {entrance.label}
            </span>
          </Html>
        </group>
      )}
    </>
  );
}
