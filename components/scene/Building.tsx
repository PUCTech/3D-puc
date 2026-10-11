import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { basementDepth, buildingHeight, floorBase, footprintCenter, type Building as B, type Locale, type Point } from '@/lib/campus';
import { INK_WIDTH, toonRamp, wallTexture } from './pixel';
import { blankShortWalls, extrude, flatPolygon } from './geometry';
import { Plants } from './Plants';
import { Cobogo } from './Cobogo';
import { Roof } from './Roof';
import { FloorPlan } from './FloorPlan';
import { LeanTo } from './LeanTo';

// Defaults when a building has no hand-written style.
const WALL = '#f6e7c8';
const ROOF = new THREE.Color('#b9a7a0');
const SELECTED_ROOF = new THREE.Color('#ffd166');

// floorLevel: when set (selected building only), the building is cut at that floor and its plan is shown.
type Props = { building: B; selected: boolean; dimmed: boolean; near: boolean; locale: Locale; floorLevel: number | null; onSelect: () => void };

// A few shrubs spread inside the footprint (each corner pulled toward the centroid).
const shrubSpots = (footprint: B['footprint']): B['footprint'] => {
  const n = footprint.length;
  const [cx, cz] = [footprint.reduce((s, p) => s + p[0], 0) / n, footprint.reduce((s, p) => s + p[1], 0) / n];
  return footprint.map(([x, z]) => [cx + (x - cx) * 0.55, cz + (z - cz) * 0.55]);
};

const LANDMARK_HEIGHT = 10; // meters; taller buildings keep their label in the overview

export function Building({ building, selected, dimmed, near, locale, floorLevel, onSelect }: Props) {
  const fullHeight = buildingHeight(building);
  const base = building.baseHeight ?? 0;
  const blankEnds = building.style?.blankEnds;
  const floor = floorLevel === null ? undefined : building.floors.find((f) => f.level === floorLevel);
  const cutAt = floor ? floorBase(building, floor.level) : null;
  const height = cutAt ?? fullHeight; // label and roof sit on what's visible
  // Volumes to extrude: in floor view, the floors below the cut; otherwise the massing parts (or the footprint).
  // Basements start below street level; they show only where the ground is sunken (e.g. the court side).
  const bottom = -basementDepth(building);
  const bodies = useMemo<{ footprint: Point[]; from: number; height: number; roofGarden?: boolean }[]>(() => {
    if (cutAt !== null) return cutAt > bottom ? [{ footprint: building.footprint, from: bottom, height: cutAt }] : [];
    if (building.parts) return building.parts.map((p) => ({ ...p, from: bottom }));
    return [{ footprint: building.footprint, from: bottom, height: fullHeight, roofGarden: building.style?.roofGarden }];
  }, [cutAt, bottom, building.footprint, building.parts, building.style?.roofGarden, fullHeight]);
  const geometries = useMemo(
    () =>
      bodies.map((b) => {
        const g = extrude(b.footprint, b.height - b.from);
        g.translate(0, b.from, 0);
        return blankEnds ? blankShortWalls(g, blankEnds) : g;
      }),
    [bodies, blankEnds],
  );
  const style = building.style ?? {};
  const floorHeight = building.floors.find((f) => f.level >= 0)?.height ?? 3.5;
  const walls = useMemo(() => wallTexture(style.wall ?? WALL, style.windows, floorHeight), [style.wall, style.windows, floorHeight]);
  const roofColor = useMemo(() => new THREE.Color(style.roof ?? ROOF), [style.roof]);
  const gardens = useMemo(
    () =>
      bodies
        .filter((b) => b.roofGarden)
        .map((b) => ({ height: b.height, geometry: flatPolygon(b.footprint, b.height + 0.05), shrubs: shrubSpots(b.footprint).map((at) => ({ kind: 'dracaena' as const, at })) })),
    [bodies],
  );
  const [cx, cz] = footprintCenter(building);
  const opacity = dimmed ? 0.45 : 1;
  const [hovered, setHovered] = useState(false);
  // In floor view the room labels take over; the name is already in the panel.
  const showLabel = !floor && (selected || hovered || (!dimmed && (near || fullHeight >= LANDMARK_HEIGHT)));
  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta < 4) onSelect();
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(false);
      document.body.style.cursor = '';
    },
  };

  return (
    <group position-y={base}>
      {bodies.map((b, i) => (
        <group key={i}>
          <mesh geometry={geometries[i]} castShadow receiveShadow {...handlers}>
            {/* ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls */}
            <meshToonMaterial attach="material-0" color={selected ? SELECTED_ROOF : roofColor} gradientMap={toonRamp} transparent opacity={opacity} />
            <meshToonMaterial attach="material-1" map={walls} gradientMap={toonRamp} transparent opacity={opacity} />
            {/* Ink outline: the main cartoon cue */}
            {!dimmed && <Edges threshold={15} color="#1b1b24" lineWidth={INK_WIDTH} />}
          </mesh>
          {/* planted terraces (roofGarden parts) stay flat */}
          {cutAt === null && style.roofShape && style.roofShape !== 'flat' && !b.roofGarden && (
            <Roof kind={style.roofShape} footprint={b.footprint} height={b.height} color={selected ? SELECTED_ROOF : roofColor} opacity={opacity} />
          )}
        </group>
      ))}
      {style.leanTo && (cutAt === null || cutAt >= 0) && <LeanTo {...style.leanTo} center={footprintCenter(building)} depth={-bottom} opacity={opacity} />}
      {cutAt === null && style.cobogoWall && <Cobogo wall={style.cobogoWall} center={footprintCenter(building)} height={fullHeight} floorHeight={floorHeight} opacity={opacity} />}
      {floor && cutAt !== null && <FloorPlan building={building} floor={floor} y={cutAt} />}
      {gardens.map((g, i) => (
        <group key={`garden-${i}`}>
          <mesh geometry={g.geometry} receiveShadow>
            <meshLambertMaterial color="#6cc24a" transparent opacity={opacity} />
          </mesh>
          <group position-y={g.height}>
            <Plants plants={g.shrubs} scale={0.6} />
          </group>
        </group>
      ))}
      {/* Always mounted, hidden with opacity: unmounting drei <Html> mid-render triggers React warnings */}
      <Html position={[cx, height + 3, cz]} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
        <span
          data-testid="building-label"
          className={`pixel-chip block whitespace-nowrap px-1.5 text-[13px] transition-opacity duration-200 ${selected ? 'bg-sun text-ink' : hovered ? 'bg-ice text-navy' : 'bg-paper text-navy'} ${showLabel ? 'opacity-100' : 'opacity-0'}`}
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
