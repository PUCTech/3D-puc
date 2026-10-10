import data from '@/data/campus.json';

export type Locale = 'pt' | 'en';
export type Localized = Record<Locale, string>;
export type Point = [number, number];

export type Room = { id: string; name?: Localized; footprint?: Point[] };
export type Floor = { level: number; label?: Localized; height: number; rooms: Room[] };
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
};
export type Campus = {
  origin: { lat: number; lon: number };
  streets: { name: string; path: Point[] }[];
  buildings: Building[];
};

export const campus = data as unknown as Campus; // JSON infers number[][], not tuples

export const buildingHeight = (b: Building) =>
  b.floors.filter((f) => f.level >= 0).reduce((sum, f) => sum + f.height, 0);

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
