import * as THREE from 'three';

// Pixel-art look: render at a fraction of the screen resolution, upscale without smoothing.
export const PIXEL_DPR = 0.25; // 1 rendered pixel = 4 CSS pixels

// 3-step light ramp: toon shading gives flat, cartoon-like faces.
export const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const FLOOR_HEIGHT = 3.5; // meters
const BAY_WIDTH = 3; // meters between window centers

// One window bay (3 m × 3.5 m) as a tiny canvas texture, tiled over every wall.
// ExtrudeGeometry's side UVs are in meters (u along the wall, v up), so repeat = 1 / bay size.
export function wallTexture(wall: string, glass: string, frame: string) {
  const c = document.createElement('canvas');
  c.width = 6;
  c.height = 7;
  const g = c.getContext('2d')!;
  g.fillStyle = wall;
  g.fillRect(0, 0, 6, 7);
  g.fillStyle = frame;
  g.fillRect(1, 2, 4, 3);
  g.fillStyle = glass;
  g.fillRect(1, 2, 4, 2);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / BAY_WIDTH, 1 / FLOOR_HEIGHT);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
