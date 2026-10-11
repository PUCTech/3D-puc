import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { campus } from '@/lib/campus';
import { flatPolygon } from './geometry';

export const GROUND_COLOR = '#b7ab98'; // warm concrete: São Paulo sidewalks and lots
const SIZE = 1500;

export function Ground({ onClear }: { onClear: () => void }) {
  // Holes where the ground is sunken, so the lower level shows through.
  const geometry = useMemo(
    () => flatPolygon([[-SIZE, -SIZE], [SIZE, -SIZE], [SIZE, SIZE], [-SIZE, SIZE]], -0.01, (campus.sunken ?? []).map((s) => s.polygon)),
    [],
  );
  return (
    // delta = pixels the pointer moved; ignore pan drags so they don't clear the selection
    <mesh geometry={geometry} receiveShadow onClick={(e: ThreeEvent<MouseEvent>) => e.delta < 4 && onClear()}>
      <meshLambertMaterial color={GROUND_COLOR} />
    </mesh>
  );
}
