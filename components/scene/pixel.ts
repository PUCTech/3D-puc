import * as THREE from 'three';

// Pixel-art look: render at a fraction of the screen resolution, upscale without smoothing.
export const PIXEL_DPR = 0.5; // desktop: 1 rendered pixel = 2×2 CSS pixels: pixel-art feel, still crisp enough to read
export const PHONE_DPR = 1; // phones: 1 rendered pixel per CSS pixel; small screens read chunky pixels as blur
export const INK_WIDTH = 1.5 / PIXEL_DPR; // outline ≈ 1.5 rendered pixels: thinner breaks into dashes

// 3-step light ramp: toon shading gives flat faces; bright shadows keep it colorful.
export const toonRamp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([150, 210, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

// Rino Levi's cobogó panel (2.52 m × 3.38 m) as in photos 04/05: a cream cement grid of 9 × 12 cells,
// dark glass in the lower 9 rows, cream concrete louvers in the top 3, light pilaster/beam on the panel edge.
export function cobogoTexture() {
  const c = document.createElement('canvas');
  c.width = 20;
  c.height = 26;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e6dcc2'; // cement grid
  g.fillRect(0, 0, 20, 26);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 9; col++) {
      g.fillStyle = row < 3 ? '#bfb39a' : '#4f5b63'; // canvas row 0 is the top: louver shadow lines, then dark glass
      g.fillRect(2 + col * 2, 1 + row * 2, 1, 1);
    }
  g.fillStyle = '#d9d9d4'; // pilaster and floor beam between panels
  g.fillRect(0, 0, 1, 26);
  g.fillRect(0, 25, 20, 1);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const COBOGO_PANEL = { width: 2.52, height: 3.38 }; // meters

const BAY_WIDTH = 3; // meters between window centers

export type WindowKind = 'default' | 'shutter-white' | 'shutter-grey' | 'framed' | 'ribbon' | 'pane';

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
  } else if (kind === 'pane') {
    // Large white-framed multi-pane window (court photo, 2018): dark glass split by white mullions.
    px('#f6f6f2', 1, 1, 6, 5);
    px('#4a5866', 2, 2, 4, 3);
    px('#f6f6f2', 4, 2, 1, 3);
    px('#f6f6f2', 2, 3, 4, 1);
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

// Vertical bars with see-through gaps (use with alphaTest): pedestrian gate, metal fences.
export function barsTexture(color: string, barsPerMeter: number, width: number) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 1, 4);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(width * barsPerMeter, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The car gate (Street View, Jan 2023): two leaves of black diagonal bars meeting in a chevron, a frame,
// a centre post and two horizontal rails.
export function carGateTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 48;
  const g = c.getContext('2d')!;
  g.strokeStyle = '#141416';
  g.lineWidth = 3;
  g.save();
  g.beginPath();
  g.rect(0, 0, 64, 48);
  g.clip();
  for (let x = -48; x < 64; x += 10) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 48, 48);
    g.stroke();
  }
  g.restore();
  g.save();
  g.beginPath();
  g.rect(64, 0, 64, 48);
  g.clip();
  for (let x = 64; x < 176; x += 10) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x - 48, 48);
    g.stroke();
  }
  g.restore();
  g.fillStyle = '#141416';
  g.fillRect(0, 0, 128, 3); // frame
  g.fillRect(0, 45, 128, 3);
  g.fillRect(0, 0, 3, 48);
  g.fillRect(125, 0, 3, 48);
  g.fillRect(62, 0, 4, 48); // centre post
  g.fillRect(0, 22, 128, 3); // middle rail
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
