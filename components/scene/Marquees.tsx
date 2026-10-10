import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { campus, type Point } from '@/lib/campus';
import { INK_WIDTH, toonRamp } from './pixel';
import { mergeGeometries } from './geometry';

// From photos 03/07/15: straight in plan, the slab waves in elevation and dips over each column.
const WAVE = { depth: 0.6, length: 6 }; // meters
const SLAB = 0.25;

// Walk the path in small steps; each sample has its point, the side normal (x, z) = (dz, -dx) and distance along the path.
function samples(path: Point[], step = 0.4) {
  const out: { p: Point; n: Point; s: number }[] = [];
  let s = 0;
  for (let i = 1; i < path.length; i++) {
    const [x1, z1] = path[i - 1], [x2, z2] = path[i];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n: Point = [(z2 - z1) / len, -(x2 - x1) / len];
    for (let d = 0; d < len; d += step) out.push({ p: [x1 + ((x2 - x1) * d) / len, z1 + ((z2 - z1) * d) / len], n, s: s + d });
    s += len;
  }
  out.push({ p: path[path.length - 1], n: out[out.length - 1].n, s });
  return out;
}

// Slab as a strip: per sample 4 vertices (inner/outer × top/bottom), quads between samples.
function slab(path: Point[], width: number, height: number) {
  const pts = samples(path);
  const pos: number[] = [];
  const idx: number[] = [];
  for (const { p: [x, z], n: [nx, nz], s } of pts) {
    const y = height - (WAVE.depth * (1 - Math.cos((2 * Math.PI * s) / WAVE.length))) / 2; // dips to height - depth
    const [ox, oz] = [x + nx * width, z + nz * width];
    pos.push(x, y, z, ox, y, oz, x, y - SLAB, z, ox, y - SLAB, oz);
  }
  const quad = (a: number, b: number, c: number, d: number) => idx.push(a, b, c, a, c, d);
  for (let i = 1; i < pts.length; i++) {
    const [p, q] = [(i - 1) * 4, i * 4];
    quad(p, q, q + 1, p + 1); // top
    quad(p + 2, p + 3, q + 3, q + 2); // bottom
    quad(p + 1, q + 1, q + 3, p + 3); // outer edge
    quad(p, p + 2, q + 2, q); // wall side
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, columns: pts.filter((q) => q.s % WAVE.length < 0.4 && q.s > 0.5) };
}

export function Marquees() {
  const { slabs, columns } = useMemo(() => {
    const slabs: THREE.BufferGeometry[] = [];
    const columns: THREE.BufferGeometry[] = [];
    for (const m of campus.marquees ?? []) {
      const { geometry, columns: at } = slab(m.path, m.width, m.height);
      slabs.push(geometry);
      for (const q of at) {
        const col = new THREE.CylinderGeometry(0.15, 0.15, m.height - WAVE.depth, 8);
        const w = m.width - 0.4;
        col.translate(q.p[0] + q.n[0] * w, (m.height - WAVE.depth) / 2, q.p[1] + q.n[1] * w);
        columns.push(col);
      }
    }
    return { slabs: slabs.length ? mergeGeometries(slabs) : null, columns: columns.length ? mergeGeometries(columns) : null };
  }, []);
  return (
    <>
      {slabs && (
        <mesh geometry={slabs} castShadow receiveShadow>
          <meshToonMaterial color="#f2f0ea" gradientMap={toonRamp} side={THREE.DoubleSide} />
          <Edges threshold={40} color="#1b1b24" lineWidth={INK_WIDTH * 0.7} />
        </mesh>
      )}
      {columns && (
        <mesh geometry={columns} castShadow>
          <meshToonMaterial color="#e8dfc0" gradientMap={toonRamp} />
        </mesh>
      )}
    </>
  );
}
