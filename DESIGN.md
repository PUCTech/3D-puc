---
name: Mapa PUC
description: Campus wayfinding for PUC-SP Consolação, read like São Paulo Metrô signage.
colors:
  navy: "#143966"
  navy-deep: "#0c2445"
  ink: "#13213a"
  muted: "#4a5a73"
  plate: "#ffffff"
  platform: "#f1f2ee"
  rule: "#dfe2e8"
  ground: "#b7ab98"
  amarela: "#fed304"
  line-vermelha: "#d42a22"
  line-vermelha-on: "#ffffff"
  line-vermelha-text: "#d42a22"
  line-verde: "#007e5e"
  line-verde-on: "#ffffff"
  line-verde-text: "#007e5e"
  line-amarela: "#fed304"
  line-amarela-on: "#143966"
  line-amarela-text: "#143966"
  line-lilas: "#9b3894"
  line-lilas-on: "#ffffff"
  line-lilas-text: "#9b3894"
  line-azul: "#006fae"
  line-azul-on: "#ffffff"
  line-azul-text: "#006fae"
  parking-blue: "#0b5cad"
typography:
  display:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "32px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "22px"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  section:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "16px"
    fontWeight: 900
    lineHeight: 1.5
  row:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.43
  map-plate:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1
  caption:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.375
  bullet:
    fontFamily: "Schibsted Grotesk, sans-serif"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  swatch: "4px"
  plate: "6px"
  control: "10px"
  panel: "12px"
  sheet: "18px"
  dialog: "16px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "32px"
  control: "44px"
  input: "50px"
  station: "52px"
  row: "56px"
components:
  plate-button:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.navy}"
    rounded: "{rounded.plate}"
    size: "44px"
  plate-button-hover:
    backgroundColor: "{colors.platform}"
  plate-button-pressed:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.plate}"
  segmented-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.plate}"
    rounded: "{rounded.swatch}"
    padding: "0 12px"
  search-input:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    height: "50px"
    padding: "0 12px 0 44px"
  sign-band:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.plate}"
    rounded: "{rounded.plate}"
    padding: "16px"
  map-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.map-plate}"
    rounded: "{rounded.plate}"
    padding: "4px 10px 4px 4px"
  list-row:
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    height: "56px"
  list-row-hover:
    backgroundColor: "{colors.platform}"
  history-pill:
    backgroundColor: "{colors.amarela}"
    textColor: "{colors.navy}"
    rounded: "{rounded.full}"
    height: "40px"
    padding: "0 16px 0 12px"
  year-chip:
    backgroundColor: "{colors.amarela}"
    textColor: "{colors.navy}"
    rounded: "{rounded.plate}"
    padding: "2px 6px"
  inset-box:
    backgroundColor: "{colors.platform}"
    rounded: "{rounded.panel}"
    padding: "16px"
---

# Design System: Mapa PUC

## Overview

**Creative North Star: "The Metrô Platform"**

Every paulistano already reads the São Paulo Metrô: a colored line, a round numbered bullet, stations in order on a vertical strip, white enamel plates with a navy band. This system borrows that literacy for a campus. Each building is a line with its own color and bullet; its floors are stations read top to bottom; the chrome is white plates and navy sign bands floating over a busy, pixelated 3D scene.

The UI is dense but calm: one neo-grotesk from 400 to 900, heavy black weights for names, bold for controls, regular for reading. Color is spent on identity, not decoration: navy is the shell and ink, the five line colors appear at full strength only where they mean "this building", and amarela doubles as the history accent. Inside panels everything is flat and divided by hairline rules; anything that floats over the 3D map keeps one soft navy-tinted lift so white does not dissolve into the scene.

The 3D scene (smooth physically-based render with soft shadows, roofs, ground, rooms with sill-height walls and furniture, room fill colors in `components/scene/FloorPlan.tsx`) is a separate scene layer with its own palette. This system governs the DOM layer over it: panels, sheet, controls and map labels.

**Key Characteristics:**
- Buildings are metro lines: color + round bullet + code, applied everywhere a building is named.
- Floors are stations on a vertical line bar; the picked one gets a sliding "train" dot.
- White enamel plates with 6px corners and a soft lift over the map; flat, ruled rows inside panels.
- Navy sign bands head the app and a picked building.
- One typeface, Schibsted Grotesk, with 900 for names.

## Colors

A navy-and-white signage shell carrying five full-strength metro line colors as building identity.

### Primary
- **Sign Navy** (navy): the sign band behind the app title and a picked building, active segmented state, pressed plate buttons, section headings, icons, focus ring (3px outline, 2px offset), caret and accent color. Also the browser theme color.
- **Tunnel Navy** (navy-deep): the PUC Tech credit strip and the photo viewer backdrop (at 75%).

