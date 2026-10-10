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

## Iteration 4: campus edge and main entrance
**Added**
- Main entrance on Rua Marquês de Paranaguá, 111: gate pillars, a red sign, and a walk east into the gap between Prédio 1 and the Auditório (the way into the patio). Field `entrance`.
- OSM edge barriers, imported (`barriers`, `gates`):
  - a 2.2 m metal-bar fence on the west;
  - concrete walls on the east and around the lot to the south;
  - a gate at the south-west corner.
- Camera fix: this camera-controls version silently ignores `verticalDragToForward`. Drag now uses `SCREEN_PAN`, which slides along the ground at the fixed angle.

**Sources**
- OSM: address node "111, Rua Marquês de Paranaguá" sits exactly on the west boundary vertex; barrier ways 546571986, 230593247, 1231187970; gate node 13443117378.
- Sica Palermo (UIA 2021): the classroom block "closes the view of those arriving from the access". This fits an entrance on the west looking east across the patio.

**Still unknown / next**
- What the real gate and portico look like.
- Where the other street entrances are (Rua Caio Prado side?).
- Street-side facades.
- Neighbour colors (still invented).

## Iteration 5: street details
**Added**
- From OSM (field `furniture`; each item stores the direction of the nearest street):
  - 33 zebra crossings;
  - 9 traffic lights;
  - 5 bus-stop shelters.

**Sources:** OSM nodes `highway=crossing|traffic_signals|bus_stop` within 200 m of the campus.

## Where the loop stopped, and why
Each remaining gap needs a source the loop couldn't read:
- **Street-side facades and exact wall colors of the campus buildings.** These need photos. Image results and PDFs with figures can't be read as text, and the text sources don't mention colors.
- **Prédio 3 and Prédio 10.** These aren't part of Rino Levi's C. The PUC Tour page names a "central building", COGEAE, the Auditório Joel Martins and the Sisters' House, but nothing ties those names to footprints.
- **Other entrances.** OSM has only one gate node and the address point.
- **Neighbour colors.** OSM has no `building:colour` tags here; the palette is invented.
- **Street trees.** OSM has no `natural=tree` near the campus.

The quickest way forward: photos from a campus walk (facades, gates, patio), or the FAU-USP / CONDEPHAAT plans (see `docs/floor-plan-sources.md`).

---

# Photo-only pass
From here on, photographs are the only source of truth. Text-based guesses are kept only when no photo contradicts them, and are marked as unverified.

Photo set: Wikimedia Commons "Instituto Sedes Sapientiae 01–15" (2016-09-27), from pt.wikipedia, plus "Fachada da COGEAE".

## Photo iteration 1: wall colors and window types
**Changed**
- **Prédio 1:** walls changed from concrete-white to cream (#ece4cf), with grey louvered shutters in deep recesses.
  - Photo 14 (street front on Marquês de Paranaguá): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_14.jpg
  - Photo 13 (side front): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_13.jpg
  - Photo 03 shows white shutters on the yard side; the iso camera sees the street side, so it uses grey.
- **Prédio 2:** walls changed from white to salmon pink (#d9a898), with windows in grey-blue surrounds and grilles.
  - Photo 15 ("Front side of the second building"): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_15.jpg
- **Auditório:** white walls with a continuous band of windows.
  - Photo 07 ("Aisle from the first to the second building"): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_07.jpg
  - Assumption: that photo shows the Auditório. The caption doesn't name the building.
- Window rows now follow each building's real floor height, so Prédio 2's ≈5.4 m floors show as 3 rows.

**Photo-checked mismatches still open**
- **Canopy:** it undulates in elevation, not in plan (photos 03, 07, 15). Its columns are round and cream.
- **Prédio 2 roof:** shallow pitched, with rafter eaves (photo 15).
- **Prédio 1 roof:** a projecting concrete eave (photos 13, 14).
- **Street fence:** a concrete lattice grid on a low wall between square pillars (photo 14). The model has OSM's "metal bars".
- **Auditório ground floor:** pale yellow under the canopy (photo 07).
- **Patio:** a winding stone path, red earth, palms and monstera (photo 02).
- **Cobogó:** off-white grid; the top rows are angled concrete louvers, not brass (photo 04).

**Unverified by any photo:** the Auditório roof garden, Prédio 3 and Prédio 10.

## Photo iteration 2: canopy shape
**Changed**
- Canopy rebuilt. Before: a plan-view wave (text-based guess, contradicted by the photos). Now:
  - straight in plan;
  - a 2.8 m-wide white slab whose height waves along its length, dipping ~0.6 m over each column;
  - thin round cream columns every 6 m.
- Photos:
  - 03 (canopy with dips at the columns): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_03.jpg
  - 15 (S-curve close-up, round cream columns): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_15.jpg
  - 07 (canopy along the aisle): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_07.jpg

**Still assumed:** the canopy's route around the patio. The photos show its shape, not a plan.

## Photo iteration 3: roofs
**Changed**
- **Prédio 1 and the Auditório:** a flat roof with a thick concrete eave projecting 0.7 m past the walls.
  - Photo 13: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_13.jpg
  - Photo 14: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_14.jpg
  - Photo 07 (thin slab edge on the Auditório): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_07.jpg
- **Prédio 2:** a shallow grey pitched roof overhanging 0.6 m. The ridge runs along the bar.
  - Photo 15: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_15.jpg
- Rendering fix: shadow bias removes the acne stripes on the roof slopes.

**Still assumed**
- Ridge direction and pitch: photo 15 shows only one eave.
- The Auditório roof garden: no photo shows the roof. It's kept from text and is unverified.
