import data from '@/data/campus.json';

export type Locale = 'pt' | 'en';
export type Localized = Record<Locale, string>;
export type Point = [number, number];

// kind is the room's use from the floor plan (classroom, stair, wc, …); names come from messages by kind.
export type Room = { id: string; kind?: string; name?: Localized; footprint?: Point[] };
// estimated: no plan exists for this floor; its rooms are guessed from photos.
export type Floor = { level: number; label?: Localized; height: number; rooms: Room[]; estimated?: boolean };
export type Building = {
  id: string;
  osmId?: number;
  name: Localized;
  shortName?: string;
  description?: Localized;
  footprint: Point[];
  baseHeight?: number;
  floors: Floor[];
  entrances?: Point[];
  // Massing parts when one extrusion is wrong (e.g. the Auditório: two storeys + a one-storey terrace wing).
  parts?: { footprint: Point[]; height: number; roofGarden?: boolean }[];
  // hand-written look; cobogoWall = the wall segment covered by a cobogó (concrete grid) screen
  style?: {
    wall?: string;
    roof?: string;
    windows?: 'default' | 'shutter-white' | 'shutter-grey' | 'framed' | 'ribbon' | 'pane';
    leanTo?: { from: Point; to: Point; width: number }; // tile lean-to roof along a wall, over a sunken level
    roofShape?: 'flat' | 'eave' | 'gable' | 'hip';
    blankEnds?: number; // walls shorter than this many meters have no windows (end walls of bar blocks)
    roofGarden?: boolean;
    cobogoWall?: [Point, Point];
  };
};
export type Campus = {
  origin: { lat: number; lon: number };
  streets: { name: string; path: Point[] }[];
  buildings: Building[];
  // Generated site context (import script); optional so hand-written data stays valid.
  boundary?: Point[];
  // Areas where the ground drops (e.g. the court level east of Prédio 2), depth in meters below street level.
  sunken?: { polygon: Point[]; depth: number }[];
  areas?: { kind: string; polygon: Point[] }[]; // OSM leisure/landuse inside or near campus, e.g. "pitch", "garden"
  footways?: Point[][];
  context?: { footprint: Point[]; height: number }[]; // neighbouring city buildings
  // hand-written landscaping (photos 02/05/07): planting, red-earth beds, stone path, palms
  gardens?: { name?: string; polygon: Point[]; plants?: { kind: 'palm' | 'slender' | 'shade' | 'monstera' | 'dracaena'; at: Point }[]; earth?: Point[][]; path?: Point[] }[];
  barriers?: { kind: string; path: Point[]; height: number }[]; // OSM fences/walls along the campus edge
  gates?: Point[];
  // OSM street details; angle = direction of the street there (radians, atan2(dz, dx))
  furniture?: { kind: 'crossing' | 'traffic_signals' | 'bus_stop'; at: Point; angle: number }[]; // OSM barrier=gate on the campus edge
  // hand-written main entrance; `along` is the street direction at the gate (the gatehouses sit either side)
  entrance?: { at: Point; along: Point; label: string; path: Point[] };
  streetFences?: { path: Point[]; height: number }[]; // hand-placed from photos: concrete lattice on a low wall
  streetTrees?: Point[]; // hand-placed from photos: tall slender trees behind the street fence
  // hand-placed small objects from photos; angle = rotation around Y in radians (atan2(dz, dx) of their facing line)
  props?: { kind: 'lamp' | 'totem' | 'bench'; at: Point; angle: number }[];
  marquees?: { path: Point[]; width: number; height: number }[]; // covered walkways; the canopy extends to the (dz, -dx) side of the path
};

export const campus = data as unknown as Campus; // JSON infers number[][], not tuples

export const buildingHeight = (b: Building) =>
  b.floors.filter((f) => f.level >= 0).reduce((sum, f) => sum + f.height, 0);

// Height of the floors below `level` (ground and up): where that floor's slab sits.
export const floorBase = (b: Building, level: number) =>
  level >= 0
    ? b.floors.filter((f) => f.level >= 0 && f.level < level).reduce((sum, f) => sum + f.height, 0)
    : -b.floors.filter((f) => f.level >= level && f.level < 0).reduce((sum, f) => sum + f.height, 0);

// How far the building goes below street level (its basement floors).
export const basementDepth = (b: Building) => b.floors.filter((f) => f.level < 0).reduce((sum, f) => sum + f.height, 0);

export const findBuilding = (id: string | null | undefined, c: Campus = campus) =>
  id ? c.buildings.find((b) => b.id === id) : undefined;

export const footprintCenter = (b: Building): Point => {
  const n = b.footprint.length;
  return [b.footprint.reduce((s, p) => s + p[0], 0) / n, b.footprint.reduce((s, p) => s + p[1], 0) / n];
};

export function validateCampus(c: Campus): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const checkLocalized = (id: string, field: string, v: Localized | undefined) => {
    if (!v) return;
    for (const l of ['pt', 'en'] as const) if (!v[l]?.trim()) errors.push(`${id}: ${field}.${l} is empty`);
  };
  for (const b of c.buildings) {
    if (seen.has(b.id)) errors.push(`duplicate building id "${b.id}"`);
    seen.add(b.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id)) errors.push(`"${b.id}": id must be a lowercase slug`);
    checkLocalized(b.id, 'name', b.name);
    checkLocalized(b.id, 'description', b.description);
    if (b.footprint.length < 3) errors.push(`${b.id}: footprint needs at least 3 points`);
    if (!b.floors.some((f) => f.level >= 0)) errors.push(`${b.id}: needs at least one floor with level >= 0`);
    const levels = new Set<number>();
    for (const f of b.floors) {
      if (levels.has(f.level)) errors.push(`${b.id}: floor level ${f.level} repeated`);
      levels.add(f.level);
      if (!(f.height > 0)) errors.push(`${b.id}: floor ${f.level} height must be > 0`);
      checkLocalized(b.id, `floor ${f.level} label`, f.label);
    }
  }
  return errors;
}
