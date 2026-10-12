import * as THREE from 'three';
import type { Era, Point } from '@/lib/campus';
import { mergeGeometries, orientedBox } from './geometry';
import { pointInPolygon } from './Sunken';

// Room interiors modeled from photos: today's classrooms (black tablet-arm chairs, light vinyl floor), the glazed
// corridor (glossy terracotta tile, tactile strip), and the 1943 Acrópole set (parquet dorm rooms, terrazzo reading
// room, restaurant with white cloths, raked auditorium with a piano on stage). See docs/realism-log.md.

// ---- Floors -------------------------------------------------------------------------------------------------

type Pattern = 'tile' | 'parquet' | 'planks' | 'speckle';
type Finish = { pattern: Pattern; base: string; accent: string; size: number; roughness: number };

// size: meters covered by one texture repeat.
export const FINISHES: Record<string, Finish> = {
  classroom: { pattern: 'parquet', base: '#b0773f', accent: '#7f5228', size: 1.2, roughness: 0.4 }, // revitalised parquet (FUNDASP, Feb 2026)
  lab: { pattern: 'speckle', base: '#c9cdd0', accent: '#9aa1a6', size: 2, roughness: 0.5 },
  corridor: { pattern: 'tile', base: '#97472d', accent: '#6e3220', size: 0.8, roughness: 0.3 }, // glossy terracotta, Prédio 2
  bar: { pattern: 'tile', base: '#a25336', accent: '#743a25', size: 0.8, roughness: 0.35 },
  bedroom: { pattern: 'parquet', base: '#a8784c', accent: '#7d5534', size: 1.2, roughness: 0.6 }, // 1943 photo
  office: { pattern: 'planks', base: '#a27a52', accent: '#7c5a3a', size: 2, roughness: 0.6 },
  meeting: { pattern: 'planks', base: '#94693f', accent: '#6f4c2b', size: 2, roughness: 0.6 },
  stage: { pattern: 'planks', base: '#b58756', accent: '#8a6239', size: 2, roughness: 0.55 },
  auditorium: { pattern: 'planks', base: '#8b6747', accent: '#644830', size: 2, roughness: 0.6 },
  lounge: { pattern: 'planks', base: '#b08a62', accent: '#86664a', size: 2, roughness: 0.6 },
  library: { pattern: 'speckle', base: '#e2dacb', accent: '#9c958a', size: 1.5, roughness: 0.45 }, // terrazzo, 1943 reading room
  stacks: { pattern: 'speckle', base: '#d8d0c0', accent: '#958d80', size: 1.5, roughness: 0.45 },
  canteen: { pattern: 'speckle', base: '#e6dccb', accent: '#a39a8c', size: 1.5, roughness: 0.45 },
  foyer: { pattern: 'speckle', base: '#e9e0cf', accent: '#a79d8e', size: 1.5, roughness: 0.4 },
  entrance: { pattern: 'speckle', base: '#e9e0cf', accent: '#a79d8e', size: 1.5, roughness: 0.4 },
  support: { pattern: 'speckle', base: '#d6d1c6', accent: '#a09a8f', size: 1.5, roughness: 0.55 },
  room: { pattern: 'speckle', base: '#d9d2c4', accent: '#a29a8c', size: 1.5, roughness: 0.55 },
  stair: { pattern: 'speckle', base: '#bdb6a8', accent: '#8a8478', size: 1.5, roughness: 0.6 }, // granite
  wc: { pattern: 'tile', base: '#e9eceb', accent: '#c3c8c7', size: 0.6, roughness: 0.3 },
  terrace: { pattern: 'tile', base: '#bdb8ae', accent: '#97928a', size: 1.5, roughness: 0.8 },
};
// 1943 finishes where they differ (Acrópole photos: parquet in the physics lab, so in teaching rooms and offices too).
const FINISHES_1943: Record<string, Finish> = {
  classroom: { pattern: 'parquet', base: '#9c6f45', accent: '#6f4c2e', size: 1.2, roughness: 0.55 },
  office: { pattern: 'parquet', base: '#a07448', accent: '#73502f', size: 1.2, roughness: 0.55 },
  meeting: { pattern: 'parquet', base: '#a07448', accent: '#73502f', size: 1.2, roughness: 0.55 },
};
export const finishOf = (kind: string, era: Era = 'hoje') => (era === '1943' ? FINISHES_1943[kind] : undefined) ?? FINISHES[kind] ?? FINISHES.room;

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const tone = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k).getStyle();