### Secondary
- **Linha Amarela** (amarela): line 3, and the history accent: clock badges, year chips, the "open history" pill, and text selection (navy text on amarela).

### Tertiary: the line colors
Each building's line lives in `lib/lines.ts` as `color` (fill), `on` (numeral on the fill) and `text` (line-colored text on white). Unknown buildings ride the navy line with their initial.
- **Vermelha** (line-vermelha, Prédio 1, code 1): deepened so white numerals pass contrast.
- **Verde** (line-verde, Prédio 2, code 2).
- **Amarela** (line-amarela, Prédio 3, code 3): the only light line; its numeral and its text on white are navy.
- **Lilás** (line-lilas, Auditório, code A).
- **Azul** (line-azul, DTI, code D): brighter than the navy shell so the two never read as one.
- **Road-sign Blue** (parking-blue): only the square "P" bullet of the parking plate, after Brazilian road signs.

### Neutral
- **Ink** (ink): body text, row labels, map plate text.
- **Muted Steel** (muted): counts, captions, placeholders, secondary labels.
- **Enamel White** (plate): every plate, panel, sheet and input.
- **Platform** (platform): hover and selected row fill, inset boxes (room legend, facts), the search well on desktop.
- **Rule** (rule): 1px dividers between rows and sections.
- **Sand Ground** (ground): page background behind the canvas; seen only before the scene paints.

### Named Rules
**The Line Owns Its Color Rule.** A line color appears only where it identifies its building: bullet, line bar, station rings, picked floor text, picked map plate. Never as a generic accent, button fill or decoration.

**The Readable Line Rule.** Line-colored text on white always uses the line's `text` value, never its fill; that is why amarela text is navy.

## Typography

**Display Font:** Schibsted Grotesk (via next/font, `--font-schibsted`)
**Body Font:** Schibsted Grotesk
**Scene-only:** Archivo Narrow 700 for the gate sign drawn on a canvas inside the 3D scene; never in the DOM UI.

**Character:** A sturdy neo-grotesk in the transit-sign tradition; black weights (900) with tight tracking (-0.025em) make names read like station plates, while 500-700 keeps controls plain.

### Hierarchy
- **Display** (900, 32px, line-height 1): a picked building's name in the desktop band. The app title is 28px at the same weight.
- **Headline** (900, 26px, line-height 1): a picked building's name in the phone sheet band.
- **Title** (900, 22px, 1.25): history entry titles. List title 20px, history panel title 18px, both 900.
- **Section** (900, 16px): in-panel headings ("Andares", "Ambientes", "Fatos"), navy.
- **Row** (600 at rest / 900 when picked, 17px): floor stations and building rows (building rows at 700).
- **Body** (400, 15px, line-height 1.625, max 65ch): descriptions and history text.
- **Label** (500-700, 14px): metadata under bands (white at 80%), buttons, counts (tabular numerals).
- **Map plate** (700, 13px; 15px when picked): DOM labels over the map.
- **Caption** (400, 12-13px): photo captions, plan notes, chips (700).

### Named Rules
**The Heavy Names Rule.** Proper names (buildings, the app) and section heads are 900; controls are 700; reading text is 400. Nothing in between competes with a name.

## Layout

One screen, no page scroll. The map is full-bleed; all UI floats over it.

- **Phone (below 1024px):** a top-right row of 44px plate controls (day/night, Rua|Nível inferior segmented, language) with 8px gaps, inset by safe-area. One bottom sheet with peek / half (50%) / full (viewport minus 72px) snaps; peek shows exactly the header (handle plus search, or the navy building band).
- **Desktop (1024px and up):** a 23.5rem left sidebar inset 16px from the window edges (navy app band, search well, scrolling body, credit strip); a second 25rem history panel beside it; plate controls top-right and zoom controls bottom-right at 20px insets. The camera frames the selection in the uncovered area.
- **Rhythm:** 4px base. Panel padding 16px, band padding 16-20px, row gaps 12px, section breaks 24-32px. Building rows are at least 56px tall; floor stations step 52px; tap targets are 44px minimum.

## Elevation & Depth

A hybrid: flat inside, lifted outside. Panels, the sheet, controls and map plates float over the 3D scene with a soft, navy-tinted, two-layer shadow; everything inside them is flat and separated by rules or platform fills.

### Shadow Vocabulary
- **Plate lift** (`0 1px 2px rgb(12 36 69 / 0.18), 0 6px 18px rgb(12 36 69 / 0.12)`): panels and search results.
- **Button lift** (`0 1px 2px rgb(12 36 69 / 0.18), 0 4px 12px rgb(12 36 69 / 0.12)`): plate buttons.
- **Map plate lift** (`0 1px 2px rgb(12 36 69 / 0.25), 0 4px 10px rgb(12 36 69 / 0.15)`): map labels, slightly stronger for the busy scene.
- **Sheet lift** (`0 -2px 6px rgb(12 36 69 / 0.12), 0 -12px 32px rgb(12 36 69 / 0.16)`): the phone sheet, cast upward.

