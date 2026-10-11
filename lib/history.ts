import data from '@/data/history.json';
import type { Localized } from './campus';

export type HistoryPhoto = { src: string; year: number; credit: string; caption: Localized };
export type HistoryEntry = { title: Localized; text: Localized; facts?: Localized[]; photos: HistoryPhoto[] };
type BuildingHistory = HistoryEntry & { floors?: (HistoryEntry & { levels: number[] })[] };

export const history = data as { site: HistoryEntry; buildings: Record<string, BuildingHistory>; sources: { label: string; url: string }[] };

// What to show for a selection: the floor's entry first (if any), then the building's. Empty when there's no history.
export function historyFor(buildingId: string, floor: number | null): HistoryEntry[] {
  const b = history.buildings[buildingId];
  if (!b) return [];
  const f = floor === null ? undefined : b.floors?.find((e) => e.levels.includes(floor));
  return f ? [f, b] : [b];
}
