# 3d-puc

An interactive 3D isometric map of the **PUC-SP Consolação campus** (R. Marquês de Paranaguá, 111, São Paulo), built by [PUC Tech](https://puctech.com.br), PUC-SP's science and technology league.

Find a building, see its floors and rooms, and read the history of a listed modernist campus designed by Rino Levi (1940–1942). Available in Portuguese and English, on phones and desktops, day and night, today and as it looked in 1943.

## What it does

- **3D campus map.** A fixed isometric camera with pan and zoom. Buildings are extruded from real footprints and measured heights.
- **Search and select.** Find a building by name, or pick it from the list. The selection lives in the URL, so a link shares it.
- **Floor plans.** Pick a building, then a floor, to see its rooms. Layouts from the original 1942 plans are shown as such. Floors without a plan are estimated and labelled as estimated in the UI.
- **Lower level.** Toggle the sunken court and basement levels.
- **1943 view.** Switch to the campus as first built. Buildings added later are hidden.
- **Night mode.** Lights under the wavy canopies and in the patio garden.
- **History panel.** Texts and archive photographs per building and per floor, with credits and sources.
- **Bilingual.** Portuguese (default) and English.
- **Installable.** Works as a standalone PWA ("Mapa PUC").
- **No-WebGL fallback.** If the 3D context is lost or unavailable, a plain building list takes over.

### URL parameters

The whole view state is in the query string, so every state is shareable and the back button works.

| Param | Values | Meaning |
|-------|--------|---------|
| `b` | building id | Selected building. Unknown ids fall back to the overview. |
| `f` | floor level (integer) | Floor plan shown for the selected building. Ignored if the building has no such floor. |
| `nivel` | `inferior` | Lower-level view. |
| `noite` | `1` | Night lighting. |
| `epoca` | `1943` | The 1943 view. Anything else means today. |

The locale is the first path segment: `/pt` (default) or `/en`.

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | [Next.js](https://nextjs.org) 16 (App Router, **static export**), React 19 |
| 3D | [three.js](https://threejs.org), [React Three Fiber](https://r3f.docs.pmnd.rs), [drei](https://drei.docs.pmnd.rs) |
| i18n | [next-intl](https://next-intl.dev) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Hosting | Vercel, deployed from GitHub Actions |

There is no backend, database or CMS. Everything is static files generated at build time.

> **Heads up:** this Next.js version has breaking changes from older releases. Read the relevant guide in `node_modules/next/dist/docs/` before changing framework-level code. See [AGENTS.md](AGENTS.md).

## Getting started

You need Node.js 20 or newer and npm.

```bash
git clone https://github.com/PUCTech/3D-puc.git
cd 3D-puc
npm install
npm run dev     # http://localhost:3000
```

To test on a phone over Wi-Fi, open `http://<your-computer-ip>:3000`. The dev config already allows `192.168.*.*` and `*.local` origins.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server with hot reload. |
| `npm run build` | Production build. Outputs a static site to `out/`. |
| `npm run start` | Serve a production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run import:footprints` | Pull building footprints and street data from OpenStreetMap into `data/campus.json`. |

Lint, typecheck and build must pass before a PR. CI runs the same three.

## How it works

### Data lives in the repo

Content is edited by developers as JSON. Nothing is fetched at runtime.

| File | Contents |
|------|----------|
| `data/campus.json` | Origin, streets, buildings (footprints, floors, rooms, entrances, styles), sunken areas, parking, terrain grids. Typed by `lib/campus.ts`. |
| `data/history.json` | Per-building and per-floor history texts, facts, archive photos with credits, and the source list. |
| `messages/pt.json`, `messages/en.json` | Every UI string. |
| `public/history/` | Archive photographs. |
| `public/brand/` | PUC-SP and PUC Tech marks. |

### Coordinates

All geometry is in **local meters** relative to the campus origin (`origin.lat/lon` in `campus.json`): `x` is east, `z` is south, `y` is up. Footprints are `[x, z]` pairs. Elevations come from the 2017 São Paulo LiDAR survey, so heights and terrain are measured, not guessed.

### Code layout

```
app/                  Next.js routes (/[locale]), manifest, icons
components/
  MapApp.tsx          Top-level client app: URL state, panels, scene
  scene/              The 3D world (React Three Fiber)
    CampusScene.tsx     Canvas, lights, camera setup
    CameraRig.tsx       Pan, zoom, framing of the selection
    Building.tsx        Extruded buildings, windows, roofs
    FloorPlan.tsx       Rooms and floors of a selected building
    City.tsx, Streets.tsx, Ground.tsx   Surroundings
    Court.tsx, Sunken.tsx, Parking.tsx  Campus features
    era.ts, night.ts    1943 and night variants
  ui/                 DOM panels over the canvas (search, details, history, toggles)
lib/                  Data access, types, search
scripts/              OSM importer and LiDAR extraction
i18n/                 next-intl routing and request config
messages/             Translations
docs/                 Research notes, sources, realism log, design specs
```

Text, search and panels are plain DOM over the canvas, not WebGL. That keeps them accessible, selectable and crisp, and it is why the list fallback works without WebGL.

### Data pipeline

`npm run import:footprints` queries OpenStreetMap through the Overpass API (campus boundary way `38629633`, plus everything within 200 m). Re-runs **merge**: footprints and streets update, hand-written fields (floors, rooms, styles, entrances) are kept. Pass `--fresh` to overwrite everything.

`scripts/lidar-campus.py` downloads the 2017 city LiDAR for the campus into local meters, as reference for modelling. It is not a runtime dependency. It needs Python with `laspy`, `lazrs`, `numpy` and `pyproj`, and writes gitignored files to `docs/consolacao/refs/lidar/`.

Floor-plan sources and what is known about each floor are in [docs/floor-plan-sources.md](docs/floor-plan-sources.md) and `docs/consolacao/sources.md`. The visual decisions are logged in [docs/realism-log.md](docs/realism-log.md).

## Deploy

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, typecheck and build on every PR and push to `main`, then deploys with the Vercel CLI:

- **Pull requests:** a preview deploy. The URL is posted as a PR comment and updated on each push. Fork PRs build but are not deployed, since forks don't get secrets.
- **Push to `main`:** a production deploy.

The Vercel project lives on a personal Vercel account, so Vercel's own Git integration isn't used.

One-time setup, as a repo admin:

1. Create a token at https://vercel.com/account/tokens.
2. Link a local clone to get the IDs: run `npx vercel link`, then `cat .vercel/project.json` (it has `orgId` and `projectId`).
3. Add three repository secrets (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Troubleshooting

- **Page stuck on the loading placeholder on a phone.** Open the dev server via your LAN IP, and make sure the IP matches `allowedDevOrigins` in `next.config.ts`.
- **Blank canvas.** WebGL may be disabled or the context lost. The app should switch to the building list. If it doesn't, that's a bug worth reporting.
- **Importer fails with 429 or 504.** Overpass rate-limits bursts. The script retries with backoff. Wait a minute and run it again.

## Contributing

Contributions are welcome, from code to translations to corrections of the campus data. Start with [CONTRIBUTING.md](CONTRIBUTING.md) and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Credits and license

Code: [MIT](LICENSE), © 2026 PUC Tech.

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL). Heights and terrain from the 2017 São Paulo LiDAR survey (PMSP). The campus design is by Rino Levi. Archive photographs keep their own credits, shown next to each photo and listed in `data/history.json`; they are not covered by the MIT license. The PUC-SP and PUC Tech marks are used with permission and are not licensed for reuse.
