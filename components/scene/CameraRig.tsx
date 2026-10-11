import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { campus, buildingHeight, findBuilding, type Building } from '@/lib/campus';
import { CAMERA_EVENT, type CameraCommand } from '@/components/ui/MapControls';

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

// leftInset / topInset / bottomInset: CSS px covered by side panels (desktop) or the top bar and bottom sheet (phones).
// The selection is fitted into the uncovered rectangle and centered in it.
export function CameraRig({ selectedId, bottomInset, leftInset, topInset }: { selectedId: string | null; bottomInset: number; leftInset: number; topInset: number }) {
  const ref = useRef<CameraControls>(null);
  const size = useThree((s) => s.size);
  // Shared by selection changes and the recenter button.
  const frame = useCallback(
    (smooth: boolean) => {
      const controls = ref.current;
      if (!controls) return;
      const b = findBuilding(selectedId);
      const sphere = b ? sphereOf([b]) : CAMPUS_SPHERE;
        // Orthographic zoom is CSS px per meter: fit the sphere's diameter into the uncovered rectangle.
      const zoom = Math.max(1.5, Math.min(size.width - leftInset, size.height - bottomInset - topInset) / (2 * sphere.radius));
      controls.moveTo(sphere.center.x, sphere.center.y, sphere.center.z, smooth);
      controls.zoomTo(zoom, smooth);
      // Shift by half the covered size (in meters at this zoom): -x moves the selection right, +y moves it up.
      controls.setFocalOffset(-leftInset / 2 / zoom, (bottomInset - topInset) / 2 / zoom, 0, smooth);
    },
    [selectedId, bottomInset, leftInset, topInset, size.width, size.height],
  );
  useEffect(() => {
    frame(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [frame]);

  // Zoom / recenter buttons (MapControls) talk to the camera through a window event.
  useEffect(() => {
    const onCommand = (e: Event) => {
      const controls = ref.current;
      if (!controls) return;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const command = (e as CustomEvent<CameraCommand>).detail;
      if (command === 'in') controls.zoomTo(controls.camera.zoom * 1.5, smooth);
      else if (command === 'out') controls.zoomTo(controls.camera.zoom / 1.5, smooth);
      else frame(smooth);
    };
    window.addEventListener(CAMERA_EVENT, onCommand);
    return () => window.removeEventListener(CAMERA_EVENT, onCommand);
  }, [frame]);
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
      dollyToCursor
      // SCREEN_PAN: vertical drags slide along the ground instead of lifting the view
      mouseButtons={{ left: ACTION.SCREEN_PAN, middle: ACTION.NONE, right: ACTION.SCREEN_PAN, wheel: ACTION.ZOOM }}
      touches={{ one: ACTION.TOUCH_SCREEN_PAN, two: ACTION.TOUCH_ZOOM_TRUCK, three: ACTION.NONE }}
    />
  );
}
