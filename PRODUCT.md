# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Strangers who find the game through a link and play it in the browser,
with no install, on a desktop with mouse and keyboard or on a phone in
landscape. Two groups count equally: bass music fans (dubstep, riddim) who
come for the sound and may not play many games, and roguelite players
(Hades, Enter the Gungeon) for whom the music is a twist on a genre they
know. Firefox is a primary browser on every device, and phones are a
first-class way to play.

## Product Purpose

Riddim Riot is a top-down, twin-stick rhythm shooter. Every weapon is a
dubstep bass synth and every shot is quantized to the beat, so the player's
fighting writes the track. A run is five levels; each level is an arena and
a procedurally generated song (intro, breakdown, build-up, drops, bridge,
outro) that ends in a boss. Success means a visitor starts a run, finishes
it (or dies), and wants another.

## Positioning

Your build is the song. Weapons are rolled from parts where each part sets
a gameplay stat and a synth parameter together, so a loadout is literally
an instrument rack, and input is quantized so even sloppy presses sound
tight. Everything (sound, simulation, visuals) runs off one musical clock,
so the visuals lock to the kick instead of approximating it.

## Operating Context

- Played from a link in a browser tab; audio can only start from a click,
  so the start screen's "Press to start" is the doorway into everything.
- On phones: landscape only, touch stick on the left half, fire on the
  right half; Android goes fullscreen, iPhone players stuck upright are
  told to open the game in a browser.
- Sessions are a run of about five songs (~4 minutes each); pausing
  happens on tab switch, rotation or Esc.
- A sound playground (`/playground.html`) is a developer tool for tuning
  the sound by ear, not a player-facing surface.

## Capabilities and Constraints

- Screens (start, level card, HUD, pause, end-of-run, victory) are React;
  the game itself is PixiJS with a fullscreen shader. React never runs per
  frame.
- Forced dark theme, via `@pindakaasman/design-system` and styled-components.
- Must work in Chromium, Firefox and WebKit, desktop and mobile.
- Visuals are part of the game's feel: shader pulses, screen shake and
  palette flashes driven by the music; each level has a seeded 4-6 colour
  palette.
- Open: meta-progression (Hades-style unlocks), shops or chests, gamepad,
  save data, BPM other than 140.

## Brand Commitments

- Name: **Riddim Riot**.
- Pillars from the design brief: your build is the song; forgiving, always
  on-beat; never the same twice; feels like a rave.
- Weapon names are generated from manufacturer + engine + rate + FX (e.g.
  "Vandal Wobble 1/8 Echo", "Lumen Laser 1/16").

## Evidence on Hand

- The playable game itself, deployed on Vercel, and the landing page that
  plays over a live level.
- Measured performance and timing results in `docs/architecture.md`.
- No testimonials, player counts, press or reviews exist; do not invent
  any.

## Product Principles

1. The music is the mechanic: anything that breaks the beat (UI that
   blocks the groove, timing that drifts) is a bug, not a style choice.
2. Get a stranger from a link to firing on the beat in as few steps as
   possible.
3. Forgiving to play, deep to master: quantized input, readable threats,
   and rolls worth chasing.
4. Every device is a real target: a phone in Firefox gets the same game,
   not a degraded one.

## Accessibility & Inclusion

Photosensitivity is a firm requirement: the game must offer a
reduced-flash / reduced-motion option and respect `prefers-reduced-motion`
in both the React screens and the shader effects (flashes, shake,
chromatic pulses). Being playable with the sound off was considered and is
not a commitment yet.
