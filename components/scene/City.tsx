import { useMemo } from 'react';
import * as THREE from 'three';
import { campus } from '@/lib/campus';
import { extrude, mergeGeometries } from './geometry';
import { toonRamp, wallTexture } from './pixel';

// shortcut: neighbour colors are a cheerful made-up palette, not their real facades
const PALETTE = ['#f4b8a4', '#f7d794', '#a9dcc0', '#a3c9ef', '#d9bdf0', '#f3efe6', '#eeb07f', '#c7e59a'];

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
      return g;
    });
    return parts.length ? mergeGeometries(parts) : null;
  }, []);
  const walls = useMemo(() => wallTexture('#ffffff'), []);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshToonMaterial vertexColors map={walls} gradientMap={toonRamp} />
    </mesh>
  );
}
