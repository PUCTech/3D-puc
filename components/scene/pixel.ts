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

// Rino Levi's cobogó panel (2.52 m × 3.38 m): 9 × 12 cement cells, lower 9 rows glazed,
// top 3 rows brass louvers. One pixel per cell plus 1-pixel concrete ribs.
export function cobogoTexture() {
  const c = document.createElement('canvas');
  c.width = 19;
  c.height = 25;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e4ded2'; // concrete ribs
  g.fillRect(0, 0, 19, 25);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 9; col++) {
      g.fillStyle = row < 3 ? '#c9a24a' : '#7fb2d6'; // canvas row 0 is the top: brass louvers, then glass
      g.fillRect(1 + col * 2, 1 + row * 2, 1, 1);
    }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const COBOGO_PANEL = { width: 2.52, height: 3.38 }; // meters

const BAY_WIDTH = 3; // meters between window centers

export type WindowKind = 'default' | 'shutter-white' | 'shutter-grey' | 'framed' | 'ribbon';

// One window bay (3 m wide × one floor tall) as an 8×8 canvas, tiled over every wall.
// Wall UVs are in meters (u along the wall, v up), so repeat = 1 / bay size.
// The bottom-left texel is always plain wall: roofs/caps sample UV (0,0) to stay window-free.
// Window kinds come from photos (see docs/realism-log.md).
export function wallTexture(wall: string, kind: WindowKind = 'default', floorHeight = 3.5) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const g = c.getContext('2d')!;
  const px = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  px(wall, 0, 0, 8, 8);
  const shade = new THREE.Color(wall).multiplyScalar(0.8).getStyle(); // recess shadow
  if (kind === 'shutter-white' || kind === 'shutter-grey') {
    const [leaf, line] = kind === 'shutter-white' ? ['#f7f5ef', '#cfcac0'] : ['#767b77', '#585c59'];
    px(shade, 2, 1, 5, 5); // deep recess
    px(leaf, 2, 1, 4, 5);
    for (let y = 2; y < 6; y += 2) px(line, 2, y, 4, 1); // louvers
  } else if (kind === 'framed') {
    px('#94a3a6', 1, 1, 6, 5); // grey-blue surround
    px('#3b4048', 2, 2, 4, 3);
    px('#c9cfd2', 4, 2, 1, 3); // grille
    px('#c9cfd2', 2, 3, 4, 1);
  } else if (kind === 'ribbon') {
    px('#f4f4f0', 0, 2, 8, 3); // continuous frame band
    px('#8fb3c9', 0, 2, 7, 2);
  } else {
    px('#3a3a48', 2, 2, 4, 3);
    px('#6fb6e8', 2, 2, 4, 2);
  }
  px(wall, 0, 7, 1, 1);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / BAY_WIDTH, 1 / floorHeight);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
