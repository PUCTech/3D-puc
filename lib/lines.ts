import type { CSSProperties } from 'react';

// Each building is a São Paulo Metrô-style line: a color, a bullet code, the numeral color on that fill (on),
// and the color to use for line-colored text on white (text; amarela is too light to read there).
type Line = { code: string; color: string; on: string; text: string };

const NAVY = '#143966';
const LINES: Record<string, Line> = {
  'predio-1': { code: '1', color: '#d42a22', on: '#fff', text: '#d42a22' }, // vermelha (deepened for white numerals)
  'predio-2': { code: '2', color: '#007e5e', on: '#fff', text: '#007e5e' }, // verde
  'predio-3': { code: '3', color: '#fed304', on: NAVY, text: NAVY }, // amarela
  auditorio: { code: 'A', color: '#9b3894', on: '#fff', text: '#9b3894' }, // lilás
  dti: { code: 'D', color: '#006fae', on: '#fff', text: '#006fae' }, // azul (brighter than the navy shell)
};

// Unknown buildings ride the navy line with their name's first letter.
export const lineFor = (id: string, name = ''): Line => LINES[id] ?? { code: name.charAt(0).toUpperCase(), color: NAVY, on: '#fff', text: NAVY };

// CSS custom properties read by .bullet and .map-plate in globals.css.
export const lineVars = (l: Line) => ({ '--line': l.color, '--line-on': l.on, '--line-text': l.text }) as CSSProperties;
