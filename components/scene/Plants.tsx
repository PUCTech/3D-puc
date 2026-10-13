import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';

import { hideOccluders, tagObject } from './occlusion';

// Custom low-poly plant models, one per species seen in the campus photos
// (see docs/realism-log.md): Canary palm (07), slender multi-stem street trees (14),
// broad shade trees (02, tour 01), monstera clumps (02, tour 01), spiky dracaena shrubs (tour 01).
export type PlantKind = 'palm' | 'slender' | 'shade' | 'monstera' | 'dracaena';
// h: measured height in m (2017 LiDAR canopy), scaling the model; without it each species keeps its nominal size.
export type Plant = { kind: PlantKind; at: Point; h?: number };

// Deterministic per-plant randomness (mulberry32), so the scene is stable across reloads.
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BARK = '#7a5c3e';
const PALM_BARK = '#9a7b55';
const LEAF = ['#3b7a3a', '#447f3c', '#4f8a42', '#356f35'];
const DARK_LEAF = ['#25502c', '#2d5a30', '#28532f'];
const BLADE = ['#6f9a45', '#587f3a', '#86a650'];

const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 6);
const taperCylinder = new THREE.CylinderGeometry(0.7, 1, 1, 6);
const blob = new THREE.IcosahedronGeometry(1, 0);
const blade = new THREE.BoxGeometry(1, 0.03, 1);
const leafDisc = new THREE.CircleGeometry(1, 7);

type Part = { geometry: THREE.BufferGeometry; matrix: THREE.Matrix4; color: string };

// A cylinder from point a to point b with the given radius.
function stem(a: THREE.Vector3, b: THREE.Vector3, radius: number, color: string, tapered = true): Part {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const m = new THREE.Matrix4().compose(a.clone().lerp(b, 0.5), q, new THREE.Vector3(radius, len, radius));
  return { geometry: tapered ? taperCylinder : unitCylinder, matrix: m, color };
}
const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const scaled = (pos: THREE.Vector3, s: THREE.Vector3, rot = new THREE.Euler()) =>
  new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromEuler(rot), s);

function palm(r: () => number): Part[] {
  const h = 7 + r() * 2.5;
  const parts: Part[] = [stem(at(0, 0, 0), at(0, h, 0), 0.5, PALM_BARK, false)];
  parts.push({ geometry: blob, matrix: scaled(at(0, h, 0), at(0.9, 0.7, 0.9)), color: DARK_LEAF[0] });
  const fronds = 18;
  for (let i = 0; i < fronds; i++) {
    // Each frond: 4 flat segments, starting upward and arching down (photo 07).
    let m = new THREE.Matrix4().makeTranslation(0, h, 0);
    m.multiply(new THREE.Matrix4().makeRotationY((i / fronds) * Math.PI * 2 + r() * 0.3));
    m.multiply(new THREE.Matrix4().makeRotationZ(0.9 - (i % 3) * 0.35));
    for (let s = 0; s < 4; s++) {
      const len = 1.3;
      const width = 0.7 - s * 0.14;
      parts.push({ geometry: blade, matrix: m.clone().multiply(scaled(at(len / 2, 0, 0), at(len, 1, width))), color: LEAF[(i + s) % LEAF.length] });
      m = m.clone().multiply(new THREE.Matrix4().makeTranslation(len, 0, 0)).multiply(new THREE.Matrix4().makeRotationZ(-0.38));
    }
  }
  return parts;
}

function slender(r: () => number): Part[] {
  // Photo 14: clumps of thin, slightly leaning trunks with small crowns high up.
  const parts: Part[] = [];
  const stems = 3 + Math.floor(r() * 3);
  for (let i = 0; i < stems; i++) {
    const a = (i / stems) * Math.PI * 2 + r();
    const base = at(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3);
    const h = 9 + r() * 4;
    const top = at(Math.cos(a) * (0.6 + r()), h, Math.sin(a) * (0.6 + r()));
    parts.push(stem(base, top, 0.14, BARK));
    for (let k = 0; k < 2; k++)
      parts.push({ geometry: blob, matrix: scaled(top.clone().add(at(r() - 0.5, k * 0.9 - 0.3, r() - 0.5)), at(1.1, 0.8, 1.1).multiplyScalar(0.8 + r() * 0.5)), color: LEAF[(i + k) % LEAF.length] });
  }
  return parts;
}

