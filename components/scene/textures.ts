import * as THREE from 'three';

// Canvas textures for the scene, drawn at real resolution and sampled smoothly (mipmaps + anisotropy), so façades,
// fences and tiles stay sharp at any zoom and soften with distance instead of shimmering.

// Pattern art (fences, lattices, tile courses) is designed on a tiny grid; scale it up crisply, then filter smoothly.
export function crispTexture(src: HTMLCanvasElement, scale = 16) {
  const c = document.createElement('canvas');
  c.width = src.width * scale;
  c.height = src.height * scale;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0, c.width, c.height);
  return smooth(new THREE.CanvasTexture(c));
}

function smooth(t: THREE.CanvasTexture) {
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A canvas measured in design units (U px each), so the art below is written in the old 8-unit bay grid.
function unitCanvas(w: number, h: number, U: number) {
  const c = document.createElement('canvas');
  c.width = w * U;
  c.height = h * U;
  const g = c.getContext('2d')!;
  g.scale(U, U);
  return { c, g };
}

// Rino Levi's cobogó panel (2.52 m × 3.38 m) as in photos 04/05: a cream cement grid of 9 × 12 cells,
// dark glass in the lower 9 rows, cream concrete louvers in the top 3, light pilaster/beam on the panel edge.
export function cobogoTexture() {
  const { c, g } = unitCanvas(20, 26, 12);
  g.fillStyle = '#e6dcc2'; // cement grid
  g.fillRect(0, 0, 20, 26);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 9; col++) {
      if (row < 3) {
        g.fillStyle = '#bfb39a'; // louver shadow
        g.fillRect(2 + col * 2, 1 + row * 2, 1, 1);
        continue;
      }
      // canvas row 0 is the top: louver shadow lines, then glass that catches a little sky at the top
      const glass = g.createLinearGradient(0, 1 + row * 2, 0, 2 + row * 2);
      glass.addColorStop(0, '#7f939e');
      glass.addColorStop(1, '#3f4a52');
      g.fillStyle = glass;
      g.fillRect(2 + col * 2, 1 + row * 2, 1, 1);
    }
  g.fillStyle = '#d9d9d4'; // pilaster and floor beam between panels
  g.fillRect(0, 0, 1, 26);
  g.fillRect(0, 25, 20, 1);
  const t = smooth(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export const COBOGO_PANEL = { width: 2.52, height: 3.38 }; // meters

const BAY_WIDTH = 3; // meters between window centers
const BAY_PX = 24; // texture px per design unit: a 3 m bay is 192 px wide

export type WindowKind = 'default' | 'shutter-white' | 'shutter-grey' | 'framed' | 'ribbon' | 'pane';

// Glass rect per kind in the 8 × 8 bay grid (x, y, w, h); the night glow lights exactly these.
const GLASS: Record<WindowKind, [number, number, number, number] | null> = {
  default: [2, 2, 4, 3],
  framed: [2, 2, 4, 3],
  pane: [2, 2, 4, 3],
  ribbon: [0, 2, 7, 2],
  'shutter-white': [2, 1, 4, 5], // light through the louvers, dimmer
  'shutter-grey': [2, 1, 4, 5],
};

// Glass: sky reflected at the top, the dark room behind at the bottom.
function glass(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, sky = '#a9c8dc', room = '#2d3742') {
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, sky);
  grad.addColorStop(0.55, '#5f7686');
  grad.addColorStop(1, room);
  g.fillStyle = grad;
  g.fillRect(x, y, w, h);
}

// One window bay (3 m wide × one floor tall), tiled over every wall.
// Wall UVs are in meters (u along the wall, v up), so repeat = 1 / bay size.
// The bottom-left unit is always plain wall: roofs/caps sample UV (0,0) to stay window-free.
// Window kinds come from photos (see docs/realism-log.md).
export function wallTexture(wall: string, kind: WindowKind = 'default', floorHeight = 3.5) {
  const { c, g } = unitCanvas(8, 8, BAY_PX);
  const px = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
  };
  const base = new THREE.Color(wall);
  const shade = base.clone().multiplyScalar(0.72).getStyle(); // recess shadow
  const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.35).getStyle(); // sill catching the sun
  px(wall, 0, 0, 8, 8);
  // Render grain: faint speckle so large walls don't read as flat plastic. Seeded, so every bay matches.
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    g.globalAlpha = 0.05 + rand() * 0.05;
    px(rand() > 0.5 ? '#000000' : '#ffffff', rand() * 8, rand() * 7, 0.08, 0.08);
  }
  g.globalAlpha = 1;
  // Floor line: the slab edge shows as a slightly darker band at the top of each bay.
  g.globalAlpha = 0.12;
  px('#000000', 0, 0, 8, 0.12);
  g.globalAlpha = 1;
  const sill = (x: number, y: number, w: number) => {
    px(light, x - 0.15, y, w + 0.3, 0.14);
    g.globalAlpha = 0.18;
    px('#000000', x - 0.15, y + 0.14, w + 0.3, 0.2); // its shadow on the wall
    g.globalAlpha = 1;
  };
  if (kind === 'shutter-white' || kind === 'shutter-grey') {
    const [leaf, line] = kind === 'shutter-white' ? ['#f4f2ec', '#c9c4b9'] : ['#767b77', '#585c59'];
    px(shade, 1.8, 0.8, 4.4, 5.4); // deep recess
    px(leaf, 2, 1, 2, 5);
    px(leaf, 4.05, 1, 1.95, 5);
    for (let y = 1.25; y < 6; y += 0.35) px(line, 2, y, 4, 0.08); // louvers
    px(line, 3.98, 1, 0.08, 5); // leaf split
    sill(2, 6, 4);
  } else if (kind === 'framed') {
    px('#94a3a6', 1.2, 1.2, 5.6, 4.6); // grey-blue surround
    glass(g, 2, 2, 4, 3);
    px('#c9cfd2', 3.95, 2, 0.1, 3); // grille
    px('#c9cfd2', 2, 3.45, 4, 0.1);
    sill(1.2, 5.8, 5.6);
  } else if (kind === 'pane') {
    // Large white-framed multi-pane window (court photo, 2018): glass split by white mullions.
    px('#f6f6f2', 1.7, 1.7, 4.6, 3.6);
    glass(g, 2, 2, 4, 3);
    for (const x of [3, 4, 5]) px('#f6f6f2', x - 0.05, 2, 0.1, 3);
    px('#f6f6f2', 2, 3.45, 4, 0.1);
    sill(1.7, 5.3, 4.6);
  } else if (kind === 'ribbon') {
    px('#f4f4f0', 0, 1.8, 8, 2.5); // continuous frame band
    glass(g, 0, 2, 7, 2, '#b9d3e3');
    for (let x = 1.75; x < 7; x += 1.75) px('#f4f4f0', x - 0.05, 2, 0.1, 2);
  } else {
    px(shade, 1.85, 1.85, 4.3, 3.3); // reveal
    glass(g, 2, 2, 4, 3);
    px('#e9e9e4', 3.95, 2, 0.1, 3); // mullion
    px('#e9e9e4', 2, 2, 4, 0.08); // head
    sill(2, 5, 4);
  }
  px(wall, 0, 7, 1, 1);
  const t = smooth(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / BAY_WIDTH, 1 / floorHeight);
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
  const t = crispTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(width * barsPerMeter, 1);
  return t;
}

