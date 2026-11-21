# Architecture

How the game is put together, why, and what's next. Read this with
[`design-brief-poc.md`](../design-brief-poc.md) (the design) and
[`CLAUDE.md`](../CLAUDE.md) (the rules to keep when changing code).

## Status

The seven PoC milestones from the brief are done and play-tested, and the
playable-demo work on top of them is in: health and death, a run loop of
levels, intensity-driven music, weapon loot, a second enemy and combo
scoring. Since then: the sound playground, layered sound (sub, reese,
growl, sidechain, pad bed), a continuous beam weapon, Crush blasts for
crowd control, and arena levels started at a circle and played as a song,
ending in a boss, with healing hearts. Since then: a five-level run arc
ending in a final boss and a victory screen, a boss with attack phases,
explosive slow weapons and a 1/2 rate, a loot magnet and bonus hearts,
weapon icons shared by the HUD and the drops, a HUD that shows every
magazine, and a heavier drum kit. Then: seeded chord progressions with a
moving pad, an arpeggio, a lead hook and offbeat stabs over them, weapon
riffs that follow the chords, a dash, and a landing page over the live
level. All five of the brief's "done when"
checks passed (measured before the arenas; re-measure frame rate on one):

| Check                                                     | Result                                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mashing fire with any rolled weapon sounds musical        | Passed by ear                                                                                  |
| Two rerolls of the same slot sound clearly different      | Passed by ear                                                                                  |
| Switching weapons mid-wobble layers without clicks or mud | Passed by ear                                                                                  |
| Visuals lock to the kick with no drift after 5 minutes    | 431 kicks exactly on grid; drift 0.012 ms/min; rendered kick within a frame of the audible one |
| 60 fps with 30 enemies and 3 layered weapons              | 58-60 fps, p99 frame 16.8 ms, ~1 ms JS a frame (Apple A18 Pro, 1440×900 @2×)                   |

