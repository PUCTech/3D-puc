import type { ThreeEvent } from '@react-three/fiber';

export const GROUND_COLOR = '#b7ab98'; // warm concrete: São Paulo sidewalks and lots

export function Ground({ onClear }: { onClear: () => void }) {
  return (
    // delta = pixels the pointer moved; ignore pan drags so they don't clear the selection
    <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow onClick={(e: ThreeEvent<MouseEvent>) => e.delta < 4 && onClear()}>
      <planeGeometry args={[3000, 3000]} />
      <meshLambertMaterial color={GROUND_COLOR} />
    </mesh>
  );
}
