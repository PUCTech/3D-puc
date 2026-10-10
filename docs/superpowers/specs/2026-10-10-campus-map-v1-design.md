# PUC-SP Campus 3D Map — v1 Design

Date: 2026-10-10
Status: Draft, pending review

## 1. Purpose

A website with an interactive 3D map of the PUC-SP Consolação campus (R. Marquês de Paranaguá, 111 — Consolação, São Paulo) for **wayfinding**: find a building, see what it is, where its entrance is, and how many floors it has. Visual identity follows the PUC Tech academic league, executed better than puctech.com.br.

Primary users: students and visitors, mostly on phones while on or near campus.

### Roadmap (each version gets its own spec)

| Version | Scope |
|---|---|
| **v1 (this spec)** | Exterior 3D campus: extruded buildings, streets, building info, search, PT/EN |
| v2 | Indoor: exploded floor view, rooms as labeled blocks, room search. Blocked on indoor data (facilities office / evacuation plans / survey) |
| v3 | Events: league event schedule tied to building + room; likely needs non-developer editing (CMS decision deferred to v3) |

### Out of scope for v1

Indoor rooms, events, CMS/admin, routing/turn-by-turn directions, user accounts, analytics, post-processing effects (bloom etc.), textures or hand-modeled buildings.

## 2. Decisions

| Topic | Decision | Reason |
|---|---|---|
| Geometry fidelity | Schematic: footprints extruded by floor heights | Shape + position + label is what makes buildings recognizable; no 3D modeling work; fits v2 floor peel |
| Geometry source | GeoSampa (preferred) or OpenStreetMap footprints, imported once by a script; hand-traced if neither is accurate | Open data; indoor data not obtainable from city records |
| 3D approach | React Three Fiber with pre-converted footprints (Approach A) | Full aesthetic control; v2/v3 fit without rewrite; tiny payload |
| Rejected | MapLibre/deck.gl (map-like look, fights v2 indoor); Blender GLB (manual re-export, modeling work) | |
| Languages | Portuguese + English | Exchange students and visitors |
| Content editing | Developers only, JSON in repo | Few buildings, rarely changes; revisit in v3 |
| Mobile layout | Bottom sheet (search on top) | Familiar, thumb-friendly; becomes floor picker (v2) and event list (v3); docks as left panel on desktop |
| Hosting | Static export, Vercel | No backend needed |

## 3. Architecture

Next.js (App Router) + TypeScript + Tailwind CSS v4, static export.

```
app/[locale]/page.tsx        → map page (locale: pt | en)
app/[locale]/layout.tsx      → Geist fonts, theme, <html lang>
components/scene/            → CampusScene, Building, Ground, Streets, CameraRig
components/ui/               → SearchBar, BuildingSheet, BuildingList, LocaleSwitch
lib/campus.ts                → types + typed accessor for campus.json
lib/search.ts                → accent-insensitive building search
data/campus.json             → campus data (generated geometry + hand-written info)
messages/{pt,en}.json        → UI strings
scripts/import-footprints.ts → one-time GeoSampa/OSM → campus.json converter
```

- **One page.** Full-screen `<Canvas>` with a plain HTML/Tailwind overlay on top. All text, search, and panels are DOM, not WebGL.
- **State.** The only shared state is the selected building, stored in the URL query (`?b=<building-id>`). Links are shareable; the back button clears the selection. No state library.
- **Client-only 3D.** The canvas is loaded with `next/dynamic` (`ssr: false`) behind a styled loading state. If WebGL is unavailable, the page shows the building list instead.
- **Dependencies:** `three`, `@react-three/fiber`, `@react-three/drei`, `next-intl`. Dev: `vitest`, `@playwright/test`.

## 4. Data model

`data/campus.json`, typed in `lib/campus.ts`:

```ts
type Localized = { pt: string; en: string };

type Campus = {
  origin: { lat: number; lon: number };                   // all geometry is meters from here
  streets: { name: string; path: [number, number][] }[];  // centerlines
  buildings: Building[];
};

type Building = {
  id: string;                        // URL slug, e.g. "predio-novo"
  osmId?: number;                    // source OSM way; import script matches on this
  name: Localized;
  shortName?: string;                // map label
  description?: Localized;
  footprint: [number, number][];     // polygon, meters (x east, z south)
  baseHeight?: number;               // default 0
  floors: Floor[];                   // ordered lowest → highest
  entrances?: [number, number][];    // door positions, meters
};

type Floor = {
  level: number;                     // -1 basement, 0 ground, 1, 2…
  label?: Localized;                 // "Térreo", "Subsolo"
  height: number;                    // meters, default 3.5
  rooms: Room[];                     // empty in v1
};

type Room = {
  id: string;                        // "412"
  name?: Localized;
  footprint?: [number, number][];    // v2
};
```

Rules:

