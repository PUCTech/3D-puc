import * as THREE from 'three';

// Pixel-art look: render at a fraction of the screen resolution, upscale without smoothing.
export const PIXEL_DPR = 0.25; // 1 rendered pixel = 4×4 CSS pixels: chunky, dungeon-game pixels
export const INK_WIDTH = 1.5 / PIXEL_DPR; // outline ≈ 1.5 rendered pixels: thinner breaks into dashes

// 3-step light ramp: toon shading gives flat faces; bright shadows keep it colorful.
export const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const FLOOR_HEIGHT = 3.5; // meters
const BAY_WIDTH = 3; // meters between window centers

// One window bay (3 m × 3.5 m) as a tiny canvas texture, tiled over every wall.
// Wall UVs are in meters (u along the wall, v up), so repeat = 1 / bay size.
// UV (0,0) is plain wall, which caps use to stay window-free.
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
