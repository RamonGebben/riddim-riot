# Bass Weapons Rhythm Roguelite — PoC Design Doc

Nov 18, 2026 · @Ramon Gebben

## Pitch

A top-down, twin-stick roguelite in the browser where every weapon is a dubstep bass synth: you fire on the beat over a procedural drum line, so your fighting writes the track. The PoC proves one thing: firing a quantized wobble gun over a drum loop, with visuals pulsing on every hit, feels like a rave.

Pillars:

- **Your build is the song.** Every weapon is a synth voice; every loadout sounds different.
- **Forgiving, always on-beat.** Input is quantized to the grid, so slightly early or late presses still sound tight.
- **Never the same twice.** Levels, weapons and music are generated from a seed, Spelunky-style.
- **Feels like a rave.** Big shader visuals, screen shake, palette flashes, all driven by the music clock.

## Full game vision

The full game is a run-based roguelite with Hades-style unlocks between runs; the PoC builds only a slice of it (next section).

| Area             | Decision                                                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure        | Roguelite runs through procedurally generated levels, Spelunky-style: a room grid with a guaranteed path from start to exit                                                       |
| Camera           | Continuous scrolling camera that follows the player, not single-screen rooms                                                                                                      |
| Controls         | Twin-stick: WASD or left stick to move, mouse or right stick to aim                                                                                                               |
| Timing           | Shots always fire quantized to the beat grid; slightly-off input is fine                                                                                                          |
| Level = song     | The level seed sets layout, key, scale, BPM, drum style and palette. Main-path rooms map to song sections (intro, build, drop, break); side rooms hold loot or breakdowns         |
| Harmony          | Key and scale are tied to the level; weapons transpose into it automatically                                                                                                      |
| Music            | Procedural drums and chords, generated in code. Combat intensity drives the arrangement: a quiet room is filtered, piling enemies build a riser, a cleared wave triggers the drop |
| Enemies          | Move on the beat, spawn on bar or phrase boundaries, and each kill triggers a sound (impact, crash, riser)                                                                        |
| Weapons          | 3–4 slots. Generated Borderlands-style from parts; each part rolls a gameplay stat and a synth parameter together                                                                 |
| Switching        | The old weapon's tail fades out while the next one triggers, so layers overlap. May become a hard cut later                                                                       |
| Getting hit      | Filter duck on the music bus to start with                                                                                                                                        |
| Loot             | A mix of enemy drops, chests and shop rooms                                                                                                                                       |
| Meta-progression | Hades-style: unlock new manufacturers and parts into the loot pool between runs                                                                                                   |

Weapon parts, each mapping gameplay to sound:

| Part         | Gameplay                  | Sound                                                                       |
| ------------ | ------------------------- | --------------------------------------------------------------------------- |
| Manufacturer | Stat profile and handling | Synth engine: FM, wavetable or subtractive                                  |
| Oscillator   | Base weapon type          | Timbre: wobble, reese, laser, growl, 808 sub                                |
| LFO          | Fire rhythm               | Rate in beat divisions: 1/4, 1/8, triplet, dotted                           |
| Filter       | Range and spread          | Cutoff, resonance, envelope                                                 |
| FX slot      | Element-like modifier     | Bitcrush = piercing, delay = echo shots, distortion = damage, reverb = area |
| Rarity       | Stat budget               | Legendaries get handcrafted signature sounds                                |

## PoC scope

The PoC is one generated level with one enemy type and two or three rolled weapons. It answers "is firing bass on the beat fun?", not "is the roguelite deep?".

In:

- One procedurally generated level from a seed: small room grid, guaranteed path, scrolling camera
- Level seed sets key, scale and BPM (start fixed at 140 BPM halftime)
- Procedural drum loop plus a simple chord or root drone in the level's key
- Weapon generator rolling from a small parts pool: 2 oscillator types (wobble, laser), 3 LFO rates, 1–2 FX
- 3 weapon slots with fade-out-and-layer switching
- Quantized firing to 1/8 or 1/16 notes; cooldowns in beats
- One enemy type that steps on the beat and spawns on bar lines
- Kill sound and filter duck on hit
- PixiJS rendering with one fullscreen shader pulsing on the kick, screen shake and a palette flash on drops
- Keyboard and mouse only

Out, for later:

