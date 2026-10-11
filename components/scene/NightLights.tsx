import { useMemo } from 'react';
import * as THREE from 'three';
import { campus, type Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';

// Night-only fixtures that don't need real lights: a glowing lamp plus a soft pool painted on the ground under it
// (additive blending). Dozens of them cost about as much as one mesh, unlike point lights.
// - ceiling lights under the wavy canopies, between columns (1943 night photo: round lamps under the slab)
// - low bollards along the patio garden path, and uplights at the patio palms

const CANOPY = { step: 6, slab: 0.25, dip: 0.6 }; // matches Marquees (wave length 6 m, depth 0.6 m)
const BOLLARD_STEP = 4.5;

// Points every `step` meters along a path, starting at `offset`, with the side normal (dz, -dx).
function along(path: Point[], step: number, offset: number) {
  const out: { p: Point; n: Point }[] = [];
  let next = offset;
  let s = 0;
  for (let i = 1; i < path.length; i++) {
    const [x1, z1] = path[i - 1], [x2, z2] = path[i];
    const len = Math.hypot(x2 - x1, z2 - z1);
    while (next <= s + len) {
      const t = (next - s) / len;
      out.push({ p: [x1 + (x2 - x1) * t, z1 + (z2 - z1) * t], n: [(z2 - z1) / len, -(x2 - x1) / len] });
      next += step;
    }
    s += len;
  }
  return out;
}

let poolTexture: THREE.CanvasTexture | null = null;
function pool() {
  if (poolTexture) return poolTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,220,160,1)');
  r.addColorStop(0.45, 'rgba(255,195,115,0.55)');
  r.addColorStop(1, 'rgba(255,170,90,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  poolTexture = new THREE.CanvasTexture(c);
  poolTexture.colorSpace = THREE.SRGBColorSpace;
  return poolTexture;
}

type Spot = { at: Point; y: number; radius: number };

export function NightLights() {
  const { fixtures, pools } = useMemo(() => {
    const lamps: THREE.BufferGeometry[] = [];
    const spots: Spot[] = [];
    // Canopy ceiling lights: centered across the slab, at the wave's low point between columns.
    for (const m of campus.marquees ?? [])
      for (const { p, n } of along(m.path, CANOPY.step, CANOPY.step / 2)) {
        const [x, z] = [p[0] + (n[0] * m.width) / 2, p[1] + (n[1] * m.width) / 2];
        const g = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 10);
        g.translate(x, m.height - CANOPY.dip - CANOPY.slab - 0.05, z);
        lamps.push(g);
        spots.push({ at: [x, z], y: 0.07, radius: 3 });
      }
    // Garden: bollards alternating sides of the patio path, uplights at palms.
    for (const garden of campus.gardens ?? []) {
      const y = -(garden.depth ?? 0);
      if (garden.path)
        along(garden.path, BOLLARD_STEP, 1).forEach(({ p, n }, i) => {
          const side = i % 2 ? 1.3 : -1.3;
          const [x, z] = [p[0] + n[0] * side, p[1] + n[1] * side];
          const g = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
          g.translate(x, y + 0.35, z);
          lamps.push(g);
          spots.push({ at: [x, z], y: y + 0.09, radius: 2.4 });
        });
      for (const plant of garden.plants ?? [])
        if (plant.kind === 'palm') spots.push({ at: plant.at, y: y + 0.1, radius: 3.6 });
    }
    return { fixtures: lamps.length ? mergeGeometries(lamps) : null, pools: spots };
  }, []);
  const texture = pool();
  return (
    <>
      {fixtures && (
        <mesh geometry={fixtures}>
          <meshBasicMaterial color="#ffe6b8" toneMapped={false} />
        </mesh>
      )}
      {pools.map((s, i) => (
        <mesh key={i} position={[s.at[0], s.y, s.at[1]]} rotation-x={-Math.PI / 2} renderOrder={2}>
          <planeGeometry args={[s.radius * 2, s.radius * 2]} />
          <meshBasicMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
