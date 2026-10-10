import { useMemo } from 'react';
import * as THREE from 'three';
import { campus } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { toonRamp } from './pixel';

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
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
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
  return (
    <>
      {solid && (
        <mesh geometry={solid} castShadow receiveShadow>
          <meshToonMaterial color={CONCRETE} gradientMap={toonRamp} />
        </mesh>
      )}
      {lattice && (
        <mesh geometry={lattice} castShadow>
          <meshToonMaterial map={texture} gradientMap={toonRamp} alphaTest={0.5} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}
