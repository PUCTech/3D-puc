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

## Parking lane (user + photo `pictures/WhatsApp Image 2025-10-29…`, satellite screenshot 01.17.04)
**Layout (user)**
- The car gate is on R. Marquês de Paranaguá, at the OSM gate in the south-west corner.
- The lane runs east along the Auditório, slopes down to the lower level, and ends at Prédio 3.
- Cars park on both sides. A railed pedestrian ramp beside the Auditório goes down to the lower level.

**Modeled**
- A 7.5 m concrete lane. It slopes over 27 m (~12%) from the Auditório's mid-length down to the lower level at Prédio 2's south end.
- Painted bays, and one accessible (blue) bay near the gate.
- 24 low-poly parallel-parked cars, in the photo's colors (silver, greys, black, white, a red one). Cars on the slope are pitched.
- A 1.7 m pedestrian ramp with white posts and handrails.
- The lower zone was extended over the slope and past the OSM boundary on the south. The concrete retaining wall on the lane's south side is the lower zone's edge, as in the photo. The street-level paving and fence stop at the car gate.

**Estimated**
- Where the slope starts and ends, the lane width, and the car positions.
- The OSM boundary is ~6 m short on the south here; the lane runs past it.

`campus.json` is ~101 KB; the size budget was raised to 128 KB (gzipped it's ~25 KB).

### Parking slope fixes (review)
- **Z-fighting:** the lane and ramp surfaces sat exactly on the street paving and the lower floor and flickered or vanished. They're now lifted 6 cm.
- **See-through:** the sloped lane and ramp are now solid, with side walls down to the lower floor and a front cap where the lower view cuts the lane.
- **Floating street:** OSM's street segments inside the sunken zone (its service driveway on the lane) were drawn at street level over the cars. Those segments are dropped.
- **Lower view:**
  - selecting a street-level-only building leaves the lower view instead of aiming the camera at a hidden building;
  - turning the lower view on clears such a selection;
  - the lane shows from the top of the slope down.

## Branding
**Gate sign** (Street View, Jan 2024, `pictures/Screenshot 2026-10-11 at 01.37.51.png`)
- The left (north) gatehouse's street face carries the PUC-SP wall sign: crest + "PUC-SP" (from `docs/svg/brasao-pucsp-assinatura-alternativa-RGB.png`, downscaled to `public/brand/pucsp-sign.png`), "Campus Marquês de Paranaguá", and "111" in blue.
- Fix: the gatehouse lattice insert sat on the campus-side face. It's now on the street face of the right block.

**Credit:** a "Feito por / Built by PUC Tech" strip with the league wordmark (`public/brand/puctech.svg`), linking to puctech.com.br. It's at the bottom of the desktop sidebar and of the phone building list.

## Street front, round 2 (Street View Jan 2023 / Jan 2024 screenshots in chat)
- **Car gate:**
  - a black sliding gate whose two leaves of diagonal bars meet in a chevron;
  - square concrete pillars either side;
  - a black vertical-bar fence on a low wall to its south.
- **Sidewalk pots:** eight black pots with cycads in front of the lattice wall, between the entrance and the car gate.
- **Pedestrian gate:** white vertical bars instead of a glass panel.
- **Entrance canopy:** the wavy canopy now starts just inside the gate and runs in along the entrance walk.
- **Auditório terrace:** a parapet railing (posts and two rails) around its planted roof.
- **Fonts:** the gate sign's lettering uses Archivo Narrow, a Google Font via `next/font`. The PUC Tech wordmark needs no font: its letters are outlined paths, and the hidden duplicate text layers were removed.
- **Build:** Tailwind no longer scans `docs/`; it failed reading a photo there.
- **Open question:** a brown tile band on a white wall in front of the terrace (photo 4) isn't modeled yet; unclear which wall it belongs to.

- Wavy canopy: no leg along Prédio 2's west wall (user, Oct 2026). It only runs along Prédio 1 and the Auditório.
- Entrance canopy meets the Prédio 1–Auditório canopy at 90° (user screenshot 11.42.44). Both follow the street grid; the entrance walk runs straight in from the gate.
- Correction: the entrance canopy is the Auditório north-wall canopy carried straight out to the gate; the Prédio 1 canopy meets it at 90°. The gate moved ~5.5 m south to line up with it, and the street fences, pots, tree, lamp and totem moved with it.

## History wiki (Oct 2026)

- 1943 photos: *Acrópole* nº 64, Aug 1943, pp. 65–72 ("Faculdade de Filosofia do Instituto Sedes Sapientiae"), photos by Leon Liberman, from the FAU-USP digital archive (https://www.acropole.fau.usp.br/edicao/64, `large/021–028.jpg`). Brazilian law 9.610/98 art. 44 protects photographs for 70 years from 1 January after publication, so these have been public domain in Brazil since 2014. The FAU-USP watermark stays visible.
- 1930 map: SARA Brasil *Mappa Topographico do Municipio de São Paulo*, sheets 50/10 and 51/6, stitched at grid lines X −2000. Downloaded from GeoSampa (`downloadArquivo.aspx?orig=DownloadMapaArticulacao&arqTipo=MAPA_ARTICULACAO&arq=Sara_Brasil_1930\<sheet>.zip`).
- GeoSampa 1940 (`Fotos_Aereas_1940\FM5-079.jpg`) and 1954 (`Fotos_Aereas_1954\FX05-237.jpg`) aerials also download, but they are unrectified. The lot was not located on them, so they aren't used.
- How 1943 uses map to today's buildings (Acrópole's own walk-through: restaurant left of the gate, conference room right, hall at the back):
  - Prédio 1 = Casa das Estudantes (restaurant below, rooms above).
  - Auditório = conference hall.
  - Prédio 2 = classrooms, hall and the glazed corridor.
- Assumptions:
  - The chapel, library and "terraço suspenso" are placed on the Auditório upper floor. They are "left of the hall", which is the auditorium side.
  - The "terraço em frente ao campo de tênis" is placed on Prédio 2's lower level, beside today's court.
  - The reading room has no stated location, so it sits under the site entry.

## Iteration: realistic render and furnished rooms (2026-10-12)
**Changed**
- The pixel-art toon look is gone.
  - Full-resolution, antialiased render.
  - Physically based materials and soft shadows.
  - No ink outlines.
  - High-resolution, smoothly filtered textures, with window frames, sills and sky reflected in the glass.
- Floors are cut-away models (`components/scene/interior.ts`).
  - Walls are cut at 1.2 m, with a dark top on every cut wall.
  - Doors open onto corridors and halls.
  - Exterior walls run solid to the sill, with glazing and mullions above.
- Floor finishes by use.
- Furniture at real sizes, by use.

**Sources and choices** (photos in `docs/consolacao/pictures/` and `public/history/`)

| Room | Finish | Furniture | Source |
|---|---|---|---|
| Classrooms | Light grey-blue vinyl | Black tablet-arm chairs in rows, white teacher's table, whiteboard | Google Maps photos, 2017 |
| Glazed corridor (Prédio 2) | Glossy terracotta tile | Yellow tactile strip, wooden benches | Recent photo |
| Dorm rooms (Prédio 1) | Parquet | Single bed, wooden desk and chair under the window, wardrobe | `1943-quarto-estudante.jpg` |
| Reading room | Terrazzo | Bookcases | `1943-sala-leitura.jpg` |
| Library | Terrazzo | Bookcases, white tables, black chairs (as in the 2017 study-room photo) | 2017 photo |
| Restaurant / canteen | Terrazzo | White tablecloths, dark ladder-back chairs | `1943-restaurante.jpg` |
| Auditorium | Wood | Raked rows of dark upholstered seats facing the stage | `1943-auditorio-fundos.jpg` |
| Stage | Wood | Lectern; a grand piano when the stage is deep enough | `1943-auditorio-frente.jpg` |

**Still invented**
- Furniture counts and positions.
- Office, meeting room and restroom layouts.
- Rooms of unknown use (`room`), which get a work table.

## Iteration: today and 1943 views, first research sweep (2026-10-12)
**Era switch**
- **URL and default:** "Hoje | 1943" is kept in the URL as `?epoca=1943`, like `?noite=1`. Today is the default.
- **Buildings:** Prédio 3 and the DTI are `later: true`, because only Prédio 1, Prédio 2 and the Auditório are Rino Levi's (1940–42). They are hidden in 1943 unless picked.
- **Room uses:** rooms have an optional `kindToday`. The 1943 dorm rooms show as "Sala" today until a source gives their current use.
- **1943 interiors:** parquet in classrooms and offices; blackboards and dark wooden two-seat desks; ladder-back chairs; white tablecloths; dark auditorium seats on a shallow rake.
- **1943 surroundings:**
  - no parked cars and no accessible bays;
  - every neighbouring building is capped at 8 m (shortcut: the real 1940s footprints aren't known);
  - the patio, the court and the street front are unchanged.

**From the new sources** (see `docs/consolacao/sources.md`)
- **Canopies:** dark waterproofed tops (drone video), white soffits and columns, and a red paint band at each column's foot (PUC-SP gallery).
- **Patio:**
  - two lobed, clipped hedge beds (drone video; outlines estimated, placed clear of the mapped trees and path);
  - a red curb along the flagstone path.
- **Glazed corridor today:** upholstered benches with planters on one side; wooden bar tables with white stools on the other.
- **Auditório today:** it is the Auditório Joel Martins (PUC Tour), with steep wooden tiers (about 18 cm per row) and sage-grey seats between wooden side panels.
- **Prédio 1 today:** Commons 2016 shows its upper corridors still have parquet floors and gridded end windows.

**Open questions**
- Current uses of Prédio 1's upper floors.
- Construction dates of Prédio 3 and the DTI.
- Where the chapel is today. Its 2023 photo shows wooden pews, a wood wall and a Madonna panel.
- Which building is the "casa das Irmãs Agostinianas" mentioned on the PUC Tour page.

## Iteration: LiDAR survey (2026-10-12)
**Source:** São Paulo's 2017 LiDAR (PMSP, AWS Open Data). `scripts/lidar-campus.py` walks the Entwine octree and keeps the points around the campus, in campus.json's local frame. Heights below are relative to the street at the gate (776.29 m).

**Heights corrected** (eave from roof points within 1.2 m of the footprint edge; ridge = 99th percentile)

| Building | Before | LiDAR eave | Change | Roof rise (`roofRise`) |
|---|---|---|---|---|
| Prédio 1 | 12.6 m | 11.0 m | floors 3.15 → 2.75 m | 2.06 m |
| Prédio 2 | 16.1 m | 13.7 m | floors 5.37 → 4.58 m | 2.04 m |
| Auditório | 9.9 m | 9.3 m | — | 0.49 m (a very shallow hip, light grey from the satellite, not terracotta) |
| DTI | top at 2.8 m | 3.6 m | floors 3.09 → 3.5 m | 1.0 m |
| Prédio 3 | — | — | already right | — |

**Two unmapped buildings found.** Footprints are LiDAR rectangles on the campus grid (70.4°); the satellite confirms both.
- **"Bloco norte"**, north of the court: about 10 × 18.5 m, roof 7.7 m above the street, standing on court level (−3.2 m). Modeled as 3 floors × 3.7 m, flat roof, with a rooftop box (not modeled).
- **"Edifício do bosque"**, in the north-east corner: about 30 × 12 m, roof eave 4.2 m above the street, standing on ground at −9.5 to −11.7 m. Modeled as 4 floors × 3.65 m on base −10.4 m, light-grey hip roof.
- Their names are descriptive placeholders. One may be the Irmãs Agostinianas house (PUC Tour). Their uses are not confirmed.

**Not modeled**
- About 16 × 17 m of building-class points under the canopy west of the Edifício do bosque. Roof about 4 m above its ground (−6.3 m). Nothing is visible from above.

**Terrain:** the lot falls far more than the model's single −3.4 m level.
- Patio: 0 to −1 m.
- Court: −2.5 to −3 m.
- East of Prédio 3: −4 to −6 m.
- North-east corner: −9 to −12 m.

**City:** 244 of 292 neighbour heights replaced. The OSM/GeoSampa values were off by a median of 8 m, and several 40–50 m towers were recorded as 3–5 m. Each height is now roof (90th percentile of building points) minus the gate's street level, so roofs sit at their true elevation above the flat model ground. 13 neighbours with too few returns keep their old height.

## Iteration: terrain, trees and neighbours from LiDAR (2026-10-12)
- **Bosque terrain:** the north-east garden is now a sloped surface from the LiDAR ground (a 2 m grid, lowest return per cell, gaps filled, lightly smoothed). It falls from −3.5 m to −12.3 m.
  - The Edifício do bosque stands at the bottom of that slope.
  - Trees there are seated on the slope.
  - The flat lower level (`sunken.floor`) no longer covers this area.
  - The lower-level view leaves a hole over it.
- **Trees:** crowns were detected from a 1 m canopy height model (local maxima ≥ 5 m, at least 4 m apart). Each detected crown replaces the guessed shade or slender trees under it, sized to its measured height (`h`).

  | Garden | Crowns | Measured height (median) |
  |---|---|---|
  | Patio | 4 | 20 m |
  | Bosque | 10 | 26 m |
  | Jardim norte | 3 | 10 m |

  Palms, monsteras and dracaenas stay hand-placed, because LiDAR doesn't separate them.
- **Neighbours:** heights are now roof (90th percentile) minus their own surrounding ground (30th percentile of ground returns within 12 m). This fixes buildings standing on lower or higher streets. Median 16 m, max 85 m; 13 kept their OSM value for lack of returns.

## Iteration: today's classrooms and Prédio 3 (2026-10-12)
**Sources:** FUNDASP Radar (PUC-SP's maintainer).
- "Marquês de Paranaguá: campus inicia ano letivo com nove salas de aula reformadas", Feb 2026, with 4 photos.
- "FUNDASP vai climatizar 10 espaços": Prédio 3 has a basement lab and three classrooms on each of floors 1–3.
- "FUNDASP apoia restauro de piano histórico": the chapel (Capela Nossa Senhora "Sedes Sapientiae") keeps the piano the canonesses donated in 1971.

**Changed**
- **Today's classrooms:**
  - revitalised wood parquet, not vinyl (the 2017 photo was a study room);
  - blue upholstered tablet-arm chairs with white tablets and black legs.
- **Prédio 3:** an estimated layout (`estimated: true`). Room counts follow FUNDASP; positions are guessed along the bar.
  - Corridor on the court side, stair at the north end, restrooms in the south annex.
  - Lowest floor: lab and support room. Lab benches use the PUC-SP gallery as reference.
  - Floors 1–3: three classrooms each.
- **New room kind:** `lab` (Laboratório / Laboratory).
- **Glazed-corridor furniture:** the bar tables now only appear in corridors over 40 m, i.e. Prédio 2's.

**Still open**
- Where the chapel is; its photo shows pews, a wood wall and a Madonna panel.
- Today's uses of Prédio 1's upper floors.
- Which building got the nine renovated classrooms. The photos show cobogó outside the windows, which suggests Prédio 2.
