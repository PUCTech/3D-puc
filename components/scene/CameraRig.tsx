import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import { campus, buildingHeight, findBuilding, type Building } from '@/lib/campus';

const sphereOf = (buildings: Building[]) => {
  const box = new THREE.Box3();
  for (const b of buildings) {
    const top = (b.baseHeight ?? 0) + buildingHeight(b);
    for (const [x, z] of b.footprint) box.expandByPoint(new THREE.Vector3(x, 0, z)).expandByPoint(new THREE.Vector3(x, top, z));
  }
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  sphere.radius = Math.max(sphere.radius * 1.15, 15); // breathing room; small sheds still show their surroundings
  return sphere;
};
const CAMPUS_SPHERE = sphereOf(campus.buildings);

export function CameraRig({ selectedId }: { selectedId: string | null }) {
  const ref = useRef<CameraControls>(null);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const b = findBuilding(selectedId);
    // fitToSphere keeps the view angle (fitToBox snaps to axis-aligned views).
    controls.rotatePolarTo(0.9, smooth); // ~50° from vertical: buildings read as 3D, streets stay visible
    controls.fitToSphere(b ? sphereOf([b]) : CAMPUS_SPHERE, smooth);
  }, [selectedId]);
  return <CameraControls ref={ref} makeDefault minDistance={20} maxDistance={600} minPolarAngle={0.2} maxPolarAngle={Math.PI * 0.45} />;
}