// One seamless repeat of a floor finish, drawn at 512 px.
function drawFloor(f: Finish) {
  const N = 512;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  const rand = rng(97);
  g.fillStyle = f.base;
  g.fillRect(0, 0, N, N);
  if (f.pattern === 'tile') {
    const n = 4, s = N / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        g.fillStyle = tone(f.base, 0.92 + rand() * 0.16);
        g.fillRect(i * s, j * s, s, s);
      }
    g.fillStyle = f.accent; // grout
    for (let i = 0; i <= n; i++) {
      g.fillRect(i * s - 2, 0, 4, N);
      g.fillRect(0, i * s - 2, N, 4);
    }
  } else if (f.pattern === 'parquet') {
    // Basketweave blocks of four slats, alternating direction.
    const n = 4, s = N / n, slat = s / 4;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        for (let k = 0; k < 4; k++) {
          g.fillStyle = tone(f.base, 0.85 + rand() * 0.3);
          if ((i + j) % 2) g.fillRect(i * s + k * slat + 1, j * s + 1, slat - 2, s - 2);
          else g.fillRect(i * s + 1, j * s + k * slat + 1, s - 2, slat - 2);
        }
  } else if (f.pattern === 'planks') {
    const rows = 8, h = N / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * N * 0.5;
      while (x < N) {
        const len = N * (0.35 + rand() * 0.4);
        g.fillStyle = tone(f.base, 0.86 + rand() * 0.26);
        g.fillRect(x + 1, r * h + 1, len - 2, h - 2);
        if (x < 0) g.fillRect(x + N + 1, r * h + 1, len - 2, h - 2); // wrap so the repeat is seamless
        x += len;
      }
    }
    g.fillStyle = f.accent;
    g.globalAlpha = 0.5;
    for (let r = 0; r <= rows; r++) g.fillRect(0, r * h - 1, N, 2);
    g.globalAlpha = 1;
  } else {
    // Terrazzo / granilite / vinyl: chips of the accent and lighter stone.
    for (let i = 0; i < 2600; i++) {
      const r = 1 + rand() * 3.5;
      g.fillStyle = rand() > 0.5 ? f.accent : tone(f.base, 1.12);
      g.globalAlpha = 0.35 + rand() * 0.5;
      g.beginPath();
      g.arc(rand() * N, rand() * N, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  return c;
}

const floorCache = new Map<string, THREE.CanvasTexture>();
export function floorTexture(kind: string, era: Era = 'hoje') {
  const f = finishOf(kind, era);
  const key = `${f.pattern}-${f.base}`;
  let t = floorCache.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(drawFloor(f));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / f.size, 1 / f.size); // floor UVs are in meters
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    floorCache.set(key, t);
  }
  return t;
}

// ---- Furniture and walls --------------------------------------------------------------------------------------

// Material classes: one merged mesh each, colored per vertex.
export type Surface = 'matte' | 'satin' | 'metal' | 'glass' | 'cap';
export const SURFACES: Record<Surface, { roughness: number; metalness: number; opacity?: number }> = {
  matte: { roughness: 0.85, metalness: 0 },
  satin: { roughness: 0.4, metalness: 0 },
  metal: { roughness: 0.3, metalness: 0.7 },
  glass: { roughness: 0.05, metalness: 0, opacity: 0.35 },
  cap: { roughness: 0.9, metalness: 0 },
};

const C = {
  plaster: '#f4f1ea', cut: '#3b4048', wood: '#a0714a', darkWood: '#5e4330', laminate: '#f1f0ec', black: '#25272b',
  steel: '#b9bec4', linen: '#f5f3ee', blanket: '#7d8794', upholstery: '#2c2d33', whiteboard: '#fbfbf9', tactile: '#e3b81c',
  cloth: '#fbfaf6', piano: '#121214', locker: '#9ea3a6', porcelain: '#f7f7f5', partition: '#cdd3d6', sofa: '#58697c', plant: '#3f7a3b', pot: '#c7c1b5',
};

export const WALL_HEIGHT = 1.2; // cut at sill height, as on an architect's plan
const SILL = 0.95;
const STAGE_RISE = 0.6;
export const stageRise = (kind: string) => (kind === 'stage' ? STAGE_RISE : 0);

