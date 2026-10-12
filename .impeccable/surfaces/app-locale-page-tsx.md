---
version: 1
slug: "app-locale-page-tsx"
primary_target: "app/[locale]/page.tsx"
related_targets: ["components/MapApp.tsx"]
---

# Campus map (the one screen)

Scope: the whole map app: phone bottom sheet, desktop sidebar + history panel, floating controls, and the DOM labels over the 3D map. The 3D scene's rendering (pixelation, roofs, ground) stays as it is.
Visitor mode: Operate. Students broadly (Gen Z), phone in hand, finding a building and floor; secondary readers of the history.
Brief: modern and jovial; navy #143966 must stay somewhere, not necessarily primary. Fonts and design free to change.

## Direction contract

THESIS: Wayfinding the way every paulistano already reads it: each building is a Metrô line with its own color and bullet, its floors are stations on that line. Refuses the maps-app default of grey rows with one blue accent.

OWN-WORLD: White enamel sign plates on a pale platform-concrete ground, navy as the sign band and ink, five line colors (vermelha, verde, amarela, lilás, azul) carrying building identity at full strength. Round line bullets with a bold numeral or letter. One neo-grotesk (Schibsted Grotesk) from 400 to 900: heavy for names, medium for UI. Plates have 6px radii. Inside panels rows are flat, divided by rules; anything floating over the 3D scene (sheet, panels, controls, map plates) keeps one soft lift, because the busy pixel scene otherwise swallows white plates.

STORY: The visitor sees colored, numbered plates on the map, recognizes the metro logic instantly, taps a building, and reads its floors top to bottom as a line, picking a station to see the rooms there.

FIRST VIEWPORT: Phone: full-bleed map; top-right a row of sign plates (day/night, Rua|Subsolo segmented in navy, language). Map labels are white plates with the line bullet. The white bottom sheet peeks with the search field; with a building picked, a navy band heads it (line bullet 40px, name 26px/900, floors and entrances), then the vertical line with station dots, 56px rows. Desktop: the same sheet as a left sidebar (navy app band on top; a picked building gets its own navy band with bullet, name and floors); history as a second panel.

FORM: Metrô Signage, my rank 1 grounded candidate, chosen as IMPECCABLE'S PICK. seed: none (unavailable)

Signature move: picking a floor slides the "train" dot down the line to its station (motion-safe; instant under reduced motion).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
