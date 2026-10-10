import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { buildingHeight, footprintCenter, type Building as B, type Locale } from '@/lib/campus';
import { INK_WIDTH, toonRamp, wallTexture } from './pixel';
import { extrude, flatPolygon } from './geometry';
import { Trees } from './Trees';

// Defaults when a building has no hand-written style.
const WALL = '#f6e7c8';
const GLASS = '#6fb6e8';
const FRAME = '#3a3a48';
const ROOF = new THREE.Color('#b9a7a0');
const SELECTED_ROOF = new THREE.Color('#ffd166');

type Props = { building: B; selected: boolean; dimmed: boolean; near: boolean; locale: Locale; onSelect: () => void };

// A few shrubs spread inside the footprint (each corner pulled toward the centroid).
const shrubSpots = (footprint: B['footprint']): B['footprint'] => {
  const n = footprint.length;
  const [cx, cz] = [footprint.reduce((s, p) => s + p[0], 0) / n, footprint.reduce((s, p) => s + p[1], 0) / n];
  return footprint.map(([x, z]) => [cx + (x - cx) * 0.55, cz + (z - cz) * 0.55]);
};

const LANDMARK_HEIGHT = 10; // meters; taller buildings keep their label in the overview

export function Building({ building, selected, dimmed, near, locale, onSelect }: Props) {
  const height = buildingHeight(building);
  const base = building.baseHeight ?? 0;
  const geometry = useMemo(() => extrude(building.footprint, height), [building.footprint, height]);
  const style = building.style ?? {};
  const walls = useMemo(() => wallTexture(style.wall ?? WALL, GLASS, FRAME), [style.wall]);
  const roofColor = useMemo(() => new THREE.Color(style.roof ?? ROOF), [style.roof]);
  const roofGarden = useMemo(() => (style.roofGarden ? flatPolygon(building.footprint, height + 0.05) : null), [style.roofGarden, building.footprint, height]);
  const roofShrubs = useMemo(() => (style.roofGarden ? shrubSpots(building.footprint) : []), [style.roofGarden, building.footprint]);
  const [cx, cz] = footprintCenter(building);
  const opacity = dimmed ? 0.45 : 1;
  const showLabel = selected || (!dimmed && (near || height >= LANDMARK_HEIGHT));

  return (
    <group position-y={base}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 4) onSelect(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls */}
        <meshToonMaterial attach="material-0" color={selected ? SELECTED_ROOF : roofColor} gradientMap={toonRamp} transparent opacity={opacity} />
        <meshToonMaterial attach="material-1" map={walls} gradientMap={toonRamp} transparent opacity={opacity} />
        {/* Ink outline: the main cartoon cue */}
        {!dimmed && <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH} />}
      </mesh>
      {roofGarden && (
        <>
          <mesh geometry={roofGarden} receiveShadow>
            <meshLambertMaterial color="#6cc24a" transparent opacity={opacity} />
          </mesh>
          <group position-y={height}>
            <Trees at={roofShrubs} scale={0.35} />
          </group>
        </>
      )}
      {/* Always mounted, hidden with opacity: unmounting drei <Html> mid-render triggers React warnings */}
      <Html position={[cx, height + 3, cz]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
        <span
          data-testid="building-label"
          className={`block whitespace-nowrap font-mono text-[10px] uppercase tracking-widest transition-opacity duration-300 ${selected ? 'text-yellow-200' : 'text-white'} [text-shadow:1px_1px_0_#000] ${showLabel ? 'opacity-100' : 'opacity-0'}`}
        >
          {building.shortName ?? building.name[locale]}
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
