import { useMemo } from 'react';
import * as THREE from 'three';
import { campus } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { barsTexture, crispTexture } from './textures';
import { Plants } from './Plants';

// Photo 14: a low concrete wall, a square concrete lattice above it, square pillars every ~2.6 m.
const WALL = 0.5;
const PILLAR_EVERY = 2.6;
const CONCRETE = '#d8d4cb';

// Lattice cell texture: 1-px ribs, transparent holes (alphaTest cuts them out).
export function latticeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = CONCRETE;
  g.fillRect(0, 0, 4, 1);
  g.fillRect(0, 0, 1, 4);
  const t = crispTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function StreetFence() {
  const { solid, lattice } = useMemo(() => {
    const solid: THREE.BufferGeometry[] = [];
    const lattice: THREE.BufferGeometry[] = [];
    for (const f of campus.streetFences ?? [])
      for (let i = 1; i < f.path.length; i++) {
        const [x1, z1] = f.path[i - 1], [x2, z2] = f.path[i];
        const len = Math.hypot(x2 - x1, z2 - z1);
        const angle = -Math.atan2(z2 - z1, x2 - x1);
        const place = (g: THREE.BufferGeometry, along: number, y: number) => {
          g.rotateY(angle);
          g.translate(x1 + ((x2 - x1) * along) / len, y, z1 + ((z2 - z1) * along) / len);
          return g;
        };
        solid.push(place(new THREE.BoxGeometry(len, WALL, 0.3), len / 2, WALL / 2));
        for (let d = 0; d <= len; d += PILLAR_EVERY) solid.push(place(new THREE.BoxGeometry(0.35, f.height, 0.35), d, f.height / 2));
        const panel = new THREE.PlaneGeometry(len, f.height - WALL);
        const uv = panel.getAttribute('uv') as THREE.BufferAttribute;
        for (let v = 0; v < uv.count; v++) uv.setXY(v, uv.getX(v) * len * 4, uv.getY(v) * (f.height - WALL) * 4); // 25 cm cells
        lattice.push(place(panel, len / 2, WALL + (f.height - WALL) / 2));
      }
    return { solid: solid.length ? mergeGeometries(solid) : null, lattice: lattice.length ? mergeGeometries(lattice) : null };
  }, []);
  const texture = useMemo(() => latticeTexture(), []);
  // Black bar fence: low wall + a plane of bars, per segment (texture repeat depends on length).
  const barFences = useMemo(
    () =>
      (campus.streetBars ?? []).flatMap((f) =>
        f.path.slice(1).map((b, i) => {
          const a = f.path[i];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          return { mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const, angle: -Math.atan2(b[1] - a[1], b[0] - a[0]), len, height: f.height, bars: barsTexture('#1d1f22', 8, len) };
        }),
      ),
    [],
  );
  const pots = useMemo(() => (campus.streetPots ?? []).map((at) => ({ kind: 'dracaena' as const, at })), []);
  return (
    <>
      {solid && (
        <mesh geometry={solid} castShadow receiveShadow>
          <meshStandardMaterial color={CONCRETE} />
        </mesh>
      )}
      {lattice && (
        <mesh geometry={lattice} castShadow>
          <meshStandardMaterial map={texture} alphaTest={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
      {barFences.map((f, i) => (
        <group key={i} position={[f.mid[0], 0, f.mid[1]]} rotation-y={f.angle}>
          <mesh position-y={WALL / 2} castShadow receiveShadow>
            <boxGeometry args={[f.len, WALL, 0.3]} />
            <meshStandardMaterial color={CONCRETE} />
          </mesh>
          <mesh position-y={WALL + (f.height - WALL) / 2}>
            <planeGeometry args={[f.len, f.height - WALL]} />
            <meshBasicMaterial map={f.bars} alphaTest={0.5} transparent side={THREE.DoubleSide} />
          </mesh>
          <mesh position-y={f.height}>
            <boxGeometry args={[f.len, 0.06, 0.06]} />
            <meshBasicMaterial color="#1d1f22" />
          </mesh>
        </group>
      ))}
      {pots.map((p, i) => (
        <mesh key={i} position={[p.at[0], 0.3, p.at[1]]} castShadow>
          <cylinderGeometry args={[0.4, 0.3, 0.6, 10]} />
          <meshStandardMaterial color="#1e2024" />
        </mesh>
      ))}
      <group position-y={0.6}>
        <Plants plants={pots} scale={0.55} />
      </group>
    </>
  );
}
