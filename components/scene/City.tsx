import { useMemo } from 'react';
import * as THREE from 'three';
import { campus } from '@/lib/campus';
import { extrude, mergeGeometries } from './geometry';
import { toonRamp, wallTexture } from './pixel';
import { hideOccluders, tagObject } from './occlusion';

// Muted concrete tones seen behind the campus in every photo (03, 07, tour 04, Descubra Sampa gate):
// grey, off-white and beige towers. Per-building colors are still not individually known.
const PALETTE = ['#d9d6cf', '#c9c4ba', '#e4ded2', '#b9b7b2', '#d6cdbd', '#cfd3d6', '#bfb5a5', '#e8e4dc'];

// All neighbouring buildings as one merged mesh (~300 buildings, one draw call).
export function City() {
  const geometry = useMemo(() => {
    const parts = (campus.context ?? []).map((c, i) => {
      const g = extrude(c.footprint, c.height);
      const wall = new THREE.Color(PALETTE[i % PALETTE.length]);
      const roof = wall.clone().multiplyScalar(0.75);
      const capCount = g.groups[0].count; // caps come first in ExtrudeGeometry's non-indexed vertices
      const uv = g.getAttribute('uv') as THREE.BufferAttribute;
      const colors = new Float32Array(uv.count * 3);
      for (let v = 0; v < uv.count; v++) {
        const c = v < capCount ? roof : wall;
        colors.set([c.r, c.g, c.b], v * 3);
        if (v < capCount) uv.setXY(v, 0, 0); // plain-wall texel: no windows on roofs
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      g.clearGroups();
      const xs = c.footprint.map((q) => q[0]), zs = c.footprint.map((q) => q[1]);
      const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
      return tagObject(g, (x0 + x1) / 2, (z0 + z1) / 2, Math.hypot(x1 - x0, z1 - z0) / 2, c.height);
    });
    return parts.length ? mergeGeometries(parts) : null;
  }, []);
  const walls = useMemo(() => wallTexture('#ffffff'), []);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshToonMaterial vertexColors map={walls} gradientMap={toonRamp} onBeforeCompile={hideOccluders} />
    </mesh>
  );
}
