import type { ThreeEvent } from '@react-three/fiber';

export function Ground({ onClear }: { onClear: () => void }) {
  return (
    // delta = pixels the pointer moved; ignore orbit drags so they don't clear the selection
    <mesh rotation-x={-Math.PI / 2} position-y={-0.01} onClick={(e: ThreeEvent<MouseEvent>) => e.delta < 4 && onClear()}>
      <planeGeometry args={[3000, 3000]} />
      <meshStandardMaterial color="#081a3e" />
    </mesh>
  );
}
