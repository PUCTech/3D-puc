# Campus Map v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Next.js site showing an interactive 3D map of the PUC-SP Consolação campus (extruded OSM footprints) with building search, an info sheet, and PT/EN.

**Architecture:** A one-time import script turns OpenStreetMap footprints into `data/campus.json` (local meters). One page renders a client-only React Three Fiber canvas with an HTML/Tailwind overlay on top. The selected building lives in the URL (`?b=<id>`). Static export, no backend.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), React 19, TypeScript, Tailwind CSS 4, three 0.186, @react-three/fiber 9, @react-three/drei 10, next-intl 4, Vitest 5, Playwright 1.64, tsx (runs the import script).

**Spec:** `docs/superpowers/specs/2026-10-10-campus-map-v1-design.md`

## Global Constraints

- Node ≥ 20.9. Package manager: npm.
- Locales: `pt` (default) and `en`. Routes `/pt`, `/en`; `/` redirects to `/pt`.
- No runtime dependencies beyond: `next`, `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `next-intl`.
- Every UI string lives in `messages/{pt,en}.json`. Every building string is `Localized` (`{ pt, en }`) in `data/campus.json`.
- Palette: ink `#020d2b` (background), night `#081a3e` (ground, panels), deep `#143966` (streets), accent `#2b6fac`, ice `#bae4fe` (edges, highlights), paper `#f0f4f9` (text). Fonts: Geist (UI), Geist Mono (labels and tags).
- Coordinates: meters from `campus.origin`, `x` east, `z` south, `y` up.
- Default floor height 3.5 m. Building height = sum of floors with `level >= 0`.
- Budgets: `data/campus.json` < 100 KB. First-load JS < ~300 KB gzipped. No textures or model files.
- No bloom or post-processing.
- Accessibility: the overlay is semantic HTML and works with the keyboard. Respect `prefers-reduced-motion`.

## Review Focus

1. **Unknown or garbage `?b=` value** (e.g. `?b=nope`, `?b=`). Expect the campus overview, no sheet, and no crash. Covered in Task 2 (`findBuilding`) and Task 8 (e2e).
2. **Search typed with accents, caps or spaces** (`"  PRÉDIO "`, `"predio"`). Expect the same matches. Covered in Task 4.
3. **Re-running the import after hand edits.** Names, ids, descriptions and floors are kept and footprints updated. Buildings deleted by hand are not re-added. Covered in Task 3.
4. **A building whose floors are all basements, or a zero-height floor.** Expect a validation error, not an invisible building. Covered in Task 2.
5. **Device without WebGL.** Expect the building list to show and selection to still work. Covered in Task 8 (e2e with `getContext` stubbed).

---

## File structure

```
app/layout.tsx                    root pass-through layout (needed by app/page.tsx)
app/page.tsx                      "/" → "/pt" redirect
app/globals.css                   Tailwind import + palette tokens
app/[locale]/layout.tsx           <html lang>, fonts, NextIntlClientProvider, metadata
app/[locale]/page.tsx             renders <MapApp/> inside <Suspense>
i18n/routing.ts                   locales list
i18n/request.ts                   next-intl request config (loads messages)
messages/pt.json, messages/en.json
lib/campus.ts                     types, campus data accessor, validateCampus, buildingHeight, findBuilding, footprintCenter
lib/search.ts                     searchBuildings
scripts/osm.ts                    pure OSM → Campus conversion + merge (tested)
scripts/import-footprints.ts      CLI: fetch Overpass, write data/campus.json
data/campus.json                  generated, then hand-edited
components/MapApp.tsx             client root: URL state, WebGL check, composes scene + UI
components/scene/CampusScene.tsx  <Canvas>, lights, composes the scene
components/scene/Building.tsx     extruded building + edges + label + entrances
components/scene/Ground.tsx       ground plane (tap clears selection)
components/scene/Streets.tsx      street lines + name labels
components/scene/CameraRig.tsx    CameraControls + fly-to
components/ui/SearchBar.tsx
components/ui/BuildingSheet.tsx
components/ui/BuildingList.tsx
components/ui/LocaleSwitch.tsx
tests/campus-data.test.ts         validates data/campus.json
tests/messages.test.ts            pt/en key parity
e2e/smoke.spec.ts                 Playwright
vitest.config.ts, playwright.config.ts, .github/workflows/ci.yml
```

---

### Task 1: Scaffold Next.js app with Tailwind, theme and Vitest

**Files:**
- Create: the Next.js scaffold (via create-next-app), `vitest.config.ts`
- Modify: `app/globals.css`, `package.json` (scripts), `.gitignore`, `next.config.ts`

**Interfaces:**
- Produces: `npm run dev|build|lint|test|typecheck`. Tailwind color utilities `ink, night, deep, accent, ice, paper` (e.g. `bg-ink`, `text-ice`). `font-sans` = Geist, `font-mono` = Geist Mono.

- [ ] **Step 1: Scaffold.** create-next-app refuses non-empty dirs with a README, so move the existing files aside first:

```bash
cd /Users/rkolaric/dev/3d-puc
mv README.md /tmp/3dpuc-README.md && mv .gitignore /tmp/3dpuc-gitignore
npx create-next-app@16 . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm --turbopack --yes
cat /tmp/3dpuc-gitignore >> .gitignore
printf '# 3d-puc\n\n3D campus map of PUC-SP Consolação. See docs/superpowers/specs/.\n' > README.md
```

If create-next-app still complains about `docs/`, scaffold into `/tmp/3dpuc-scaffold` and `cp -R` its contents (except `.git`) into the repo.

