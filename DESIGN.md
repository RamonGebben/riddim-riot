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
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: '0.2em'
  data:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
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

<!-- impeccable:design-map -->

Name: Bass Weapons
Colors: primary: strobe-blue #60a5fa; secondary: uv-violet #a78bfa; tertiary: hype-amber #fbbf24; neutral: floor-black #111111; primary: strobe-blue-bright #93c5fd; primary: strobe-ink #0b1220 (+6 more in the sidecar)
Fonts: system-ui (display, headline, title, body); ui-monospace (label, data)
Spacing: xxs 0.4222rem, xs 0.5628rem, s 0.7502rem, base 1rem, m 1.333rem, l 1.7769rem, xl 2.3686rem
Radius: s 4px, base 8px, full 9999px
North Star: "The Club Under Glass"
Rules:

- The Glow Is State Rule. A colored halo (`0 0 14px` at 50-55% of the
- The One Job Per Light Rule. Each accent keeps its meaning across every
- The Dark Floor Rule. Every surface is dark.
- The Gear Voice Rule. Anything technical (a key, a BPM, a seed, a
- The Tabular Numbers Rule. Live numbers (score, combo, stats) use
- The Glass Not Paper Rule. Panels over the game are translucent and
  Elevation:
- Modal: 0 8px 24px rgba(0, 0, 0, 0.6)
- State halo: 0 0 14px color-mix(in srgb, <accent> 50-55%, transparent)
- Readout glow: text-shadow: 0 0 8px currentColor
- Wordmark breath: drop-shadow(0 0 18px rgb(167 139 250 / 0.55))
  Don't:
- Don't introduce light surfaces or light-mode variants; the color mode is forced dark.
- Don't use glitch text, scanlines, RGB-split type or magenta/cyan hacker styling.
- Don't let a screen read like a SaaS app: no opaque white-ish cards, no stock dashboard chrome, no more than one primary pill per screen.
- Don't put opaque, shadowed cards over the live game; only the pause/end overlay is opaque.
- Don't put a kicker or eyebrow label above a heading; the heading speaks for itself.
- Don't add a second loud moment to a screen that already has the wordmark, a level heading or the combo.
- Don't lay out a page as a row of equal cards; group by meaning on one surface instead.
- Don't hard-code a color or size outside the theme; use `theme.color()`, `theme.spacing()` and `theme.fontSize()` so the scale and modes stay one source.
  Do:
- Do build every in-game panel as glass: Floor Black at 70-75%, a 1px Haze White hairline at 12%, a 6-8px backdrop blur.
- Do spend glow only on state (active, ready, reward), with the 14px halo or a `currentColor` drop-shadow.
- (+6 more)
  Full: .impeccable/design-full.md (read a section when you need its detail)