// A box in a local frame (x = along u, z = along v), placed by the room's transform.
type Piece = { s: Surface; color: string; x: number; z: number; y: number; w: number; d: number; h: number; rot?: number };
const P = (s: Surface, color: string, x: number, z: number, y: number, w: number, d: number, h: number): Piece => ({ s, color, x, z, y, w, d, h });

// Furniture, built around its own origin facing +x (a seated person looks toward +x). Sizes in meters.
// Tablet-arm chair (FUNDASP 2026 photos): blue upholstered seat and back, white writing tablet, black steel legs.
const tabletChair = (): Piece[] => [
  P('matte', '#2346a0', 0, 0, 0.42, 0.46, 0.46, 0.06), // seat
  P('matte', '#2346a0', -0.22, 0, 0.48, 0.06, 0.44, 0.38), // back
  P('satin', C.laminate, 0.12, 0.27, 0.68, 0.36, 0.28, 0.025), // writing tablet on the right
  ...[[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].map(([x, z]) => P('metal', C.black, x, z, 0, 0.03, 0.03, 0.42)),
];
const officeChair = (): Piece[] => [
  P('satin', C.black, 0, 0, 0.45, 0.48, 0.48, 0.07),
  P('satin', C.black, -0.23, 0, 0.52, 0.06, 0.44, 0.45),
  P('metal', C.steel, 0, 0, 0.08, 0.05, 0.05, 0.37),
  P('satin', C.black, 0, 0, 0.04, 0.55, 0.08, 0.04),
  P('satin', C.black, 0, 0, 0.04, 0.08, 0.55, 0.04),
];
const ladderChair = (): Piece[] => [
  P('matte', C.darkWood, 0, 0, 0.44, 0.42, 0.42, 0.04),
  P('matte', C.darkWood, -0.2, 0, 0.48, 0.03, 0.4, 0.55),
  ...[[-0.18, -0.18], [-0.18, 0.18], [0.18, -0.18], [0.18, 0.18]].map(([x, z]) => P('matte', C.darkWood, x, z, 0, 0.035, 0.035, 0.44)),
];
const table = (w: number, d: number, h: number, top: string, s: Surface = 'satin', legs = C.steel): Piece[] => [
  P(s, top, 0, 0, h - 0.035, w, d, 0.035),
  ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => P('metal', legs, (sx * (w - 0.08)) / 2, (sz * (d - 0.08)) / 2, 0, 0.035, 0.035, h - 0.035)),
];
const clothTable = (): Piece[] => [P('matte', C.cloth, 0, 0, 0.5, 0.95, 0.95, 0.27), P('matte', C.darkWood, 0, 0, 0, 0.6, 0.6, 0.5)];
const bed = (): Piece[] => [
  P('matte', C.darkWood, 0, 0, 0, 1.95, 0.92, 0.3),
  P('matte', C.linen, 0, 0, 0.3, 1.9, 0.88, 0.16),
  P('matte', C.blanket, 0.3, 0, 0.46, 1.25, 0.9, 0.04),
  P('matte', C.linen, -0.72, 0, 0.46, 0.38, 0.62, 0.1), // pillow
];
// Desk: 0.6 deep along x (the sitter is on -x), 1.2 wide along z.
const desk = (monitor = false): Piece[] => [
  ...table(0.6, 1.2, 0.75, C.wood, 'satin', C.darkWood),
  ...(monitor ? [P('satin', C.black, 0.15, 0, 0.75, 0.04, 0.55, 0.36), P('metal', C.steel, 0.2, 0, 0.75, 0.15, 0.18, 0.02)] : []),
];
const shift = (pieces: Piece[], dx: number) => pieces.map((p) => ({ ...p, x: p.x + dx }));
const bookcase = (len: number, rand: () => number): Piece[] => {
  const out: Piece[] = [P('matte', C.darkWood, 0, 0, 0, 0.36, len, 1.15)];
  const books = ['#7a2f2a', '#2f4a6b', '#3c5a3a', '#c9a24a', '#6b4b7a', '#d8d2c2', '#24323f'];
  for (const y of [0.08, 0.45, 0.82])
    for (let z = -len / 2 + 0.05; z < len / 2 - 0.05; ) {
      const t = 0.03 + rand() * 0.04;
      out.push(P('matte', books[Math.floor(rand() * books.length)], 0.19, z + t / 2, y, 0.02, t, 0.22 + rand() * 0.08));
      z += t + 0.005;
    }
  return out;
};
const sofa = (len: number): Piece[] => [
  P('matte', C.sofa, 0, 0, 0, 0.85, len, 0.42),
  P('matte', C.sofa, -0.34, 0, 0.42, 0.17, len, 0.38),
  P('matte', C.sofa, 0, -len / 2 + 0.09, 0.42, 0.85, 0.18, 0.2),
  P('matte', C.sofa, 0, len / 2 - 0.09, 0.42, 0.85, 0.18, 0.2),
];
const piano = (): Piece[] => [P('satin', C.piano, 0, 0, 0.62, 1.5, 1.5, 0.35), ...[[-0.6, -0.6], [-0.6, 0.6], [0.6, 0]].map(([x, z]) => P('satin', C.piano, x, z, 0, 0.1, 0.1, 0.62))];
const planter = (): Piece[] => [P('matte', C.pot, 0, 0, 0, 0.45, 0.45, 0.4), P('matte', C.plant, 0, 0, 0.4, 0.6, 0.6, 0.45)];

