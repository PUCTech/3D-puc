import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { campus, buildingHeight, findBuilding, type Building } from '@/lib/campus';

const { ACTION } = CameraControlsImpl;
// Fixed isometric view, like a MOBA camera: pan and zoom only, no rotation.
// From the south-west: the view of visitors arriving from the entrance, facing the cobogó wall across the patio.
export const ISO_AZIMUTH = -Math.PI / 4;
export const ISO_POLAR = 0.96; // ~55° from vertical

const sphereOf = (buildings: Building[]) => {
  const box = new THREE.Box3();
  for (const b of buildings) {
    const top = (b.baseHeight ?? 0) + buildingHeight(b);
    for (const [x, z] of b.footprint) box.expandByPoint(new THREE.Vector3(x, 0, z)).expandByPoint(new THREE.Vector3(x, top, z));
  }
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  sphere.radius = Math.max(sphere.radius * 1.15, 15); // breathing room; small buildings still show their surroundings
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
    controls.fitToSphere(b ? sphereOf([b]) : CAMPUS_SPHERE, smooth);
  }, [selectedId]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minAzimuthAngle={ISO_AZIMUTH}
      maxAzimuthAngle={ISO_AZIMUTH}
      minPolarAngle={ISO_POLAR}
      maxPolarAngle={ISO_POLAR}
      minZoom={1.5}
      maxZoom={40}
      verticalDragToForward // vertical drags slide along the ground instead of lifting the view
      dollyToCursor
      mouseButtons={{ left: ACTION.TRUCK, middle: ACTION.NONE, right: ACTION.TRUCK, wheel: ACTION.ZOOM }}
      touches={{ one: ACTION.TOUCH_TRUCK, two: ACTION.TOUCH_ZOOM_TRUCK, three: ACTION.NONE }}
    />
  );
}
