import { useMemo } from 'react';
import * as THREE from 'three';

import { campus, type Point } from '@/lib/campus';

import { mergeGeometries } from './geometry';

// From photos 03/07/15: straight in plan, the slab waves in elevation and dips over each column.
const WAVE = { depth: 0.6, length: 6 }; // meters
const SLAB = 0.25;
const LIP = { height: 0.18, width: 0.12 }; // raised edge along the outer rim (photos 03, 15)

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

// Slab as a strip: per sample 6 vertices (inner/outer × top/bottom, plus the lip's inner and outer top), quads between samples.
function slab(path: Point[], width: number, height: number) {
  const pts = samples(path);
  const pos: number[] = [];
  const idx: number[] = [];
  for (const { p: [x, z], n: [nx, nz], s } of pts) {
    const y = height - (WAVE.depth * (1 - Math.cos((2 * Math.PI * s) / WAVE.length))) / 2; // dips to height - depth
    const [ox, oz] = [x + nx * width, z + nz * width];
    const [lx, lz] = [x + nx * (width - LIP.width), z + nz * (width - LIP.width)];
    pos.push(x, y, z, ox, y, oz, x, y - SLAB, z, ox, y - SLAB, oz, lx, y + LIP.height, lz, ox, y + LIP.height, oz);
  }
  const top: number[] = []; // upper faces: dark weathered concrete from above (drone video)
  const quad = (a: number, b: number, c: number, d: number, into = idx) => into.push(a, b, c, a, c, d);
  for (let i = 1; i < pts.length; i++) {
    const [p, q] = [(i - 1) * 6, i * 6];
    quad(p, q, q + 1, p + 1, top); // top
    quad(p + 2, p + 3, q + 3, q + 2); // bottom
    quad(p + 1, q + 1, q + 3, p + 3); // outer edge
    quad(p, p + 2, q + 2, q); // wall side
    quad(p + 5, q + 5, q + 4, p + 4, top); // lip top
    quad(p + 1, q + 1, q + 5, p + 5); // lip outer face
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...top, ...idx]);
  g.addGroup(0, top.length, 0);
  g.addGroup(top.length, idx.length, 1);
  g.computeVertexNormals();
  return { geometry: g, columns: pts.filter((q) => q.s % WAVE.length < 0.4 && q.s > 0.5) };
}

export function Marquees() {
  const { slabs, columns, bands } = useMemo(() => {
    const slabs: THREE.BufferGeometry[] = [];
    const columns: THREE.BufferGeometry[] = [];
    const bands: THREE.BufferGeometry[] = [];
    for (const m of campus.marquees ?? []) {
      const { geometry, columns: at } = slab(m.path, m.width, m.height);
      slabs.push(geometry);
      for (const q of at) {
        const col = new THREE.CylinderGeometry(0.15, 0.15, m.height - WAVE.depth, 8);
        const w = m.width - 0.4;
        col.translate(q.p[0] + q.n[0] * w, (m.height - WAVE.depth) / 2, q.p[1] + q.n[1] * w);
        columns.push(col);
        const band = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8); // red paint band at the foot (PUC-SP gallery 2023)
        band.translate(q.p[0] + q.n[0] * w, 0.06, q.p[1] + q.n[1] * w);
        bands.push(band);
      }
    }
    // Slabs stay separate (few of them) so their top/side material groups survive.
    return { slabs, columns: columns.length ? mergeGeometries(columns) : null, bands: bands.length ? mergeGeometries(bands) : null };
  }, []);
  return (
    <>
      {slabs.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial attach="material-0" color="#2e3134" side={THREE.DoubleSide} />
          <meshStandardMaterial attach="material-1" color="#f2f0ea" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {bands && (
        <mesh geometry={bands}>
          <meshStandardMaterial color="#b53a2c" />
        </mesh>
      )}
      {columns && (
        <mesh geometry={columns} castShadow>
          <meshStandardMaterial color="#f3f1ec" />
        </mesh>
      )}
    </>
  );
}
