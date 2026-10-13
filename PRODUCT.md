# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** PUC-SP students and visitors, mostly on phones, on or near the Consolação campus, looking for a building: where it is, what it is, where the entrance is, which floor they need. Includes exchange students who read English.
- **Secondary:** people evaluating PUC Tech (prospective members, the university, partners). For them the map shows what the league can build.

## Product Purpose

An interactive 3D isometric map of the PUC-SP Consolação campus (R. Marquês de Paranaguá, 111, São Paulo) for wayfinding. Users can search and select buildings, see their floors and rooms, and read the campus's architectural history. Success means a first-time visitor finds the right building and entrance faster than by asking someone. The map should also be good enough to hold up as PUC Tech's showcase work.

## Positioning

The map is built from the campus's own record: OpenStreetMap/GeoSampa footprints, Rino Levi's original 1942 plans and 1943 archive photography, and the CONDEPHAAT/CONPRESP heritage listings. It combines wayfinding with the heritage of a listed modernist campus, which a generic map tile or a static campus PDF can't do. The university endorses it, and PUC Tech (PUC-SP's science and technology league) builds and maintains it.

## Operating Context

- Used in the moment, on foot, often on mobile data and in sunlight. Also at night (night mode exists).
- The selected building lives in the URL (`?b=<id>`) so it can be shared. The back button clears the selection.
- Can be installed to the home screen as a standalone PWA ("Mapa PUC"); `/pt` is the start URL.
- Content is edited by developers as JSON in the repo (`data/campus.json`, `data/history.json`, `messages/*.json`).

## Capabilities and Constraints

- Next.js (static export) + React Three Fiber + next-intl + Tailwind v4, deployed to Vercel through GitHub Actions. No backend.
- Bilingual: Portuguese (default) and English. Every UI string goes through `messages/{pt,en}.json`.
- All text, search and panels are DOM over the canvas, not WebGL. When WebGL is unavailable, the building list is the fallback.
- Indoor data: original 1942 plans for some floors. Other floor layouts are estimated from community reports and must be labelled as such in the UI.
- Out of scope so far: turn-by-turn routing, accounts, analytics, CMS. Events (v3) are planned but not decided.

## Brand Commitments

- Official, endorsed by PUC-SP. University branding may be used (`public/brand/pucsp-sign.png`), in a way that fits an official channel.
- Credit line "Built by PUC Tech" with the league wordmark (`public/brand/puctech.svg`, `data/PUCT.svg`), linking to puctech.com.br.
- The v1 spec commits the visual identity to following PUC Tech, executed better than puctech.com.br.

## Evidence on Hand

- Campus geometry: `data/campus.json` (OSM-derived footprints, floors, entrances, rooms).
- History: `data/history.json` with sourced entries (Acrópole nº 64, 1943; Mappa SARA 1930; Vitruvius; Wikipédia) and 1930/1943 archive photos in `public/history/`.
- Plans and heritage documents: `docs/consolacao/floor-plans/` (Rino Levi plans, CONDEPHAAT res. 68/2010, CONPRESP 12/15, GeoSampa lot data).
- Reference photos of the real campus: `docs/consolacao/pictures/`.
- Absent: usage numbers, user testimonials, room schedules. Do not fabricate them.

## Product Principles

1. **Find it first.** Every layer (history, night mode, rooms) sits on top of fast wayfinding and never in its way.
2. **True to the record.** Geometry, history and room uses trace to a source. Anything estimated says so.
3. **Phone in hand, on campus.** Design for one thumb, glare and patchy data before desktop.
4. **Official but made by students.** It speaks credibly for PUC-SP and visibly shows PUC Tech's craft.
5. **Both languages are first-class.** PT and EN get equal care. Neither is a translation afterthought.

## Accessibility & Inclusion

WCAG 2.2 AA is the floor. The 3D canvas is an enhancement: every building and its information must also be reachable through the DOM building list and search, by keyboard and screen reader. Respect `prefers-reduced-motion` for camera moves.
