import { useMemo } from 'react';
import * as THREE from 'three';
import { campus } from '@/lib/campus';
import { mergeGeometries } from './geometry';

const items = campus.furniture ?? [];

// Zebra crossings: stripes running with the traffic, spread across the street.
function zebras() {
  const parts: THREE.BufferGeometry[] = [];
  for (const f of items.filter((f) => f.kind === 'crossing'))
    for (let k = -3; k <= 3; k++) {
      const g = new THREE.PlaneGeometry(3, 0.55); // 3 m along the street, 0.55 m wide
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0.06, k * 1.1);
      g.rotateY(-f.angle);
      g.translate(f.at[0], 0, f.at[1]);
      parts.push(g);
    }
  return parts.length ? mergeGeometries(parts) : null;
}

export function Furniture() {
  const stripes = useMemo(() => zebras(), []);
  return (
    <>
      {stripes && (
        <mesh geometry={stripes}>
          <meshBasicMaterial color="#f7f7f2" />
        </mesh>
      )}
      {items
        .filter((f) => f.kind === 'traffic_signals')
        .map((f, i) => (
          <group key={`s${i}`} position={[f.at[0], 0, f.at[1]]} rotation-y={-f.angle}>
            <mesh position-y={2} castShadow>
              <boxGeometry args={[0.25, 4, 0.25]} />
              <meshStandardMaterial color="#2c2f38" />
            </mesh>
            <mesh position-y={4.2}>
              <boxGeometry args={[0.5, 1.2, 0.5]} />
              <meshStandardMaterial color="#f2c230" />
            </mesh>
          </group>
        ))}
      {items
        .filter((f) => f.kind === 'bus_stop')
        .map((f, i) => (
          <group key={`b${i}`} position={[f.at[0], 0, f.at[1]]} rotation-y={-f.angle}>
            <mesh position-y={2.6} castShadow>
              <boxGeometry args={[4, 0.2, 1.6]} />
              <meshStandardMaterial color="#3a86c8" />
            </mesh>
            {[-1.8, 1.8].map((x) => (
              <mesh key={x} position={[x, 1.3, -0.6]}>
                <boxGeometry args={[0.15, 2.6, 0.15]} />
                <meshStandardMaterial color="#2c2f38" />
              </mesh>
            ))}
          </group>
        ))}
    </>
  );
}
