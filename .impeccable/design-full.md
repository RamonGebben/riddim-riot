---
name: Bass Weapons
description: A twin-stick rhythm roguelite where every gun is a bass synth; screens are smoked glass over a live dancefloor.
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
    fontFamily: 'ui-monospace, monospace'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.2em'
  data:
    fontFamily: 'ui-monospace, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.5
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
---

# Design System: Bass Weapons

## Overview

**Creative North Star: "The Club Under Glass"**

The game is the dancefloor: a PixiJS arena whose shader pulses, shakes and
changes palette with the music. Every React screen is a pane of smoked
glass laid over that floor and lit by it. Panels are translucent floor
black with a faint white hairline and a backdrop blur, so the level keeps
moving through them. Even the landing page plays a live level behind its
copy, with a silent demo of shots landing on the kick.

The chrome recedes and the game leads. Color and glow are not decoration.
They mark state: the slot you're holding, a magazine that's loaded, a
combo, dash being ready, a heart you just got back. The one deliberate
performance is the wordmark: heavy italic caps in a violet-to-blue
gradient whose glow breathes on two beats at 140 BPM. Density runs high in
the HUD (small mono readouts, segment bars, key caps) and loose on the
landing and level cards, where a single headline holds the screen.

The system rejects two neighbours. It is not generic SaaS, so no bland
blue-pill-on-white app feel, even though it starts from a stock token set.
And it is not cyberpunk cliché: no glitch text, scanlines or magenta/cyan
hacker styling. It is dark only; light surfaces never appear.

**Key Characteristics:**

- Smoked glass panels (70-75% floor black, 12% white hairline, 6-8px blur) over the live game
- Glow means state: an active, ready or rewarded element gets a soft colored halo; resting elements get none
- Mono uppercase, widely tracked labels in UV Violet name each panel
- One loud moment per screen: the wordmark, a level heading or the combo
- Motion keyed to the tempo, and switched off when flashing is reduced

## Colors

Near-black club neutrals with four lights, each with one job: Strobe Blue
for "yours and ready", UV Violet for labels and drops, Hype Amber for
reward, Alarm Coral for health and danger.

### Primary

