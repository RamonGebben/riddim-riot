import { immediate, now } from 'tone';
import {
  createArrangement,
  createBacking,
  createBlastSound,
  createDrums,
  createImpactSound,
  createMusicBus,
  createRechargeSound,
  createReloadSound,
  createPreviewer,
  createScoreSound,
  createChordSound,
  createWeaponVoice,
  heardTime,
  startAudio,
  measureWeaponLoudness,
  PREVIEW_LEAD_IN,
  renderMenuLoop,
  renderWeaponPreview,
} from './audio';
import { createBus } from './bus';
import { createClock, type Tick } from './clock';
import { styleFor } from './genre';
import { rigStyle } from './rig';
import type { GameEvents } from './events';
import { initialHud, type HudView } from './hud';
import {
  gridError,
  secondsPerStep,
  STEPS_PER_BEAT,
  STEPS_PER_DIVISION,
} from './grid';
import { chordAt, progressionFor, shiftFor, transposeInKey } from './harmony';
import { createLoadout, type Armed, type LoadoutView } from './loadout';
import { generateLevel, TILE_SIZE } from './level';
import { degreeToMidi, keyName, midiToHz } from './music';
import { startPlay, type Play, type Pulses } from './play';
import type { Section, SongPart } from './sim/survival';
import { rulesFor } from './sim/world';
import { createPulse } from './render/pulse';
import { levelSeed, nextLevel, type RunState } from './run';
import { createWeaponSlot } from './sim';
import { MAX_MULTIPLIER } from './sim/combo';
import { SOUND_DESIGN } from './sound';
import {
  MANUFACTURERS,
  spreadAngle,
  weaponFrom,
  type FxPart,
  type LfoPart,
  type OscillatorPart,
  type WeaponRecipe,
} from './weapons';

export type { HudView } from './hud';
export { levelSeed, newRun, type RunState } from './run';
export { sameRecipe, type WeaponRecipe } from './weapons';
export { BAG_SIZE } from './sim/loot';
export type { LoadoutView } from './loadout';
export { RUN_LEVELS } from './sim/world';
export { MAX_TIER, scoreMultiplier, tierOf } from './tier';
export {
  cleanRig,
  describeRig,
  isRigged,
  RIG_BPM,
  RIG_SUBGENRES,
  rigLoot,
  rigRun,
  type Rig,
} from './rig';
export { attachBackdrop } from './backdrop';
export {
  readFlashing,
  reducesFlashing,
  saveFlashing,
  setFlashingReduced,
  type FlashingChoice,
} from './flashing';

/** A level's subgenre and tempo, from its seed (see `genre`) or the rig. */
export const levelStyle = (run: RunState) =>
  rigStyle(styleFor(levelSeed(run), run.level), run.rig);
const DUCK_SECONDS = 0.6;
/** A press within this of the weapon's grid is on the beat. */
const ON_BEAT_SECONDS = 0.05;
/** What a timing bonus does to a shot. */
const ACCENT = {
  beat: { damage: 1.5, size: 1.35, flash: 1.5 },
  swap: { damage: 2, size: 1.6, flash: 2 },
};

/** Where `startGame` has got to, so a slow or stuck start can say so. */
export type StartStep = 'audio' | 'kit' | 'weapons';

/** What the screens show about a run's current level, before it's played. */
export const describeLevel = (run: RunState) => {
  const { key, palette } = generateLevel(levelSeed(run));
  const { style, bpm } = levelStyle(run);
  return {
    key: keyName(key),
    palette: palette.name,
    bpm,
    subgenre: style.label,
  };
};

/** What a weapon does, as numbers to compare: bigger is better in each. */
export interface WeaponStats {
  /**
   * Damage a full bar of direct hits deals, echoes included, in tenths:
   * the one number to judge a weapon by.
   */
  perBar: number;
  /** Damage per shot (or per beam tick), in tenths. */
  hit: number;
  /** Shots in a bar: a full magazine. */
  shots: number;
  /** How far a shot carries, in tiles. */
  reach: number;
  /** A blast's radius in tiles; 0 when shots don't burst. */
  area: number;
}