// The car gate (Street View, Jan 2023): two leaves of black diagonal bars meeting in a chevron, a frame,
// a centre post and two horizontal rails.
export function carGateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.scale(4, 4);
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
  return smooth(new THREE.CanvasTexture(c));
}

// Night: an emissive map matching wallTexture's windows: 8×8 bays per tile, a seeded random ~55% lit warm,
// so façades don't light up as a uniform grid. Black everywhere else (walls, roofs at UV 0,0).
const glowCache = new Map<string, THREE.CanvasTexture>();
export function windowGlowTexture(kind: WindowKind = 'default', floorHeight = 3.5) {
  const key = `${kind}-${floorHeight}`;
  const cached = glowCache.get(key);
  if (cached) return cached;
  const N = 8;
  const { c, g } = unitCanvas(8 * N, 8 * N, 8);
  g.fillStyle = '#000';
  g.fillRect(0, 0, 8 * N, 8 * N);
  const rect = GLASS[kind];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const warm = ['#ffd27a', '#ffe3a3', '#ffc864', '#fff0c8'];
  const dim = kind.startsWith('shutter') ? 0.45 : 1;
  for (let ty = 0; ty < N; ty++)
    for (let tx = 0; tx < N; tx++) {
      if (!rect || rand() > 0.55) continue;
      g.globalAlpha = dim * (0.75 + rand() * 0.25);
      g.fillStyle = warm[Math.floor(rand() * warm.length)];
      g.fillRect(tx * 8 + rect[0], ty * 8 + rect[1], rect[2], rect[3]);
    }
  const t = smooth(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / (BAY_WIDTH * N), 1 / (floorHeight * N));
  glowCache.set(key, t);
  return t;
}