- **Strobe Blue** (#60a5fa): the player's own things and the main action.
  The "Drop in" button, the active weapon slot's border and halo,
  loaded magazine cells, weapon tags, control key names, the Take button's
  border, and the played part of a normal song segment.
- **Strobe Blue Bright** (#93c5fd): the hover state of Strobe Blue, and the
  focus ring on every interactive element.
- **Strobe Ink** (#0b1220): text on a Strobe Blue fill.

### Secondary

- **UV Violet** (#a78bfa): the small labels that name a panel ("Your
  loadout", "How to play"), drop segments on the song track, the level card heading's
  glow, and the start of the wordmark gradient.

### Tertiary

- **Hype Amber** (#fbbf24): reward and readiness. The combo multiplier,
  the dash button when ready, bonus hearts, and the new-best badge.
- **Alarm Coral** (#ff6369): health and danger. Hearts, the boss health
  bar, and error text.

### Neutral

- **Floor Black** (#111111): the page background, and the base of every
  glass panel at 70-75% opacity.
- **Booth Black** (#1c1c1c): the raised background step.
- **Console Grey** (#1f1f1f): form fields and the quiet-button hover.
- **Console Edge** (#2e2e2e): field and stat-tile borders, empty hearts, and
  the dash button while recharging.
- **Haze White** (#ededed): primary text, and the source of the glass
  hairline (12-25% mixed into transparent).
- **Smoke Grey** (#9ca3af): secondary text, meta lines, inactive slots, the
  level badge, and empty magazine cells at 25%.

### Named Rules

**The Glow Is State Rule.** A colored halo (`0 0 14px` at 50-55% of the
color) or a `currentColor` drop-shadow appears only on an element that is
active, ready or rewarded. A resting element never glows.

**The One Job Per Light Rule.** Each accent keeps its meaning across every
screen: blue is yours and ready, violet names things and marks drops,
amber is reward, coral is health and danger. Don't borrow an accent for
decoration.

**The Dark Floor Rule.** Every surface is dark. The theme's light mode
tokens exist but are never shown (the color mode is forced to dark), so
never design for them.

## Typography

**Display Font:** system-ui (with sans-serif)
**Body Font:** system-ui (with sans-serif)
**Label/Mono Font:** ui-monospace (with monospace)

**Character:** A native sans, pushed to weight 900 italic for the wordmark
and kept plain everywhere else, paired with a monospace that does the
technical voice: keys, BPM, seeds, stats and every label. The mono makes
the screens read like gear.

Sizes come from the design system's one modular scale (ratio 1.333). The
root font size is 100% on phones and tablets, 106.25% from 1024px and
112.5% from 1440px, so every rem value above grows with the screen.
Spacing uses the same ratio.

### Hierarchy

- **Display** (900 italic, uppercase, clamp(2.75rem, min(10vw, 16vh), 6rem),
  0.95, balanced): the wordmark only, with the violet-to-blue gradient
  clipped to the text. Sized by the short side too, so a landscape phone
  keeps the button in view.
- **Headline** (700, 2.3686rem, 1.2): overlay headings (paused, run over,
  victory). The level card's heading runs 1.6× larger with a violet glow.
- **Title** (700, 1.333rem): the primary button, score, combo and the
  landing lead (400 there).
- **Body** (400, 1rem, 1.5): running text. Card copy drops to 0.75rem in
  Smoke Grey. The lead is capped at 30em and balanced.
- **Label** (mono 700, 0.75rem, 0.2em tracking, uppercase): panel names. Stat labels and badges use 0.08em tracking. The level
  card meta uses 0.12em.
- **Data** (mono 400, 0.75rem): meta lines, seeds, status messages, stat
  numbers (at 1.7769rem bold), key caps.

### Named Rules

**The Gear Voice Rule.** Anything technical (a key, a BPM, a seed, a
count, a key binding) is set in mono. Prose is never set in mono.

**The Tabular Numbers Rule.** Live numbers (score, combo, stats) use
`font-variant-numeric: tabular-nums` so they don't jitter as they change.

## Layout

On a wide landscape screen (`min-width: 720px` and landscape) the landing
page sets its hero down a left column (up to 34rem) and leaves the right
open, where the backdrop camera puts the level's circle. A shade darkens
the level only behind the text: a gradient from the left and a band along
the bottom. Under the hero, one glass briefing (capped at 62rem) holds the
loadout and the controls side by side. Narrower or upright, everything
stacks centred, the shade becomes a pool behind the hero, and the page
scrolls. The level card is a single centred stack with `gap: s`.

The game HUD sits in fixed clusters around the edges of the stage, leaving
the middle clear. Touch controls own the bottom corners and centre: dash
in the bottom right, Take in the bottom centre, the stick under the left
thumb. Every fixed edge element adds `env(safe-area-inset-*)` to its
offset, and full-height pages use `100dvh` (with a `100vh` fallback).

Breakpoints: 768px (tablet), 1024px (tablet landscape) and 1440px
(desktop) change only the root font size. Layout changes key off
`(pointer: coarse)`, which gives bigger slots and dash, swaps the controls
list and shows the Take button, and off `(max-height: 500px)`, which
tightens overlay panels on landscape phones. Phones are played landscape
only.

## Elevation & Depth

Depth is optical rather than cast. A panel sits above the game because it
is a darker, blurred sheet of glass, not because it throws a shadow. Glass
is layered by opacity: the landing shade (a radial darkening behind the
text), cards at 75%, the HUD at 70-72%, and the pause backdrop at 70% with
a 4px blur. The one opaque surface is the overlay panel, which carries the
only true drop shadow. Glow is the other depth cue: a lit element floats.

### Shadow Vocabulary

- **Modal** (`box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6)`): the overlay panel
  only (pause, run over, victory).
- **State halo** (`box-shadow: 0 0 14px color-mix(in srgb, <accent> 50-55%, transparent)`):
  the active weapon slot (Strobe Blue) and the ready dash button (Hype Amber).
- **Readout glow** (`text-shadow: 0 0 8px currentColor` / `filter: drop-shadow(0 0 4px currentColor)`):
  the combo, and full hearts.
- **Wordmark breath** (`drop-shadow(0 0 18px rgb(167 139 250 / 0.55))` to
  `drop-shadow(0 0 34px rgb(96 165 250 / 0.9))`): the title, on two beats.

### Named Rules

**The Glass Not Paper Rule.** Panels over the game are translucent and
blurred, never opaque cards with drop shadows. The only opaque surface is
the overlay panel, which freezes play.

## Shapes

Gently rounded and consistent. Panels, cards, slots and stat tiles share
an 8px radius. Fields, quiet buttons and small chrome use 4px. Anything you
press as a single action is a full pill or a circle: the primary button,
the Take button, the dash button, icon buttons, badges and the boss bar.
Small data marks stay nearly square (magazine cells 1px, song segments
2px), so they read as meters rather than buttons. Borders are 1px
hairlines on surfaces and 2px on stateful controls (slot, dash, Take,
focus ring).

## Components

### Buttons

Confident, round and tactile.

- **Shape:** full pill (9999px); minimum height `max(target, 2.5em)`.
- **Primary:** Strobe Blue fill, Strobe Ink text, title type,
  `xs × l` padding. One per screen.
- **Hover / Focus:** fill shifts to Strobe Blue Bright; focus is a 2px
  Strobe Blue Bright outline offset by 2px. Disabled drops to 50% opacity
  with a not-allowed cursor.
- **Quiet:** a compact outlined button for dense UI (playground
  toggles). Transparent with a 1px Console Edge border, 4px radius, 0.75rem
  medium text, Console Grey on hover. With `aria-pressed="true"` it fills
  Strobe Blue.
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
  Grey with a Smoke Grey knob and a 60% Smoke Grey rim when off, Strobe Blue with a Strobe Ink knob
  when on. The knob slides over 150ms.
- **Semantics:** a real checkbox with `role="switch"` under it, so it keeps
  focus, keyboard and state. Focus is the standard 2px Strobe Blue Bright
  outline on the track.
- **Keyboard:** Space and Enter both flip it; Enter on it never reaches a
  page-level shortcut.

### Inputs / Fields

- **Style:** Console Grey fill, 1px Console Edge border (Alarm Coral when
  invalid), 4px radius, mono 0.75rem, at least the minimum target height.
- **Focus:** 2px Strobe Blue Bright outline.

### Weapon Slot (signature)

A HUD button for each weapon. It holds its key cap, engine icon, rate and
badges, with the magazine as a row of cells underneath. Glass at 72% with a
2px border: Strobe Blue with a blue halo when active, 15% Haze White
otherwise (Smoke Grey text). Pressing scales it to 0.96 over 80ms. On
touch screens it grows to 7.5em × 3.6em.

### Magazine and Song Track (signature)

Meters made of flat segments. Magazine cells are Strobe Blue when loaded
and Smoke Grey at 25% when empty. Song segments are as wide as their bars,
filled left to right with a hard stop: Strobe Blue for normal sections,
UV Violet for drops. The boss bar under the track is a 10px Alarm Coral
pill outline with a 15% coral fill.

### Weapon List (start page)

Each weapon is its engine icon at title size in Strobe Blue, then its key
cap and generated name in bold, then what it does in plain words in Smoke
Grey ("Slow, heavy hits · every shot echoes"). The names keep the game's
own terms; the plain line explains them.

### Weapon Tag

A weapon named in a line of text: icon, engine and rate, plus optional
blast and FX icons. Bold Strobe Blue, with 0.3em gaps between parts.
Icons are `currentColor` SVGs sized at 1em.

### Stat Tile and Badge

End-of-run stats are tiles: a 1px Console Edge border and 8px radius,
holding a large bold mono number with a small uppercase Smoke Grey label
above it. A new best is a Hype Amber pill badge with Floor Black mono caps.

### Dash Button

A 4.5em circle (5.5em on touch) of 72% glass, fixed bottom right. Its
border and halo are Hype Amber when ready and Console Edge while a
cooldown fill sweeps it.

## Do's and Don'ts

### Do:

- **Do** build every in-game panel as glass: Floor Black at 70-75%, a 1px Haze White hairline at 12%, a 6-8px backdrop blur.
- **Do** spend glow only on state (active, ready, reward), with the 14px halo or a `currentColor` drop-shadow.
- **Do** keep each accent to its one job: Strobe Blue yours/ready, UV Violet labels/drops, Hype Amber reward, Alarm Coral health/danger.
- **Do** name panels with a mono uppercase UV Violet label (0.75rem, 0.2em tracking).
- **Do** set keys, numbers, seeds and BPM in mono, with tabular numbers for anything live.
- **Do** time looping motion to the tempo (a beat at 140 BPM is ~0.43s).
- **Do** stop every looping or popping animation under `:root[data-flashing='reduced']`, and keep new canvas flashes and shake inside the stage's `calmFrame`. The player's Reduce flashing choice (or the system's reduced motion) sets both.
- **Do** add `env(safe-area-inset-*)` to fixed edge controls, and give touch targets at least the design system's minimum target (44px on touch).

### Don't:

- **Don't** introduce light surfaces or light-mode variants; the color mode is forced dark.
- **Don't** use glitch text, scanlines, RGB-split type or magenta/cyan hacker styling.
- **Don't** let a screen read like a SaaS app: no opaque white-ish cards, no stock dashboard chrome, no more than one primary pill per screen.
- **Don't** put opaque, shadowed cards over the live game; only the pause/end overlay is opaque.
- **Don't** put a kicker or eyebrow label above a heading; the heading speaks for itself.
- **Don't** add a second loud moment to a screen that already has the wordmark, a level heading or the combo.
- **Don't** lay out a page as a row of equal cards; group by meaning on one surface instead.
- **Don't** hard-code a color or size outside the theme; use `theme.color()`, `theme.spacing()` and `theme.fontSize()` so the scale and modes stay one source.