- [ ] **Step 2: Install dependencies**

```bash
npm i three @react-three/fiber @react-three/drei next-intl
npm i -D @types/three vitest tsx @playwright/test
```

- [ ] **Step 3: Static export.** Replace `next.config.ts`. next-intl is added in Task 5, so this stays plain for now:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

- [ ] **Step 4: Theme tokens.** Replace `app/globals.css`:

```css
@import "tailwindcss";

@theme inline {
  --color-ink: #020d2b;
  --color-night: #081a3e;
  --color-deep: #143966;
  --color-accent: #2b6fac;
  --color-ice: #bae4fe;
  --color-paper: #f0f4f9;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html, body {
  height: 100%;
  background: var(--color-ink);
  color: var(--color-paper);
}
```

- [ ] **Step 5: Vitest config.** Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: { include: ['**/*.test.ts'], exclude: ['node_modules/**', 'e2e/**'] },
});
```

Add these scripts to `package.json` (keep the generated `dev`, `build`, `lint`):

```json
"test": "vitest run",
"typecheck": "tsc --noEmit",
"import:footprints": "tsx scripts/import-footprints.ts"
```

- [ ] **Step 6: Verify.** `npm run build` succeeds and creates `out/index.html`. `npm run lint` passes. `npx vitest run --passWithNoTests` exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind theme, static export and Vitest"
```

---

### Task 2: Campus types, accessors and validation

**Files:**
- Create: `lib/campus.ts`, `lib/campus.test.ts`, `data/campus.json` (temporary seed, replaced in Task 3)

**Interfaces:**
- Produces (from `@/lib/campus`):
  - types `Localized`, `Campus`, `Building`, `Floor`, `Room`, `Point = [number, number]`, `Locale = 'pt' | 'en'`
  - `campus: Campus` (the data file, typed)
  - `buildingHeight(b: Building): number` (sum of floor heights with `level >= 0`)
  - `findBuilding(id: string | null | undefined, c?: Campus): Building | undefined`
  - `footprintCenter(b: Building): Point` (average of footprint points)
  - `validateCampus(c: Campus): string[]` (empty array = valid)

- [ ] **Step 1: Seed data.** Create `data/campus.json` so the import works before Task 3:

```json
{
  "origin": { "lat": -23.54907, "lon": -46.64948 },
  "streets": [],
  "buildings": [
    {
      "id": "predio-1",
      "name": { "pt": "Prédio 1", "en": "Building 1" },
      "footprint": [[0, 0], [20, 0], [20, 10], [0, 10]],
      "floors": [{ "level": 0, "height": 3.5, "rooms": [] }]
    }
  ]
}
```

- [ ] **Step 2: Write the failing tests.** Create `lib/campus.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the tests and watch them fail.** `npx vitest run lib/campus.test.ts`. Expected: FAIL, cannot find `./campus`.

- [ ] **Step 4: Implement.** Create `lib/campus.ts`:

```ts
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

export const campus = data as Campus;

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
```

If TypeScript rejects `data as Campus` (JSON arrays are inferred as `number[][]`), use `data as unknown as Campus`.

- [ ] **Step 5: Run the tests and check they pass.** `npx vitest run lib/campus.test.ts`. Expected: PASS.

- [ ] **Step 6: Add the data test.** Create `tests/campus-data.test.ts`:

```ts
import { it, expect } from 'vitest';
import { campus, validateCampus } from '@/lib/campus';
import { statSync } from 'node:fs';

it('data/campus.json is valid', () => expect(validateCampus(campus)).toEqual([]));
it('data/campus.json stays under 100 KB', () => expect(statSync('data/campus.json').size).toBeLessThan(100_000));
```

Run `npm test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib data tests
git commit -m "feat: campus data types, accessors and validation"
```

---

### Task 3: OSM footprint import script

**Files:**
- Create: `scripts/osm.ts`, `scripts/osm.test.ts`, `scripts/import-footprints.ts`
- Modify: `data/campus.json` (regenerated)

**Interfaces:**
- Consumes: `Campus`, `Building`, `Floor`, `Point` from `@/lib/campus`
- Produces (from `scripts/osm.ts`):
  - `type OsmWay = { type: 'way'; id: number; tags?: Record<string, string>; geometry: { lat: number; lon: number }[] }`
  - `project(p: {lat:number; lon:number}, origin: {lat:number; lon:number}): Point` (meters, x east, z south, rounded to 0.01)
  - `pointInPolygon(p: Point, poly: Point[]): boolean`
  - `guessFloors(height: number | undefined): Floor[]`
  - `buildCampus(ways: OsmWay[], campusWayId: number, origin?: {lat:number; lon:number}): Campus`
  - `mergeCampus(existing: Campus, fresh: Campus): Campus`

- [ ] **Step 1: Write the failing tests.** Create `scripts/osm.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { project, pointInPolygon, guessFloors, buildCampus, mergeCampus, type OsmWay } from './osm';

const origin = { lat: -23.549, lon: -46.649 };
// small square ~ 100 m around origin; OSM closed ways repeat the first node
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
```

- [ ] **Step 2: Run the tests and watch them fail.** `npx vitest run scripts/osm.test.ts`. Expected: FAIL, cannot find `./osm`.

- [ ] **Step 3: Implement.** Create `scripts/osm.ts`:

```ts
import type { Campus, Building, Floor, Point } from '../lib/campus';

export type LatLon = { lat: number; lon: number };
export type OsmWay = { type: 'way'; id: number; tags?: Record<string, string>; geometry: LatLon[] };

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320;
const FLOOR_HEIGHT = 3.5;
const r2 = (n: number) => Math.round(n * 100) / 100;

