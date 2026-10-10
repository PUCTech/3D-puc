import { it, expect } from 'vitest';
import { searchBuildings } from './search';
import type { Building } from './campus';

const mk = (id: string, pt: string, en: string, shortName?: string): Building =>
  ({ id, name: { pt, en }, shortName, footprint: [], floors: [] });
const all = [mk('novo', 'Prédio Novo', 'New Building', 'P. Novo'), mk('velho', 'Prédio Velho', 'Old Building'), mk('bib', 'Biblioteca', 'Library')];
const ids = (q: string) => searchBuildings(all, q).map((b) => b.id);

it('returns everything for an empty or blank query', () => expect(ids('  ')).toEqual(['novo', 'velho', 'bib']));
it('ignores accents and case', () => expect(ids('PREDIO')).toEqual(['novo', 'velho']));
it('matches accented queries against accented names', () => expect(ids('prédio n')).toEqual(['novo']));
it('trims whitespace', () => expect(ids('  biblio ')).toEqual(['bib']));
it('matches the English name', () => expect(ids('library')).toEqual(['bib']));
it('matches the short name', () => expect(ids('p. novo')).toEqual(['novo']));
it('returns nothing when nothing matches', () => expect(ids('xyz')).toEqual([]));
