import { it, expect } from 'vitest';
import pt from '@/messages/pt.json';
import en from '@/messages/en.json';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();

it('pt and en have the same message keys', () => expect(keys(en)).toEqual(keys(pt)));