// Equirectangular projection: accurate to centimeters at campus scale.
export const project = (p: LatLon, o: LatLon): Point => [
  r2((p.lon - o.lon) * M_PER_DEG_LON * Math.cos((o.lat * Math.PI) / 180)),
  r2(-(p.lat - o.lat) * M_PER_DEG_LAT),
];

export function pointInPolygon([x, z]: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function guessFloors(height: number | undefined): Floor[] {
  if (!height) return [{ level: 0, height: FLOOR_HEIGHT, rooms: [] }];
  const n = Math.max(1, Math.round(height / FLOOR_HEIGHT));
  return Array.from({ length: n }, (_, level) => ({ level, height: r2(height / n), rooms: [] }));
}

const ring = (w: OsmWay, o: LatLon): Point[] => {
  const pts = w.geometry.map((p) => project(p, o));
  const [a, z] = [pts[0], pts[pts.length - 1]];
  return pts.length > 1 && a[0] === z[0] && a[1] === z[1] ? pts.slice(0, -1) : pts;
};
const center = (pts: Point[]): Point => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

export function buildCampus(ways: OsmWay[], campusWayId: number, origin?: LatLon): Campus {
  const campusWay = ways.find((w) => w.id === campusWayId);
  if (!campusWay) throw new Error(`campus way ${campusWayId} not found in Overpass result`);
  const g = campusWay.geometry.slice(0, -1);
  const o = origin ?? {
    lat: g.reduce((s, p) => s + p.lat, 0) / g.length,
    lon: g.reduce((s, p) => s + p.lon, 0) / g.length,
  };
  const boundary = ring(campusWay, o);
  const buildings: Building[] = ways
    .filter((w) => w.tags?.building && w.id !== campusWayId)
    .map((w) => ({ w, footprint: ring(w, o) }))
    .filter(({ footprint }) => pointInPolygon(center(footprint), boundary))
    .sort((a, b) => a.w.id - b.w.id)
    .map(({ w, footprint }, i) => ({
      id: `predio-${i + 1}`,
      osmId: w.id,
      name: { pt: `Prédio ${i + 1}`, en: `Building ${i + 1}` },
      footprint,
      floors: guessFloors(w.tags?.height ? Number(w.tags.height) : undefined),
    }));
  const streets = ways
    .filter((w) => w.tags?.highway)
    .map((w) => ({ name: w.tags?.name ?? '', path: w.geometry.map((p) => project(p, o)) }));
  return { origin: o, streets, buildings };
}

export function mergeCampus(existing: Campus, fresh: Campus): Campus {
  const byOsm = new Map(fresh.buildings.map((b) => [b.osmId, b]));
  return {
    ...existing,
    streets: fresh.streets,
    buildings: existing.buildings.map((b) => {
      const match = b.osmId !== undefined ? byOsm.get(b.osmId) : undefined;
      return match ? { ...b, footprint: match.footprint } : b;
    }),
  };
}
```

`mergeCampus` relies on `fresh` having been built with `existing.origin`. The CLI below guarantees that.

- [ ] **Step 4: Run the tests and check they pass.** `npx vitest run scripts/osm.test.ts`. Expected: PASS.

- [ ] **Step 5: CLI.** Create `scripts/import-footprints.ts`:

```ts
// One-time import of campus footprints from OpenStreetMap (Overpass API).
// Re-running updates footprints/streets and keeps every hand-edited field.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { buildCampus, mergeCampus, type OsmWay } from './osm';
import { validateCampus, type Campus } from '../lib/campus';

const CAMPUS_WAY = 38629633; // "PUC Campus Consolação" boundary in OSM
const OUT = 'data/campus.json';
const QUERY = `[out:json][timeout:25];
way(${CAMPUS_WAY})->.campus;
.campus out geom;
way["building"](around.campus:0);
out geom;
way["highway"~"^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$"](around.campus:80);
out geom;`;

// Plain async main: package.json is CommonJS, so tsx can't use top-level await here.
async function main() {
const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'User-Agent': '3d-puc campus map importer' },
  body: new URLSearchParams({ data: QUERY }),
});
if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text()}`);
const ways = ((await res.json()).elements as OsmWay[]).filter((e) => e.type === 'way');

const existing: Campus | undefined = existsSync(OUT) && process.argv.includes('--merge')
  ? JSON.parse(readFileSync(OUT, 'utf8'))
  : undefined;
const fresh = buildCampus(ways, CAMPUS_WAY, existing?.origin);
const result = existing ? mergeCampus(existing, fresh) : fresh;

const errors = validateCampus(result);
if (errors.length) throw new Error(`refusing to write invalid campus:\n${errors.join('\n')}`);
writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
console.log(`wrote ${OUT}: ${result.buildings.length} buildings, ${result.streets.length} streets`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

`lib/campus.ts` imports `@/data/campus.json`. tsx resolves the `@/` alias through `tsconfig.json` paths. If it doesn't, change that import in `lib/campus.ts` to `../data/campus.json`.

- [ ] **Step 6: Generate the real data.** Run `npm run import:footprints`. This first run deliberately has no `--merge`, so it replaces the Task 2 seed.
  - Expected output: `wrote data/campus.json: 16 buildings, N streets`.
  - If the count isn't 16, OSM changed since 2026-10-10. Accept the new count.
  - Run `npm test`. Expected: PASS, including the size budget.

From now on, always re-import with `npm run import:footprints -- --merge`. Running it without `--merge` overwrites hand-edited fields.

- [ ] **Step 7: Commit**

```bash
git add scripts data
git commit -m "feat: import campus footprints and streets from OpenStreetMap"
```

---

### Task 4: Accent-insensitive building search

**Files:**
- Create: `lib/search.ts`, `lib/search.test.ts`

**Interfaces:**
- Consumes: `Building` from `@/lib/campus`
- Produces: `searchBuildings(buildings: Building[], query: string): Building[]`. An empty or whitespace query returns all buildings in their original order.

- [ ] **Step 1: Write the failing tests.** Create `lib/search.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and watch them fail.** `npx vitest run lib/search.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement.** Create `lib/search.ts`:

```ts
import type { Building } from './campus';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export function searchBuildings(buildings: Building[], query: string): Building[] {
  const q = norm(query);
  if (!q) return buildings;
  return buildings.filter((b) => [b.name.pt, b.name.en, b.shortName ?? ''].some((s) => norm(s).includes(q)));
}
```

- [ ] **Step 4: Run the tests and check they pass.** `npx vitest run lib/search.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/search.ts lib/search.test.ts
git commit -m "feat: accent-insensitive building search"
```

---

### Task 5: Localized routes and messages (next-intl, static export)

**Files:**
- Create: `i18n/routing.ts`, `i18n/request.ts`, `messages/pt.json`, `messages/en.json`, `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `tests/messages.test.ts`
- Modify: `next.config.ts`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Produces: the `routing` export (`routing.locales: readonly ['pt','en']`). Message keys used by Tasks 6–7 (exact names below). `app/[locale]/page.tsx` renders `<MapApp />` from `@/components/MapApp`. Task 5 creates a placeholder MapApp and Task 7 replaces it.

