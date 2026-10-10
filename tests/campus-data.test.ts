import { it, expect } from 'vitest';
import { campus, validateCampus } from '@/lib/campus';
import { statSync } from 'node:fs';

it('data/campus.json is valid', () => expect(validateCampus(campus)).toEqual([]));
it('data/campus.json stays under 100 KB', () => expect(statSync('data/campus.json').size).toBeLessThan(100_000));