function shade(r: () => number): Part[] {
  // Broad patio tree: short trunk, a few branches, a lumpy crown of several blobs.
  const h = 3 + r() * 1.5;
  const parts: Part[] = [stem(at(0, 0, 0), at(0, h, 0), 0.3, BARK)];
  const crownY = h + 2.2 + r();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + r();
    parts.push(stem(at(0, h, 0), at(Math.cos(a) * 1.6, crownY - 0.6, Math.sin(a) * 1.6), 0.13, BARK));
  }
  const blobs = 5 + Math.floor(r() * 3);
  for (let i = 0; i < blobs; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 2;
    parts.push({ geometry: blob, matrix: scaled(at(Math.cos(a) * d, crownY + r() * 1.4, Math.sin(a) * d), at(1, 0.8, 1).multiplyScalar(1.4 + r() * 0.9)), color: LEAF[i % LEAF.length] });
  }
  return parts;
}

function monstera(r: () => number): Part[] {
  // Low clump of big flat leaves on short stalks, tilted outward.
  const parts: Part[] = [];
  const leaves = 6 + Math.floor(r() * 4);
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2 + r() * 0.4;
    const d = 0.4 + r() * 0.5;
    const y = 0.5 + r() * 0.9;
    const tip = at(Math.cos(a) * d, y, Math.sin(a) * d);
    parts.push(stem(at(0, 0, 0), tip, 0.03, DARK_LEAF[1], false));
    const rot = new THREE.Euler(-Math.PI / 2 + 0.6 + r() * 0.4, 0, 0);
    const m = new THREE.Matrix4().makeTranslation(tip.x, tip.y, tip.z).multiply(new THREE.Matrix4().makeRotationY(-a + Math.PI / 2)).multiply(scaled(at(0, 0, 0), at(0.55 + r() * 0.2, 0.45, 1), rot));
    parts.push({ geometry: leafDisc, matrix: m, color: DARK_LEAF[i % DARK_LEAF.length] });
  }
  return parts;
}

function dracaena(r: () => number): Part[] {
  // Spiky shrub: a few thin stems, each topped by a tuft of long blades.
  const parts: Part[] = [];
  const stems = 2 + Math.floor(r() * 3);
  for (let i = 0; i < stems; i++) {
    const top = at((r() - 0.5) * 0.8, 1.2 + r() * 1.4, (r() - 0.5) * 0.8);
    parts.push(stem(at(0, 0, 0), top, 0.05, '#6b5a3a', false));
    for (let b = 0; b < 9; b++) {
      const m = new THREE.Matrix4()
        .makeTranslation(top.x, top.y, top.z)
        .multiply(new THREE.Matrix4().makeRotationY((b / 9) * Math.PI * 2 + r()))
        .multiply(new THREE.Matrix4().makeRotationZ(0.4 + r() * 0.6))
        .multiply(scaled(at(0.45, 0, 0), at(0.9, 1, 0.09)));
      parts.push({ geometry: blade, matrix: m, color: BLADE[(i + b) % BLADE.length] });
    }
  }
  return parts;
}

const BUILDERS: Record<PlantKind, (r: () => number) => Part[]> = { palm, slender, shade, monstera, dracaena };
// Rough [radius, height] of each kind, for hiding plants in front of the selection (occlusion.ts).
const SIZE: Record<PlantKind, [number, number]> = { palm: [4, 10], slender: [2, 13], shade: [3.5, 9], monstera: [1.2, 1.6], dracaena: [1, 2.8] };

// All plants of a group merged into one vertex-colored mesh.
function buildPlants(plants: Plant[], scale: number) {
  const pieces: THREE.BufferGeometry[] = [];
  plants.forEach((p, i) => {
    const r = rng(Math.round(p.at[0] * 1000) ^ Math.round(p.at[1] * 1000) ^ (i * 7919));
    const s = scale * (p.h ? p.h / SIZE[p.kind][1] : 1);
    const place = new THREE.Matrix4().makeTranslation(p.at[0], 0, p.at[1]).multiply(new THREE.Matrix4().makeRotationY(r() * Math.PI * 2)).multiply(new THREE.Matrix4().makeScale(s, s, s));
    for (const part of BUILDERS[p.kind](r)) {
      let g = part.geometry.clone().applyMatrix4(place.clone().multiply(part.matrix));
      if (g.index) g = g.toNonIndexed(); // merging needs all pieces non-indexed
      g.deleteAttribute('uv');
      const c = new THREE.Color(part.color);
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      for (let v = 0; v < colors.length; v += 3) colors.set([c.r, c.g, c.b], v);
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      pieces.push(tagObject(g, p.at[0], p.at[1], SIZE[p.kind][0] * s, SIZE[p.kind][1] * s));
    }
  });
  return pieces.length ? mergeGeometries(pieces) : null;
}

export function Plants({ plants, scale = 1 }: { plants: Plant[]; scale?: number }) {
  const geometry = useMemo(() => buildPlants(plants, scale), [plants, scale]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} onBeforeCompile={hideOccluders} />
    </mesh>
  );
}
