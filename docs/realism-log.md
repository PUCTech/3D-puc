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
