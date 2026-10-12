import data from '@/data/campus.json';

export type Locale = 'pt' | 'en';
export type Localized = Record<Locale, string>;
export type Point = [number, number];
// Ground heights on a grid (m relative to the street at the gate), row-major from (x0, z0), `step` m apart: 2017 LiDAR.
export type Terrain = { x0: number; z0: number; step: number; cols: number; rows: number; h: number[] };

// kind is the room's use in the 1942 plan (classroom, stair, wc, …); names come from messages by kind.
// kindToday: its use today when it differs and is known (photos, PUC-SP pages); see docs/consolacao/sources.md.
export type Room = { id: string; kind?: string; kindToday?: string; name?: Localized; footprint?: Point[] };
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
  later?: boolean; // not part of the 1942 Rino Levi complex (built after; year not yet sourced): hidden in the 1943 view
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
    roofRise?: number; // hip roof height above the eave slab, m (2017 LiDAR); default: a fixed pitch
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
  // floor: where the flat lower floor is paved, when part of the zone has its own terrain (a garden with `terrain`).
  sunken?: { polygon: Point[]; floor?: Point[]; depth: number }[];
  upperLot?: Point[];
  // Parking lane: axis from the car gate (`from`) to its end; slope = [start, end] distances along it where it drops `depth` m.
  // Cars: d = distance along the axis, side = -1 | 1 (which row), color.
  parking?: {
    from: Point;
    to: Point;
    width: number;
    slope: number[];
    depth: number;
    ramp?: { from: Point; to: Point; width: number };
    accessible?: { d: number; side: number }[];
    cars: { d: number; side: number; color: string }[];
  }; // street-level part of the campus lot (boundary minus sunken zones), so paving needs no holes
  areas?: { kind: string; polygon: Point[] }[]; // OSM leisure/landuse inside or near campus, e.g. "pitch", "garden"
  footways?: Point[][];
  context?: { footprint: Point[]; height: number }[]; // neighbouring city buildings
  // hand-written landscaping (photos 02/05/07): planting, red-earth beds, stone path, palms
  // depth: garden on a sunken level (m below street level)
  gardens?: { name?: string; depth?: number; polygon: Point[]; plants?: { kind: 'palm' | 'slender' | 'shade' | 'monstera' | 'dracaena'; at: Point; h?: number }[]; earth?: Point[][]; path?: Point[]; hedges?: Point[][]; terrain?: Terrain }[]; // hedges: clipped beds (drone video; outlines estimated)
  barriers?: { kind: string; path: Point[]; height: number }[]; // OSM fences/walls along the campus edge
  gates?: Point[];
  // OSM street details; angle = direction of the street there (radians, atan2(dz, dx))
  furniture?: { kind: 'crossing' | 'traffic_signals' | 'bus_stop'; at: Point; angle: number }[]; // OSM barrier=gate on the campus edge
  // hand-written main entrance; `along` is the street direction at the gate (the gatehouses sit either side)
  entrance?: { at: Point; along: Point; label: string; path: Point[] };
  streetFences?: { path: Point[]; height: number }[]; // hand-placed from photos: concrete lattice on a low wall
  streetBars?: { path: Point[]; height: number }[]; // black vertical-bar fence on a low wall (Street View 2023)
  streetPots?: Point[]; // black sidewalk pots with cycads (Street View 2023)
  streetTrees?: Point[]; // hand-placed from photos: tall slender trees behind the street fence
  // hand-placed small objects from photos; angle = rotation around Y in radians (atan2(dz, dx) of their facing line)
  props?: { kind: 'lamp' | 'totem' | 'bench'; at: Point; angle: number }[];
  marquees?: { path: Point[]; width: number; height: number }[]; // covered walkways; the canopy extends to the (dz, -dx) side of the path
};

// The map shows the campus as it is today, or as Rino Levi's institute looked in 1943 (Acrópole photos).
export type Era = 'hoje' | '1943';
// Uses that only existed in 1943 (the student residence) have no mapped use today until a source says otherwise.
const GONE = new Set(['bedroom']);
export const roomKind = (r: Room, era: Era) => (era === '1943' ? (r.kind ?? 'room') : (r.kindToday ?? (GONE.has(r.kind ?? '') ? 'room' : (r.kind ?? 'room'))));

export const campus = data as unknown as Campus; // JSON infers number[][], not tuples

export const buildingHeight = (b: Building) =>
  b.floors.filter((f) => f.level >= 0).reduce((sum, f) => sum + f.height, 0);

// Height of the floors below `level` (ground and up): where that floor's slab sits.
export const floorBase = (b: Building, level: number) =>
  level >= 0
    ? b.floors.filter((f) => f.level >= 0 && f.level < level).reduce((sum, f) => sum + f.height, 0)
    : -b.floors.filter((f) => f.level >= level && f.level < 0).reduce((sum, f) => sum + f.height, 0);

// Buildings that exist on the lower level (basements, or standing on the sunken ground).
export const onLowerLevel = (b: Building) => b.floors.some((f) => f.level < 0) || (b.baseHeight ?? 0) < 0;

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
