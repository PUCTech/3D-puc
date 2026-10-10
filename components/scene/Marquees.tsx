import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { INK_WIDTH, toonRamp } from './pixel';
import { extrude, mergeGeometries } from './geometry';

const WAVE = { amplitude: 0.9, length: 6 }; // meters: the "marquise ondulada" outer edge
const SLAB = 0.3;
const COLUMN_EVERY = 6;

// Walk the path in small steps; each sample has its point, the side normal (x, z) = (dz, -dx) and distance along the path.
function samples(path: Point[], step = 0.5) {
  const out: { p: Point; n: Point; s: number }[] = [];
  let s = 0;
  for (let i = 1; i < path.length; i++) {
    const [x1, z1] = path[i - 1], [x2, z2] = path[i];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n: Point = [(z2 - z1) / len, -(x2 - x1) / len];
    for (let d = 0; d < len; d += step) out.push({ p: [x1 + ((x2 - x1) * d) / len, z1 + ((z2 - z1) * d) / len], n, s: s + d });
    s += len;
  }
  const last = path[path.length - 1];
  out.push({ p: last, n: out[out.length - 1].n, s });
  return out;
}

// Rino Levi's undulating concrete canopies: a slab whose outer edge waves, on thin columns.
export function Marquees() {
  const geometry = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const m of campus.marquees ?? []) {
      const pts = samples(m.path);
      const outer = pts.map(({ p: [x, z], n: [nx, nz], s }) => {
        const w = m.width + WAVE.amplitude * Math.sin((2 * Math.PI * s) / WAVE.length);
        return [x + nx * w, z + nz * w] as Point;
      });
      const slab = extrude([...pts.map((q) => q.p), ...outer.reverse()], SLAB);
      slab.translate(0, m.height, 0);
      parts.push(slab);
      for (const q of pts.filter((q) => q.s % COLUMN_EVERY < 0.5)) {
        const w = m.width - 0.4;
        const col = new THREE.BoxGeometry(0.25, m.height, 0.25);
        col.translate(q.p[0] + q.n[0] * w, m.height / 2, q.p[1] + q.n[1] * w);
        parts.push(col.toNonIndexed());
      }
    }
    if (!parts.length) return null;
    for (const p of parts) {
      p.deleteAttribute('uv');
      p.clearGroups();
    }
    return mergeGeometries(parts);
  }, []);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshToonMaterial color="#e9e4da" gradientMap={toonRamp} />
      <Edges threshold={30} color="#1b1b24" lineWidth={INK_WIDTH * 0.7} />
    </mesh>
  );
}