### Named Rules
**The Float Only Rule.** A shadow means "this floats over the map". Nothing inside a panel gets one; rows, boxes and chips are flat. Never a hard offset shadow.

## Shapes

Enamel plates have gently rounded 6px corners: plate buttons, map plates, the building band, year chips. Containers that hold content step up: 12px for panels, the search field and inset boxes; 18px for the top of the phone sheet; 16px for the photo viewer. The segmented control's inner tabs and room swatches use 4px. Circles are reserved for line bullets, station rings, the train dot, the history clock badge and icon-only close buttons. The parking bullet is a 4px-rounded square, the one deliberate non-circle bullet.

Icons are a single inline set on a 24px grid with a 2px round stroke in currentColor.

## Components

### Buttons
- **Plate button:** white, navy icon or text, 6px corners, 44px square, button lift. Hover fills platform; press scales to 0.96; `aria-pressed` turns it navy with white content. 120ms transitions.
- **Segmented control:** a plate with 4px inner padding holding two tabs; the active tab is navy with white text and 4px corners, the other navy text on white, platform on hover.
- **On a navy band:** controls become white at 12% (22% on hover), white content, white focus outline (10px corners for the language switch, round for close).
- **Text link button:** navy, 700, underline 2px with 4px offset; hover turns the underline the building's line color.
- **History pill:** amarela, navy 700 text, fully round, 40px, with the clock icon.

### Chips
- **Year chip:** amarela, navy 700 12px tabular numerals, 6px corners; pinned on photos at 8px.

### Cards / Containers
- **Panel:** white plate, 12px corners, plate lift, opens with a navy band; content flat inside.
- **Inset box:** platform fill, 12px corners, 16px padding, no border or shadow (room legend, facts).
- **Photo tile:** platform fill, 12px corners, cropped image (4:3 hero, square grid, 16:9 odd-one-out), hover zoom 1.03 over 300ms.

### Inputs / Fields
- **Search:** 50px tall, white, 2px navy border, 12px corners, navy search icon inset 14px, 500 16px ink text, muted placeholder.
- **Focus:** a 4px navy ring at 25%. Results drop in a plate list, rows divided by rules, each with a 28px line bullet.

### Navigation
- **Building list:** rule-divided rows, at least 56px: 36px bullet, 17px 700 name, muted floor count, navy chevron at 60% that nudges 2px right on hover. Hover fills platform.

### Line Bullet (signature)
A circle filled with the line color, numeral or letter in the `on` color, 900 weight, tabular numerals. Sizes as used: 56px (desktop band), 44px (phone band), 36px (list), 28px (search results), 22px (map plate).

### Station Line (signature)
Floors listed top floor first as stations, 52px each. An 8px rounded bar in the line color runs through 16px white station rings (3.5px line-color border). The picked floor gets platform fill, 900 weight in the line's text color, a rotated chevron, and the 24px "train" dot (line fill, 4px white border) slides to it over 500ms on `cubic-bezier(.16,1,.3,1)`, instant under reduced motion.

### Map Plate (signature)
A white 6px plate over the map: line bullet, then the name in 700 13px ink. The picked building's plate takes its line color with `on`-colored text at 15px, and its bullet inverts to white with the line's text color. Hover adds a 2px navy ring. Parking uses the square road-sign "P". Plates fade (opacity) but never transform-animate, since they move every frame.

## Do's and Don'ts

### Do:
- **Do** give every building its line bullet wherever its name appears (list, search, bands, map plates).
- **Do** use the line's `text` value for line-colored text on white, and its `on` value on the fill.
- **Do** keep 44px minimum for every control and 56px for list rows.
- **Do** separate rows with 1px rule lines and hover them with the platform fill.
- **Do** head the app and a picked building with a navy band (white text, metadata at 80%).
- **Do** make motion motion-safe: station dots pulse for loading, the train dot slides, the sheet eases on `cubic-bezier(.2,.8,.2,1)` over 300ms; all go static under reduced motion.

### Don't:
- **Don't** use a line color as a generic accent; it always means one building.
- **Don't** put shadows on anything inside a panel, and never use a hard offset shadow.
- **Don't** add a second UI typeface; Archivo Narrow stays inside the 3D gate sign.
- **Don't** fall back to grey rows with a single blue accent; identity comes from the line colors.
- **Don't** use amarela for numerals or text on white; on white, amarela's text is navy.