type Placed = { pieces: Piece[]; u: number; v: number; rot?: number; foot: [number, number] }; // foot: footprint (w, d) for the fit test

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let x = from; x <= to + 1e-6; x += step) out.push(x);
  return out;
};

// Lay out a room by use in its oriented box (u along the longest wall; the front of a teaching room is at u0).
// era: 1943 rooms get the period's dark wood and ladder-back chairs; today's get laminate, steel and black task chairs.
function furnish(kind: string, [u0, u1]: number[], [v0, v1]: number[], seed: number, era: Era): Placed[] {
  const old = era === '1943';
  const chair = old ? ladderChair : officeChair;
  const U = u1 - u0, V = v1 - v0, um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
  const rand = rng(seed);
  const out: Placed[] = [];
  const put = (pieces: Piece[], u: number, v: number, foot: [number, number], rot = 0) => out.push({ pieces, u, v, rot, foot });
  switch (kind) {
    case 'classroom':
      if (old) {
        // 1943: blackboard, the teacher's dark wood desk, two-seat wooden desks with chairs behind.
        put([P('matte', '#2b3a33', 0, 0, 0.85, 0.03, Math.min(4, V - 1), 0.33)], u0 + 0.1, vm, [0.06, 0.2]);
        put(table(0.8, 1.5, 0.78, C.darkWood, 'matte', C.darkWood), u0 + 1.2, vm, [0.8, 1.5]);
        for (const u of range(u0 + 2.6, u1 - 0.6, 1.2))
          for (const v of range(v0 + 0.9, v1 - 0.9, 1.5))
            put([...table(0.5, 1.2, 0.74, C.darkWood, 'matte', C.darkWood), ...shift(ladderChair(), 0.45).map((p) => ({ ...p, z: p.z - 0.3 })), ...shift(ladderChair(), 0.45).map((p) => ({ ...p, z: p.z + 0.3 }))], u, v, [1.2, 1.2], Math.PI);
        break;
      }
      put([P('satin', C.whiteboard, 0, 0, 0.85, 0.03, Math.min(3.6, V - 1), 0.33)], u0 + 0.1, vm, [0.06, 0.2]); // whiteboard on the front wall, cut at 1.2
      put([...table(1.4, 0.65, 0.76, C.laminate), P('matte', C.black, 0.3, 0, 0.1, 0.03, 1.36, 0.6)], u0 + 1.2, vm, [0.7, 1.4]);
      for (const u of range(u0 + 2.6, u1 - 0.6, 1.1))
        for (const v of range(v0 + 0.6, v1 - 0.6, 0.85)) put(tabletChair(), u, v, [0.5, 0.5], Math.PI); // facing the board
      break;
    case 'bedroom':
      put(bed(), u0 + 1.3, v0 + 0.62, [1.95, 0.92]);
      put([...shift(desk(), 0.25), ...shift(ladderChair(), -0.35)], u1 - 0.9, v1 - 0.62, [1.2, 1.2], Math.PI / 2); // desk under the window, chair in front
      put([P('matte', C.wood, 0, 0, 0, 0.58, 1.0, 1.15)], u0 + 0.4, v1 - 0.65, [0.58, 1.0]); // wardrobe
      break;
    case 'office':
      for (const u of range(u0 + 1.0, u1 - 1.0, 2.2)) {
        put(desk(!old), u, v0 + 0.45, [0.6, 1.2], -Math.PI / 2); // monitor toward the wall (today)
        put(chair(), u, v0 + 1.2, [0.55, 0.55], -Math.PI / 2);
      }
      put([P('metal', C.locker, 0, 0, 0, 0.45, 0.9, 1.1)], u1 - 0.35, v1 - 0.6, [0.45, 0.9]);
      break;
    case 'meeting': {
      const w = Math.max(1.4, U - 2.2), d = Math.max(0.9, V - 2.2);
      put(table(w, d, 0.75, C.wood, 'satin', C.darkWood), um, vm, [w, d]);
      for (const u of range(um - w / 2 + 0.4, um + w / 2 - 0.4, 0.75)) {
        put(chair(), u, vm - d / 2 - 0.35, [0.55, 0.55], Math.PI / 2);
        put(chair(), u, vm + d / 2 + 0.35, [0.55, 0.55], -Math.PI / 2);
      }
      break;
    }
    case 'library':
    case 'stacks':
      if (kind === 'stacks') for (const v of range(v0 + 0.6, v1 - 0.6, 1.3)) put(bookcase(Math.max(1, U - 1.6), rand), um, v, [0.36, Math.max(1, U - 1.6)], Math.PI / 2);
      else {
        put(bookcase(U - 1.0, rand), um, v0 + 0.25, [0.36, U - 1.0], Math.PI / 2); // books facing into the room
        put(bookcase(U - 1.0, rand), um, v1 - 0.25, [0.36, U - 1.0], -Math.PI / 2);
        for (const u of range(u0 + 1.4, u1 - 1.4, 2.6)) {
          put(old ? table(1.6, 0.9, 0.75, C.wood, 'satin', C.darkWood) : table(1.6, 0.9, 0.75, C.laminate), u, vm, [1.6, 0.9]);
          for (const [du, dv, r] of [[-0.4, -0.75, Math.PI / 2], [0.4, -0.75, Math.PI / 2], [-0.4, 0.75, -Math.PI / 2], [0.4, 0.75, -Math.PI / 2]])
            put(chair(), u + du, vm + dv, [0.5, 0.5], r);
        }
      }
      break;
    case 'canteen':
      for (const u of range(u0 + 1.3, u1 - 1.3, 2.1))
        for (const v of range(v0 + 1.3, v1 - 1.3, 2.1)) {
          put(old ? clothTable() : table(0.9, 0.9, 0.75, C.laminate), u, v, [0.95, 0.95]); // 1943: white tablecloths
          put(chair(), u - 0.72, v, [0.45, 0.45]);
          put(chair(), u + 0.72, v, [0.45, 0.45], Math.PI);
        }
      break;
    case 'bar':
      put([P('satin', C.wood, 0, 0, 0, 0.6, Math.max(1.2, V - 1.2), 1.05), P('satin', C.laminate, 0, 0, 1.05, 0.7, Math.max(1.2, V - 1.2), 0.04)], u1 - 0.6, vm, [0.7, V - 1.2]);
      for (const v of range(v0 + 0.8, v1 - 0.8, 0.7)) put([P('satin', C.black, 0, 0, 0.7, 0.36, 0.36, 0.05), P('metal', C.steel, 0, 0, 0, 0.04, 0.04, 0.7)], u1 - 1.25, v, [0.36, 0.36]);
      break;
    case 'lounge':
      put(sofa(Math.min(2.4, V - 1)), u0 + 0.6, vm, [0.85, Math.min(2.4, V - 1)]);
      put(table(1.0, 0.6, 0.4, C.wood, 'satin', C.darkWood), u0 + 1.7, vm, [1.0, 0.6]);
      put(planter(), u1 - 0.5, v0 + 0.5, [0.6, 0.6]);
      break;
    case 'auditorium': {
      // Raked tiers rising away from the stage end (u0), seats facing it.
      // 1943 (Acrópole): dark seats on a shallow rake. Today (Auditório Joel Martins, PUC Tour photo): steep wooden
      // tiers and sage-grey upholstered seats between wooden side panels.
      const step = old ? 0.12 : 0.18;
      const seat = old ? '#3b2a22' : '#94a19e';
      const tier = old ? finishOf('auditorium', era).base : '#b07a43';
      let row = 0;
      for (const u of range(u0 + 1.6, u1 - 0.5, 0.95)) {
        const rise = row++ * step;
        out.push({ pieces: [P('satin', tier, 0, 0, 0, 0.95, V - 0.3, rise)], u, v: vm, foot: [0.95, V - 0.3] });
        for (const v of range(v0 + 0.9, v1 - 0.9, 0.55))
          put([
            P('matte', seat, 0, 0, rise + 0.4, 0.45, 0.46, 0.09),
            P('matte', seat, 0.2, 0, rise + 0.45, 0.08, 0.46, 0.45),
            ...(old ? [P('matte', seat, 0, 0, rise, 0.3, 0.06, 0.4)] : [P('satin', C.wood, 0.02, -0.255, rise, 0.5, 0.05, 0.62), P('satin', C.wood, 0.02, 0.255, rise, 0.5, 0.05, 0.62)]),
          ], u, v, [0.5, 0.55]);
      }
      break;
    }
    case 'stage':
      put(piano(), um, vm - V / 4, [1.6, 1.6]); // the grand piano of the 1943 photo
      put([P('satin', C.darkWood, 0, 0, 0, 0.5, 0.6, 1.1)], um, vm + V / 4, [0.5, 0.6]); // lectern
      break;
    case 'stair': {
      // A flight climbing along u to the cut, with a steel handrail: the steps show which way is up.
      const n = Math.max(3, Math.floor((U - 0.6) / 0.28)), run = (U - 0.6) / n, rise = (WALL_HEIGHT - 0.1) / n;
      const width = Math.max(0.8, V - 0.4);
      for (let i = 0; i < n; i++) out.push({ pieces: [P('matte', finishOf('stair').base, 0, 0, 0, run, width, rise * (i + 1)), P('satin', tone(finishOf('stair').base, 0.8), run / 2 - 0.02, 0, rise * (i + 1) - 0.02, 0.04, width, 0.02)], u: u0 + 0.3 + run * (i + 0.5), v: vm, foot: [run, width] });
      put([P('metal', C.steel, 0, 0, 0.9, U - 0.6, 0.04, 0.04)], um, vm + width / 2 - 0.05, [U - 0.6, 0.05]);
      break;
    }
    case 'wc':
      for (const u of range(u0 + 0.6, u1 - 0.6, 1.0)) {
        put([P('satin', C.porcelain, 0.25, 0, 0, 0.55, 0.38, 0.42)], u, v0 + 0.35, [0.55, 0.38], -Math.PI / 2);
        put([P('satin', C.partition, 0, 0, 0.12, 0.03, 1.4, 1.0)], u + 0.5, v0 + 0.75, [0.05, 1.4]);
      }
      break;
    case 'corridor':
      put([P('satin', C.tactile, 0, 0, 0.005, Math.max(0.5, U - 1.2), 0.4, 0.012)], um, vm, [U - 1.2, 0.4]); // tactile guide strip
      if (old) {
        for (const u of range(u0 + 3, u1 - 3, 9)) put([P('matte', C.wood, 0, 0, 0.38, 1.6, 0.42, 0.06), P('metal', C.black, -0.6, 0, 0, 0.05, 0.36, 0.38), P('metal', C.black, 0.6, 0, 0, 0.05, 0.36, 0.38)], u, v1 - 0.35, [1.6, 0.42]);
        break;
      }
      // Today (PUC-SP gallery 2023): upholstered benches and planters along one side, wooden bar tables with stools on the other.
      for (const u of range(u0 + 2.5, u1 - 2.5, 7)) {
        put([P('matte', C.wood, 0, 0, 0, 1.8, 0.48, 0.3), P('matte', '#a69686', 0, 0, 0.3, 1.8, 0.48, 0.12)], u, v1 - 0.35, [1.8, 0.48]);
        put(planter(), u + 1.6, v1 - 0.35, [0.6, 0.6]);
      }
      if (U > 40) // the bar tables are the glazed corridor's (Prédio 2, ~60 m), not every hallway's
      for (const u of range(u0 + 4.5, u1 - 4.5, 7))
        put([P('satin', C.wood, 0, 0, 0, 2.2, 0.55, 1.05), P('satin', '#b38a5e', 0, 0, 1.05, 2.3, 0.6, 0.04), ...[-0.7, 0, 0.7].map((x) => P('satin', '#f3f1ec', x, 0.55, 0.62, 0.36, 0.36, 0.06)), ...[-0.7, 0, 0.7].map((x) => P('metal', C.black, x, 0.55, 0, 0.04, 0.04, 0.62))], u, v0 + 0.8, [2.3, 1.5]);
      break;
    case 'foyer':
    case 'entrance':
      put(planter(), u0 + 0.6, v0 + 0.6, [0.6, 0.6]);
      put(planter(), u1 - 0.6, v0 + 0.6, [0.6, 0.6]);
      break;
    case 'terrace':
      for (const u of range(u0 + 1, u1 - 1, 2.5)) put(planter(), u, v0 + 0.5, [0.6, 0.6]);
      break;
    case 'room': // use unknown: a work table
      put(table(1.6, 0.9, 0.75, C.laminate), um, vm, [1.6, 0.9]);
      for (const [du, dv, r] of [[-0.4, -0.75, Math.PI / 2], [0.4, -0.75, Math.PI / 2], [-0.4, 0.75, -Math.PI / 2], [0.4, 0.75, -Math.PI / 2]]) put(chair(), um + du, vm + dv, [0.5, 0.5], r);
      break;
    case 'lab':
      // Lab benches with stools and monitors (PUC-SP gallery: electronics and physics labs).
      for (const v of range(v0 + 1.2, v1 - 1.2, 2.4)) {
        put([...table(Math.max(1.5, U - 2.4), 0.8, 0.9, '#e9e7e1', 'satin', C.black), ...range(-U / 2 + 1.8, U / 2 - 1.8, 1.6).map((x) => P('satin', C.black, x, 0.2, 0.9, 0.5, 0.05, 0.32))], um, v, [Math.max(1.5, U - 2.4), 0.8]);
        for (const u of range(u0 + 1.8, u1 - 1.8, 1.6)) put([P('satin', C.black, 0, 0, 0.62, 0.36, 0.36, 0.05), P('metal', C.steel, 0, 0, 0, 0.04, 0.04, 0.62)], u, v - 0.75, [0.36, 0.36]);
      }
      break;
    case 'support':
      for (const v of range(v0 + 0.4, v1 - 0.4, 0.5)) put([P('metal', C.locker, 0, 0, 0, 0.45, 0.48, 1.15)], u0 + 0.3, v, [0.45, 0.48]);
      break;
  }
  return out;
}