/** A weapon as the screens name and draw it. */
export interface WeaponCard {
  name: string;
  /** Who made it: Vandal hits harder, Lumen shoots faster. */
  maker: string;
  oscillator: OscillatorPart;
  lfo: LfoPart;
  fx: FxPart | null;
  /** A slow weapon whose shots burst. */
  blasts: boolean;
  /** Dropped by a boss: always the heavier maker with an FX. */
  bossLoot: boolean;
  /** The tier it dropped at, and the one it plays at on the run's level. */
  tier: number;
  playing: number;
  stats: WeaponStats;
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10;

/** Weapons as they play in the key of the run's current level. */
export const describeWeapons = (
  recipes: Array<WeaponRecipe>,
  run: RunState,
): Array<WeaponCard> => {
  const { key } = generateLevel(levelSeed(run));
  return recipes.map(recipe => {
    const { name, parts, projectile, timing, echo, tier } = weaponFrom(
      recipe,
      key,
      run.level,
    );
    return {
      name,
      maker: MANUFACTURERS[parts.manufacturer].label,
      oscillator: parts.oscillator,
      lfo: parts.lfo,
      fx: parts.fx,
      blasts: projectile.detonates === true,
      // Only boss loot pins its maker (see `goodLootRecipe`).
      bossLoot: recipe.manufacturer !== undefined,
      tier: tier.own,
      playing: tier.playing,
      stats: {
        perBar: Math.round(
          (projectile.damage + (echo?.damage ?? 0)) * timing.magazine * 10,
        ),
        hit: Math.round(projectile.damage * 10),
        shots: timing.magazine,
        reach: oneDecimal((projectile.speed * projectile.lifetime) / TILE_SIZE),
        area: oneDecimal((projectile.splash?.radius ?? 0) / TILE_SIZE),
      },
    };
  });
};

/** The run's weapons as the landing page previews them, in its key. */
export const describeLoadout = (run: RunState) =>
  describeWeapons(run.recipes, run);

/** What the loadout menu sorts: the slots, and the bag beside them. */
export interface Inventory {
  recipes: Array<WeaponRecipe>;
  bag: Array<WeaponRecipe>;
}

export interface Game {
  /** Mount the stage and input on the play area; returns detach. */
  attach: (element: HTMLElement) => () => void;
  /**
   * Switch to a slot and hold its trigger - a touch screen's slot button,
   * so every weapon is a press away. `releaseSlot` lets go, unless another
   * slot has been pressed since.
   */
  fireSlot: (slot: number) => void;
  releaseSlot: (slot: number) => void;
  /** Dash: Space's twin, for the touch screen's button. */
  dash: () => void;
  /** Freeze the whole game: music, clock, enemies and input. */
  pause: () => void;
  /** Must be called from a user gesture, like `startGame`. */
  resume: () => void;
  /**
   * The browser is holding the sound back (no output device, autoplay
   * rules, a phone call). The game waits, frozen like a pause, until it
   * starts; a pause the player asked for doesn't count.
   */
  soundBlocked: () => boolean;
  /** Called whenever `soundBlocked` may have changed; returns off. */
  onSound: (listener: (blocked: boolean) => void) => () => void;
  /** Try to start the sound again. Must be called from a user gesture. */
  retrySound: () => void;
  loadout: () => LoadoutView;
  /** The slots' weapons and the bag, for the loadout menu. */
  inventory: () => Inventory;
  /**
   * The loadout menu's choice: these weapons in the slots, the rest in the
   * bag. Resolves once any new ones are armed; call it while paused.
   */
  arrange: (inventory: Inventory) => Promise<void>;
  /**
   * Freeze the level for the loadout menu: a pause, with the bar the track
   * is on looping under a low-pass so the groove carries on. Call it from
   * a press (the loop's context starts on it).
   */
  openMenu: () => void;
  /**
   * Close the menu: the loop fades and the level carries on - unless it
   * was opened from the pause, which it goes back to.
   */
  closeMenu: () => void;
  /**
   * Audition a weapon: a bar of its riff in the level's key, heard even
   * while the level is frozen. Call it from a press; `onStart` fires as it
   * sounds, and it resolves when the bar ends or another preview (or
   * `stopPreview`) cuts it off.
   */
  preview: (recipe: WeaponRecipe, onStart?: () => void) => Promise<void>;
  /**
   * An A/B: `a` for a bar, `b` the next, back and forth until stopped.
   * `onTurn` says which is sounding (0 for `a`, 1 for `b`) as each starts.
   */
  previewAB: (
    a: WeaponRecipe,
    b: WeaponRecipe,
    onTurn: (which: 0 | 1) => void,
  ) => Promise<void>;
  stopPreview: () => void;
  /** Called on every weapon switch or reroll; returns unsubscribe. */
  onLoadout: (listener: (view: LoadoutView) => void) => () => void;
  hud: () => HudView;
  /** The run as it stands, moved on to the next level - after a clear. */
  nextRun: () => RunState;
  /** Play-testing: clear the level now, as if the exit were taken. */
  skipLevel: () => void;
  /** Play-testing: put `recipes` in the bag, in place of what's there. */
  stockBag: (recipes: Array<WeaponRecipe>) => void;
  /** Called whenever health, kills or the run's status change. */
  onHud: (listener: (view: HudView) => void) => () => void;
  stop: () => void;
}

/**
 * Must be called from a user gesture (a click), before anything else that
 * spends it, like a fullscreen request: it starts the AudioContext, which
 * browsers block until then.
 */
export const startGame = async ({
  run,
  stress = false,
  onStep = () => {},
  latencyHint,
}: {
  run: RunState;
  /** Fill the level with enemies from the first bar - for perf checks. */
  stress?: boolean;
  onStep?: (step: StartStep) => void;
  /** The audio buffer to ask for; only the first start of a page sets it. */
  latencyHint?: AudioContextLatencyCategory;
}): Promise<Game> => {
  onStep('audio');
  const audio = await startAudio({ latencyHint });
  /** The audio time of what the speakers are playing right now. */
  const heardNow = () =>
    heardTime(audio.outputTimestamp(), performance.now(), immediate());

  const seed = levelSeed(run);
  const level = generateLevel(seed);
  const { key } = level;
  const rootHz = (octave: number) => midiToHz(degreeToMidi(key, 0, octave));

  const { style, bpm } = levelStyle(run);
  const stepSeconds = secondsPerStep(bpm);
  const beatSeconds = stepSeconds * STEPS_PER_BEAT;
  const pulses: Pulses = {
    kick: createPulse({ decay: 0.14 }),
    beat: createPulse({ decay: 0.1 }),
    shot: createPulse({ decay: 0.08 }),
    kill: createPulse({ decay: 0.12 }),
    hit: createPulse({ decay: 0.18 }),
    drop: createPulse({ decay: 0.5 }),
  };

  const bus = createBus<GameEvents>();
  const musicBus = createMusicBus();
  onStep('kit');
  const drums = createDrums({
    seed,
    style: style.drums,
    output: musicBus.input,
    kickHz: rootHz(1),
    onHit: hit => {
      if (hit.voice !== 'kick') return;
      pulses.kick.hit(hit.time, hit.velocity);
      musicBus.pump(hit.time, hit.velocity, SOUND_DESIGN.mix);
    },
  });
  const reloadSound = createReloadSound(musicBus.direct);
  const rechargeSound = createRechargeSound(musicBus.direct);
  // The level's chords: the pad, the backing layers and every weapon's
  // riff follow them. They restart with the song, so a drop lands home.
  const progression = progressionFor(seed, key);
  let songStartBar = 0;
  const chordBar = (bar: number) => bar - songStartBar;
  const arrangement = createArrangement({
    musicBus,
    output: musicBus.input,
    barSeconds: beatSeconds * 4,
    rootHz: rootHz(1),
    key,
    progression,
  });
  const backing = createBacking({
    output: musicBus.bed,
    key,
    seed,
    progression,
    stepSeconds,
  });
  /** A riff note moved onto the chord of the bar being played. */
  const onChord = (note: number) =>
    lastTick
      ? transposeInKey(
          key,
          note,
          shiftFor(chordAt(progression, chordBar(lastTick.bar)).degree),
        )
      : note;
  const impact = createImpactSound({
    output: musicBus.direct,
    root: rootHz(1),
  });
  const blast = createBlastSound({
    output: musicBus.direct,
    root: rootHz(1),
  });
  const score = createScoreSound({
    output: musicBus.direct,
    key,
    beatSeconds,
  });
  const chord = createChordSound({ output: musicBus.direct, key });

  const arm = async (recipe: WeaponRecipe): Promise<Armed> => {
    const weapon = weaponFrom(recipe, key, run.level);
    const volume = await measureWeaponLoudness(weapon, { bpm });
    const voice = createWeaponVoice({
      output: musicBus.weapons,
      sound: weapon.sound,
      beatSeconds,
      volume,
    });
    const { projectile, echo } = weapon;
    const slot = createWeaponSlot({
      spec: weapon.timing,
      voice: {
        fire: (time, duration, shot, accent) => {
          voice.fire(time, duration, shot, onChord);
          backing.duck(time);
          const bonus = accent ? ACCENT[accent] : null;
          pulses.shot.hit(time, bonus?.flash ?? 1);
          const angle = spreadAngle(shot, projectile.spread);
          const spec = bonus
            ? {
                ...projectile,
                damage: projectile.damage * bonus.damage,
                radius: projectile.radius * bonus.size,
              }
            : projectile;
          bus.emit('shot', { time, spec, angle });
          if (!echo) return;
          bus.emit('shot', {
            time: time + echo.delayBeats * beatSeconds,
            spec: { ...projectile, damage: echo.damage },
            angle: -angle,
          });
        },
      },
      reloadSound: projectile.kind === 'beam' ? rechargeSound : reloadSound,
      bpm,
      now,
    });
    return { recipe, weapon, slot, voice };
  };

  const listeners = new Set<(view: LoadoutView) => void>();
  const hudListeners = new Set<(view: HudView) => void>();
  let hud = initialHud(run);
  onStep('weapons');
  const loadout = await createLoadout({
    recipes: run.recipes,
    active: run.active,
    arm,
    now: immediate,
    stepSeconds,
    onChange: view => listeners.forEach(listener => listener(view)),
  });

  let lastTick: Tick | null = null;
  let drumsIn = false;
  /** Did a press land within the beat window of the active weapon's grid? */
  const onBeat = () => {
    if (!lastTick) return false;
    const steps = STEPS_PER_DIVISION[loadout.activeWeapon().timing.division];
    const anchor = lastTick.time - (lastTick.step % steps) * stepSeconds;
    const error = gridError(heardNow(), anchor, steps * stepSeconds);
    return Math.abs(error) <= ON_BEAT_SECONDS;
  };
  // Suspending the AudioContext stops its clock, and every time in the
  // game (Transport, scheduled sound, hops, pulses) is read off it, so the
  // game picks up on resume exactly where it stopped.
  let paused = false;
  const soundBlocked = () => !paused && !audio.running();
  /** Paused, or waiting on the sound: the game holds still either way. */
  const frozen = () => paused || soundBlocked();
  const soundListeners = new Set<(blocked: boolean) => void>();
  const tellSound = () =>
    soundListeners.forEach(listener => listener(soundBlocked()));
  const offAudio = audio.onChange(tellSound);
  const pause = () => {
    if (paused) return;
    paused = true;
    loadout.release();
    void audio.suspend();
    tellSound();
  };
  const resume = () => {
    if (!paused) return;
    paused = false;
    // Told once the resume settles, so a moment of starting up doesn't
    // flash "sound blocked"; a refused resume is told after the wait.
    void audio.resume().then(tellSound);
  };

  const trigger = {
    press: () => {
      if (!frozen()) loadout.press({ onBeat: onBeat() });
    },
    release: loadout.release,
  };

  const unsubscribe = [
    bus.on('tick', tick => {
      lastTick = tick;
    }),
    // Silent until the circle's slam brings them in (see `startDrums`).
    bus.on('tick', tick => {
      if (drumsIn) drums.onTick(tick);
    }),
    bus.on('tick', loadout.onTick),
    bus.on('tick', tick => {
      if (tick.sixteenth === 0) pulses.beat.hit(tick.time);
    }),
  ];
  const clock = createClock({
    bpm,
    onTick: tick => bus.emit('tick', tick),
  });
  clock.start();
  const previewer = createPreviewer({ barSeconds: beatSeconds * 4 });
  /** What the track's playing, for the menu's loop. */
  let playingSection: { section: Section; part: SongPart | null } = {
    section: 'calm',
    part: null,
  };
  let trackIn = false;
  let menuOpen = false;
  /** The menu was opened over the pause: closing it goes back there. */
  let menuOverPause = false;
  /** The riff moved onto the chord being played, as a preview plays it. */
  const chordShift = () =>
    lastTick
      ? shiftFor(chordAt(progression, chordBar(lastTick.bar)).degree)
      : 0;
  /** Each weapon's preview, rendered once. */
  const previews = new Map<string, Promise<AudioBuffer>>();
  /** Bumped by every preview and stop, so a slow render can't play late. */
  let previewTurn = 0;
  const previewOf = (recipe: WeaponRecipe) => {
    const shift = chordShift();
    const id = `${JSON.stringify(recipe)}@${shift}`;
    const known = previews.get(id);
    if (known) return known;
    const rendering = renderWeaponPreview(weaponFrom(recipe, key, run.level), {
      bpm,
      pitch: note => transposeInKey(key, note, shift),
    });
    previews.set(id, rendering);
    // A failed render is tried again next time, not remembered.
    rendering.catch(() => previews.delete(id));
    return rendering;
  };
  let mounted: Play | null = null;
  /** The bag while no stage holds it: before it mounts, after it's gone. */
  let detachedBag = run.bag;
  const bag = () => mounted?.bag() ?? detachedBag;
  let dash = () => {};

  return {
    attach: element => {
      // The stage mounts asynchronously; a detach before it's ready still
      // has to tear it down once it arrives.
      const play = startPlay({
        element,
        level,
        rules: rulesFor({
          level: run.level,
          stress: stress || Boolean(run.rig?.stress),
          pressure: style.pressure,
          god: run.rig?.god,
        }),
        carry: run,
        seed,
        bus,
        trigger,
        onHud: view => {
          hud = view;
          hudListeners.forEach(listener => listener(view));
        },
        onWeaponAction: action => {
          if (!frozen()) loadout.act(action);
        },
        isPaused: frozen,
        pulses,
        sounds: {
          impact: impact.play,
          score: score.play,
          blast: blast.play,
          duck: time => musicBus.duck(time, DUCK_SECONDS),
          dead: musicBus.muffle,
          section: (section, at) => {
            const bar = chordBar(at.bar);
            playingSection = { section, part: at.part };
            arrangement.onBar(section, { ...at, chordBar: bar });
            backing.onBar({ time: at.time, bar, part: at.part });
          },
          charge: arrangement.charge,
          uncharge: arrangement.uncharge,
          dropHit: arrangement.drop,
          heal: time => score.play(time, MAX_MULTIPLIER),
          volley: blast.play,
          chord: time => {
            const bar = lastTick ? chordBar(lastTick.bar) : 0;
            chord.play(time, chordAt(progression, bar).degree);
          },
          halfTime: drums.halfTime,
          startDrums: tick => {
            songStartBar = tick.bar;
            // The slam's own tick has already gone by the drums: play it.
            if (!drumsIn) drums.onTick(tick);
            drumsIn = true;
            trackIn = true;
          },
        },
        stepSeconds,
        audioNow: immediate,
        heardNow,
      });
      void play.then(started => {
        mounted = started;
        dash = started.dash;
      });
      return () => {
        // The bag outlives the stage: the end-of-run menu still sorts it.
        const kept = bag();
        mounted = null;
        detachedBag = kept;
        dash = () => {};
        void play.then(started => started.detach());
      };
    },
    dash: () => {
      if (!frozen()) dash();
    },
    fireSlot: slot => {
      if (frozen() || hud.status !== 'playing') return;
      loadout.act({ type: 'select', slot });
      trigger.press();
    },
    releaseSlot: slot => {
      if (loadout.active() === slot) trigger.release();
    },
    pause,
    resume,
    soundBlocked,
    onSound: listener => {
      soundListeners.add(listener);
      return () => soundListeners.delete(listener);
    },
    retrySound: () => {
      void audio.resume().then(tellSound);
    },
    loadout: loadout.view,
    inventory: () => ({ recipes: loadout.recipes(), bag: bag() }),
    arrange: async ({ recipes, bag: sorted }) => {
      await loadout.arrange(recipes);
      if (mounted) mounted.setBag(sorted);
      else detachedBag = sorted;
    },
    openMenu: () => {
      previewer.prime();
      menuOverPause = paused;
      pause();
      menuOpen = true;
      if (!lastTick || hud.status !== 'playing') return;
      const at = lastTick;
      void renderMenuLoop({
        seed,
        key,
        progression,
        bpm,
        rootHz: rootHz(1),
        bar: at.bar,
        chordBar: chordBar(at.bar),
        drums: trackIn,
        ...playingSection,
      }).then(
        bar => {
          // Closed again while it rendered: nothing to loop under.
          if (menuOpen) previewer.startLoop(bar);
        },
        (error: unknown) => console.error(error),
      );
    },
    closeMenu: () => {
      menuOpen = false;
      previewTurn += 1;
      previewer.stop();
      previewer.stopLoop();
      if (!menuOverPause) resume();
    },
    preview: async (recipe, onStart) => {
      previewer.prime();
      const turn = ++previewTurn;
      previewer.stop();
      const buffer = await previewOf(recipe);
      if (turn !== previewTurn) return;
      // Rejects, rather than hanging, when the browser holds the sound back.
      await new Promise<void>((resolve, reject) => {
        previewer
          .play(buffer, {
            leadIn: PREVIEW_LEAD_IN,
            onTurn: () => onStart?.(),
            onEnd: resolve,
          })
          .catch(reject);
      });
    },
    previewAB: async (a, b, onTurn) => {
      previewer.prime();
      const turn = ++previewTurn;
      previewer.stop();
      // One after the other: offline renders take turns anyway.
      const first = await previewOf(a);
      const second = await previewOf(b);
      if (turn !== previewTurn) return;
      await new Promise<void>((resolve, reject) => {
        previewer
          .alternate(first, second, {
            leadIn: PREVIEW_LEAD_IN,
            onTurn: bar => onTurn(bar % 2 === 0 ? 0 : 1),
            onEnd: resolve,
          })
          .catch(reject);
      });
    },
    stopPreview: () => {
      previewTurn += 1;
      previewer.stop();
    },
    hud: () => hud,
    skipLevel: () => mounted?.skip(),
    stockBag: recipes => {
      detachedBag = recipes;
      mounted?.setBag(recipes);
    },
    nextRun: () =>
      nextLevel(run, {
        hp: hud.hp,
        kills: hud.kills,
        score: hud.score,
        recipes: loadout.recipes(),
        active: loadout.active(),
        bag: bag(),
      }),
    onHud: listener => {
      hudListeners.add(listener);
      return () => hudListeners.delete(listener);
    },
    onLoadout: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop: () => {
      offAudio();
      previewer.dispose();
      soundListeners.clear();
      unsubscribe.forEach(off => off());
      clock.dispose();
      [
        drums,
        loadout,
        reloadSound,
        rechargeSound,
        impact,
        blast,
        score,
        chord,
        arrangement,
        backing,
        musicBus,
      ].forEach(node => node.dispose());
    },
  };
};
