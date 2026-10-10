import type { Building } from './campus';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function searchBuildings(buildings: Building[], query: string): Building[] {
  const q = norm(query);
  if (!q) return buildings;
  return buildings.filter((b) => [b.name.pt, b.name.en, b.shortName ?? ''].some((s) => norm(s).includes(q)));
}
