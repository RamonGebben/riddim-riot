---
name: Riddim Riot
description: A twin-stick rhythm roguelite where every gun is a bass synth; screens are smoked glass over a live dancefloor, and the sound is made in a booth of synth panels.
colors:
  strobe-blue: '#60a5fa'
  strobe-blue-bright: '#93c5fd'
  strobe-ink: '#0b1220'
  uv-violet: '#a78bfa'
  hype-amber: '#fbbf24'
  alarm-coral: '#ff6369'
  floor-black: '#111111'
  booth-black: '#1c1c1c'
  console-grey: '#1f1f1f'
  console-edge: '#2e2e2e'
  haze-white: '#ededed'
  smoke-grey: '#9ca3af'
typography:
  display:
    fontFamily: 'system-ui, sans-serif'
    fontSize: 'clamp(2.75rem, min(10vw, 16vh), 6rem)'
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'system-ui, sans-serif'
    fontSize: '2.3686rem'
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: 'system-ui, sans-serif'
    fontSize: '1.333rem'
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: 'system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.2em'
  rack-label:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.16em'
  data:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.5
  readout:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.2
    fontFeature: '"tnum"'
rounded:
  s: '4px'
  base: '8px'
  full: '9999px'
spacing:
  xxs: '0.4222rem'
  xs: '0.5628rem'
  s: '0.7502rem'
  base: '1rem'
  m: '1.333rem'
  l: '1.7769rem'
  xl: '2.3686rem'
components:
  button-primary:
    backgroundColor: '{colors.strobe-blue}'
    textColor: '{colors.strobe-ink}'
    typography: '{typography.title}'
    rounded: '{rounded.full}'
    padding: '0.5628rem 1.7769rem'
  button-primary-hover:
    backgroundColor: '{colors.strobe-blue-bright}'
    textColor: '{colors.strobe-ink}'
  button-quiet:
    backgroundColor: 'transparent'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.s}'
    padding: '0.4222rem 0.7502rem'
  button-quiet-hover:
    backgroundColor: '{colors.console-grey}'
  button-quiet-pressed:
    backgroundColor: '{colors.strobe-blue}'
    textColor: '{colors.strobe-ink}'
  glass-card:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.base}'
    padding: '1rem'
  hud-panel:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.base}'
    padding: '0.4222rem 0.7502rem'
  text-input:
    backgroundColor: '{colors.console-grey}'
    textColor: '{colors.haze-white}'
    typography: '{typography.data}'
    rounded: '{rounded.s}'
    padding: '0 0.5628rem'
  stat-tile:
    backgroundColor: 'transparent'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.base}'
    padding: '0.7502rem 1rem'
  badge-callout:
    backgroundColor: '{colors.hype-amber}'
    textColor: '{colors.floor-black}'
    typography: '{typography.label}'
    rounded: '{rounded.full}'
    padding: '0.4222rem 1rem'
  overlay-panel:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.base}'
    padding: '1.7769rem'
  panel-row:
    backgroundColor: '{colors.console-grey}'
    textColor: '{colors.haze-white}'
    rounded: '{rounded.s}'
    padding: '0.5628rem'
  latch:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.haze-white}'
    typography: '{typography.data}'
    rounded: '{rounded.s}'
    padding: '0 0.4222rem'
    height: '1.75rem'
  latch-pressed:
    backgroundColor: '{colors.strobe-blue}'
    textColor: '{colors.strobe-ink}'
  latch-pressed-weapon:
    backgroundColor: '{colors.hype-amber}'
    textColor: '{colors.floor-black}'
  latch-primary:
    backgroundColor: '{colors.strobe-blue}'
    textColor: '{colors.strobe-ink}'
  latch-primary-hover:
    backgroundColor: '{colors.strobe-blue-bright}'
  knob:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.strobe-blue}'
    typography: '{typography.readout}'
    rounded: '{rounded.full}'
    size: '44px'
    width: '4.25rem'
  knob-weapon:
    textColor: '{colors.hype-amber}'
  curve-screen:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.strobe-blue}'
    typography: '{typography.readout}'
    rounded: '{rounded.s}'
    height: '104px'
  rack-tab:
    backgroundColor: 'transparent'
    textColor: '{colors.smoke-grey}'
    typography: '{typography.rack-label}'
    rounded: '{rounded.s}'
    padding: '0 1rem'
    height: '2.25rem'
  rack-tab-selected:
    backgroundColor: '{colors.console-grey}'
    textColor: '{colors.haze-white}'
  preset-display:
    backgroundColor: '{colors.floor-black}'
    textColor: '{colors.hype-amber}'
    rounded: '{rounded.s}'
    padding: '0 0.5628rem'
    height: '1.75rem'
