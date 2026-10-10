'use client';
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { campus, type Locale } from '@/lib/campus';
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
import { GROUND_COLOR } from './Ground';

const NEAR_ZOOM = 6; // orthographic zoom = CSS px per meter; zoomed in past this, every building gets a label

function Buildings({ selectedId, locale, onSelect }: Props) {
  const [near, setNear] = useState(false);
  useFrame(({ camera }) => {
    const n = camera.zoom > NEAR_ZOOM;
    if (n !== near) setNear(n);
  });
  return campus.buildings.map((b) => (
    <Building
      key={b.id}
      building={b}
      selected={b.id === selectedId}
      dimmed={selectedId !== null && b.id !== selectedId}
      near={near}
      locale={locale}
      onSelect={() => onSelect(b.id)}
    />
  ));
}

type Props = { selectedId: string | null; locale: Locale; onSelect: (id: string | null) => void };

export default function CampusScene({ selectedId, locale, onSelect }: Props) {
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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-camera-far={600}
      />
      <Ground onClear={() => onSelect(null)} />
      <Site />
      <Streets />
      <City />
      <Marquees />
      <Edge />
      <Furniture />
      <Buildings selectedId={selectedId} locale={locale} onSelect={onSelect} />
      <CameraRig selectedId={selectedId} />
    </Canvas>
  );
}
