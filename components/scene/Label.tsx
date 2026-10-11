import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

// A text label pinned to a 3D point: a plain DOM span over the canvas, moved with a CSS transform on each rendered
// frame. Replaces drei <Html>, which mounts a React root per label (costly on phones) and unmounts it synchronously,
// which React reports as an error ("synchronously unmount a root while React was already rendering").
export function Label({ position, text, className, testId }: { position: [number, number, number]; text: string; className: string; testId?: string }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const ref = useRef<HTMLSpanElement | null>(null);
  const v = useRef(new THREE.Vector3());

  useLayoutEffect(() => {
    const el = (ref.current = document.createElement('span'));
    el.style.cssText = 'position:absolute;top:0;left:0;z-index:10;pointer-events:none;user-select:none;will-change:transform';
    gl.domElement.parentElement?.appendChild(el);
    return () => el.remove();
  }, [gl]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = text;
    el.className = className;
    if (testId) el.dataset.testid = testId;
  }, [text, className, testId]);

  // Runs only when the scene renders (frameloop="demand"), i.e. exactly when the camera or scene changed.
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const p = v.current.set(...position).project(camera);
    el.style.transform = `translate(${((p.x + 1) / 2) * size.width}px, ${((1 - p.y) / 2) * size.height}px) translate(-50%, -50%)`;
  });
  return null;
}
