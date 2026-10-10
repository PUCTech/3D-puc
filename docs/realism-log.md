# Realism log

Running log of the "make it look like the real campus" loop. Style: pixel-art toon, fixed isometric camera.

## Iteration 1: site plan, city context, iso camera (2026-10-10)
**Added**
- Campus lot (OSM boundary, way 38629633) as sandy paving.
- OSM pitches, gardens, parks and grass near the campus, as green areas. There's a soccer pitch inside the campus (way 420431250).
- Footways as light paving strips (58 from OSM).
- Streets drawn as 8 m asphalt strips instead of screen-width lines.
- 292 neighbouring buildings from OSM, with heights, as one merged mesh in a colorful palette.
- Style changes requested by the user:
  - Coarser pixels (¼-resolution render).
  - Fixed isometric orthographic camera with pan and zoom only, no rotation.
  - Warm concrete ground instead of green.

**Sources:** OpenStreetMap via Overpass (`way(around:200)` of the campus boundary).

**Still unknown / next**
- Real wall and roof colors of the campus buildings. OSM has no `building:colour` or `roof:*` tags for them.
- Courtyard garden, Rino Levi's undulating marquees, and the roof garden (from the literature).
- Entrances and gates. OSM has `barrier=gate` nodes nearby that haven't been imported yet.
- Street widths and lanes. Every street is drawn 8 m wide for now.
- Neighbour colors are invented.
- Tall neighbours on the camera side can hide the campus at some zooms.

## Iteration 2: Rino Levi identity (concrete, patio garden, roof garden)
**Added**
- Per-building `style` in `campus.json` (hand-written; re-imports keep it).
  - Rino Levi blocks (Prédio 1, Prédio 2, Auditório): concrete-white walls (#efe9dc) and concrete roofs.
  - Later buildings: warmer walls.
- Roof garden on the Auditório, Rino Levi's first "teto-jardim", with small shrubs.
- Inner patio as a tropical garden with 11 cartoon trees: `gardens` in `campus.json`.

**Sources**
- pt.wikipedia "Prédio do Instituto Sedes Sapientiae". It names the blocks (auditorium, former dormitory, teaching), the internal patio "repleto de vegetação tropical", the garden "originalmente projetado por Burle Marx", the roof garden above the auditorium, "marquises onduladas", and the heavy use of concrete.
- PUC Tour (pucsp.br/puc-tour/consolacao.php).
- Arte Fora do Museu.

**Assumptions** (no plan or photo was readable)
- The patio is the U between Prédio 1, Prédio 2 and the Auditório.
- Prédio 2 is the "second building" whose patio wall is the concrete grid.
- Tree positions are illustrative, not surveyed.

**Still unknown / next**
- The undulating concrete marquees linking the blocks.
- The concrete-grid wall of Prédio 2 facing the patio.
- Exact wall colors from photos.

## Iteration 3: cobogó wall, undulating marquees, classroom block floors
**Added**
- Cobogó screen on Prédio 2's west (patio) wall, modeled on the real panel module.
  - Each panel is 2.52 m × 3.38 m: 9 × 12 cement cells, glass in the lower 9 rows and brass louvers in the top 3.
  - Style field `cobogoWall`.
- Prédio 2 corrected to 3 floors (≈5.4 m each, matching OSM's 16 m height).
- Undulating concrete canopy around the patio, along Prédio 1, the gap and the Auditório.
  - The outer edge waves (0.9 m amplitude, 6 m wavelength).
  - Thin columns every 6 m.
  - Field `marquees` in `campus.json`.
- Fixed iso camera now looks from the south-west instead of the south-east. Per the paper, that's the visitor's view from the entrance, with the cobogó wall as the patio's backdrop.

**Sources**
- Sica Palermo, UIA 2021 / ACSA proceedings, paper 55. It says:
  - The 3 blocks of different heights form a continuous "C".
  - The classroom block has 3 levels, sits at the back of the lot, and its west facade toward the central patio is cobogós.
  - The panel dimensions and composition.
- The circulation around the patio is protected by marquees (earlier search summary of the same paper).

**Assumptions**
- The canopy's exact route and wave shape are illustrative. No plan or photo was readable.

**Still unknown / next**
- Entrances and gates on the street side (OSM `barrier=gate` nodes nearby).
- Street-side facades.
- Which blocks are the dormitory and teaching wings beyond Prédio 2.
