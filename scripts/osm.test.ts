import { describe, it, expect } from 'vitest';
import { project, pointInPolygon, guessFloors, buildCampus, mergeCampus, importMode, type OsmWay } from './osm';

const origin = { lat: -23.549, lon: -46.649 };
// small square around origin; OSM closed ways repeat the first node
const ring = (d: number) => [
  { lat: origin.lat - d, lon: origin.lon - d }, { lat: origin.lat - d, lon: origin.lon + d },
  { lat: origin.lat + d, lon: origin.lon + d }, { lat: origin.lat + d, lon: origin.lon - d },
  { lat: origin.lat - d, lon: origin.lon - d },
];
const ways: OsmWay[] = [
  { type: 'way', id: 1, tags: { amenity: 'university' }, geometry: ring(0.0005) },
  { type: 'way', id: 10, tags: { building: 'yes', height: '10.5' }, geometry: ring(0.0001) },
  { type: 'way', id: 11, tags: { building: 'yes' }, geometry: ring(0.0001).map((p) => ({ ...p, lon: p.lon + 0.01 })) }, // outside campus
  { type: 'way', id: 20, tags: { highway: 'residential', name: 'Rua Teste' }, geometry: [ring(0.001)[0], ring(0.001)[1]] },
];

describe('project', () => {
  it('maps origin to 0,0', () => expect(project(origin, origin)).toEqual([0, 0]));
  it('north is negative z, east is positive x', () => {
    const [x, z] = project({ lat: origin.lat + 0.001, lon: origin.lon + 0.001 }, origin);
    expect(z).toBeCloseTo(-110.5, 0);
    expect(x).toBeCloseTo(102.1, 0); // 111320 * cos(23.549°) * 0.001
  });
});

describe('pointInPolygon', () => {
  const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  it('inside', () => expect(pointInPolygon([5, 5], sq)).toBe(true));
  it('outside', () => expect(pointInPolygon([15, 5], sq)).toBe(false));
});

describe('guessFloors', () => {
  it('splits height into ~3.5 m floors that sum to the height', () => {
    const f = guessFloors(10.5);
    expect(f.map((x) => x.level)).toEqual([0, 1, 2]);
    expect(f.reduce((s, x) => s + x.height, 0)).toBeCloseTo(10.5);
  });
  it('defaults to one 3.5 m floor without a height', () =>
    expect(guessFloors(undefined)).toEqual([{ level: 0, height: 3.5, rooms: [] }]));
  it('never returns zero floors for tiny heights', () => expect(guessFloors(1).length).toBe(1));
});

describe('buildCampus', () => {
  const c = buildCampus(ways, 1, origin);
  it('keeps only buildings inside the campus boundary', () => expect(c.buildings.map((b) => b.osmId)).toEqual([10]));
  it('drops the repeated closing point', () => expect(c.buildings[0].footprint).toHaveLength(4));
  it('creates placeholder names and slug ids', () => {
    expect(c.buildings[0].id).toBe('predio-1');
    expect(c.buildings[0].name).toEqual({ pt: 'Prédio 1', en: 'Building 1' });
  });
  it('imports streets with names', () => expect(c.streets).toEqual([{ name: 'Rua Teste', path: expect.any(Array) }]));
  it('defaults origin to the campus boundary center', () =>
    expect(buildCampus(ways, 1).origin.lat).toBeCloseTo(origin.lat, 6));
  it('throws when the campus way is missing', () => expect(() => buildCampus(ways, 999)).toThrow(/campus way 999/));
});

describe('mergeCampus', () => {
  const fresh = buildCampus(ways, 1, origin);
  const edited = {
    ...fresh,
    buildings: [{ ...fresh.buildings[0], id: 'predio-novo', name: { pt: 'Prédio Novo', en: 'New Building' }, footprint: [[0, 0], [1, 0], [1, 1]] as [number, number][] }],
  };
  const merged = mergeCampus(edited, fresh);
  it('keeps hand-written fields', () => {
    expect(merged.buildings[0].id).toBe('predio-novo');
    expect(merged.buildings[0].name.pt).toBe('Prédio Novo');
  });
  it('updates footprints from OSM by osmId', () => expect(merged.buildings[0].footprint).toEqual(fresh.buildings[0].footprint));
  it('does not re-add buildings deleted by hand', () =>
    expect(mergeCampus({ ...fresh, buildings: [] }, fresh).buildings).toEqual([]));
  it('keeps the existing origin', () =>
    expect(mergeCampus({ ...edited, origin: { lat: 1, lon: 2 } }, fresh).origin).toEqual({ lat: 1, lon: 2 }));
});

describe('importMode', () => {
  it('merges by default when data already exists', () => expect(importMode(true, [])).toBe('merge'));
  it('starts fresh when there is no data yet', () => expect(importMode(false, [])).toBe('fresh'));
  it('only overwrites existing data with --fresh', () => expect(importMode(true, ['--fresh'])).toBe('fresh'));
});
