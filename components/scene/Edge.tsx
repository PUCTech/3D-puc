import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { mergeGeometries, ribbons } from './geometry';
import { toonRamp } from './pixel';
import { latticeTexture } from './StreetFence';

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

// Main gate (Descubra Sampa photo): pale-yellow gatehouses with cobogó lattice inserts flanking a white metal gate.
const GATE = { width: 3, house: 4, depth: 3, height: 2.8 };
function Gatehouse({ at: [x, z], along: [ax, az] }: { at: Point; along: Point }) {
  const lattice = useMemo(() => {
    const t = latticeTexture();
    t.repeat.set(GATE.house * 2, 4);
    return t;
  }, []);
  const angle = -Math.atan2(az, ax);
  const offset = GATE.width / 2 + GATE.house / 2;
  return (
    <group position={[x, 0, z]} rotation-y={angle}>
      {[-offset, offset].map((u) => (
        <group key={u} position-x={u}>
          <mesh position-y={GATE.height / 2} castShadow receiveShadow>
            <boxGeometry args={[GATE.house, GATE.height, GATE.depth]} />
            <meshToonMaterial color="#e8dba0" gradientMap={toonRamp} />
          </mesh>
          {/* lattice insert on the street face (+z after rotation is the street side for this gate) */}
          <mesh position={[0, GATE.height * 0.6, -GATE.depth / 2 - 0.02]} rotation-y={Math.PI}>
            <planeGeometry args={[GATE.house * 0.6, GATE.height * 0.4]} />
            <meshToonMaterial map={lattice} color="#f1e7b8" gradientMap={toonRamp} alphaTest={0.5} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position-y={1.2}>
        <boxGeometry args={[GATE.width, 2.4, 0.08]} />
        <meshToonMaterial color="#f3f3ee" gradientMap={toonRamp} transparent opacity={0.7} />
      </mesh>
    </group>
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
          <Gatehouse at={entrance.at} along={entrance.along} />
          <Html position={[entrance.at[0], 4.2, entrance.at[1]]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
            {/* white plaque with dark lettering, as on the real gate (Descubra Sampa photo) */}
            <span className="block whitespace-nowrap rounded-sm border border-[#555] bg-[#f7f6f1] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#2a2a2a] shadow-[2px_2px_0_#000]">
              {entrance.label}
            </span>
          </Html>
        </group>
      )}
    </>
  );
}