- [ ] **Step 1: Write the failing test.** Create `tests/messages.test.ts`:

```ts
import { it, expect } from 'vitest';
import pt from '@/messages/pt.json';
import en from '@/messages/en.json';

const keys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`])).sort();

it('pt and en have the same message keys', () => expect(keys(en)).toEqual(keys(pt)));
```

Run `npx vitest run tests/messages.test.ts`. Expected: FAIL, files missing.

- [ ] **Step 2: Messages.** Create `messages/pt.json`:

```json
{
  "meta": { "title": "Mapa 3D · PUC-SP Consolação", "description": "Encontre prédios do campus Consolação da PUC-SP em um mapa 3D interativo. Por PUC Tech." },
  "search": { "label": "Buscar prédio", "placeholder": "Buscar prédio…", "noResults": "Nenhum prédio encontrado" },
  "sheet": {
    "floors": "{count, plural, one {# andar} other {# andares}}",
    "entrances": "{count, plural, one {# entrada marcada no mapa} other {# entradas marcadas no mapa}}",
    "close": "Fechar",
    "expand": "Mostrar mais",
    "collapse": "Mostrar menos",
    "floorList": "Andares"
  },
  "floor": { "ground": "Térreo", "basement": "Subsolo {n}", "level": "{level}º andar" },
  "list": { "open": "Lista de prédios", "title": "Prédios", "close": "Fechar lista" },
  "locale": { "switch": "English", "switchLabel": "Ver em inglês" },
  "loading": "Carregando mapa…",
  "noWebgl": "Seu navegador não suporta 3D. Use a lista de prédios."
}
```

Create `messages/en.json`:

```json
{
  "meta": { "title": "3D Map · PUC-SP Consolação", "description": "Find buildings on PUC-SP's Consolação campus on an interactive 3D map. By PUC Tech." },
  "search": { "label": "Search buildings", "placeholder": "Search buildings…", "noResults": "No buildings found" },
  "sheet": {
    "floors": "{count, plural, one {# floor} other {# floors}}",
    "entrances": "{count, plural, one {# entrance marked on the map} other {# entrances marked on the map}}",
    "close": "Close",
    "expand": "Show more",
    "collapse": "Show less",
    "floorList": "Floors"
  },
  "floor": { "ground": "Ground floor", "basement": "Basement {n}", "level": "Floor {level}" },
  "list": { "open": "Building list", "title": "Buildings", "close": "Close list" },
  "locale": { "switch": "Português", "switchLabel": "Ver em português" },
  "loading": "Loading map…",
  "noWebgl": "Your browser doesn't support 3D. Use the building list."
}
```

Run `npx vitest run tests/messages.test.ts`. Expected: PASS.

- [ ] **Step 3: next-intl config.** Create `i18n/routing.ts`:

```ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({ locales: ['pt', 'en'], defaultLocale: 'pt' });
```

Create `i18n/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
```

Replace `next.config.ts`:

```ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = { output: 'export' };

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig);
```

- [ ] **Step 4: Layouts and pages.** Static export has no middleware, so locales come from `[locale]` params and `/` redirects.

Replace `app/layout.tsx` (pass-through; `<html>` lives in the locale layout):

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

Replace `app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function Root() {
  redirect('/pt');
}
```

Create `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import '../globals.css';

const sans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = await getTranslations({ locale: (await params).locale, namespace: 'meta' });
  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale === 'pt' ? 'pt-BR' : 'en'} className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Create `app/[locale]/page.tsx`:

```tsx
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { MapApp } from '@/components/MapApp';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <Suspense>
      <MapApp />
    </Suspense>
  );
}
```

Create a temporary `components/MapApp.tsx` (Task 7 replaces it):

```tsx
'use client';
import { useTranslations } from 'next-intl';

export function MapApp() {
  return <main className="p-4 font-mono text-ice">{useTranslations()('loading')}</main>;
}
```