---

# Design System: Riddim Riot

## Overview

**Creative North Star: "The Club Under Glass"**

The game is the dancefloor: a PixiJS arena whose shader pulses, shakes and
changes palette with the music. Every React screen the player meets is a
pane of smoked glass laid over that floor and lit by it. Panels are
translucent floor black with a faint white hairline and a backdrop blur,
so the level keeps moving through them. Even the landing page plays a live
level behind its copy, with a silent demo of shots landing on the kick.

Behind the glass is the booth, where the sound is made. The sound
playground (`/playground`) is a bass synth's front panel in the same
palette: opaque Console Grey slabs framed in rows, Floor Black wells and
screens set into them, arc knobs, small square latches and curve screens
whose handles you drag. It is dense, flat and labelled like gear. The
floor and the booth share one palette, one type pair and one rule for
light; they differ in material (glass over a live game, opaque panel
around a tool) and in shape (pills on the floor, square latches in the
booth).

The chrome recedes and the game leads. Color and glow are not decoration.
They mark state: the slot you're holding, a magazine that's loaded, a
combo, dash being ready, a heart you just got back, the engine that's
armed. The one deliberate performance is the wordmark: heavy italic caps
in a violet-to-blue gradient, RIDDIM stacked over RIOT, whose O is the
level's circle filling a quarter on each beat at 140 BPM. Density runs
high in the HUD and the booth (small mono readouts, segment bars, key caps,
knobs) and loose on the landing and level cards, where a single headline
holds the screen.

The system rejects two neighbours. It is not generic SaaS, so no bland
blue-pill-on-white app feel and no settings-form arrangement of a tool,
even though it starts from a stock token set. And it is not cyberpunk
cliché: no glitch text, scanlines or magenta/cyan hacker styling. It is
dark only; light surfaces never appear.

**Key Characteristics:**

- Smoked glass panels (70-75% floor black, 12% white hairline, 6-8px blur) over the live game
- Opaque synth-panel slabs in the booth: Console Grey rows with Floor Black wells, screens and latches set into them
- Glow means state: an active, ready, armed or rewarded element gets a soft colored halo; resting elements get none
- Mono uppercase, widely tracked labels in UV Violet name each panel and section
- In the booth, Strobe Blue is the sound design and Hype Amber is the auditioned weapon's own values, never the other way round
- One loud moment per screen: the wordmark, a level heading or the combo
- Motion keyed to the tempo, and switched off when flashing is reduced

## Colors

Near-black club neutrals with four lights, each with one job: Strobe Blue
for "yours and ready", UV Violet for names and drops, Hype Amber for
reward (and, in the booth, the weapon on audition), Alarm Coral for health
and danger.

### Primary

