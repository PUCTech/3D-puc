import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point } from '@/lib/campus';
import { COBOGO_PANEL, cobogoTexture, toonRamp } from './pixel';

// A cobogó screen hung just outside one wall segment, facing away from the building's center.
export function Cobogo({ wall: [[x1, z1], [x2, z2]], center: [cx, cz], height, opacity }: { wall: [Point, Point]; center: Point; height: number; opacity: number }) {
  const { position, rotationY, length } = useMemo(() => {
    const length = Math.hypot(x2 - x1, z2 - z1);
    let [nx, nz] = [(z2 - z1) / length, -(x2 - x1) / length];
    const [mx, mz] = [(x1 + x2) / 2, (z1 + z2) / 2];
    if (nx * (mx - cx) + nz * (mz - cz) < 0) [nx, nz] = [-nx, -nz]; // point outward
    // PlaneGeometry faces +z; rotate it so its normal is (nx, 0, nz).
    return { position: [mx + nx * 0.15, height / 2, mz + nz * 0.15] as const, rotationY: Math.atan2(nx, nz), length };
  }, [x1, z1, x2, z2, cx, cz, height]);
  const texture = useMemo(() => {
    const t = cobogoTexture();
    t.repeat.set(length / COBOGO_PANEL.width, height / COBOGO_PANEL.height);
    return t;
  }, [length, height]);
  return (
    <mesh position={position} rotation-y={rotationY}>
      <planeGeometry args={[length, height]} />
      <meshToonMaterial map={texture} gradientMap={toonRamp} side={THREE.DoubleSide} transparent opacity={opacity} />
    </mesh>
  );
}