The sound is now layered for weight; tuning it by ear in the playground
is still to come (see [Roadmap](#roadmap)).

## The one rule: everything hangs off one clock

```
Tone Transport ──tick (1/16, with its scheduled audio time)──▶ bus
                                                         │
          ┌──────────────────────────┬───────────────────┼─────────────────────┐
          ▼                          ▼                   ▼                     ▼
   drums (schedule hits)   loadout → weapon slots   beat pulse        play loop (world)
                           (quantized fire)                          beats → enemies act
                                                                     bars  → song, waves
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
  (the on-beat bonus, combo beats) use the heard clock too. A projection
  trailing the audio clock by over a second is no latency and falls back to
  it: WebKit on Linux reports a `performanceTime` ahead of
  `performance.now()`, which pinned the heard clock near zero (no beat, and
  a phantom dash on a clock under zero).
- **A bigger audio buffer for Firefox on phones.** `startAudio` makes
  Tone's context with `latencyHint: 'playback'` in Firefox on a touch
  screen, `'interactive'` in other browsers on one, and `'balanced'`
  elsewhere (`?latency=` overrides): Firefox on a phone crackled on smaller
  buffers and was clean on `playback` (play-tested), and visuals follow the
  speakers whatever the buffer. Chrome honours the hint (on a Mac, base +
  output latency 5 + 24 ms on `interactive`, 10 + 32 ms on `balanced`,
  21 + 56 ms on `playback`), so on `playback` Chrome Android answered a tap
  visibly later than Firefox; Firefox reports 16.6 ms whatever is asked,
  and its output timestamp doesn't trail the audio clock at all.
- **Output timestamps from under Tone's wrapper.** Tone runs on a
  standardized-audio-context wrapper, which has no `getOutputTimestamp()`,
  so the heard clock long fell back to the audio clock. `startAudio` reads
  the timestamp from the native context the wrapper holds (a private
  field; without it the heard clock falls back as before). Handing Tone a
  native context instead broke Firefox, where the wrapper fills in params
  Tone expects. Measured in Chrome on built-in output: heard trails audio
  by 22 ms (output latency 24 ms).
- **Pause suspends the AudioContext.** Its clock stops, and with it the
  Transport, scheduled sound, enemy hops and pulses, so a resume carries on
  exactly where it stopped; the frame loop skips frames meanwhile, and the
  heard clock is clamped to the audio clock so it can't jump across the
  pause.
- **Sound the browser holds back freezes the game too.** If the context
  isn't running and the player didn't pause (no output device, autoplay
  rules, a phone call), the game holds still like a pause and shows
  "Sound couldn't start" with a Start sound button - a press, which
  browsers need. It clears itself on the context's `statechange`.
- Visual envelopes (`render/pulse`) store hit times and are read at the heard
  time each frame, so a kick, beat, shot, kill, hit or drop flash can't drift
  from its sound.

## Source layout

React follows mise's atomic layout; the game lives outside it in
`src/game/<domain>/`, each domain's `index.ts` being its only public surface.

```
src/
  app/                React root: start ↔ game ↔ level card, owns the run
                      and the Game
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
    icons/            SVG path data for the HUD and the stage
    harmony/          seeded progressions, voice leading, lead/arp/stab
                      patterns, diatonic transposition (pure)
    backdrop/         the landing page's live, silent level
    level/            arena generator, tilemap, BFS distance field
    weapons/          parts pool, rollWeapon, recipes, spread, weapon types
    loadout/          3 slots: switching, holstering, swapping in loot
    hud/              HudView: what React shows, published on change only
    sim/              pure simulation: trigger, weaponSlot, player, enemy,
                      projectile, beam, splash, combat, collision,
                      survival, loot, combo, boss, world
    input/            keyboard/mouse: move vector, trigger, weapon keys;
                      touch: floating stick (turn inside the inner rim,
                      move past it) and right-half fire
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

A run is `RUN_LEVELS` (5) levels. Clearing one shows its stats for a
moment, then the next starts by itself behind a level card (no click: the
AudioContext is already running, and only a fresh run asks to go
fullscreen); clearing the last wins the run. The best score is kept in
`localStorage` (`utils/bestScore`), read before each run so its end can say
"New best!". Seed, key and BPM no longer sit in the HUD: the seed shows on
the pause and end screens, to share.

`startGame({ run })` plays one level. It opens quiet: only the pad bed
plays (no drums) and weapons fire on its pulse, until the player steps
into the circle. When the player takes the exit, the HUD
goes to `cleared`, and **Next level** calls `play(game.nextRun())`, which
stops this game and starts the next. Death offers **Try again** (same run
seed, level 1) or **New run** (fresh seed). React only re-renders on HUD
changes, never per frame.

### Simulation (`sim/`, pure)

`World` is a plain object stepped by pure functions, and the play loop holds
the only mutable reference:

- `onBeat(world, { time, beat })`: hoppers hop one tile along the flow field
  (`level/field`, a BFS from the player's tile), nearest first, never onto an
  occupied tile, so queues flow round cover. Chargers line up on beat 3
  (the snare) when within 8 tiles, showing a tell, and dash 4 tiles on the
  next downbeat; otherwise they walk on beat 2. The boss fights in three
  phases by health (`sim/boss`): it winds up on the beat before and fires a
  ring of orbs on the snare, every other bar, then every bar with hoppers
  called in every 4 bars, then on beats 1 and 3 while walking every beat.
  Each ring turns half a gap, and an orb's position is pure in time like a
  hop. The final level's boss has 1.5× health.
- `onBar(world, { bar, time, rng, telegraphSeconds, view })`: advances the level
  (`sim/survival`). It waits until the player steps into the circle; the
  next bar line starts a one-bar charge (riser, filling ring) and the bar
  after slams: shockwave, drop hit, drums in, and the song starts. The song
  is intro 16, breakdown 8, build-up 8, drop 1 16, drop 2 16, bridge 16,
  drop 3 32-48 (longer per level) and outro 16 bars, and each part sends
  waves at its own pace and size (sparse in the intro and breakdown, every
  2 bars through the build-up, every 4 with extra enemies in the drops,
  none in the outro; sooner once the floor is clear). Drop 3 opens with the
  boss, 8+ tiles away. Once the boss is down and the outro is playing, the
  circle opens as the exit. Spawns land 4+ tiles from the player and,
  given the `view` (the camera's world rect), only where it can be seen,
  falling back to anywhere when nothing on screen is free; a marker pulses
  there for a bar first (`telegraphSeconds`), so a wave lands on the next
  bar line. The camera zooms out on small screens (`render/camera`
  `zoomFor`) until the short side shows at least 720 world px, so a phone
  sees about as much of the arena as a laptop.
- `stepWorld(world, { input, dt, now, beat, beatSeconds })`: per frame, the
  player moves (420 px/s, sliding along walls; Space or the touch button
  dashes 0.14 s at 1500 px/s along the stick, or the aim standing still,
  passing through enemies and orbs, ready again after 2 beats), shots whose time has sounded leave the
  barrel, projectiles fly and die on walls, beam ticks hit everything along
  their ray (`sim/beam`), then hits, Crush blasts (`sim/splash`) and
  contacts resolve.
  Kills score into the combo, may drop loot, and hits cost one of 5 HP (then
  0.6 s of invulnerability). Walking over a heart heals one; at full health
  it stacks a bonus heart on top (up to 3, `BONUS_HEARTS`), lost first and
  carried between levels, so saving health pays off. Hearts within 170 px
  drift in while there's room to heal (`sim/loot` `attractHearts`); weapons
  drift in the same way while the run's bag has room (`attractPickups`),
  and land in `world.bag` (up to `BAG_SIZE`, 24). A full bag leaves them
  on the floor until the player makes room. The boss hurts on contact but doesn't burst. At 0 HP the world is `dead`; on the open exit
  it's `cleared`. Either way it freezes.

`WaveRules` (from `rulesFor({ level, stress })`) set the song, boss HP
(30, +12 a level) and charger share. Hoppers and chargers die to any hit
(a shot, echo, blast or beam tick), so difficulty comes from wave size,
chargers and the boss. An enemy stores
its current hop (`from`, `to`, `hopAt`, `hopSeconds`), so its position is a
pure function of the clock and lands exactly on the beat.

### Weapons

- **Trigger** (`sim/trigger`): a pure state machine stepped per 1/16. Taps
  queue one shot for the next slot of the weapon's division, holding fires
  every slot. An empty magazine plans its reload fill on the grid: a click on
  the first offbeat, then a rumble on the next beat. Continuous weapons
  (`coolSteps`) also regain a charge every few idle steps.
- **Weapon slot** (`sim/weaponSlot`): plays trigger events at tick times. A
  press can still land on the last tick if its audio hasn't played yet, which
  keeps fire feeling instant despite the lookahead. Holstered slots refill
  silently and ignore presses.
- **Timing bonuses**: a press within 50 ms of the weapon's grid (heard clock)
  accents its shot (1.5× damage, bigger, brighter). The first shot after a
  switch that lands on a downbeat gets the swap bonus (2×).
- **Rolling** (`weapons/roll`): each part sets a gameplay stat and a sound
  together. Manufacturer (Vandal/Lumen: damage and speed, saw or square),
  oscillator (wobble blob, laser bolt, or beam), LFO rate (1/4, 1/8, 1/16:
  the fire rhythm; the magazine is always one bar and damage per bar is
  balanced; 1/2 is a rarer roll), filter (cutoff → range, resonance →
  tighter spread) and an
  optional FX (Crush: +10% damage and a blast on every hit; Echo: an extra
  half-damage shot 1/8 later). Every weapon plays a 4-note riff in the
  level's key, one note per shot.
- **Beam**: continuous. It ticks every 1/16 whatever its LFO (the LFO only
  pulses its filter), each tick a hitscan ray that pierces and stops at
  walls. A bar of fire overheats it into a 4-beat recharge with its own
  sound (vent, rising whine, ready ping); resting cools a charge back every
  2 steps. Its voice opens on the first tick and stays held, gliding through
  the riff a note per beat.
- **Slow weapons blast**: 1/4 and 1/2 shots are bigger and burst on a hit,
  at the end of their range or on a wall (`detonates`): 96 px at 70% of the
  shot's damage for 1/4, 150 px at 80% for 1/2, grown by Crush on top.
- **Crush blasts** (`sim/splash`): a crushed shot bursts where it hits:
  everything within 64-128 px (wider with more drive) takes 60% of the
  shot's damage and is shoved 44 px away, which also breaks a charger's
  lined-up dash. Beams don't blast.
- **Loadout** (`loadout`): three slots. Switching fades the old tail
  (0.35 s), moves sub ownership (the others are high-passed at 180 Hz) and
  carries a held trigger over. `arrange` puts the loadout menu's choice in
  the slots: weapons already armed move over with their magazines, only
  new ones are armed. A new run opens with the player's kept loadout, or
  one of each engine (`starterRecipes`).
- **Loot** (`sim/loot`): any kill has a 10% chance of a weapon, else 8% of
  a heart. The boss always drops a good weapon (Vandal with an FX, pinned
  through `WeaponRecipe`) and two hearts. Rolls are seeded per level.
  Weapons go into the bag, not the hand (see [Loadout and bag](#loadout-and-bag)).

### Loadout and bag

Loot used to pile up on the floor, one F-swap at a time. Now every weapon
drifts into a per-run **bag** (`RunState.bag`, `World.bag`), carried from
level to level and empty at the start of every run.

- **The menu** (`templates/GameScreen` `LoadoutMenu`), a sequencer rack.
  Tab, B or the HUD's bag button opens it as a dialog (focus kept inside).
  Done always sits in its header, and reads "· discard n" while weapons
  are marked. Each slot is a track row: key cap, engine, beat, name with
  its FX and blast as inserts, a 16-step grid lit where it fires
  (`steps.ts`: hits on its division, echoes an 1/8 later, a beam held
  through the bar), and a cue button. The bag is a crate of cards, each
  with a mini step grid. Pick a bag weapon and the comparison stacks it
  over the slot it would replace (the one aimed at, else the same
  engine's) on one shared grid. Each row shows its damage a bar, and the
  pick gets a verdict (`verdict.ts`: stronger, trade-off or weaker, judged
  on damage a bar first). Under them: hit, shots, reach and blast with the
  differences. "Equip in 1/2/3", 1-3 or a double-click place it. Arrow
  keys walk the slots or the bag, then across. Bag cards that beat their
  likely slot get an amber chevron. "Best" sorts by damage a bar, and
  "Discard weaker" marks every clearly weaker weapon at once. Discards are
  only marks until Done; Esc asks once before throwing them out, and Undo
  changes puts everything back. A full bag says drops are waiting on the
  floor. New loot is grouped first and revealed once. A picked weapon's
  verdict is announced in one line, not the whole comparison. Done calls
  `Game.arrange`, which arms any new weapon while still frozen. The pure
  moves live in `rack.ts`.
- **The loop and previews** (`audio/menuLoop`, `audio/preview`). Opening
  the menu mid-level suspends the game's context as Pause does, so the
  clock and the sim stay exact. The bar the track is on (drums, pad, air,
  backing, in its section and chord) is rendered offline from the level's
  own voices: a warm-up bar first, then one bar kept with a 30 ms seam
  baked across its loop point. It loops on a small separate AudioContext
  (`createPreviewer`, primed inside the press) under the `menu` patch's
  low-pass. A Hear button renders a bar of the weapon's riff once (moved
  onto the loop's chord, levelled to the weapon mix) and starts it on the
  loop's next beat. The comparison's A/B (`Game.previewAB`,
  `previewer.alternate`) plays the pick for a bar, then the slot's, back and
  forth on the bar grid. Each next bar is queued as the one two before it
  ends, on the audio clock. Only the highlight of the row that's sounding
  (and its playhead) follows a timer. Every offline render now waits its turn (`offlineTurn`),
  since `Offline` swaps Tone's global context. After a run there's no loop,
  because the track is still playing, muffled.
- **After a run** the death and victory screens say how many weapons are
  in the bag and that it empties. **Keep loot (n)** is the first secondary
  pill, and Try again or New run ask once before emptying a bag nobody has
  looked at.
  It opens the same menu over the finished run. The end screen stays
  mounted (hidden) under it, so the board's sign-in form keeps its state.
- **Kept between runs** (`app/_components/useKeptLoadout`,
  `utils/keptLoadout`). Whatever the menu last closed on is the loadout
  every fresh run opens with (`newRun(seed, recipes)`). A run already under
  way (quit at level 3 and pressed Drop in) keeps its own. Every choice is
  kept on the device with when it was made, so a guest keeps theirs between
  visits. Signed in, it's also saved to the account (`loadout.save`, a
  `public.loadouts` row only its owner can read or write,
  `db/migrations/0003_loadouts.sql`) and read back on any device
  (`loadout.mine`, with its `savedAt`). The newer of the two wins; a device
  choice newer than the account's goes up when the player signs in.
  Recipes are checked against the parts pool by one schema
  (`loadoutSchema`) on the device, on the way in and on the way out. They're
  not proved to have been looted, so a forged loadout is possible, like a
  forged score within `plausible`'s limits.

### Scoring (`sim/combo`)

A kill on the same beat as the last, or the next one, extends the combo;
each kill scores 100 × the combo, capped at ×8, and a beat without a kill
drops it. Score carries across levels. Each kill also plucks the score
voice a scale degree higher per combo step, an octave by ×8.

### Audio

- **Gates, not instruments.** Every voice is built once from always-running
  sources gated by envelopes (`audio/gate`). Tone's instruments create
  nodes per note and leaked thousands a minute, which made the audio
  crackle over time. Play now creates zero nodes; arming a weapon (start,
  loot) builds its voice once.
- **A lean graph** (`audio/graph`). Voices are built from the context's own
  nodes, one browser node each, with Tone's `Param` for automation (it adds
  no nodes) and Tone's own waves, curves and mixes copied over: the
  envelope, `FatOscillator`'s detune and phases, the `Filter` cascade, the
  crossfades in `Distortion`, `FeedbackDelay` and `Reverb`, `Channel`'s
  mono pan. Tone's classes cost many hidden nodes apiece and drove params
  from signals, so a level ran ~1,350 browser nodes and phones couldn't
  keep up; it now runs ~260 and sounds the same (every voice rendered
  offline matches its Tone version, weapons to 0.01 dB). 20 s of a level's
  whole graph renders offline in 0.9 s instead of 3.5 s in Chromium, 0.7 s
  instead of 4.1 s in Firefox and 1.0 s instead of 3.3 s in WebKit (M-series
  Mac). Sweep LFOs start with the Transport, or mid-level in phase with it
  (loot), and read their rate then: BPM must be set before the start.
- **Drums**: the kit runs into a soft-clipper and a glue compressor; the
  kick (with a triangle "knock" an octave up for small speakers) and the
  snare are each driven too. Measured offline against the old kit: +3 dB
  RMS overall at the same peak headroom (−10 dB), the kick +2.7 dB with
  about half the crest factor, the snare +7 dB. Per-bar patterns generated from the seed (kick on 1 and snare on 3
  always, ghost kicks, hat shuffle, a snare roll every 4 bars), with the kick
  tuned to the level's root. The kick has a beater click and a sub tail on
  its own oscillator; the snare a three-strike clap.
- **Layered weapons**: every engine is a stack (`WeaponLayersPatch`): a body
  high-passed at a crossover, a clean saturated sub under it (kept out of
  the drive and echo), a detuned stack through the body filter (a reese at
  -1 octave), a growl band-passed by a twin of the body LFO, and a click,
  glued by a compressor. `audio/saturate` is a level-keeping tanh shaper.
- **Music bus**: the track (drums, arrangement) goes through an arrangement
  low-pass; weapons, kills and reloads go in past it (`direct`), so the
  player's sound stays clear. Then one duck low-pass (0.6 s on a hit; held
  shut on death) and a limiter. Every kick pumps (`pump`) the pad bed
  (`bed`) and the weapons (`weapons`) by the `mix` patch: the sidechain.
- **Arrangement** (`audio/arrangement`): each bar line picks a section from
  the song part: _calm_ before the slam, in the breakdown and the outro
  (track at 700 Hz), _groove_ in the intro and bridge (3.2 kHz), _build_ in
  the build-up (filter riding open over 2 bars, a noise riser every 2
  bars), _drop_ in every drop (wide open; a crash and a sub boom on the
  root, a palette flash, struck again when one drop follows another).
  `charge` plays the circle's one-bar riser.
  Under it a detuned saw chord in key and high air fill the bed, louder as
  the fight builds and pulled back in the drop.
- **Loudness** (`audio/loudness`): each weapon is rendered for a bar offline
  when armed (~35 ms) and set to −20 dB RMS. Rolls that spanned 17 dB now
  match exactly.

### Harmony and backing (`harmony/`, `audio/voices/backing`)

Each level's seed picks a progression from twelve proven dark loops
(`TEMPLATES`), may swap one chord for a neighbour, replaces any chord
that's diminished in the key's scale (ii in minor, v in phrygian), and
plays it as 4 one-bar chords, 4 two-bar chords, or 8 bars with a
turnaround. It restarts on the slam, so every drop lands on i. Chords are
voiced in the inversion closest to the last, so the pad glides.

- **Pad** (`arrangement`): the bed's saw chord now follows the
  progression, gliding into each chord on its bar line.
- **Backing** (`createBacking`): a pluck arpeggio (seeded order and rate),
  a two-bar lead hook (chord tones on strong 8ths, steps between, the
  second bar answering the first, moved onto each chord) and offbeat chord
  stabs, switched on per song part (`LAYERS`). A whole bar is scheduled on
  its bar line. The layers run through a high-pass into the pumped bed and
  duck on every shot, so they sit under the weapons: measured offline,
  8-10 dB under a weapon's -20 dB RMS before the duck.
- **Riffs follow the chord**: a weapon's riff note is moved diatonically
  onto the bar's chord the short way round (`shiftFor`, `transposeInKey`),
  so it keeps its shape and stays in key.

### Sound design (`sound/`, `playground/`)

Every value that shapes the sound lives in one typed `SoundDesign`
(`sound/model`): the wobble, laser and beam engines and their layers, the
weapon mix and loudness target, the sidechain, the drums, impact, blast,
score, reload, recharge and arrangement patches (with the pad bed), and the sound
half of the parts pool (waveforms, base drive, octaves, riff degrees, and
the cutoff, resonance, crush and echo ranges rolls land in). Gameplay
stats stay in `weapons/parts`.

The game plays `SOUND_DESIGN`: `BASE_DESIGN` merged with
`sound/design.json`. `mergeDesign` keeps only values whose type matches
the base, so a design saved by an older build, or edited by hand, still
loads and the base fills any gap. Every voice takes its patch with the
game's design as the default.

`sound/schema` lists every value with its label, range, step and unit;
tests keep it complete. The playground page (`/playground`,
`src/playground`) renders a control per field and drives
`game/playground`, which runs the real voices on the real clock. Saving
goes through a dev-only route (`/api/sound-design`, in
`src/app/api/sound-design`) that merges, Prettier-formats and writes `design.json`
without reloading the page.

### Levels

`generateLevel(seed)` builds one walled arena (`level/arena`), 37×25 tiles
of 64 px (about twice a laptop screen each way; the camera follows). Each
level picks one cover style: _blocks_ (2-3 mirrored pairs of big blocks to
circle) or _scattered_ (pillars and short walls, four-way symmetric, to
weave through). Pieces never touch each other or the border, so no floor
is ever walled off. The circle sits at the centre with a clear zone, and
the player spawns 4 tiles below it. The seed also picks the style, key and
palette, each from its own `deriveSeed` stream so changing one never
reshuffles another.

### Landing page

The start screen draws the run's first level live behind it
(`attachBackdrop`): the stage and rave shader over the arena, the camera
drifting a little round the circle and the kick pulsing at 140 BPM
halftime. A silent demo plays round the circle (`ghostAt`, pure): a shot
on every kick that lands, and bursts its target, on the next. It runs before any AudioContext exists, so it times itself off
the page's clock - decoration, never musical timing. On a wide landscape
screen the text sits down the left and the camera puts the circle right
of centre, clear of it (the page's `SIDE_BY_SIDE` and the backdrop's
`ASIDE` must agree). Under the title: **Drop in**, **Reduce flashing** beside it (second in tab
order; Enter flips it rather than starting), and the run's key, levels and
best score. The seed isn't on the start page: `?seed=` still picks it, and
a finished run offers **Copy seed link**.
Under it, one glass briefing: the loadout with icons, generated names and
what each weapon does in plain words (`describeLoadout`), and how to play
for the pointer in hand. Enter starts from anywhere on the page.

**Reduce flashing** (`game/flashing`) is the player's choice, kept in
local storage, or the system's reduced motion until they make one. The
stage reads it every frame and draws a `calmFrame`: no shake, no drop
flash, the kick, shot and hit pulses turned well down; the backdrop
camera holds still. The screens' own animations (the title's glow, the
combo and heart pops, the level card) stop off `data-flashing="reduced"`
on the root.

### HUD and icons

`game/icons` holds every icon as SVG path data on a 24-unit grid: the
`Icon` atom draws it as `<svg>`, `render/icon` as Pixi paths, so the HUD and
the drops show the same wobble, laser, beam, Crush, Echo, blast and heart.
The loadout view carries each slot's ammo and refill (published when a
magazine changes, not per frame); a refill's sweep is a CSS animation
lasting its seconds. Each slot is a button: held, it switches to that
weapon and fires it (`Game.fireSlot`), which is how a touch screen
switches. Swiping is gone. A weapon on the ground has a floating label of
its engine, beat, blast and FX, fading in as the player nears.

### Rendering

Pixi v8 on WebGL: a static level view with the circle (breathing and
rippling while it waits, filling over the charge, dim during the song,
open as the exit), pooled pickup sprites (weapons and hearts) and enemy
sprites (hopper diamonds, charger wedges with a dash tell, the big boss, and
a spawn marker before each appears), a
per-frame fx layer (projectiles, kill bursts), and one fullscreen filter
(`raveFilter`) doing chromatic aberration, single-pass bloom, a vignette, the
red hit flash and the drop's palette flash, all driven by the pulses. The
filter renders at the renderer's resolution (`'inherit'`): Pixi's default
of 1x drew the whole stage at 1x and upscaled it, pixelated on a phone. The
renderer itself is capped at 2x. The camera eases after the player, stays
inside the level and zooms out on small screens.

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
- **Audio CPU:** in a Storybook page (`pnpm storybook`; its Vite server
  serves source by URL, the Next app doesn't), import the audio domain by Vite's URL for
  Tone (the one `src/game/audio/gate` imports - a bare `'tone'` is a
  second copy, and `Offline` then renders nothing), build a level's voices
  inside `Offline` and time the render of 20 s. Count native nodes by
  wrapping `create*` as above.
- **Kick drift:** record kick times from `AudioParam.setValueAtTime` calls
  (the kick's pitch drop starts at 5× its root), and per frame `currentTime`,
  `getOutputTimestamp()` and the `uKick` uniform (wrap `uniform1f`). Compare
  each kick's first lit frame with its audible time.
- **Loudness:** render each rolled weapon with `Offline` and compare RMS.
- **The loop by bot:** walk up into the circle (hold W until the HUD says
  charging), then stand still: waves reach the player by contact.

## Roadmap

Done since the PoC: health and death, the run loop, intensity-driven
arrangement, weapon loot, the charger, combo, on-beat and swap bonuses, the
sound playground, layered sound, the beam, Crush blasts, arena levels with
the start circle, song-structured survival, the boss and hearts.

Next is **play-testing the song levels** and **tuning by ear** in the
playground (`/playground`); the game and the weapon generator use
what's saved. The layers, sidechain and pad bed are first guesses. Where a
knob isn't enough (a new engine, an FM or wavetable manufacturer), add the
value to `SoundDesign` and `DESIGN_SCHEMA` so it shows up in the
playground.

Gameplay ideas still open:

- Balance pass from real play: HP, wave sizes, charger range, drop rates.
- A level transition that keeps the music running: the next level still
  rebuilds the audio graph, so the outro is muffled and cut behind the
  level card.
- Hades-style unlocks between runs, shops or chests.

Known gaps: holstered weapons refill silently (the brief wants a quiet fill
layer), no active reload, manufacturers only pick saw or square (no FM or
wavetable engines yet), BPM is fixed at 140, and the boss (its phases and orbs), the
exit, the level transition and the victory screen are only covered by unit
and story tests: reaching them takes the whole ~4-minute song.
