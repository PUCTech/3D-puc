import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import type { Point } from '@/lib/campus';
import { mergeGeometries } from './geometry';
import { COBOGO_PANEL, INK_WIDTH, cobogoTexture, toonRamp } from './pixel';
import { useNight } from './night';

const FRAME = { pilaster: 0.3, beam: 0.25, depth: 0.45 }; // meters; photos 04/05/tour 02: frame stands proud of the lattice

// Rino Levi's cobogó facade as relief (photos 04, 05, tour 02): a lattice screen just outside the wall,
// with light concrete pilasters at every panel joint and a floor beam at every level, both standing proud.
export function Cobogo({
  wall: [[x1, z1], [x2, z2]],
  center: [cx, cz],
  height,
  floorHeight,
  opacity,
}: {
  wall: [Point, Point];
  center: Point;
  height: number;
  floorHeight: number;
  opacity: number;
}) {
  const night = useNight();
  const { position, rotationY, length } = useMemo(() => {
    const length = Math.hypot(x2 - x1, z2 - z1);
    let [nx, nz] = [(z2 - z1) / length, -(x2 - x1) / length];
    const [mx, mz] = [(x1 + x2) / 2, (z1 + z2) / 2];
    if (nx * (mx - cx) + nz * (mz - cz) < 0) [nx, nz] = [-nx, -nz]; // point outward
    // Local frame: x along the wall, +z outward (PlaneGeometry faces +z).
    return { position: [mx + nx * 0.15, 0, mz + nz * 0.15] as const, rotationY: Math.atan2(nx, nz), length };
  }, [x1, z1, x2, z2, cx, cz]);
  const texture = useMemo(() => {
    const t = cobogoTexture();
    t.repeat.set(length / COBOGO_PANEL.width, height / COBOGO_PANEL.height);
    return t;
  }, [length, height]);
  const frame = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const panels = Math.max(1, Math.round(length / COBOGO_PANEL.width));
    for (let i = 0; i <= panels; i++) {
      const g = new THREE.BoxGeometry(FRAME.pilaster, height, FRAME.depth);
      g.translate(-length / 2 + (i * length) / panels, height / 2, FRAME.depth / 2);
      parts.push(g);
    }
    for (let y = floorHeight; y < height - 0.5; y += floorHeight) {
      const g = new THREE.BoxGeometry(length, FRAME.beam, FRAME.depth);
      g.translate(0, y, FRAME.depth / 2);
      parts.push(g);
    }
    return mergeGeometries(parts);
  }, [length, height, floorHeight]);
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position-y={height / 2}>
        <planeGeometry args={[length, height]} />
        {/* night: the lit corridors behind glow warm through the glass grid */}
        <meshToonMaterial map={texture} gradientMap={toonRamp} side={THREE.DoubleSide} transparent opacity={opacity} emissive="#ffcf80" emissiveMap={texture} emissiveIntensity={night ? 0.7 : 0} />
      </mesh>
      <mesh geometry={frame} castShadow>
        <meshToonMaterial color="#d3d8d8" gradientMap={toonRamp} transparent opacity={opacity} />
        {/* soft grey ink: the real frame is light, black lines read too heavy at this density */}
        {opacity === 1 && <Edges threshold={30} color="#8a9094" lineWidth={INK_WIDTH * 0.5} />}
      </mesh>
    </group>
  );
}
