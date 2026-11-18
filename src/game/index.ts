import { getContext, immediate, now, start } from 'tone';
import {
  createArrangement,
  createDrums,
  createImpactSound,
  createMusicBus,
  createReloadSound,
  createWeaponVoice,
  heardTime,
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
import { spreadAngle, weaponFrom, type WeaponRecipe } from './weapons';

export type { HudView } from './hud';
export { levelSeed, newRun, type RunState } from './run';
export type { LoadoutView } from './loadout';

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

/** What the screens show about a run's current level, before it's played. */
export const describeLevel = (run: RunState) => {
  const { key, palette } = generateLevel(levelSeed(run));
  return { key: keyName(key), palette: palette.name, bpm: BPM };
};

/** The audio time of what the speakers are playing right now. */
const heardNow = () => {
  const raw = getContext().rawContext;
  const timestamp =
    raw instanceof AudioContext ? raw.getOutputTimestamp() : undefined;
  return heardTime(timestamp, performance.now(), immediate());
};

export interface Game {
  /** Mount the stage and input on the play area; returns detach. */
  attach: (element: HTMLElement) => () => void;
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
 * Must be called from a user gesture (a click): it starts the AudioContext,
 * which browsers block until then.
 */
export const startGame = async ({
  run,
  stress = false,
}: {
  run: RunState;
  /** Fill the level with enemies from the first bar - for perf checks. */
  stress?: boolean;
}): Promise<Game> => {
  await start();

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
  const drums = await createDrums({
    seed,
    output: musicBus.input,
    kickHz: rootHz(1),
    onHit: hit => {
      if (hit.voice === 'kick') pulses.kick.hit(hit.time, hit.velocity);
    },
  });
  const reloadSound = createReloadSound(musicBus.direct);
  const arrangement = createArrangement({
    musicBus,
    output: musicBus.input,
    barSeconds: beatSeconds * 4,
    rootHz: rootHz(1),
  });
  const impact = createImpactSound({
    output: musicBus.direct,
    root: rootHz(1),
  });

  const arm = async (recipe: WeaponRecipe): Promise<Armed> => {
    const weapon = weaponFrom(recipe, key);
    const volume = await measureWeaponLoudness(weapon, { bpm: BPM });
    const voice = createWeaponVoice({
      output: musicBus.direct,
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
      reloadSound,
      bpm: BPM,
      now,
    });
    return { recipe, weapon, slot, voice };
  };

  const listeners = new Set<(view: LoadoutView) => void>();
  const hudListeners = new Set<(view: HudView) => void>();
  let hud = initialHud(run);
  const loadout = await createLoadout({
    recipes: run.recipes,
    active: run.active,
    arm,
    now: immediate,
    onChange: view => listeners.forEach(listener => listener(view)),
  });

  let lastTick: Tick | null = null;
  /** Did a press land within the beat window of the active weapon's grid? */
  const onBeat = () => {
    if (!lastTick) return false;
    const steps = STEPS_PER_DIVISION[loadout.activeWeapon().timing.division];
    const anchor = lastTick.time - (lastTick.step % steps) * stepSeconds;
    const error = gridError(heardNow(), anchor, steps * stepSeconds);
    return Math.abs(error) <= ON_BEAT_SECONDS;
  };
  const trigger = {
    press: () => loadout.press({ onBeat: onBeat() }),
    release: loadout.release,
  };

  const unsubscribe = [
    bus.on('tick', tick => {
      lastTick = tick;
    }),
    bus.on('tick', drums.onTick),
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
        onWeaponAction: loadout.act,
        swapWeapon: loadout.replaceActive,
        pulses,
        sounds: {
          impact: impact.play,
          duck: time => musicBus.duck(time, DUCK_SECONDS),
          dead: musicBus.muffle,
          section: arrangement.onBar,
        },
        stepSeconds,
        audioNow: immediate,
        heardNow,
      });
      return () => {
        play.then(detach => detach());
      };
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
      unsubscribe.forEach(off => off());
      clock.dispose();
      [drums, loadout, reloadSound, impact, arrangement, musicBus].forEach(
        node => node.dispose(),
      );
    },
  };
};