- Meta-progression, unlocks, shops, chests, rarity tiers, legendaries
- Multiple levels, biomes, BPM changes, key modulation between levels
- Intensity-driven arrangement beyond a simple on/off filter
- Gamepad, menus beyond a start screen, save data

The PoC is done when:

- [ ] Mashing fire with any rolled weapon still sounds musical
- [ ] Two rerolls of the same slot sound clearly different
- [ ] Switching weapons mid-wobble layers without clicks or mud
- [ ] Visuals visibly lock to the kick with no drift after 5 minutes
- [ ] Holds 60 fps with 30 enemies and 3 layered weapons on a mid-range laptop

## Core systems

Everything hangs off one musical clock; game, audio and visuals all react to its beat events instead of keeping their own time.

### Clock and quantization

- The Tone.js Transport is the only clock. It emits tick events at 1/16 resolution with bar and beat positions.
- A fire press is queued and played on the next grid slot of that weapon's division (1/8 or 1/16).
- Optional later: a small damage bonus when the press lands within about 50 ms of the slot.
- Cooldowns are counted in beats, so a laser that "recharges in 2 beats" stays in time at any BPM.
- Audio is scheduled ahead with the Transport's lookahead; visuals read the same scheduled times, so they never drift.

### Weapons and synth voices

- A weapon is plain data: `{ manufacturer, oscillator, lfo, filter, fx[], stats }`, rolled from a seeded RNG.
- Each part rolls its gameplay stat and its synth parameter together, from a range that is known to sound good.
- One voice per slot, each on its own channel with its own release envelope; switching fades the old tail while the new voice starts.
- Every note snaps to the level's scale. Loudness is normalized per weapon.
- Only one active voice owns the sub frequencies; the others are high-passed so layers don't turn to mud.
- Start with a polyphony cap of 3 weapon voices plus the drum bus.

### Ammo, charge and reload

Limits break up the riff: a magazine is a musical phrase, and the reload is the fill between phrases ("whob whob, click, rumble, whob whob").

- **Magazine = phrase length.** Sized in notes so it empties on a musical boundary, e.g. 8 shots of 1/8 = one bar.
- **Reload = fill.** Its duration is counted in beats (e.g. 2), so you're back in on the downbeat. Its sounds are quantized too: a click on the offbeat, a rumble or riser landing on the next one.
- **Reload sound is a rolled part.** The manufacturer sets its flavour: mechanical click, vinyl scratch, tape rewind, servo whine. It sits in a different frequency range from the main voice so it complements it rather than fighting it.
- **Charge weapons.** Holding builds a riser and opens the filter; releasing fires on the next downbeat, with damage scaling with charge.
- **Overheat** as the limit for held weapons like the wobble: heat builds while held, and venting plays a noise sweep.
- **Active reload, kept forgiving.** Pressing reload on the beat during the fill shortens it and adds an extra hit; missing just means a normal reload.
- **Switching reloads** the weapon you put away: it refills in the background over its reload beats, playing its fill as a quiet layer. This rewards cycling through all 3–4 slots and building compositions instead of camping one gun. To stop swap-spamming for free ammo, a holstered weapon only comes back full once its reload beats have passed.
- **Swap bonus.** If the first shot after a switch lands on the downbeat, it hits harder and gets a visual accent, rewarding well-timed swaps the way a DJ times a transition. A missed downbeat just fires normally.

Reloading is automatic: an empty magazine starts the fill on the next grid slot, so the player never breaks the groove to manage ammo. Active reload still works by pressing during the fill. For the PoC, the hand-tuned wobble gun gets a magazine and a 2-beat auto-reload.

### Music generation

- The level seed picks key, scale and BPM.
- Drums are generated per bar from pattern rules: kick and snare in a halftime layout, plus random hat and fill variation.
- A root drone or simple chord pad in the key gives the weapons something to sit on.
- The music bus has one low-pass filter: ducked on player hit, opened on the drop.

### Level generation

- Spelunky-style: a small grid of rooms (start with 3×3), a random-walk main path from start to exit, side rooms filled in after.
- Each room is picked from a handful of handmade tile templates with random variation.
- The whole level is one continuous tilemap with a scrolling camera.

### Enemies