const sameSide = (a: Point, b: Point, rooms: Point[][], self: number) => {
  // Midpoint of edge a→b nudged off the wall on both sides: which neighbouring room (if any) lies beyond it?
  const [mx, mz] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nx, nz] = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
  for (const k of [0.3, -0.3]) {
    const p: Point = [mx + nx * k, mz + nz * k];
    if (pointInPolygon(p, rooms[self])) continue;
    const other = rooms.findIndex((r, i) => i !== self && pointInPolygon(p, r));
    return other; // -1: outside every room (an exterior wall)
  }
  return -2; // degenerate
};

export type Interior = Record<Surface, THREE.BufferGeometry | null>;

// A whole floor's interior as one merged geometry per surface class, with vertex colors.
export function buildInterior(rooms: { kind: string; footprint: Point[] }[], y: number, era: Era): Interior {
  const parts: Record<Surface, THREE.BufferGeometry[]> = { matte: [], satin: [], metal: [], glass: [], cap: [] };
  const color = new THREE.Color();
  const add = (s: Surface, hex: string, g: THREE.BufferGeometry) => {
    color.set(hex);
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) color.toArray(col, i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts[s].push(g);
  };
  // A wall run from a to b along the edge, between heights y0 and y1, of thickness t.
  const run = (s: Surface, hex: string, a: Point, b: Point, from: number, to: number, y0: number, y1: number, t: number) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [dx, dz] = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const w = to - from;
    if (w <= 0.02 || y1 <= y0) return;
    const g = new THREE.BoxGeometry(w, y1 - y0, t);
    g.rotateY(-Math.atan2(dz, dx));
    const c = from + w / 2;
    g.translate(a[0] + dx * c, y + y0 + (y1 - y0) / 2, a[1] + dz * c);
    add(s, hex, g);
  };
  const polys = rooms.map((r) => r.footprint);
  const OPEN = new Set(['corridor', 'foyer', 'entrance', 'stair']); // rooms open onto these through a door
  rooms.forEach((r, ri) => {
    r.footprint.forEach((a, i) => {
      const b = r.footprint[(i + 1) % r.footprint.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.05) return;
      const beyond = sameSide(a, b, polys, ri);
      if (beyond >= 0 && beyond < ri) return; // a shared wall is drawn once, by the first room
      if (beyond === -1) {
        // Exterior wall: solid to the sill, then a glazed band to the cut, with mullions every 1.5 m.
        run('matte', C.plaster, a, b, 0, len, 0, SILL, 0.24);
        run('glass', '#bcd6e6', a, b, 0, len, SILL, WALL_HEIGHT, 0.04);
        run('cap', C.cut, a, b, 0, len, SILL, SILL + 0.015, 0.25);
        for (let d = 0; d <= len; d += 1.5) run('satin', '#e9e9e4', a, b, Math.max(0, d - 0.03), Math.min(len, d + 0.03), SILL, WALL_HEIGHT, 0.06);
        return;
      }
      if (beyond >= 0 && OPEN.has(rooms[beyond].kind) && OPEN.has(r.kind)) return; // corridor meets corridor or hall: open
      const door = beyond >= 0 && (OPEN.has(rooms[beyond].kind) !== OPEN.has(r.kind)) && len > 1.5;
      const segments: [number, number][] = door ? [[0, len / 2 - 0.45], [len / 2 + 0.45, len]] : [[0, len]];
      for (const [from, to] of segments) {
        run('matte', C.plaster, a, b, from, to, 0, WALL_HEIGHT, 0.12);
        run('cap', C.cut, a, b, from, to, WALL_HEIGHT, WALL_HEIGHT + 0.015, 0.125);
      }
      if (door) run('satin', C.darkWood, a, b, len / 2 - 0.45, len / 2 + 0.45, 0, 0.012, 0.14); // threshold
    });
    // Furniture in the room's frame; a piece is kept only if its whole footprint is inside the room.
    const box = orientedBox(r.footprint);
    // Teaching rooms and the auditorium are laid out with their front at u0; turn the frame round when the stage is at u1.
    const stage = r.kind === 'auditorium' ? rooms.find((o) => o.kind === 'stage') : undefined;
    const [sx, sz] = stage ? [stage.footprint.reduce((a, p) => a + p[0], 0) / stage.footprint.length, stage.footprint.reduce((a, p) => a + p[1], 0) / stage.footprint.length] : [0, 0];
    const flip = !!stage && sx * box.ux + sz * box.uz > (box.u[0] + box.u[1]) / 2;
    const [ux, uz, vx, vz] = flip ? [-box.ux, -box.uz, -box.vx, -box.vz] : [box.ux, box.uz, box.vx, box.vz];
    const [u, v] = flip ? [[-box.u[1], -box.u[0]], [-box.v[1], -box.v[0]]] : [box.u, box.v];
    const toWorld = new THREE.Matrix4().makeBasis(new THREE.Vector3(ux, 0, uz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(vx, 0, vz)); // room frame (u, v) → world
    const world = (cu: number, cv: number): Point => [cu * ux + cv * vx, cu * uz + cv * vz];
    const floorY = 0.03 + stageRise(r.kind);
    for (const item of furnish(r.kind, u, v, 13 + ri * 7, era)) {
      const [fw, fd] = item.foot;
      const cos = Math.cos(item.rot ?? 0), sin = Math.sin(item.rot ?? 0);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([su, sv]) => {
        const [lx, lz] = [(su * fw) / 2, (sv * fd) / 2];
        return world(item.u + lx * cos - lz * sin, item.v + lx * sin + lz * cos);
      });
      if (!corners.every((p) => pointInPolygon(p, r.footprint))) continue;
      for (const p of item.pieces) {
        const g = new THREE.BoxGeometry(p.w, p.h, p.d);
        g.translate(p.x, p.y + p.h / 2, p.z);
        g.rotateY(-(item.rot ?? 0));
        g.translate(item.u, 0, item.v);
        g.applyMatrix4(toWorld);
        g.translate(0, y + floorY, 0);
        add(p.s, p.color, g);
      }
    }
  });
  return Object.fromEntries((Object.keys(parts) as Surface[]).map((s) => [s, parts[s].length ? mergeGeometries(parts[s]) : null])) as Interior;
}
