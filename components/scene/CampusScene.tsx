'use client';
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { campus, type Locale } from '@/lib/campus';
import { Building } from './Building';
import { Ground } from './Ground';
import { Streets } from './Streets';
import { CameraRig } from './CameraRig';
import { PIXEL_DPR } from './pixel';

const NEAR_DISTANCE = 160; // meters from camera to origin; closer than this, every building gets a label

function Buildings({ selectedId, locale, onSelect }: Props) {
  const [near, setNear] = useState(false);
  useFrame(({ camera }) => {
    const n = camera.position.length() < NEAR_DISTANCE;
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
      camera={{ position: [140, 160, 180], fov: 40, near: 1, far: 5000 }}
      dpr={PIXEL_DPR}
      gl={{ antialias: false }}
      shadows
      style={{ imageRendering: 'pixelated' }}
    >
      <color attach="background" args={['#9fd3f5']} />
      <hemisphereLight args={['#dff2ff', '#6b7f4e', 0.9]} />
      <directionalLight
        position={[60, 120, 40]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <Ground onClear={() => onSelect(null)} />
      <Streets />
      <Buildings selectedId={selectedId} locale={locale} onSelect={onSelect} />
      <CameraRig selectedId={selectedId} />
    </Canvas>
  );
}