Delete any scaffold leftovers that no longer apply: `app/page.module.css` (if present) and the `public/*.svg` demo files.

- [ ] **Step 5: Verify.** Run `npm run build`. Expected: success, with `out/pt.html` and `out/en.html` present.
  - `out/index.html` must redirect to `/pt`. Check with `grep -i refresh out/index.html` or look for a `/pt` redirect.
  - If the static redirect isn't emitted, replace `app/page.tsx` with a page that renders `<html><head><meta httpEquiv="refresh" content="0; url=/pt" /></head><body><a href="/pt">PUC-SP</a></body></html>`.
  - Then run `npm run dev`, open `/pt` and `/en`, and check that the loading text appears in each language.
  - Run `npm test`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: pt/en routes with next-intl and static export"
```

---

### Task 6: 3D scene

**Files:**
- Create: `components/scene/CampusScene.tsx`, `components/scene/Building.tsx`, `components/scene/Ground.tsx`, `components/scene/Streets.tsx`, `components/scene/CameraRig.tsx`

**Interfaces:**
- Consumes: `campus`, `buildingHeight`, `findBuilding`, `footprintCenter`, `Building` (type) from `@/lib/campus`
- Produces: `CampusScene` as the **default** export (loaded with `next/dynamic`), props `{ selectedId: string | null; onSelect: (id: string | null) => void }`

The scene is checked by eye, not unit-tested (per the spec). Task 8 covers it with a smoke test.

- [ ] **Step 1: Ground.** Create `components/scene/Ground.tsx`:

```tsx
import type { ThreeEvent } from '@react-three/fiber';

export function Ground({ onClear }: { onClear: () => void }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.01} onClick={(e: ThreeEvent<MouseEvent>) => e.delta < 4 && onClear()}>
      <planeGeometry args={[3000, 3000]} />
      <meshStandardMaterial color="#081a3e" />
    </mesh>
  );
}
```

`e.delta` is how many pixels the pointer moved. Ignoring clicks that moved means orbit drags don't clear the selection.

- [ ] **Step 2: Streets.** Create `components/scene/Streets.tsx`:

```tsx
import { Html, Line } from '@react-three/drei';
import { campus } from '@/lib/campus';

