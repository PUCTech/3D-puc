import { describe, it, expect } from 'vitest';
import { buildingHeight, findBuilding, footprintCenter, validateCampus, type Campus, type Building } from './campus';

const b = (over: Partial<Building> = {}): Building => ({
  id: 'a',
  name: { pt: 'A', en: 'A' },
  footprint: [[0, 0], [10, 0], [10, 10], [0, 10]],
  floors: [{ level: 0, height: 3.5, rooms: [] }],
  ...over,
});
const c = (buildings: Building[]): Campus => ({ origin: { lat: 0, lon: 0 }, streets: [], buildings });

describe('buildingHeight', () => {
  it('sums floors at or above ground, ignoring basements', () => {
    expect(buildingHeight(b({ floors: [
      { level: -1, height: 3, rooms: [] },
      { level: 0, height: 4, rooms: [] },
      { level: 1, height: 3.5, rooms: [] },
    ] }))).toBe(7.5);
  });
});

describe('findBuilding', () => {
  const campus = c([b({ id: 'x' })]);
  it('finds by id', () => expect(findBuilding('x', campus)?.id).toBe('x'));
  it('returns undefined for unknown, empty or missing ids', () => {
    expect(findBuilding('nope', campus)).toBeUndefined();
    expect(findBuilding('', campus)).toBeUndefined();
    expect(findBuilding(null, campus)).toBeUndefined();
  });
});

describe('footprintCenter', () => {
  it('averages the points', () => expect(footprintCenter(b())).toEqual([5, 5]));
});

describe('validateCampus', () => {
  it('accepts a valid campus', () => expect(validateCampus(c([b()]))).toEqual([]));
  it('rejects duplicate ids', () => expect(validateCampus(c([b(), b()]))).toContain('duplicate building id "a"'));
  it('rejects a missing translation', () =>
    expect(validateCampus(c([b({ name: { pt: 'A', en: '' } })]))).toContain('a: name.en is empty'));
  it('rejects polygons with fewer than 3 points', () =>
    expect(validateCampus(c([b({ footprint: [[0, 0], [1, 1]] })]))).toContain('a: footprint needs at least 3 points'));
  it('rejects buildings with no floor at or above ground', () =>
    expect(validateCampus(c([b({ floors: [{ level: -1, height: 3, rooms: [] }] })]))).toContain('a: needs at least one floor with level >= 0'));
  it('rejects repeated floor levels', () =>
    expect(validateCampus(c([b({ floors: [{ level: 0, height: 3, rooms: [] }, { level: 0, height: 3, rooms: [] }] })]))).toContain('a: floor level 0 repeated'));
  it('rejects non-positive floor heights', () =>
    expect(validateCampus(c([b({ floors: [{ level: 0, height: 0, rooms: [] }] })]))).toContain('a: floor 0 height must be > 0'));
  it('rejects ids that are not URL slugs', () =>
    expect(validateCampus(c([b({ id: 'Prédio 1' })]))).toContain('"Prédio 1": id must be a lowercase slug'));
  it('checks description translations when present', () =>
    expect(validateCampus(c([b({ description: { pt: 'x', en: '' } })]))).toContain('a: description.en is empty'));
});