- One type for the PoC: walks toward the player one tile per beat.
- Waves spawn on bar boundaries.
- A kill schedules an impact sound on the next 1/16 slot.

### Visuals

- PixiJS with a fullscreen filter shader: chromatic aberration and bloom that spike on the kick.
- Screen shake on the kick and on kills; a palette flash on the drop.
- Limited palette (4–6 colours) per level, picked from the seed.
- Sprites squash on the beat, driven by the same tick events.

## Tech stack and architecture

TypeScript in the browser, with Tone.js as the single clock and PixiJS for rendering; React is kept out of the game loop.

&#91;embedded content: runtime architecture · one clock, one bus, three subscribers\]

The Transport ticks onto the bus; the sim, the audio voices and the renderer all react to the same scheduled times, so sound and visuals cannot drift apart.

| Layer     | Choice                               | Why                                                             |
| --------- | ------------------------------------ | --------------------------------------------------------------- |
| Language  | TypeScript                           | Main language; typed weapon and level data                      |
| Audio     | [Tone.js](https://tonejs.github.io/) | Synths, LFOs, effects and a Transport with lookahead scheduling |
| Rendering | [PixiJS](https://pixijs.com/)        | WebGL sprites and custom filter shaders                         |
| UI        | React                                | Start screen and menus only, mounted beside the Pixi canvas     |
| Build     | Vite                                 | Fast dev server for a browser game                              |
| RNG       | Small seeded PRNG (e.g. mulberry32)  | Every level, weapon and pattern reproducible from a seed        |
| Tests     | Vitest                               | Pure generators and quantization logic are easy to unit test    |

Project setup (lint, format, tsconfig, test config) comes from the mise recipes, so only game-specific choices live here. A starting folder layout, to adjust to those conventions:

```
src/
  clock/       Transport wrapper, tick events, quantize helpers
  bus/         typed event bus
  audio/       voices, drum generator, music bus, FX
  weapons/     parts pool, generator, weapon data types
  level/       room templates, grid generator, tilemap
  sim/         player, enemies, collisions, cooldowns
  render/      Pixi stage, camera, shaders, juice (shake, flash)
  ui/          React start screen and menus
  rng/         seeded PRNG
```

## Milestones

Build sound and feel first, then generation: each step should be playable and judged by ear before the next starts.

1. **Clock and drums.** Tone.js Transport, procedural kick/snare/hat loop at 140 BPM, tick events on the bus.
2. **One hand-tuned wobble gun.** Quantized fire on mouse click, one fixed synth patch. Judge: does it feel good?
3. **Pixi stage and shader.** Player moves twin-stick in an empty arena; fullscreen shader and shake pulse on the kick.
4. **Enemy on the beat.** One enemy type stepping per beat, spawning per bar, kill sounds, filter duck on hit.
5. **Weapon generator.** Parts pool, seeded rolls, scale snapping, loudness normalization, 3 slots with layered switching.
6. **Level generator.** Seeded room grid, main path, tile templates, scrolling camera; seed also sets key and palette.
7. **Playtest pass.** Check the done-when list in PoC scope, tune ranges, decide fade vs hard cut for switching.

## Risks and open questions

The biggest risk is generated weapons that sound bad; parameter ranges and mixing rules matter more than the number of parts.

| Risk                                                  | Mitigation                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Random rolls produce ugly or harsh sounds             | Curated ranges per part, scale snapping, loudness normalization, listen-test every new part |
| Layered bass voices turn to mud                       | One sub owner, high-pass on other voices, sidechain duck from the kick                      |
| Audio CPU cost with many voices and FX in the browser | Polyphony cap, reuse voices instead of creating per shot, profile early in milestone 5      |
| Visual drift from audio                               | Visuals read Transport-scheduled times, never `setTimeout` or frame counts                  |
| Browser autoplay rules block audio                    | Start the AudioContext from a "press to start" click                                        |
| Shaders too heavy on low-end machines                 | One combined filter pass, a quality toggle                                                  |

Open questions:

- [ ] Exact quantization grid: always 1/16, or per-weapon division?
- [ ] Should on-beat timing give a damage bonus, or stay purely cosmetic?
- [ ] Does a weapon's LFO rate change its damage rate, or only its sound?
- [ ] Name for collected sounds, given "SoundFont" already means .sf2 sample banks
- [ ] Game title