export function Streets() {
  return (
    <>
      {campus.streets.map((s, i) => {
        const mid = s.path[Math.floor(s.path.length / 2)];
        return (
          <group key={i}>
            <Line points={s.path.map(([x, z]) => [x, 0.02, z] as [number, number, number])} color="#143966" lineWidth={6} />
            {s.name && (
              <Html position={[mid[0], 0.5, mid[1]]} center distanceFactor={150} className="pointer-events-none select-none whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-accent">
                {s.name}
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Building.** Create `components/scene/Building.tsx`:

```tsx
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { buildingHeight, footprintCenter, type Building as B } from '@/lib/campus';

const LOW = new THREE.Color('#143966');
const HIGH = new THREE.Color('#2b6fac');
const ICE = new THREE.Color('#bae4fe');

type Props = { building: B; maxHeight: number; selected: boolean; dimmed: boolean; onSelect: () => void };

export function Building({ building, maxHeight, selected, dimmed, onSelect }: Props) {
  const height = buildingHeight(building);
  const base = building.baseHeight ?? 0;
  const geometry = useMemo(() => {
    // Shape lives in XY; after rotateX(-90°), shape y becomes -z, so feed -z to land on +z (south).
    const shape = new THREE.Shape(building.footprint.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  }, [building.footprint, height]);
  const side = useMemo(() => LOW.clone().lerp(HIGH, maxHeight ? height / maxHeight : 0), [height, maxHeight]);
  const roof = useMemo(() => (selected ? side.clone().lerp(ICE, 0.6) : side.clone().lerp(ICE, 0.15)), [side, selected]);
  const [cx, cz] = footprintCenter(building);
  const opacity = dimmed ? 0.45 : 1;

  return (
    <group position-y={base}>
      <mesh
        geometry={geometry}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta < 4) onSelect(); }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {/* ExtrudeGeometry groups: 0 = caps (roof/floor), 1 = walls */}
        <meshStandardMaterial attach="material-0" color={roof} transparent opacity={opacity} />
        <meshStandardMaterial attach="material-1" color={side} transparent opacity={opacity} />
        <Edges threshold={15} color={selected ? '#bae4fe' : dimmed ? '#2b6fac' : '#7fb4dd'} lineWidth={selected ? 2 : 1} />
      </mesh>
      <Html position={[cx, height + 3, cz]} center distanceFactor={120} className="pointer-events-none select-none">
        <span className={`whitespace-nowrap font-mono text-[11px] uppercase tracking-widest ${selected ? 'text-ice' : 'text-ice/60'}`}>
          {building.shortName ?? building.name.pt}
        </span>
      </Html>
      {selected && building.entrances?.map(([x, z], i) => <Entrance key={i} x={x} z={z} />)}
    </group>
  );
}

function Entrance({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + 0.3 * Math.sin(clock.elapsedTime * 3);
    ref.current?.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} position={[x, 0.05, z]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.8, 1.3, 32]} />
      <meshBasicMaterial color="#bae4fe" />
    </mesh>
  );
}
```

If drei's `<Edges>` rejects `lineWidth` (it depends on the drei version), drop that prop. If `useRef<CameraControls>` doesn't type-check in Step 4, use `useRef<CameraControlsImpl>` with `import { CameraControlsImpl } from '@react-three/drei'`.

The label uses `shortName` or the Portuguese name, because building names are proper nouns. If PUC uses English names for any building, that's a later content decision.

- [ ] **Step 4: Camera.** Create `components/scene/CameraRig.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CameraControls } from '@react-three/drei';
import { campus, buildingHeight, findBuilding, type Building } from '@/lib/campus';

const boxOf = (buildings: Building[]) => {
  const box = new THREE.Box3();
  for (const b of buildings) {
    const top = (b.baseHeight ?? 0) + buildingHeight(b);
    for (const [x, z] of b.footprint) box.expandByPoint(new THREE.Vector3(x, 0, z)).expandByPoint(new THREE.Vector3(x, top, z));
  }
  return box;
};
const CAMPUS_BOX = boxOf(campus.buildings);

export function CameraRig({ selectedId }: { selectedId: string | null }) {
  const ref = useRef<CameraControls>(null);
  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const b = findBuilding(selectedId);
    // Bottom padding leaves room for the bottom sheet on phones.
    controls.fitToBox(b ? boxOf([b]) : CAMPUS_BOX, smooth, { paddingTop: 10, paddingLeft: 10, paddingRight: 10, paddingBottom: b ? 40 : 10 });
  }, [selectedId]);
  return <CameraControls ref={ref} makeDefault minDistance={20} maxDistance={600} minPolarAngle={0.2} maxPolarAngle={Math.PI * 0.45} />;
}
```

- [ ] **Step 5: Scene root.** Create `components/scene/CampusScene.tsx`:

```tsx
'use client';
import { Canvas } from '@react-three/fiber';
import { campus, buildingHeight } from '@/lib/campus';
import { Building } from './Building';
import { Ground } from './Ground';
import { Streets } from './Streets';
import { CameraRig } from './CameraRig';

const MAX_HEIGHT = Math.max(...campus.buildings.map(buildingHeight));

type Props = { selectedId: string | null; onSelect: (id: string | null) => void };

export default function CampusScene({ selectedId, onSelect }: Props) {
  return (
    <Canvas camera={{ position: [140, 160, 180], fov: 40, near: 1, far: 5000 }} dpr={[1, 2]}>
      <color attach="background" args={['#020d2b']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[80, 150, 60]} intensity={1.5} />
      <Ground onClear={() => onSelect(null)} />
      <Streets />
      {campus.buildings.map((b) => (
        <Building
          key={b.id}
          building={b}
          maxHeight={MAX_HEIGHT}
          selected={b.id === selectedId}
          dimmed={selectedId !== null && b.id !== selectedId}
          onSelect={() => onSelect(b.id)}
        />
      ))}
      <CameraRig selectedId={selectedId} />
    </Canvas>
  );
}
```

- [ ] **Step 6: Temporary wiring to check by eye.** In `components/MapApp.tsx`, temporarily render:

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
const CampusScene = dynamic(() => import('@/components/scene/CampusScene'), { ssr: false });

export function MapApp() {
  const [id, setId] = useState<string | null>(null);
  return <main className="fixed inset-0"><CampusScene selectedId={id} onSelect={setId} /></main>;
}
```

Run `npm run dev` and open `/pt`. Check:
- The campus is in view.
- Buildings are extruded upward and sit on the ground, not mirrored. Compare with the OSM map at `osm.org/way/38629633`: north is up the screen, toward −z.
- Tapping a building flies to it and dims the others. Tapping the ground goes back to the overview.
- Dragging orbits without changing the selection.

- [ ] **Step 7: Verify and commit.** `npm run typecheck && npm run lint && npm test` all pass.

```bash
git add components
git commit -m "feat: 3D campus scene with extruded buildings, streets and camera fly-to"
```

---

### Task 7: Overlay UI and URL state

**Files:**
- Create: `components/ui/SearchBar.tsx`, `components/ui/BuildingSheet.tsx`, `components/ui/BuildingList.tsx`, `components/ui/LocaleSwitch.tsx`
- Modify: `components/MapApp.tsx` (final version)

**Interfaces:**
- Consumes: `campus`, `findBuilding`, `buildingHeight`, `Building`, `Locale` from `@/lib/campus`. `searchBuildings` from `@/lib/search`. The default export of `CampusScene` from Task 6. Message keys from Task 5.
- Produces: `data-testid` hooks for e2e: `building-sheet`, `building-list`, `building-list-item`, `scene-loading`. The sheet heading is an `<h2>` with the building name.

- [ ] **Step 1: SearchBar.** Create `components/ui/SearchBar.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';
import { searchBuildings } from '@/lib/search';

export function SearchBar({ onPick }: { onPick: (id: string) => void }) {
  const t = useTranslations('search');
  const locale = useLocale() as Locale;
  const [q, setQ] = useState('');
  const results = q.trim() ? searchBuildings(campus.buildings, q) : [];
  const pick = (id: string) => { onPick(id); setQ(''); };
  return (
    <div className="relative">
      <input
        type="search"
        aria-label={t('label')}
        placeholder={t('placeholder')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0].id)}
        className="h-11 w-full rounded-xl border border-deep bg-night/85 px-4 text-sm text-paper placeholder:text-ice/50 backdrop-blur focus:border-ice focus:outline-none"
      />
      {q.trim() && (
        <ul className="absolute inset-x-0 top-12 overflow-hidden rounded-xl border border-deep bg-night/95 backdrop-blur">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-ice/60">{t('noResults')}</li>}
          {results.map((b) => (
            <li key={b.id}>
              <button onClick={() => pick(b.id)} className="w-full px-4 py-3 text-left text-sm hover:bg-deep focus:bg-deep focus:outline-none">
                {b.name[locale]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: BuildingSheet.** Create `components/ui/BuildingSheet.tsx`:

```tsx
'use client';
import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Building, Floor, Locale } from '@/lib/campus';

export function BuildingSheet({ building, onClose }: { building: Building; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<number | null>(null);
  const aboveGround = building.floors.filter((f) => f.level >= 0).length;
  const floorName = (f: Floor) =>
    f.label?.[locale] ?? (f.level === 0 ? t('floor.ground') : f.level < 0 ? t('floor.basement', { n: -f.level }) : t('floor.level', { level: f.level }));

  const onPointerUp = (y: number) => {
    if (dragStart.current === null) return;
    const dy = y - dragStart.current;
    dragStart.current = null;
    if (dy < -30) setExpanded(true);
    else if (dy > 30 && expanded) setExpanded(false);
    else if (dy > 30) onClose();
  };

  return (
    <section
      data-testid="building-sheet"
      aria-labelledby="sheet-title"
      className="pointer-events-auto fixed inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-accent bg-night px-5 pb-6 pt-2 lg:inset-y-4 lg:left-4 lg:right-auto lg:max-h-none lg:w-96 lg:rounded-2xl lg:border"
    >
      <button
        aria-label={expanded ? t('sheet.collapse') : t('sheet.expand')}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onPointerDown={(e) => (dragStart.current = e.clientY)}
        onPointerUp={(e) => onPointerUp(e.clientY)}
        className="mx-auto mb-3 block h-6 w-full touch-none lg:hidden"
      >
        <span className="mx-auto block h-1 w-10 rounded-full bg-accent" />
      </button>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md border border-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ice">
              {t('sheet.floors', { count: aboveGround })}
            </span>
            {!!building.entrances?.length && (
              <span className="rounded-md border border-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ice">
                {t('sheet.entrances', { count: building.entrances.length })}
              </span>
            )}
          </div>
          <h2 id="sheet-title" className="mt-2 text-xl font-semibold">{building.name[locale]}</h2>
        </div>
        <button onClick={onClose} aria-label={t('sheet.close')} className="rounded-lg px-2 py-1 text-ice/70 hover:text-ice">✕</button>
      </div>
      {building.description && (
        <p className={`mt-2 text-sm leading-relaxed text-paper/75 ${expanded ? '' : 'line-clamp-2 lg:line-clamp-none'}`}>
          {building.description[locale]}
        </p>
      )}
      <div className={expanded ? 'mt-4' : 'mt-4 hidden lg:block'}>
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-ice/60">{t('sheet.floorList')}</h3>
        <ol className="mt-2 space-y-1">
          {[...building.floors].sort((a, b) => b.level - a.level).map((f) => (
            <li key={f.level} className="rounded-lg border border-deep px-3 py-2 text-sm">{floorName(f)}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: BuildingList.** Create `components/ui/BuildingList.tsx`:

```tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import { campus, type Locale } from '@/lib/campus';

export function BuildingList({ onPick, onClose, closable }: { onPick: (id: string) => void; onClose: () => void; closable: boolean }) {
  const t = useTranslations('list');
  const locale = useLocale() as Locale;
  const buildings = [...campus.buildings].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale));
  return (
    <nav data-testid="building-list" aria-label={t('title')} className="pointer-events-auto fixed inset-x-4 top-20 bottom-4 overflow-y-auto rounded-2xl border border-deep bg-night/95 p-4 backdrop-blur lg:left-auto lg:w-80">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-widest text-ice">{t('title')}</h2>
        {closable && <button onClick={onClose} aria-label={t('close')} className="px-2 text-ice/70 hover:text-ice">✕</button>}
      </div>
      <ul className="space-y-1">
        {buildings.map((b) => (
          <li key={b.id}>
            <button data-testid="building-list-item" onClick={() => onPick(b.id)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-deep focus:bg-deep focus:outline-none">
              {b.name[locale]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: LocaleSwitch.** Create `components/ui/LocaleSwitch.tsx`. It keeps `?b=` by copying the current query string:

```tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

export function LocaleSwitch() {
  const t = useTranslations('locale');
  const other = useLocale() === 'pt' ? 'en' : 'pt';
  const qs = useSearchParams().toString();
  return (
    <a href={`/${other}${qs ? `?${qs}` : ''}`} aria-label={t('switchLabel')} hrefLang={other} className="rounded-xl border border-deep bg-night/85 px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-ice backdrop-blur hover:border-ice">
      {other.toUpperCase()}
    </a>
  );
}
```

- [ ] **Step 5: MapApp (final).** Replace `components/MapApp.tsx`:

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { findBuilding } from '@/lib/campus';
import { SearchBar } from './ui/SearchBar';
import { BuildingSheet } from './ui/BuildingSheet';
import { BuildingList } from './ui/BuildingList';
import { LocaleSwitch } from './ui/LocaleSwitch';

function Loading() {
  const t = useTranslations();
  return <div data-testid="scene-loading" className="grid h-full place-items-center font-mono text-xs uppercase tracking-widest text-ice/60">{t('loading')}</div>;
}
const CampusScene = dynamic(() => import('./scene/CampusScene'), { ssr: false, loading: Loading });

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
};

export function MapApp() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = findBuilding(params.get('b')) ?? null; // unknown ids fall back to the overview
  const [webgl, setWebgl] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => setWebgl(hasWebGL()), []);

  const select = (id: string | null) => {
    setListOpen(false);
    router.push(id ? `${pathname}?b=${encodeURIComponent(id)}` : pathname, { scroll: false });
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      {webgl ? (
        <CampusScene selectedId={selected?.id ?? null} onSelect={select} />
      ) : (
        <p role="status" className="p-4 pt-20 text-sm text-ice/70">{t('noWebgl')}</p>
      )}
      <div className="pointer-events-none fixed inset-x-0 top-0 flex gap-2 p-3 lg:left-auto lg:w-[28rem]">
        <div className="pointer-events-auto flex-1"><SearchBar onPick={select} /></div>
        <button
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen || !webgl}
          className="pointer-events-auto rounded-xl border border-deep bg-night/85 px-3 font-mono text-xs uppercase tracking-wider text-ice backdrop-blur hover:border-ice"
        >
          {t('list.open')}
        </button>
        <div className="pointer-events-auto flex"><LocaleSwitch /></div>
      </div>
      {(listOpen || !webgl) && <BuildingList onPick={select} onClose={() => setListOpen(false)} closable={webgl} />}
      {selected && <BuildingSheet key={selected.id} building={selected} onClose={() => select(null)} />}
    </main>
  );
}
```

- [ ] **Step 6: Check by eye on `npm run dev`:**
  - **Phone width:** use devtools at 390×844.
  - **Search:** "predio" lists buildings, and Enter picks the first.
  - **Sheet:** a peek shows; tapping or dragging the handle up expands it, and dragging down closes it.
  - **Back button:** clears the selection.
  - **Locale switch:** PT↔EN keeps `?b=`.
  - **Desktop (≥ 1024px):** the sheet sits as a left-hand panel.
  - **Keyboard:** Tab reaches search, list, locale and sheet buttons.

- [ ] **Step 7: Verify and commit.** `npm run typecheck && npm run lint && npm test && npm run build` all pass.

```bash
git add components
git commit -m "feat: search, building sheet, building list and locale switch with URL state"
```

---

### Task 8: Playwright smoke tests and CI

**Files:**
- Create: `playwright.config.ts`, `e2e/smoke.spec.ts`, `.github/workflows/ci.yml`
- Modify: `.gitignore` (Playwright output)

**Interfaces:**
- Consumes: `data-testid`s from Task 7. `data/campus.json` (reads the first building's id and the building count).

- [ ] **Step 1: Config.** Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://localhost:3100' },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: { command: 'npm run dev -- --port 3100', url: 'http://localhost:3100/pt', reuseExistingServer: !process.env.CI },
});
```

Append to `.gitignore`:

```
/test-results/
/playwright-report/
```

Add the script `"e2e": "playwright test"` to `package.json`.

- [ ] **Step 2: Write the tests.** Create `e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import campus from '../data/campus.json';

const first = campus.buildings[0];

for (const locale of ['pt', 'en'] as const) {
  test(`${locale}: loads with search and locale switch`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : 'en');
    await expect(page.getByRole('searchbox')).toBeVisible();
  });
}

test('?b=<id> opens that building sheet', async ({ page }) => {
  await page.goto(`/pt?b=${first.id}`);
  await expect(page.getByTestId('building-sheet').getByRole('heading', { level: 2 })).toHaveText(first.name.pt);
});

test('unknown ?b= shows the overview without a sheet', async ({ page }) => {
  await page.goto('/pt?b=does-not-exist');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await expect(page.getByTestId('building-sheet')).toHaveCount(0);
});

test('building list shows every building and selecting one opens its sheet', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('button', { name: 'Lista de prédios' }).click();
  await expect(page.getByTestId('building-list-item')).toHaveCount(campus.buildings.length);
  await page.getByTestId('building-list-item').filter({ hasText: first.name.pt }).first().click();
  await expect(page).toHaveURL(new RegExp(`b=${first.id}`));
  await expect(page.getByTestId('building-sheet')).toBeVisible();
});

test('without WebGL the building list is shown', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test stub
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
    };
  });
  await page.goto('/pt');
  await expect(page.getByTestId('building-list')).toBeVisible();
  await expect(page.getByTestId('building-list-item')).toHaveCount(campus.buildings.length);
});

test('search ignores accents', async ({ page }) => {
  await page.goto('/pt');
  await page.getByRole('searchbox').fill('predio');
  await expect(page.getByRole('button', { name: first.name.pt, exact: true })).toBeVisible();
});
```

The last test assumes the first building's name contains "Prédio", which is true for the placeholder names. Once the real names are in, change the query to match a real name.

- [ ] **Step 3: Run.** `npx playwright install chromium && npm run e2e`. Expected: all tests pass. If one fails, fix the app code, not the test, unless the test contradicts the spec.

- [ ] **Step 4: CI.** Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
        env: { CI: 'true' }
```

- [ ] **Step 5: Budget check.** Run `npm run build` and read the reported first-load JS for `/[locale]`.
  - If it's well over ~300 KB gzipped, check that `CampusScene` (three.js) is only in the dynamic chunk. three is big, so a few hundred KB in that lazy chunk is expected.
  - Record the numbers in the PR description.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e .github .gitignore package.json
git commit -m "test: Playwright smoke tests and CI workflow"
```

---

## After the plan: hand-filled content (not code)

These are content tasks for you, not code tasks. The site works with placeholders until they're done.

- Walk the campus.
- In `data/campus.json`, set each building's real `id` (slug), `name`, `shortName`, `description`, floor count and `label`s, and `entrances` (positions in meters; the OSM map helps).
- Delete sheds and walkways that shouldn't appear.
- Run `npm test` after editing. The data test catches missing translations and bad floors.
