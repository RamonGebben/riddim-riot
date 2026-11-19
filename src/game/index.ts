import { immediate, now } from 'tone';
import {
  createArrangement,
  createBlastSound,
  createDrums,
  createImpactSound,
  createMusicBus,
  createRechargeSound,
  createReloadSound,
  createScoreSound,
  createWeaponVoice,
  heardTime,
  startAudio,
  measureWeaponLoudness,
} from './audio';
import { createBus } from './bus';
import { createClock, type Tick } from './clock';
import type { GameEvents } from './events';
import { initialHud, type HudView } from './hud';
import {
  gridError,
  secondsPerStep,
  STEPS_PER_BEAT,
  STEPS_PER_DIVISION,
} from './grid';
import { createLoadout, type Armed, type LoadoutView } from './loadout';
import { generateLevel } from './level';
import { degreeToMidi, keyName, midiToHz } from './music';
import { startPlay, type Pulses } from './play';
import { rulesFor } from './sim/world';
import { createPulse } from './render/pulse';
import { levelSeed, nextLevel, type RunState } from './run';
import { createWeaponSlot } from './sim';
import { MAX_MULTIPLIER } from './sim/combo';
import { SOUND_DESIGN } from './sound';
import { spreadAngle, weaponFrom, type WeaponRecipe } from './weapons';

export type { HudView } from './hud';
export { levelSeed, newRun, type RunState } from './run';
export type { LoadoutView } from './loadout';
export { RUN_LEVELS } from './sim/world';

/** Fixed for the PoC; the level seed picks it later. */
export const BPM = 140;
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
  return { key: keyName(key), palette: palette.name, bpm: BPM };
};

export interface Game {
  /** Mount the stage and input on the play area; returns detach. */
  attach: (element: HTMLElement) => () => void;
  /** Take the weapon the player is standing on, for touch screens. */
  takeWeapon: () => void;
  /**
   * Switch to a slot and hold its trigger - a touch screen's slot button,
   * so every weapon is a press away. `releaseSlot` lets go, unless another
   * slot has been pressed since.
   */
  fireSlot: (slot: number) => void;
  releaseSlot: (slot: number) => void;
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
  /** Called on every weapon switch or reroll; returns unsubscribe. */
  onLoadout: (listener: (view: LoadoutView) => void) => () => void;
  hud: () => HudView;
  /** The run as it stands, moved on to the next level - after a clear. */
  nextRun: () => RunState;
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

  const stepSeconds = secondsPerStep(BPM);
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
  const arrangement = createArrangement({
    musicBus,
    output: musicBus.input,
    barSeconds: beatSeconds * 4,
    rootHz: rootHz(1),
    key,
  });
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

  const arm = async (recipe: WeaponRecipe): Promise<Armed> => {
    const weapon = weaponFrom(recipe, key);
    const volume = await measureWeaponLoudness(weapon, { bpm: BPM });
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
          voice.fire(time, duration, shot);
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
      bpm: BPM,
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
    bpm: BPM,
    onTick: tick => bus.emit('tick', tick),
  });
  clock.start();
  let takeWeapon = () => {};

  return {
    attach: element => {
      // The stage mounts asynchronously; a detach before it's ready still
      // has to tear it down once it arrives.
      const play = startPlay({
        element,
        level,
        rules: rulesFor({ level: run.level, stress }),
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
        swapWeapon: loadout.replaceActive,
        pulses,
        sounds: {
          impact: impact.play,
          score: score.play,
          blast: blast.play,
          duck: time => musicBus.duck(time, DUCK_SECONDS),
          dead: musicBus.muffle,
          section: arrangement.onBar,
          charge: arrangement.charge,
          dropHit: arrangement.drop,
          heal: time => score.play(time, MAX_MULTIPLIER),
          volley: blast.play,
          startDrums: tick => {
            // The slam's own tick has already gone by the drums: play it.
            if (!drumsIn) drums.onTick(tick);
            drumsIn = true;
          },
        },
        stepSeconds,
        audioNow: immediate,
        heardNow,
      });
      void play.then(mounted => {
        takeWeapon = mounted.takeWeapon;
      });
      return () => {
        takeWeapon = () => {};
        void play.then(mounted => mounted.detach());
      };
    },
    takeWeapon: () => {
      if (!frozen()) takeWeapon();
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
    hud: () => hud,
    nextRun: () =>
      nextLevel(run, {
        hp: hud.hp,
        kills: hud.kills,
        score: hud.score,
        recipes: loadout.recipes(),
        active: loadout.active(),
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
        arrangement,
        musicBus,
      ].forEach(node => node.dispose());
    },
  };
};
