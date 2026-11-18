# Architecture

How the game is put together, why, and what's next. Read this with
[`design-brief-poc.md`](../design-brief-poc.md) (the design) and
[`CLAUDE.md`](../CLAUDE.md) (the rules to keep when changing code).

## Status

The seven PoC milestones from the brief are done and play-tested, and the
playable-demo work on top of them is in: health and death, a run loop of
levels, intensity-driven music, weapon loot, a second enemy and combo
scoring. All five of the brief's "done when" checks pass:

| Check                                                     | Result                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mashing fire with any rolled weapon sounds musical        | Passed by ear                                                                                  |
| Two rerolls of the same slot sound clearly different      | Passed by ear                                                                                  |
| Switching weapons mid-wobble layers without clicks or mud | Passed by ear                                                                                  |
| Visuals lock to the kick with no drift after 5 minutes    | 431 kicks exactly on grid; drift 0.012 ms/min; rendered kick within a frame of the audible one |
| 60 fps with 30 enemies and 3 layered weapons              | 58-60 fps, p99 frame 16.8 ms, ~1 ms JS a frame (Apple A18 Pro, 1440×900 @2×)                   |

The sound works but lacks the weight of real dubstep. That's deliberately
parked: gameplay first, then sound design (see [Roadmap](#roadmap)).

## The one rule: everything hangs off one clock

```
Tone Transport ──tick (1/16, with its scheduled audio time)──▶ bus
                                                         │
          ┌──────────────────────────┬───────────────────┼─────────────────────┐
          ▼                          ▼                   ▼                     ▼
   drums (schedule hits)   loadout → weapon slots   beat pulse        play loop (world)
                           (quantized fire)                          beats → enemies act
                                                                     bars  → waves, section
```

- `clock` wraps Tone's Transport and emits a `tick` every 1/16 step, carrying
  `bar`, `beat`, `stepInBar` and `time`: the AudioContext time the step plays
  at. Ticks arrive ~100 ms ahead of the sound (Tone's lookahead).
- Sound is scheduled at `tick.time`. Nothing uses `setTimeout` or frame counts
  for musical timing.
- **Two readings of the same clock.** New sounds are scheduled from the audio
  clock (`audioNow` = Tone's `immediate()`). The frame loop simulates and draws
  at the heard clock (`heardNow`, projected from `getOutputTimestamp()`), which
  trails it by the output latency. Without this, visuals fired ~15 ms early on
  built-in speakers and would be badly early on Bluetooth. Timing judgements
  (the on-beat bonus, combo beats) use the heard clock too.
- Visual envelopes (`render/pulse`) store hit times and are read at the heard
  time each frame, so a kick, beat, shot, kill, hit or drop flash can't drift
  from its sound.

## Source layout

React follows mise's atomic layout; the game lives outside it in
`src/game/<domain>/`, each domain's `index.ts` being its only public surface.

```
src/
  app/                React root: start ↔ game screen, owns the run and the Game
  atoms/ templates/   presentational UI (Button, StartScreen, GameScreen: HUD,
                      loadout, prompt, overlays)
  providers/ theme/   design-system theme, forced dark
  utils/getSeed/      ?seed= parsing
  game/
    index.ts          startGame({ run }): builds audio, clock, loadout for one
                      level; attach() mounts play; nextRun() after a clear
    run/              RunState (seed, level, hp, kills, score, weapon recipes),
                      newRun, levelSeed, nextLevel
    clock/            Transport → tick
    grid/             pure musical time: positions, quantize, tempo,
                      nextGridTime, gridError
    bus/ events/      typed synchronous event bus; GameEvents (tick, shot)
    rng/              mulberry32 + deriveSeed for independent streams
    music/            keys, scales, degree → MIDI, rollKey
    palette/          the four 6-colour level palettes
    level/            room grid, room templates, tilemap, BFS distance field
    weapons/          parts pool, rollWeapon, recipes, spread, weapon types
    loadout/          3 slots: switching, holstering, swapping in loot
    hud/              HudView: what React shows, published on change only
    sim/              pure simulation: trigger, weaponSlot, player, enemy,
                      projectile, combat, collision, waves, loot, combo, world
    input/            keyboard/mouse: move vector, trigger, weapon keys
    audio/            drums, music bus, arrangement, weapon/reload/impact
                      voices, gate, loudness measurement, heardTime
    render/           Pixi stage, views, camera, rave shader, pulses
    play/             the frame loop: input → world → camera → render → HUD
```

## Systems

### A run (`run/`, `app/`)

A run is a chain of levels. `RunState` carries the run seed, the level
number, health, kills, score and the loadout as weapon _recipes_ (a seed and
an optional pinned engine). Level 1 plays the run seed; later levels get
`deriveSeed(seed, 20, level)` for a fresh layout, key and palette. Recipes
are re-rolled in each level's key, so a loadout transposes for free.

`startGame({ run })` plays one level. When the player takes the exit, the HUD
goes to `cleared`, and **Next level** calls `play(game.nextRun())`, which
stops this game and starts the next. Death offers **Try again** (same run
seed, level 1) or **New run** (fresh seed). React only re-renders on HUD
changes, never per frame.

### Simulation (`sim/`, pure)

`World` is a plain object stepped by pure functions, and the play loop holds
the only mutable reference:

- `onBeat(world, { time, beat })`: hoppers hop one tile along the flow field
  (`level/field`, a BFS from the player's tile), nearest first, never onto an
  occupied tile, so queues flow through doorways. Chargers line up on beat 3
  (the snare) when within 8 tiles, showing a tell, and dash 4 tiles on the
  next downbeat; otherwise they walk on beat 2.
- `onBar(world, { bar, time, rng })`: advances the wave lifecycle
  (`sim/waves`): a quiet intro (2 bars on level 1), then waves. A wave is
  fought until a bar line finds nobody left, which clears it and drops a
  weapon. The next wave comes 4 bars later, and a fight longer than 8 bars
  gets reinforcements. Waves grow per wave and per level (cap 14, 30 alive)
  and spawn 10-18 tiles away by walking distance. Chargers make up 25% of
  waves after a level's first, rising with the level.
- `stepWorld(world, { input, dt, now, beat })`: per frame, the player moves
  (420 px/s, sliding along walls), shots whose time has sounded leave the
  barrel, projectiles fly and die on walls, then hits and contacts resolve.
  Kills score into the combo, may drop loot, and hits cost one of 5 HP (then
  0.6 s of invulnerability). At 0 HP the world is `dead`; on the open exit
  it's `cleared`. Either way it freezes.

`WaveRules` (from `rulesFor({ level, stress })`) set the quiet bars, waves to
clear (2 + level), enemy HP (+0.5 a level) and charger share. An enemy stores
its current hop (`from`, `to`, `hopAt`, `hopSeconds`), so its position is a
pure function of the clock and lands exactly on the beat.

### Weapons

- **Trigger** (`sim/trigger`): a pure state machine stepped per 1/16. Taps
  queue one shot for the next slot of the weapon's division, holding fires
  every slot. An empty magazine plans its reload fill on the grid: a click on
  the first offbeat, then a rumble on the next beat.
- **Weapon slot** (`sim/weaponSlot`): plays trigger events at tick times. A
  press can still land on the last tick if its audio hasn't played yet, which
  keeps fire feeling instant despite the lookahead. Holstered slots refill
  silently and ignore presses.
- **Timing bonuses**: a press within 50 ms of the weapon's grid (heard clock)
  accents its shot (1.5× damage, bigger, brighter). The first shot after a
  switch that lands on a downbeat gets the swap bonus (2×).
- **Rolling** (`weapons/roll`): each part sets a gameplay stat and a sound
  together. Manufacturer (Vandal/Lumen: damage and speed, saw or square),
  oscillator (wobble blob with sub, or laser beam), LFO rate (1/4, 1/8, 1/16:
  the fire rhythm; the magazine is always one bar and damage per bar is
  balanced), filter (cutoff → range, resonance → tighter spread) and an
  optional FX (Crush: +25% damage; Echo: an extra half-damage shot 1/8 later).
  Every weapon plays a 4-note riff in the level's key, one note per shot.
- **Loadout** (`loadout`): three slots. Switching fades the old tail
  (0.35 s), moves sub ownership (the others are high-passed at 180 Hz) and
  carries a held trigger over. `replaceActive` swaps loot in. A new run pins
  one wobble and one laser.
- **Loot** (`sim/loot`): a cleared wave always drops a weapon where the last
  kill fell; any kill has a 6% chance. Rolls are seeded per level. **F** on a
  weapon swaps it into the active slot and drops the old one in its place.

### Scoring (`sim/combo`)

A kill on the same beat as the last, or the next one, extends the combo;
each kill scores 100 × the combo, capped at ×8, and a beat without a kill
drops it. Score carries across levels.

### Audio

- **Gates, not instruments.** Every voice is built once from always-running
  sources gated by `AmplitudeEnvelope`s (`audio/gate`). Tone's instruments
  create nodes per note and leaked thousands a minute, which made the audio
  crackle over time. Play now creates zero nodes; arming a weapon (start,
  loot) builds its voice once.
- **Drums**: per-bar patterns generated from the seed (kick on 1 and snare on 3
  always, ghost kicks, hat shuffle, a snare roll every 4 bars), with the kick
  tuned to the level's root.
- **Music bus**: the track (drums, arrangement) goes through an arrangement
  low-pass; weapons, kills and reloads go in past it (`direct`), so the
  player's sound stays clear. Then one duck low-pass (0.6 s on a hit; held
  shut on death) and a limiter.
- **Arrangement** (`audio/arrangement`): each bar line picks a section from
  the wave lifecycle. _calm_ in the intro (track at 700 Hz), _groove_ while few
  enemies are up (3.2 kHz), _build_ at 8+ alive (filter riding open over 2
  bars, a noise riser every 2 bars), _drop_ for the phrase after a cleared
  wave (wide open; a crash and a sub boom on the root, a palette flash).
- **Loudness** (`audio/loudness`): each weapon is rendered for a bar offline
  when armed (~35 ms) and set to −20 dB RMS. Rolls that spanned 17 dB now
  match exactly.

### Levels

`generateLevel(seed)` builds a 3×3 room grid. A Spelunky-style walk lays the
main path from the top row to the bottom row; side rooms link in after, so
every room is reachable. Rooms are 17×11 tiles (64 px each) from six
handmade templates, randomly mirrored and with optional walls. Each keeps
its centre lines clear so 3-wide doors always connect. The seed also picks
the key and palette, each from its own `deriveSeed` stream so changing one
never reshuffles another. The exit pad sits in the last room on the path and
lights up once enough waves are cleared.

### Rendering

Pixi v8 on WebGL: a static level view (with the exit pad), pooled pickup and
enemy sprites (hopper diamonds, charger wedges with a dash tell), a
per-frame fx layer (projectiles, kill bursts), and one fullscreen filter
(`raveFilter`) doing chromatic aberration, single-pass bloom, a vignette, the
red hit flash and the drop's palette flash, all driven by the pulses. The
camera eases after the player and stays inside the level.

## Measuring things

These checks are scripted with Playwright against `pnpm dev`; they live in
session scratch files, not the repo. To redo them:

- **Frame rate:** launch with `chromium.launch({ channel: 'chromium' })`. The
  default headless shell uses a software GPU and reads ~10 fps. Open
  `?stress` (30 enemies, chargers included), hold fire, cycle 1/2/3 every
  120 ms, and record rAF intervals.
- **Audio graph leaks:** wrap `BaseAudioContext.prototype.create*` with a
  `WeakRef` + `FinalizationRegistry` and force GC (`--js-flags=--expose-gc`).
  Play must create zero nodes.
- **Kick drift:** record kick times from `AudioParam.setValueAtTime` calls
  (the kick's pitch drop starts at 5× its root), and per frame `currentTime`,
  `getOutputTimestamp()` and the `uKick` uniform (wrap `uniform1f`). Compare
  each kick's first lit frame with its audible time.
- **Loudness:** render each rolled weapon with `Offline` and compare RMS.
- **The loop by bot:** standing still clears a level-1 wave by contact in
  ~10 s, which exercises waves, the drop, loot under the player and death.

## Roadmap

Done since the PoC: health and death, the run loop, intensity-driven
arrangement, weapon loot, the charger, and combo, on-beat and swap bonuses.

Next is **sound design**: a playground page with knobs and values tuned by
ear, whose settings become the ranges the weapon generator rolls from.
That's the place to add the dubstep weight that's still missing, and to make
the riser, crash and drop hit like a real one.

Gameplay ideas still open:

- Balance pass from real play: HP, wave sizes, charger range, drop rates.
- A level-transition that keeps the music running instead of an overlay.
- A run-end goal (a final level or a boss) and a high score.
- Contact bursts currently count towards clearing a wave; consider making
  only kills count.

Known gaps: holstered weapons refill silently (the brief wants a quiet fill
layer), no active reload, manufacturers only pick saw or square (no FM or
wavetable engines yet), BPM is fixed at 140, and reaching the exit is only
covered by unit tests, not an end-to-end test.
