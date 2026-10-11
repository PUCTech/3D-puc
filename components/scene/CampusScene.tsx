'use client';
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { basementDepth, campus, type Locale } from '@/lib/campus';
import { Building } from './Building';
import { Ground } from './Ground';
import { Streets } from './Streets';
import { CameraRig } from './CameraRig';
import { PIXEL_DPR } from './pixel';
import { City } from './City';
import { Site } from './Site';
import { Marquees } from './Marquees';
import { Edge } from './Edge';
import { Furniture } from './Furniture';
import { StreetFence } from './StreetFence';
import { Props as CampusProps } from './Props';
import { Plants } from './Plants';
import { GROUND_COLOR } from './Ground';

const STREET_TREES = (campus.streetTrees ?? []).map((at) => ({ kind: 'slender' as const, at }));
const NEAR_ZOOM = 6; // orthographic zoom = CSS px per meter; zoomed in past this, every building gets a label

// Street-level-only buildings (no basement, not on the sunken ground) are hidden in the lower view.
const onLowerLevel = (b: (typeof campus.buildings)[number]) => basementDepth(b) > 0 || (b.baseHeight ?? 0) < 0;
export const LOWER_DEPTH = campus.sunken?.[0]?.depth ?? 0;

function Buildings({ selectedId, selectedFloor, lower, locale, onSelect }: Props) {
  const [near, setNear] = useState(false);
  useFrame(({ camera }) => {
    const n = camera.zoom > NEAR_ZOOM;
    if (n !== near) setNear(n);
  });
  return campus.buildings.filter((b) => !lower || onLowerLevel(b)).map((b) => (
    <Building
      key={b.id}
      building={b}
      selected={b.id === selectedId}
      dimmed={selectedId !== null && b.id !== selectedId}
      near={near}
      // lower view opens basements at their lowest floor
      floorLevel={lower && basementDepth(b) > 0 ? Math.min(...b.floors.map((f) => f.level)) : b.id === selectedId ? selectedFloor : null}
      lower={lower}
      locale={locale}
      onSelect={() => onSelect(b.id)}
    />
  ));
}

// lower: show only the lower level (court, Prédio 2 subsolo, Prédio 3, DTI); street-level layers are removed.
type Props = { selectedId: string | null; selectedFloor: number | null; lower: boolean; bottomInset?: number; locale: Locale; onSelect: (id: string | null) => void };

export default function CampusScene({ selectedId, selectedFloor, lower, bottomInset = 0, locale, onSelect }: Props) {
  return (
    <Canvas
      orthographic
      camera={{ position: [-250, 300, 250], zoom: 4, near: 1, far: 3000 }}
      dpr={PIXEL_DPR}
      gl={{ antialias: false }}
      shadows
      style={{ imageRendering: 'pixelated' }}
    >
      <color attach="background" args={[GROUND_COLOR]} />
      <hemisphereLight args={['#ffffff', '#7fae55', 1.1]} />
      <directionalLight
        position={[120, 240, 80]}
        intensity={2.2}
        castShadow
        shadow-bias={-0.0005}
        shadow-normalBias={0.08} // removes acne stripes on roofs and slopes
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-camera-far={600}
      />
      <Ground lower={lower} onClear={() => onSelect(null)} />
      <Site lower={lower} />
      {/* the city keeps its place relative to the ground */}
      <group position-y={lower ? -LOWER_DEPTH : 0}>
        <City />
      </group>
      {!lower && (
        <>
          <Streets />
          <Marquees />
          <Edge />
          <Furniture />
          <StreetFence />
          <CampusProps />
          <Plants plants={STREET_TREES} />
        </>
      )}
      <Buildings selectedId={selectedId} selectedFloor={selectedFloor} lower={lower} locale={locale} onSelect={onSelect} />
      <CameraRig selectedId={selectedId} bottomInset={bottomInset} />
    </Canvas>
  );
}
