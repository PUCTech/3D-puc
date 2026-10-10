'use client';
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { campus, buildingHeight, type Locale } from '@/lib/campus';
import { Building } from './Building';
import { Ground } from './Ground';
import { Streets } from './Streets';
import { CameraRig } from './CameraRig';

const MAX_HEIGHT = Math.max(...campus.buildings.map(buildingHeight));
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
      maxHeight={MAX_HEIGHT}
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
    <Canvas camera={{ position: [140, 160, 180], fov: 40, near: 1, far: 5000 }} dpr={[1, 2]}>
      <color attach="background" args={['#020d2b']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[80, 150, 60]} intensity={1.5} />
      <Ground onClear={() => onSelect(null)} />
      <Streets />
      <Buildings selectedId={selectedId} locale={locale} onSelect={onSelect} />
      <CameraRig selectedId={selectedId} />
    </Canvas>
  );
}
