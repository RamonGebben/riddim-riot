# Architecture

How the game is put together, why, and what's next. Read this with
[`design-brief-poc.md`](../design-brief-poc.md) (the design) and
[`CLAUDE.md`](../CLAUDE.md) (the rules to keep when changing code).

## Status

The seven PoC milestones from the brief are done and play-tested. All five
of its "done when" checks pass:

| Check                                                     | Result                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mashing fire with any rolled weapon sounds musical        | Passed by ear                                                                                  |
| Two rerolls of the same slot sound clearly different      | Passed by ear                                                                                  |
| Switching weapons mid-wobble layers without clicks or mud | Passed by ear                                                                                  |
| Visuals lock to the kick with no drift after 5 minutes    | 431 kicks exactly on grid; drift 0.012 ms/min; rendered kick within a frame of the audible one |
| 60 fps with 30 enemies and 3 layered weapons              | 59.5 fps, p99 frame 16.8 ms, ~1 ms JS a frame (Apple A18 Pro, 1440×900 @2×)                    |

The sound works but lacks the weight of real dubstep. That's deliberately
parked: gameplay first, then sound design (see [Roadmap](#roadmap)).

## The one rule: everything hangs off one clock

```
Tone Transport ──tick (1/16, with its scheduled audio time)──▶ bus
                                                         │
          ┌──────────────────────────┬───────────────────┼─────────────────────┐
          ▼                          ▼                   ▼                     ▼
   drums (schedule hits)   loadout → weapon slots   beat pulse        play loop (world)
                           (quantized fire)                          beats → enemy hops
                                                                     bars  → waves
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
  built-in speakers and would be badly early on Bluetooth.
- Visual envelopes (`render/pulse`) store hit times and are read at the heard
  time each frame, so a kick, beat, shot, kill or hit flash can't drift from
  its sound.

## Source layout

React follows mise's atomic layout; the game lives outside it in
`src/game/<domain>/`, each domain's `index.ts` being its only public surface.

```
src/
  app/                React root: start screen ↔ game screen, owns the Game handle
  atoms/ templates/   presentational UI (Button, StartScreen, GameScreen + HUD)
  providers/ theme/   design-system theme, forced dark
  utils/getSeed/      ?seed= parsing
  game/
    index.ts          startGame(): builds audio, clock, loadout; attach() mounts play
    clock/            Transport → tick
    grid/             pure musical time: positions, quantize, tempo, nextGridTime
    bus/ events/      typed synchronous event bus; GameEvents (tick, shot)
    rng/              mulberry32 + deriveSeed for independent streams
    music/            keys, scales, degree → MIDI, rollKey
    palette/          the four 6-colour level palettes
    level/            room grid, room templates, tilemap, BFS distance field
    weapons/          parts pool, rollWeapon, spread pattern, weapon types
    loadout/          3 slots: switching, holstering, rerolls
    sim/              pure simulation: trigger, weaponSlot, player, enemy,
                      projectile, combat, collision, world
    input/            keyboard/mouse: move vector, trigger, weapon keys
    audio/            drums, music bus, weapon/reload/impact voices, gate,
                      loudness measurement, heardTime
    render/           Pixi stage, views, camera, rave shader, pulses
    play/             the frame loop: input → world → camera → render
```

## Systems

### Simulation (`sim/`, pure)

`World` is a plain object stepped by pure functions, and the play loop holds
the only mutable reference:

- `onBeat(world, time)`: every enemy hops one tile along the flow field
  (`level/field`, a BFS from the player's tile), nearest first, never onto
  an occupied tile, so queues flow through doorways.
- `onBar(world, { bar, time, rng })`: spawns a wave after 2 quiet bars, sized
  `1 + bar/2` (max 6, cap 30 alive), on floor tiles 10-18 tiles away by
  walking distance. `WaveRules` can switch to stress fill.
- `stepWorld(world, { input, dt, now })`: per frame, the player moves (420 px/s,
  sliding along walls), shots whose time has sounded leave the barrel,
  projectiles fly and die on walls, then hits and contacts resolve. Returns
  kills and whether the player was hit (0.6 s of invulnerability).

An enemy stores its current hop (`from`, `to`, `hopAt`), so its position is a
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
- **Rolling** (`weapons/roll`): each part sets a gameplay stat and a sound
  together. Manufacturer (Vandal/Lumen: damage and speed, saw or square),
  oscillator (wobble blob with sub, or laser beam), LFO rate (1/4, 1/8, 1/16:
  the fire rhythm; the magazine is always one bar and damage per bar is
  balanced), filter (cutoff → range, resonance → tighter spread) and an
  optional FX (Crush: +25% damage; Echo: an extra half-damage shot 1/8 later).
  Every weapon plays a 4-note riff in the level's key, one note per shot.
- **Loadout** (`loadout`): three slots. Switching fades the old tail
  (0.35 s), moves sub ownership (the others are high-passed at 180 Hz) and
  carries a held trigger over. The starting loadout pins one wobble and one
  laser.

### Audio

- **Gates, not instruments.** Every voice is built once from always-running
  sources gated by `AmplitudeEnvelope`s (`audio/gate`). Tone's instruments
  create nodes per note and leaked thousands a minute, which made the audio
  crackle over time. Play now creates zero nodes.
- **Drums**: per-bar patterns generated from the seed (kick on 1 and snare on 3
  always, ghost kicks, hat shuffle, a snare roll every 4 bars), with the kick
  tuned to the level's root.
- **Music bus**: everything goes through one low-pass (ducked for 0.6 s when
  hit) into a limiter.
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
never reshuffles another.

### Rendering

Pixi v8 on WebGL: a static level view, pooled enemy sprites, a per-frame fx
layer (projectiles, kill bursts), and one fullscreen filter (`raveFilter`)
doing chromatic aberration, single-pass bloom, a vignette and the red hit
flash, all driven by the pulses. The camera eases after the player and stays
inside the level.

## Measuring things

These checks are scripted with Playwright against `pnpm dev`; they live in
session scratch files, not the repo. To redo them:

- **Frame rate:** launch with `chromium.launch({ channel: 'chromium' })`. The
  default headless shell uses a software GPU and reads ~10 fps. Open
  `?stress`, hold fire, cycle 1/2/3 every 120 ms, and record rAF intervals.
- **Audio graph leaks:** wrap `BaseAudioContext.prototype.create*` with a
  `WeakRef` + `FinalizationRegistry` and force GC (`--js-flags=--expose-gc`).
  Play must create zero nodes.
- **Kick drift:** record kick times from `AudioParam.setValueAtTime` calls
  (the kick's pitch drop starts at 5× its root), and per frame `currentTime`,
  `getOutputTimestamp()` and the `uKick` uniform (wrap `uniform1f`). Compare
  each kick's first lit frame with its audible time.
- **Loudness:** render each rolled weapon with `Offline` and compare RMS.

## Roadmap

The next work, in order. Each step is playable on its own.

1. **Health, death and restart**: hit points in the HUD, a death screen with
   run stats, restart on the same seed or a new one.
2. **Exit and run loop**: the exit pad clears the level; the next level gets
   a new seed (layout, key, palette) and difficulty ramps.
3. **Intensity-driven arrangement**: quiet rooms filtered, a riser as enemies
   pile up, a drop with a palette flash when a wave is cleared.
4. **Weapon loot**: enemies sometimes drop a rolled weapon to swap into a
   slot, replacing the R reroll.
5. **A second enemy type**: a charger that telegraphs on the beat and dashes
   on the downbeat.
6. **Juice**: a combo counter for kills on consecutive beats, an on-beat
   damage bonus and the swap bonus for switching on the downbeat.

After that, **sound design**: a playground page with knobs and values tuned
by ear, whose settings become the ranges the weapon generator rolls from.
That's the place to add the dubstep weight that's still missing.

Known gaps: holstered weapons refill silently (the brief wants a quiet fill
layer), no active reload, manufacturers only pick saw or square (no FM or
wavetable engines yet), BPM is fixed at 140.
