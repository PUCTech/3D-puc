import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { buildingHeight, footprintCenter, type Building as B } from '@/lib/campus';

const LOW = new THREE.Color('#143966');
const HIGH = new THREE.Color('#2b6fac');
const ICE = new THREE.Color('#bae4fe');

type Props = { building: B; maxHeight: number; selected: boolean; dimmed: boolean; near: boolean; onSelect: () => void };

const LANDMARK_HEIGHT = 10; // meters; taller buildings keep their label in the overview

export function Building({ building, maxHeight, selected, dimmed, near, onSelect }: Props) {
  const height = buildingHeight(building);
  const base = building.baseHeight ?? 0;
  const geometry = useMemo(() => {
    // Shape lives in XY; after rotateX(-90°), shape y becomes -z, so feed -z to land on +z (south).
    const shape = new THREE.Shape(building.footprint.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [building.footprint, height]);
  const side = useMemo(() => LOW.clone().lerp(HIGH, maxHeight ? height / maxHeight : 0), [height, maxHeight]);
  const roof = useMemo(() => (selected ? side.clone().lerp(ICE, 0.6) : side.clone().lerp(ICE, 0.15)), [side, selected]);
  const [cx, cz] = footprintCenter(building);
  const opacity = dimmed ? 0.45 : 1;
  const showLabel = selected || (!dimmed && (near || height >= LANDMARK_HEIGHT));

  return (
    <group position-y={base}>
      <mesh
        geometry={geometry}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 4) onSelect(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls */}
        <meshStandardMaterial attach="material-0" color={roof} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-1" color={side} transparent opacity={opacity} />
        {!dimmed && <Edges threshold={15} color={selected ? '#bae4fe' : '#7fb4dd'} lineWidth={selected ? 2 : 1} />}
      </mesh>
      {/* Always mounted, hidden with opacity: unmounting drei <Html> mid-render triggers React warnings */}
      <Html position={[cx, height + 3, cz]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
        <span
          className={`block whitespace-nowrap font-mono text-[10px] uppercase tracking-widest transition-opacity duration-300 ${selected ? 'text-ice' : 'text-ice/60'} ${showLabel ? 'opacity-100' : 'opacity-0'}`}
        >
          {building.shortName ?? building.name.pt}
        </span>
      </Html>
      {selected && building.entrances?.map(([x, z], i) => <Entrance key={i} x={x} z={z} />)}
    </group>
  );
}

function Entrance({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + 0.3 * Math.sin(clock.elapsedTime * 3);
    ref.current?.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={[x, 0.05, z]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.8, 1.3, 32]} />
      <meshBasicMaterial color="#bae4fe" />
    </mesh>
  );
}
