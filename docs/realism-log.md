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

## Photo iteration 4: street front on Marquês de Paranaguá
**Added**
- Concrete lattice fence along the west boundary in front of Prédio 1 and the Auditório, with a gap at the entrance:
  - a 0.5 m low wall;
  - a 25 cm square lattice up to 2.2 m;
  - square pillars every 2.6 m.
  - Field `streetFences`.
- 17 tall, slender trees (10–13 m trunks, small high crowns) 2.5 m inside the fence. Field `streetTrees`.
- Photo 14 (view from Rua Marquês de Paranaguá): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_14.jpg

**Still assumed**
- The fence's full extent beyond the stretch the photo shows.
- Tree count and spacing (approximated from the photo's density).
- The gate itself: no photo of the entrance.

## Photo iteration 5: cobogó colors and patio planting
**Changed**
- **Cobogó:** brass louvers and light-blue glass replaced by a cream cement grid (#e6dcc2) with dark glass cells, cream concrete louvers in the top 3 rows, and light pilasters and floor beams between panels.
  - Photo 04: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_04.jpg
  - Photo 05: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_05.jpg
- **Patio:**
  - dense dark-green ground cover (photo 05);
  - red-earth beds and a winding light stone path (photo 02: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_02.jpg);
  - a tall palm near the Auditório (photo 07: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_07.jpg).

**Still assumed:** exact positions of the path, beds and palm. The photos show what's there, not where in plan.

## Photo iteration 6: plain end walls
**Changed**
- The end walls of Prédio 1 and Prédio 2 (wall faces shorter than 13 m) have no tiled windows any more. Style field `blankEnds`.
  - Photo 08 ("Side front of the first building to the yard"): https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_08.jpg
- Photo 08 also re-confirms the thick projecting eave.

**Checked, not applied**
- Photo 06 shows white shutters and a pale yellow ground floor on the yard side, under the canopy: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_06.jpg. The canopy hides that floor from the fixed iso camera, so it isn't modeled.
- "Fachada da COGEAE" shows exposed board-marked concrete, metal ribbon windows and a glass ground floor: https://commons.wikimedia.org/wiki/File:Fachada_da_COGEAE.JPG. Nothing ties it to a footprint here, so it isn't assigned to Prédio 3 or Prédio 10.

**Not modeled:** the single central window stack on the end wall (glass blocks and a balcony door). It's too small at map scale.

## Photo iteration 7: the main gate
**Changed**
- The entrance's plain pillars and red sign are replaced by:
  - pale-yellow gatehouses (#e8dba0) on each side, with concrete lattice inserts on the street face;
  - a white metal gate between them;
  - a white "PUC-SP" plaque with dark lettering.
- The street-fence gaps were widened to fit the gatehouses.
- Photo (Sergio Brisola / Descubra Sampa, 2022): https://www.descubrasampa.com.br/2022/05/puc-sp-campus-consolacao.html
  - It also shows the lattice street fence continuing from the gate, and photo 08's end wall (balcony, glass blocks) behind it.

**Also checked (PUC Tour gallery, https://www5.pucsp.br/puc-tour/consolacao.php)**
- `consolacao_01`: confirms the white yard side of Prédio 1 with white shutters, the wavy canopy on cream columns, and the flagstone path.
- `consolacao_02`: names the cobogó block **"Prédio Central"**, which is our Prédio 2.
- `consolacao_04`: COGEAE is a separate tall concrete building, not one of the five on the map.
- `mapa-consolacao`: PUC's official campus map. Its colors are legend categories, not facade colors, so they're not used.

## Where the photo-only pass stopped, and why
Searched: Wikimedia Commons, PUC-SP's campus page, the PUC Tour gallery, j.pucsp.br (Jornada do Patrimônio 2018, 5 event photos), and Descubra Sampa. No photo resolves what's left:
- **Prédio 3 and Prédio 10:** no photo shows them. They keep generic warm walls and default windows, and are unverified.
- **Auditório roof garden:** no photo shows the roof. It's kept from text and is unverified.
- **Canopy and patio layout:** the photos confirm the shape and the planting, but not their positions in plan.
- **The yard side under the canopy** (pale-yellow ground floor, photo 06): real, but hidden from the fixed iso camera.

Best next source: photos from a campus walk of Prédio 3, Prédio 10, the Auditório roof (from an upper floor of Prédio 2), and an aerial or upper-floor view of the patio.

---

# Goal pass: custom models
## Custom 1: plant species models (`components/scene/Plants.tsx`)
The generic "trunk + ball" tree is replaced by procedural models, one per species seen in the photos. All plants in a group merge into one vertex-colored mesh (one draw call).
- **Canary palm:** a thick trunk and 18 fronds, each 4 segments arching down. Photo 07.
- **Slender street tree:** a clump of 3–5 thin, leaning trunks 9–13 m tall, with small crowns high up. Photo 14.
- **Shade tree:** a short trunk with 3 branches and a lumpy crown of 5–7 blobs. Photos 02 and tour 01.
- **Monstera:** a low clump of 6–9 big flat leaves on stalks, tilted outward. Photos 02 and tour 01.
- **Dracaena:** thin stems topped with tufts of long blades. Tour 01.

Patio planting: 8 shade trees, 3 slender trees, 1 palm, 10 monstera and 8 dracaena, kept 1.5 m off the stone path. Positions are illustrative.

Randomness is seeded per plant (mulberry32), so the scene is identical on every load.

## Custom 2: cobogó facade as relief (`components/scene/Cobogo.tsx`)
- The flat textured plane is now a 3D facade:
  - light concrete pilasters (0.3 m wide, standing 0.45 m proud) at every 2.52 m panel joint;
  - a floor beam at every level;
  - the lattice screen set back behind them.
- Soft grey ink instead of black: the real frame is light.
- Photo tour 02 ("Prédio Central"): https://www5.pucsp.br/puc-tour/img/galeria/consolacao/consolacao_02.jpg
- Photos 04 and 05: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_04.jpg, https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_05.jpg

## Custom 3: small objects and paving
- **Lamp posts:** white posts with box lamps, 1.2 m inside the street fence, every 12 m. Photo 14.
- **PUC-SP totem sign:** a light curved panel on a blue post, with the crest and red lettering at pixel scale, just inside the gate. Photo: https://commons.wikimedia.org/wiki/File:PUC-SP-Centro-das-Ciencias-Exatas-e-Tecnologia.JPG
- **Concrete slab benches** beside the patio path. Tour 01 and the PUC campus banner (https://www.pucsp.br/sites/default/files/2018-01/campus-consolacao_0.jpg).
- **Campus ground:** sandy color (an early text guess) changed to light grey concrete paving, as in every photo (tour 01; Jornada do Patrimônio photos 1–2, https://j.pucsp.br/noticia/campus-consolacao-integra-jornada-do-patrimonio-pelo-terceiro-ano-consecutivo).
- Checked and discarded: the Commons category's Werner Haberkorn photo is 1950s downtown São Paulo, and the campus isn't identifiable in it.

## Custom 4: Prédio 2 roof details
- Corrugated sheeting: ribs running down both slopes every 1.2 m, a shade darker than the roof.
- Exposed rafter tails under both eaves every 0.9 m.
- Photo 15: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_15.jpg

## Custom 5: neighbourhood tones
- Neighbour palette changed from invented candy colors to muted concrete greys, off-whites and beiges, as seen behind the campus in every photo:
  - photo 03: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_03.jpg
  - photo 07: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_07.jpg
  - tour 04;
  - the Descubra Sampa gate photo.
- The campus now stands out the way it does in reality.
- Individual neighbour colors are still unknown; the tones are randomized from the photo palette.

## Custom 6: canopy lip
- A raised lip (0.18 m high, 0.12 m wide) along the canopy's outer rim, following the wave.
- Photo 15: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_15.jpg
- Photo 03: https://commons.wikimedia.org/wiki/File:Instituto_Sedes_Sapientiae_03.jpg

## Where the goal pass stands
**Custom models done:** plants (5 species), cobogó relief, street fence, gatehouse, roofs (eave slab; pitched with ribs and rafters), canopy with lip, lamp posts, totem sign, benches.

**Image sources exhausted:** Wikimedia Commons (16 campus photos and its category), PUC-SP pages and the PUC Tour gallery, j.pucsp.br, Descubra Sampa. Flickr's public feed had nothing for the campus.

**Considered and skipped:** 3D window sills. The wall texture coordinates follow world axes, so sills would drift off the painted windows on angled walls.

**Still unverified for lack of photos:** Prédio 3, Prédio 10, the Auditório roof, and the exact positions of the canopy, path and plants.

---

# Floors from the plans (`docs/consolacao/`)
Sources: Rino Levi's Instituto Sedes Sapientiae ground and upper floor plans (redrawn by Ana Paula Koury, via Vitruvius), plus the section and elevation of the classroom block. See `docs/consolacao/README.md`.

**Plan → model orientation**
- Plan up = east, plan right = south, plan bottom = Rua Marquês de Paranaguá.
- This matches the photos: the cobogó corridor faces the patio (west), the Auditório attaches to Prédio 2's south end, and the entrance is on the street.

**Rooms** (123 rooms, stored per floor as world-space polygons; names come from their kind)

| Building | Ground floor | Upper floors |
|---|---|---|
| Prédio 2 (classroom block) | rooms on the east (70% of the depth), corridor along the cobogó; toilet blocks at both ends, stair hall at ~70% | the upper plan: six classrooms and the stair hall, used for floors 1 and 2 |
| Prédio 1 (former dormitory) | rooms, toilets and a pantry either side of a central corridor; a columned lounge at the south end | 18 bedrooms, a bathroom block and the stair, used for floors 1–3 |
| Auditório | foyer, stage, fan-shaped seating, and the entrance at the curved street front | offices, a numbered room, book stacks and the library, plus the **terrace** over the west 38% |

**Massing:** the Auditório is now two parts, a 2-storey library wing (east) and a 1-storey hall wing (west) with the planted terrace on its roof. The user confirmed the terrace.

**Honesty notes**
- The plans don't number rooms, so rooms are labeled by use only.
- The UI says this is the original 1942 plan and current uses may differ.
- Room partitions were measured from a 528 px plan, so expect roughly ±1 m.

---

# Terrain and new photos (`docs/consolacao/pictures/`, user-supplied screenshots)
**Street View, Jan 2024 (gate on Marquês de Paranaguá 111)**
- Gatehouses are **white**, not yellow (photo 08 / Descubra Sampa were older or warmer-lit). The PUC-SP crest sign sits on the left block's wall, with lattice panels and a white gate.
- Changed the gatehouse color.

**Prédio 2 corridor, Jul 2025**
- Red terracotta tile floor along the cobogó.
- Corridors in the floor view are now terracotta.

**Patio, Oct 2022**
- Confirms the white undulating canopies on cream columns, the stone path, benches, the palm, white shutters, and the yellow ground floor under the canopy.

**Court, Mar 2018 (looking down on Prédio 2's east side)**
- Prédio 2's east facade is **white** with large white multi-pane windows and a glass-block panel at the stair. Changed Prédio 2 to white walls with the new `pane` window type. The pink from photo 15 must belong to another face.
- A **lower level** runs along the east wall under a **red clay-tile lean-to**, opening onto the **green basketball/futsal court**. The ground drops one storey east of Prédio 2 (confirmed by the user).

**Implemented**
- `sunken` zone, 3.4 m deep, from 16 to 39 m along Prédio 2's east wall and out to 23.5 m. The ground and paving have a hole there, with a lower floor and concrete retaining walls. The OSM pitch drops into it and gets court lines (outline, center line, center circle).
- Prédio 2 gets **level −1** (3.4 m), extruded below street level. It only shows on the court side.
- A tile lean-to along the east wall, on posts standing at court level.
- Basement floor views draw through the ground (X-ray), so the plan reads.

**Estimated:** level −1 rooms (no plan exists: a row of rooms facing the court plus a corridor). The UI says so. The pit's exact extent is estimated from the photo and the court position.

## Drone video (`docs/consolacao/pictures/videoplayback.mp4`, user-supplied)
Frames sampled every 2 s.

**Roofs (the biggest miss)**
- Prédio 1, Prédio 2 and the Auditório's library wing all have **terracotta clay-tile hipped roofs** on a white eave. This replaces the flat concrete slab and the grey "corrugated" gable from photo 15.
- New `hip` roof: ridge along the long axis, tile-course texture, and a white eave slab projecting 0.7 m.
- The Auditório's terrace wing stays flat and planted.

**Prédio 3 and Prédio 10:** white modern boxes with flat dark roofs.

**Canopies:** the tops are dark weathered concrete from above (#5f6366). The edges, underside and round columns stay white.

**Court:** it sits against Prédio 2's east wall, between Prédio 2 and a white flat-roofed block. The sunken zone was trimmed to the wall strip plus the court (20–39 m along the wall, 22 m out), and the lean-to was shortened to match.

**Seen but not yet modeled**
- The cross-shaped hedge parterres in the patio beds.
- A small tile-roofed building at the court's south end. It's one of the buildings removed from the map.

## Terrain, DTI and the basement uses (user)
**Lower level**
- Prédio 10, the court, Prédio 2's level −1 and Prédio 3 all sit on the same lower ground.
- The whole campus east of Prédio 2's east wall line is now one sunken zone, 3.4 m deep: the campus boundary clipped by that line.
- The street-level paving uses the complementary polygon (`upperLot`), so no polygon holes touch the boundary.
- Prédio 3 and DTI have `baseHeight` −3.4. Footways and areas inside the zone are drawn on its floor.

**Prédio 10 → DTI**
- From the drone video, frames 24–30 s: white walls, continuous grey-glass window bands, and a **dark slate low hip roof**.
- The id is now `dti`, so old `?b=predio-10` links fall back to the overview.

**Prédio 2, Subsolo 1** (uses reported by the user; partitions estimated)
- Library, library, the stair hall (same position as the upper floors), then the canteen (cantina) to the south.
- A corridor runs along the west.

## Court and lower level (drone video, 29–33 s)
**Court**
- Multi-sport: a maroon border band around a green field, with white futsal and basketball markings (center circle, penalty arcs, keys, free-throw circles).
- Goals, hoops with backboards, a 4 m chain-link fence on posts, and floodlights on the corners (as in the 2018 photo).
- New component: `Court.tsx`.

**Roofs swapped**
- DTI, the pavilion at the court's south end, has the **terracotta hip** roof.
- Prédio 3, the long block on the court's east, has the **dark slate hip** roof.

**Lean-to:** now runs the full length of Prédio 2's east wall, as in the video.

**Lower-level planting**
- Dense tree canopy east and south of the buildings ("Bosque"), a planted strip north of the court, and a hedge strip behind the court's east fence.
- Gardens now take a `depth`, to sit on the sunken level.

**Faded buildings** drop to 20% opacity when something else is selected. Prédio 2 blocks the court from the fixed camera, so this lets the court read through.

## Lower-level view and the Prédio 3 roof (user)
- **Prédio 3:** flat dark roof.
- **New STREET / LOWER toggle** (`?nivel=inferior`). It's on by default when a basement floor is picked.
  - **Removes:** street-level-only buildings (Prédio 1, the Auditório), the patio and gardens, canopies, paving, streets, street furniture and the street fence.
  - **Ground:** drops to the lower level, and the city shifts down with it.
  - **Prédio 2:** opens at Subsolo 1 with its rooms, drawn normally (no X-ray needed).
  - **Shows on one plane:** the court, DTI, Prédio 3, the lower woods and the basement.