- **Strobe Blue** (#60a5fa): the player's own things and the main action.
  The "Drop in" button, the active weapon slot's border and halo, loaded
  magazine cells, weapon tags, control key names, a picked weapon card's
  border and halo, and the played part of a normal song segment. In the
  booth it is the sound design and the page's own state: a knob's arc for
  a design value, every curve trace, fill and band, design handles, a
  pressed latch, the filled primary latch, and lit meter segments.
- **Strobe Blue Bright** (#93c5fd): the hover state of Strobe Blue, and the
  focus ring on every interactive element. In the booth it also marks a
  design value that differs from what's saved (its readout, the unsaved
  count) and the meter's loud top 6 dB.
- **Strobe Ink** (#0b1220): text on a Strobe Blue fill.

### Secondary

- **UV Violet** (#a78bfa): the small labels that name a panel ("Your
  loadout", "How to play") or a booth section ("Filter", "Amp envelope",
  "Firing range", a latch group's name, the meter's OUT), drop segments on
  the song track, the level card heading's glow, and the start of the
  wordmark gradient.

### Tertiary

- **Hype Amber** (#fbbf24): reward and readiness in the game. The combo
  multiplier, the dash button when ready, bonus hearts, the new-best badge,
  new and better loot. In the booth it is the auditioned weapon's own
  values only: the preset display's weapon name, the armed engine's dot in
  the rack strip, a weapon knob's arc, the weapon's draggable handle and
  dashed marker line on a curve screen, the riff's pitch bars and sounding
  step, and a latch pressed in the weapon's tone.
- **Alarm Coral** (#ff6369): health and danger. Hearts, the boss health
  bar, error text, an invalid field's border, and the meter's clip segment.

### Neutral

- **Floor Black** (#111111): the page background, and the base of every
  glass panel at 70-75% opacity. In the booth it is everything set into a
  panel: wells, curve screens, the firing range window, the preset display,
  latch and knob faces, readouts and unlit meter segments.
- **Booth Black** (#1c1c1c): the raised background step (bag cards).
- **Console Grey** (#1f1f1f): form fields, the quiet-button hover, and the
  booth's panel slabs (the preset bar, panel rows, the range deck, the
  selected rack tab).
- **Console Edge** (#2e2e2e): field, stat-tile and booth borders (latch
  outline, curve screen frame, rack strip rule), the empty track of a knob,
  empty hearts, and the dash button while recharging.
- **Haze White** (#ededed): primary text, the knob's pointer, the source of
  the glass hairline (12-25% mixed into transparent), and the booth's panel
  hairline (9%), curve grid (7%) and axis labels (45%).
- **Smoke Grey** (#9ca3af): secondary text, meta lines, inactive slots and
  rack tabs, the level badge, empty magazine cells at 25%, the meter scale,
  a latch's hover border, and the knob's tick at the saved value.

### Named Rules

**The Glow Is State Rule.** A colored halo (`0 0 14px` at 50-55% of the
color, or `0 0 8px` at 55% on a small dot) or a `currentColor` drop-shadow
appears only on an element that is active, ready, armed or rewarded. A
resting element never glows.

**The One Job Per Light Rule.** Each accent keeps its meaning across every
screen: blue is yours and ready, violet names things and marks drops,
amber is reward, coral is health and danger. Don't borrow an accent for
decoration.

**The Design Blue, Weapon Amber Rule.** Wherever the sound design and one
rolled weapon are edited side by side, Strobe Blue is the design (the
values every weapon shares, and the page's own state) and Hype Amber is
only the weapon being auditioned (its roll and its overrides). A control
that edits the design is never amber; a control that edits only this
weapon is never blue. Test: cover the labels, and the colour alone still
tells you whether a change will be saved to the game.

**The Dark Floor Rule.** Every surface is dark. The theme's light mode
tokens exist but are never shown (the color mode is forced to dark), so
never design for them.

## Typography

**Display Font:** system-ui (with sans-serif)
**Body Font:** system-ui (with sans-serif)
**Label/Mono Font:** ui-monospace, then SFMono-Regular, Menlo, Consolas and Liberation Mono (Chromium and Firefox don't resolve `ui-monospace` and would fall back to Courier)

**Character:** A native sans, pushed to weight 900 italic for the wordmark
and kept plain everywhere else, paired with a monospace that does the
technical voice: keys, BPM, seeds, stats, every label and every value on a
synth panel. The mono makes the screens read like gear.

Sizes come from the design system's one modular scale (ratio 1.333, floor
0.75rem). The root font size is 100% on phones and tablets, 106.25% from
1024px and 112.5% from 1440px, so every rem value grows with the screen.
Spacing uses the same ratio. The booth sets nearly everything at the
scale's floor (0.75rem); its hierarchy comes from colour, weight, tracking
and position, not size.

### Hierarchy

- **Display** (900 italic, uppercase, clamp(3.5rem, min(16vw, 18vh), 6rem)
  stacked, clamp(2.75rem, min(10vw, 16vh), 6rem) on one line below 32rem
  tall, 0.95): the wordmark only, with the violet-to-blue gradient clipped
  to the text. Stacked, RIDDIM sets at 0.62em with 0.06em tracking so it
  spans RIOT's width. RIOT's O is a drawn ring (the level's circle), the
  letter kept in the text at zero size.
- **Headline** (700, 2.3686rem, 1.2): overlay headings (paused, run over,
  victory). The level card's heading runs 1.6× larger with a violet glow.
- **Title** (700, 1.333rem): the primary button, score, combo and the
  landing lead (400 there).
- **Body** (400, 1rem, 1.5): running text. Card copy and booth notices drop
  to 0.75rem. The lead is capped at 30em and balanced. The preset display's
  weapon name is body sans in bold Hype Amber: a name, not data.
- **Label** (mono 700, 0.75rem, 0.2em tracking, uppercase): panel names on
  the floor. Stat labels and badges use 0.08em tracking; the level card
  meta uses 0.12em.
- **Rack label** (mono 700, 0.75rem, 0.16em tracking, uppercase): booth
  section names, latch-group names, rack tabs and the meter's OUT. The
  playground's own title in the preset bar opens wider, at 0.24em in Haze
  White.
- **Data** (mono 400, 0.75rem): meta lines, seeds, status messages, stat
  numbers (at 1.7769rem bold), key caps, latch captions (bold, uppercase).
- **Readout** (mono 400, 0.75rem, 1.2, tabular): knob values, curve-screen
  captions and axes, meter scale, riff note names. Knob names above their
  readout are mono uppercase at 78% Haze White.

### Named Rules

**The Gear Voice Rule.** Anything technical (a key, a BPM, a seed, a
count, a key binding, a parameter and its value) is set in mono. Prose is
never set in mono.

**The Tabular Numbers Rule.** Live numbers (score, combo, stats, knob
readouts, curve captions, meter scale) use `font-variant-numeric:
tabular-nums` so they don't jitter as they change.

## Layout

On a wide landscape screen (`min-width: 720px` and landscape) the landing
page sets its hero down a left column (up to 34rem) and leaves the right
open, where the backdrop camera puts the level's circle. A shade darkens
the level only behind the text. Under the hero, one glass briefing (capped
at 62rem) holds the loadout and the controls side by side. Narrower or
upright, everything stacks centred and the page scrolls. The level card is
a single centred stack with `gap: s`.

The game HUD sits in fixed clusters around the edges of the stage, leaving
the middle clear. Touch controls own the bottom corners and centre. Every
fixed edge element adds `env(safe-area-inset-*)` to its offset, and
full-height pages use `100dvh` (with a `100vh` fallback).

The booth is a workbench capped at 110rem with `base` padding and gaps. The
preset bar runs across the top in two thin wrapping lines: title, preset
and file actions, then the pins, key, section, drums and the output meter
pushed to the end. Under it, from 1100px, the rack takes the left column
and a 20-26rem right column holds the firing range above the output strip
(`gap: s`). Narrower, they stack with the firing range first, because
firing the weapon is what the page is for. A rack is rows of sections in
one frame, side by side from 900px, each section's column weighted by its
knob count (three for one with a curve) at `minmax(min-content, n fr)`, so
a row is as wide as its controls need and never a row of equal cards.
Inside a section the order is fixed: name and latches, curve screen, then
knobs, the weapon's knobs last behind a dashed amber rule. Spacing inside
the booth is tight: `xs` within sections, 0.25rem between knobs, 2px
between latches in a group.

Breakpoints: 768px (tablet), 1024px (tablet landscape) and 1440px
(desktop) change only the root font size. Layout changes key off
`(pointer: coarse)` (bigger slots and dash, swapped controls list),
`(max-height: 500px)` (tighter overlay panels on landscape phones) and the
booth's own widths (700px, 900px, 1100px). Phones play the game landscape
only.

## Elevation & Depth

Depth is optical rather than cast. On the floor a panel sits above the
game because it is a darker, blurred sheet of glass, not because it throws
a shadow. Glass is layered by opacity: the landing shade, cards at 75%, the
HUD at 70-72%, and the pause backdrop at 70% with a 4px blur. The one
opaque surface over the game is the overlay panel, which carries the only
true drop shadow.

The booth is flat and opaque, and its depth is tonal and inward: the page
is Floor Black, panels are Console Grey slabs with a 9% Haze White
hairline, and what's set into them (screens, wells, latches, knob faces,
readouts) drops back to Floor Black, as a recess. Sections in a row are
split by 1px Floor Black dividers rather than gaps. The one shadow in the
booth is the modal shadow on the rolls dropdown, which floats over the
panel.

Glow is the other depth cue on both: a lit element floats.

### Shadow Vocabulary

- **Modal** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6)`): the overlay
  panel (pause, run over, victory) and the booth's rolls dropdown.
- **State halo** (`box-shadow: 0 0 14px color-mix(in srgb, <accent> 50-55%, transparent)`):
  the active weapon slot (Strobe Blue) and the ready dash button (Hype
  Amber).
- **Armed dot** (`box-shadow: 0 0 8px color-mix(in srgb, #fbbf24 55%, transparent)`):
  the 0.5rem amber dot on the rack tab of the engine being auditioned.
- **Readout glow** (`text-shadow: 0 0 8px currentColor` / `filter: drop-shadow(0 0 4px currentColor)`):
  the combo, and full hearts.
- **Wordmark glow** (`drop-shadow(0 0 18px rgb(167 139 250 / 0.55))`): the
  title, steady. Its motion is the O's ring filling on the beat.

### Named Rules

**The Glass Not Paper Rule.** Panels over the game are translucent and
blurred, never opaque cards with drop shadows. The only opaque surface
over play is the overlay panel, which freezes it. (The booth is not over
the game; its opaque slabs hold the game in a window instead.)

**The Recess Rule.** In the booth, a panel is lighter than the page and
everything you read or touch inside it is darker than the panel. Nothing
in the booth is raised above its slab except the dropdown.

## Shapes

Gently rounded and consistent. On the floor, panels, cards, slots and stat
tiles share an 8px radius; fields, quiet buttons and small chrome use 4px.
Anything you press there as a single action is a full pill or a circle:
the primary button, the bag button, the dash button, icon buttons, badges
and the boss bar.

The booth is square-cornered by comparison: every slab, row, screen,
latch, readout and tab uses 4px, and the only round things are the knobs,
the curve handles and the armed dot. Actions on the panel are small square
latches; the booth's one pill is the primary "Start audio" button on the
85% Floor Black overlay that comes before the panel, since audio can only
start from a click.

Small data marks stay nearly square (magazine cells and meter segments
1px, song segments 2px), so they read as meters rather than buttons.
Borders are 1px hairlines on surfaces and 2px on stateful controls (slot,
dash, menu card, focus ring). Dashed lines mean "not the real value": a
curve's dimmed range edges, the design's range band, the weapon's marker
line and the rule fencing off the weapon's knobs.

## Components

### Buttons

Confident, round and tactile.

- **Shape:** full pill (9999px); minimum height `max(target, 2.5em)`.
- **Primary:** Strobe Blue fill, Strobe Ink text, title type,
  `xs × l` padding. One per screen.
- **Hover / Focus:** fill shifts to Strobe Blue Bright; focus is a 2px
  Strobe Blue Bright outline offset by 2px. Disabled drops to 50% opacity
  with a not-allowed cursor.
- **Secondary:** the same pill, transparent with a 25% Haze White ring that
  turns Strobe Blue on hover.
- **Quiet:** a compact outlined button for dense UI on the floor (the
  loadout's placing buttons, segmented controls, run standing actions).
  Transparent with a 1px Console Edge border, 4px radius, 0.75rem medium
  text, Console Grey on hover. With `aria-pressed="true"` it fills Strobe
  Blue.
- **Icon button:** a circle at the minimum target size with a 1px 25% Haze
  White ring. It holds just an icon and is named by `aria-label`.

### Cards / Containers

- **Corner Style:** 8px.
- **Background:** Floor Black at 75% (cards) or 70% (HUD panels), with an 8px
  or 6px backdrop blur.
- **Shadow Strategy:** none. See The Glass Not Paper Rule.
- **Border:** 1px Haze White at 12%.
- **Internal Padding:** `base` for cards, `xxs × s` for HUD panels. The card
  heading is a UV Violet mono label; card copy is 0.75rem Smoke Grey.

### Toggle

- **Style:** a 2.25em × 1.25em pill switch beside its label (0.75rem): Console
  Grey with a Smoke Grey knob and a 60% Smoke Grey rim when off, Strobe Blue
  with a Strobe Ink knob when on. The knob slides over 150ms.
- **Semantics:** a real checkbox with `role="switch"` under it. Space and
  Enter both flip it; Enter never reaches a page-level shortcut.

### Inputs / Fields

- **Style:** Console Grey fill, 1px Console Edge border (Alarm Coral when
  invalid), 4px radius, mono 0.75rem, at least the minimum target height.
- **Focus:** 2px Strobe Blue Bright outline.

### Weapon Slot (signature)

A HUD button for each weapon: key cap, engine icon, rate and badges, with
the magazine as a row of cells underneath. Glass at 72% with a 2px border:
Strobe Blue with a blue halo when active, 15% Haze White otherwise (Smoke
Grey text). Pressing scales it to 0.96 over 80ms. On touch screens it grows
to 7.5em × 3.6em.

### Magazine and Song Track (signature)

Meters made of flat segments. Magazine cells are Strobe Blue when loaded
and Smoke Grey at 25% when empty. Song segments are as wide as their bars,
filled left to right with a hard stop: Strobe Blue for normal sections, UV
Violet for drops. The boss bar under the track is a 10px Alarm Coral pill
outline with a 15% coral fill.

### Weapon List and Weapon Tag

On the start page each weapon is its engine icon at title size in Strobe
Blue, then its key cap and generated name in bold, then what it does in
plain words in Smoke Grey. Inline, a weapon tag is icon, engine and rate
(plus optional blast and FX icons) in bold Strobe Blue with 0.3em gaps.
Icons are `currentColor` SVGs sized at 1em.

### Stat Tile and Badge

End-of-run stats are tiles: a 1px Console Edge border and 8px radius,
holding a large bold mono number with a small uppercase Smoke Grey label
above it. A new best is a Hype Amber pill badge with Floor Black mono caps.

### Loadout Menu (sequencer rack)

A dialog sheet over the frozen level, which keeps playing its bar under a
low-pass: the overlay panel's opaque floor black at 62rem, never taller
than the screen, with the one primary pill always on screen. Below a
hairline, the rack (Equipped, then the side-by-side comparison) and the bag
scroll as two columns, stacking under 720px. Equipped slots are one-line
tracks with UV Violet insert chips and a 16-cell step grid (Strobe Blue
fires, 40% blue echo, Console Edge rest, a Haze White playhead hidden under
reduced flashing). The comparison ends each side in a verdict tag:
Stronger (Hype Amber fill), Trade-off (outlined Haze White) or Weaker (grey
outline). Bag cards are Booth Black with the slot's 15% hairline; picked is
a Strobe Blue border and halo, a target slot a dashed 60% blue edge, marked
for discard 45% opacity and struck through, new a Hype Amber dot.

### Dash Button

A 4.5em circle (5.5em on touch) of 72% glass, fixed bottom right. Its
border and halo are Hype Amber when ready and Console Edge while a
cooldown fill sweeps it.

### Arc Knob (booth signature)

The booth's continuous control. A 44px dial: a 270° track (7:30 round to
4:30) in Console Edge, 4px wide with round caps, with the value's arc
over it in the knob's tone (Strobe Blue for a design value, Hype Amber for
the weapon's own); a 12px Floor Black face with a 10% Haze White rim and a
2px Haze White pointer. While the value differs from its reference (the
saved design value, or the weapon's roll), a 2px Smoke Grey tick marks the
reference on the ring. Under the dial: the name (mono uppercase 0.75rem,
78% Haze White, ellipsis at 4.25rem) and a readout chip (4rem, Floor Black,
mono tabular), which turns Strobe Blue Bright when a design value has
moved and Hype Amber when the weapon is overridden. Drag vertically (160px
per sweep, Shift five times finer), arrow and Page keys, Home/End,
double-click or Delete to reset, click the readout to type. Frequencies
turn on a log scale. Focus is the 2px Strobe Blue Bright outline.

### Latch (booth signature)

The booth's push-button: a small square key, at least 2.25rem × 1.75rem,
Floor Black with a 1px Console Edge outline, 4px radius, mono bold
uppercase 0.75rem. Hover lifts the outline to Smoke Grey. Pressed
(`aria-pressed`), it fills in its tone with no outline: Strobe Blue with
Strobe Ink text, or Hype Amber with dark text for the weapon. The one
action that matters most on a strip (Save to game) is filled Strobe Blue,
not made bigger, and hovers to Strobe Blue Bright. Disabled drops to 40%.
A **latch group** sets a UV Violet rack label before a run of latches 2px
apart, exactly one pressed: pick one of a few (pins, section, drums, fire
mode, filter slope, octave).

### Panel Row and Section

A rack's row is one Console Grey frame (4px radius, 9% Haze White
hairline) holding its sections side by side, split by 1px Floor Black
dividers. A section is a well with `xs` padding: a header line with its
rack label and right-aligned Play and Reset latches (Reset disabled until a
value in it has moved), then its curve screen if it has one, then its
knobs. The weapon's own knobs follow the design's behind a 1px dashed
45% amber rule. The output strip and range deck are the same frame.

### Curve Screen (booth signature)

A section's dark display, drawn as SVG for its measured width (104px tall
by default). Floor Black with a 1px Console Edge frame and 4px radius. A
caption strip across the top holds the readout (mono tabular, 80% Haze
White, right-aligned) so it never covers the plot. Inside: a 7% Haze White
grid, 45% Haze White mono axis labels in an 18px gutter, the curve as a 2px
Strobe Blue trace over a 16% blue fill, the design's range as a 22% blue
band with a dashed 55% edge, range limits as dashed 45% traces, and the
weapon's value as a dashed amber line. **Handles** are 5.5px dots with a
Floor Black fill and a 2.5px ring in their tone, filling solid on hover,
caught within a 12px invisible grip, grab/grabbing cursors, double-click
to reset. Every handle doubles a knob, which is where the keyboard reaches
it. The filter screen is the model: band edges edit the design, the amber
handle overrides the weapon.

### Rack Strip

Folder tabs for the instruments: rack-label type in Smoke Grey on nothing,
2.25rem tall with `base` side padding, over a 1px Console Edge rule. The
selected tab joins the panel below: Console Grey fill, Console Edge border
on three sides, Haze White text. The armed engine's tab carries the amber
armed dot. Arrow keys move between tabs.

### Preset Bar and Display

The booth's top strip, a Console Grey slab in two thin wrapping lines. The
preset display is a Floor Black screen at least 20rem wide: the weapon's
name in bold Hype Amber, then its seed and gain in Smoke Grey mono
tabular, stepped by previous/next latches holding SVG chevrons. The unsaved
count reads in Strobe Blue Bright mono while anything differs from what's
saved, Smoke Grey otherwise.

### Output Meter

A row of 24 flat segments, 2 dB each from -48 to 0, 2px apart, 0.625rem
tall, 1px radius, after a UV Violet OUT label and over a Smoke Grey mono
scale (-48, -24, -12, -6, 0). Unlit segments are Floor Black; lit are
Strobe Blue, the top 6 dB Strobe Blue Bright, the last segment Alarm
Coral. The peak segment holds for 1.2s. It redraws per animation frame
straight onto the segments, never through React.

### Riff Steps

The weapon's riff on a bar of 16 steps, 3px apart: Floor Black cells
(downbeats framed in Console Edge), each holding its note name in mono and
a pitch bar in Hype Amber over a Console Grey trough; steps without a shot
drop to 30% text. The sounding step lights to a 28% amber mix over 60ms.

### Firing Range

The game's own stage mounted in a Floor Black window at 15:11 with a
Console Edge frame, crosshair cursor, under a rack label and above the
fire latch group. A help strip of key bindings sits on its bottom edge in
mono over 72% Floor Black.

## Do's and Don'ts

### Do:

- **Do** build every in-game panel as glass: Floor Black at 70-75%, a 1px Haze White hairline at 12%, a 6-8px backdrop blur.
- **Do** build booth tools as opaque Console Grey slabs with Floor Black screens, wells and latches set into them, framed rows split by 1px Floor Black dividers.
- **Do** spend glow only on state (active, ready, armed, reward), with the 14px halo, the 8px dot halo or a `currentColor` drop-shadow.
- **Do** keep each accent to its one job: Strobe Blue yours/ready, UV Violet labels/drops, Hype Amber reward, Alarm Coral health/danger.
- **Do** colour every booth control by what it edits: Strobe Blue for the sound design and page state, Hype Amber for the auditioned weapon's roll and overrides.
- **Do** mark a moved value against its reference: the Smoke Grey tick on the knob ring, a Strobe Blue Bright readout, and a Reset that only enables once something moved.
- **Do** name panels and sections with a mono uppercase UV Violet label (0.75rem; 0.2em tracking on the floor, 0.16em in the booth).
- **Do** set keys, numbers, seeds, BPM and parameter values in mono, with tabular numbers for anything live.
- **Do** draw what a value does (a curve screen with draggable handles) where a slider list would hide it, and give every handle a knob for the keyboard.
- **Do** time looping motion to the tempo (a beat at 140 BPM is ~0.43s).
- **Do** stop every looping or popping animation under `:root[data-flashing='reduced']`, and keep new canvas flashes and shake inside the stage's `calmFrame`.
- **Do** add `env(safe-area-inset-*)` to fixed edge controls, and give touch targets at least the design system's minimum target (44px on touch).

### Don't:

- **Don't** introduce light surfaces or light-mode variants; the color mode is forced dark.
- **Don't** use glitch text, scanlines, RGB-split type or magenta/cyan hacker styling.
- **Don't** let a screen read like a SaaS app: no opaque white-ish cards, no stock dashboard chrome, no settings-form stack of slider lists, no more than one primary pill per screen.
- **Don't** put opaque, shadowed cards over the live game; only the pause/end overlay is opaque.
- **Don't** colour a design control amber or a weapon-only control blue.
- **Don't** put a kicker or eyebrow label above a heading; the heading speaks for itself.
- **Don't** add a second loud moment to a screen that already has the wordmark, a level heading or the combo.
- **Don't** lay out a page as a row of equal cards; group by meaning on one surface instead.
- **Don't** re-render React per frame for a meter or playhead; draw onto the elements from an animation frame.
- **Don't** hard-code a color or size outside the theme; use `theme.color()`, `theme.spacing()` and `theme.fontSize()` so the scale and modes stay one source.