- Building height is the sum of its floor heights. No separate height field.
- Below-ground floors (negative `level`) are not rendered in v1; they still count toward the floor list shown in the sheet.
- Coordinates are local meters, converted from latitude/longitude by the import script (equirectangular projection around `origin`, accurate enough at campus scale). No projection code at runtime.
- **Source confirmed:** OSM way 38629633 (campus boundary) contains 16 building footprints with `height` tags (3–16 m) and no names. The first import creates placeholder names ("Prédio N" / "Building N") and guesses floors from `height / 3.5 m`. Real names and floor counts are then edited by hand.
- On later runs, the import script updates `footprint` (matched by `osmId`) and `streets`, and keeps every hand-written field (`id`, `name`, `description`, `floors`, `entrances`, …). It never adds or removes buildings after the first run, so a deleted shed stays deleted.
- OSM closed ways repeat their first point; the script drops the duplicate. Winding order is left as-is (Three.js `ExtrudeGeometry` handles both).
- v3 events will reference `buildingId` + optional `roomId`; nothing in this model changes for them.

## 5. UI and interactions

### Layout

- **Phone:** search bar at the top, bottom sheet for building info (peek state → drag to expand → drag down or tap ground to dismiss). PT/EN toggle and a "Lista de prédios" button in the top corner.
- **Desktop (≥ 1024px):** the same sheet sits as a left-hand panel.

### Camera

- Starts on an angled overview of the whole campus.
- Orbit, zoom and pan through drei `CameraControls` (touch: one-finger orbit, pinch zoom/pan). Tilt is limited above the ground and zoom has a min and max.
- Selecting a building smoothly flies the camera to frame it. If the device asks for reduced motion (`prefers-reduced-motion`), the camera jumps instead.

### Selecting a building

Triggered by tapping it, choosing it in search or the list, or opening a `?b=` link. Then:

- The selected building gets a brighter `#bae4fe` outline and a lighter roof. The others dim slightly.
- The sheet opens to a peek showing the name, floor count, entrance and short description. Expanded, it shows the full description and the floor list.
- Entrance markers pulse on the ground.
- Clearing the selection (closing the sheet, tapping the ground, or pressing back) removes `?b=`.
- An unknown `?b=` id is ignored and the overview is shown.

### Search

Matches building `name` (both languages) and `shortName`, ignoring case and accents. A simple filter over the building list, with no search library.

### Labels

Geist Mono labels above each building, using drei `<Html>` with `distanceFactor`, so they shrink as the camera zooms out. (shortcut: no overlap detection; add it if labels collide once real names are in)

### Visual style

| Element | Value |
|---|---|
| Background | `#020d2b` |
| Ground | `#081a3e` |
| Streets | `#143966`, with name labels |
| Buildings | navy → `#2b6fac` gradient by height |
| Building edges / highlights | `#bae4fe` |
| Text on light surfaces | paper `#f0f4f9` |
| Fonts | Geist (UI), Geist Mono (labels, tags) via `next/font` |
| Lighting | one directional light + ambient light; no post-processing |

### Accessibility and fallbacks

- The overlay is semantic HTML. Search, sheet, list and toggles work with the keyboard and screen readers.
- "Lista de prédios" opens a plain list with the same information. This is also the fallback when WebGL is unavailable.
- Every UI string lives in `messages/{pt,en}.json`. Building text lives in `campus.json`.

### Language

`next-intl` with `/pt` and `/en` routes. `/` redirects to `/pt`. The toggle keeps `?b=`.

## 6. Testing and quality

### Automated (Vitest)

- **Data test.** `campus.json` matches the expected shape: unique ids, `pt` and `en` both filled, polygons with at least 3 points, at least one floor per building, no repeated floor levels.
- **Import script test.** On a small sample file, checks coordinates are converted to meters around `origin`, outline point order is normalized, and hand-written fields survive a re-run.
- **Search test.** Accent-insensitive matching in both languages.
- **Translations test.** `messages/pt.json` and `messages/en.json` have identical keys.

### Automated (Playwright smoke test)

Loads `/pt` and `/en`. Opening `?b=<id>` shows that building's sheet. The building list shows every building.

### Manual check before each release (real phone)

- The overview loads in under about 3 seconds on 4G.
- Orbiting stays smooth.
- Tapping a building opens its sheet.

### CI

GitHub Actions runs lint, type-check, Vitest and Playwright on every PR. Vercel preview deploys give each PR a link to try on a phone.

### Budgets

- `campus.json` under 100 KB.
- JavaScript loaded on first visit under about 300 KB gzipped.
- No textures or 3D model files.

## 7. Open risks

- **Footprint accuracy.** OSM has footprints and heights for all 16 campus buildings (verified 2026-10-10), but they haven't been checked against reality. If something is off, GeoSampa LiDAR (2017/2020) is the fallback.
- **Floor counts and building names** must be gathered by hand (a campus walk). The import script can't provide them.
- **Indoor data for v2** has no source yet. See `docs/floor-plan-sources.md`. The campus is Rino Levi's 1942 Sedes Sapientiae, so the original plans exist (FAU-USP Rino Levi collection, CONDEPHAAT listing).
