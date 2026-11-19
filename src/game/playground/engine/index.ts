import { getDestination, immediate, Meter, now } from 'tone';
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
  measureWeaponLoudness,
  type Arrangement,
  type BlastSound,
  type Drums,
  type ImpactSound,
  type ReloadSound,
  type ScoreSound,
  type WeaponVoice,
  startAudio,
} from '../../audio';
import { createBus } from '../../bus';
import { createClock, type ClockEvents, type Tick } from '../../clock';
import {
  nextGridTime,
  secondsPerStep,
  STEPS_PER_BAR,
  STEPS_PER_BEAT,
} from '../../grid';
import { degreeToMidi, midiToHz, type Key } from '../../music';
import { createRng } from '../../rng';
import { MAX_MULTIPLIER } from '../../sim/combo';
import { createWeaponSlot, type WeaponSlot } from '../../sim';
import type { Section } from '../../sim/survival';
import type { SoundDesign } from '../../sound';
import type { Weapon } from '../../weapons';

/** How the playground fires the weapon while you turn knobs. */
export type FireMode = 'off' | 'hold' | 'mash';

export type OneShot =
  'impact' | 'score' | 'blast' | 'reload' | 'recharge' | 'riser' | 'drop';

export interface Playground {
  /**
   * Rebuild the track (drums, arrangement, impact, reload) from a new
   * design. Re-arm the weapon after: its sound comes from the design too.
   */
  setDesign: (design: SoundDesign) => Promise<void>;
  setKey: (key: Key) => Promise<void>;
  /** Arm a weapon; resolves with the gain loudness normalization gave it. */
  setWeapon: (weapon: Weapon) => Promise<number>;
  setDrums: (on: boolean) => void;
  setFire: (mode: FireMode) => void;
  /** One quantized shot, like a single click in the game. */
  tap: () => void;
  /** The arrangement section the track plays, from the next bar. */
  setSection: (section: Section) => void;
  play: (sound: OneShot) => void;
  /** Output level in dB, for a meter. */
  level: () => number;
  dispose: () => void;
}

export const BPM = 140;
/** In mash mode, the chance of a tap on each 1/8. */
const MASH_DENSITY = 0.55;

/**
 * The game's own voices, drums and arrangement on the game's clock, driven
 * by audition controls instead of a fight. Must start from a click: it
 * starts the AudioContext.
 */
export const createPlayground = async ({
  design: initialDesign,
  key: initialKey,
}: {
  design: SoundDesign;
  key: Key;
}): Promise<Playground> => {
  await startAudio();

  const stepSeconds = secondsPerStep(BPM);
  const beatSeconds = stepSeconds * STEPS_PER_BEAT;
  const musicBus = createMusicBus();
  const meter = new Meter({ smoothing: 0.85 });
  getDestination().connect(meter);

  let design = initialDesign;
  let key = initialKey;
  let weapon: Weapon | null = null;
  let drumsOn = true;
  let fire: FireMode = 'off';
  let section: Section = 'groove';
  let lastTick: Tick | null = null;
  const mashRng = createRng(1);

  let drums: Drums | null = null;
  let arrangement: Arrangement | null = null;
  let impact: ImpactSound | null = null;
  let reload: ReloadSound | null = null;
  let recharge: ReloadSound | null = null;
  let score: ScoreSound | null = null;
  let blast: BlastSound | null = null;
  /** Each score press is the next kill in a combo, wrapping at the top. */
  let combo = 0;
  let voice: WeaponVoice | null = null;
  let slot: WeaponSlot | null = null;

  const rootHz = () => midiToHz(degreeToMidi(key, 0, 1));

  // Building voices and measuring loudness offline can't overlap (`Offline`
  // swaps Tone's global context), so every rebuild waits its turn.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = queue.then(task);
    queue = next.catch(() => undefined);
    return next;
  };

  const buildTrack = async () => {
    drums?.dispose();
    arrangement?.dispose();
    impact?.dispose();
    reload?.dispose();
    recharge?.dispose();
    score?.dispose();
    blast?.dispose();
    drums = await createDrums({
      seed: 1,
      output: musicBus.input,
      kickHz: rootHz(),
      patch: design.drums,
      onHit: hit => {
        if (hit.voice === 'kick') {
          musicBus.pump(hit.time, hit.velocity, design.mix);
        }
      },
    });
    arrangement = createArrangement({
      musicBus,
      output: musicBus.input,
      barSeconds: beatSeconds * 4,
      rootHz: rootHz(),
      key,
      patch: design.arrangement,
    });
    impact = createImpactSound({
      output: musicBus.direct,
      root: rootHz(),
      patch: design.impact,
    });
    reload = createReloadSound(musicBus.direct, design.reload);
    recharge = createRechargeSound(musicBus.direct, design.recharge);
    blast = createBlastSound({
      output: musicBus.direct,
      root: rootHz(),
      patch: design.blast,
    });
    score = createScoreSound({
      output: musicBus.direct,
      key,
      beatSeconds,
      patch: design.score,
    });
  };

  const buildWeapon = async (): Promise<number> => {
    if (!weapon) return 0;
    const armed = weapon;
    const volume = await measureWeaponLoudness(armed, { bpm: BPM, design });
    voice?.dispose();
    voice = createWeaponVoice({
      output: musicBus.weapons,
      sound: armed.sound,
      beatSeconds,
      volume,
      design,
    });
    const live = voice;
    const fill = () => (armed.projectile.kind === 'beam' ? recharge : reload);
    slot = createWeaponSlot({
      spec: armed.timing,
      voice: {
        fire: (time, duration, shot) => live.fire(time, duration, shot),
      },
      // Looked up per cue: a design change rebuilds the track's sounds.
      reloadSound: {
        click: time => fill()?.click(time),
        rumble: (time, duration) => fill()?.rumble(time, duration),
      },
      bpm: BPM,
      now,
    });
    if (fire === 'hold') slot.press();
    return volume;
  };

  await buildTrack();

  const bus = createBus<ClockEvents>();
  bus.on('tick', tick => {
    lastTick = tick;
    if (drumsOn) drums?.onTick(tick);
    if (tick.stepInBar === 0) {
      arrangement?.onBar(section, { time: tick.time, bar: tick.bar });
    }
    if (
      fire === 'mash' &&
      tick.step % 2 === 0 &&
      mashRng.chance(MASH_DENSITY)
    ) {
      slot?.press();
      slot?.release();
    }
    slot?.onTick(tick);
  });
  const clock = createClock({
    bpm: BPM,
    onTick: tick => bus.emit('tick', tick),
  });
  clock.start();

  /** The next 1/16 that can still be scheduled, or the next bar line. */
  const nextStep = () =>
    lastTick
      ? nextGridTime({ now: immediate(), anchor: lastTick.time, stepSeconds })
      : immediate() + 0.05;
  const nextBar = () => {
    if (!lastTick) return immediate() + 0.05;
    const stepsLeft = STEPS_PER_BAR - lastTick.stepInBar;
    return lastTick.time + stepsLeft * stepSeconds;
  };

  return {
    setDesign: next =>
      serial(async () => {
        design = next;
        await buildTrack();
      }),
    setKey: next =>
      serial(async () => {
        key = next;
        await buildTrack();
      }),
    setWeapon: next =>
      serial(async () => {
        weapon = next;
        return buildWeapon();
      }),
    setDrums: on => {
      drumsOn = on;
    },
    setFire: mode => {
      fire = mode;
      if (mode === 'hold') slot?.press();
      else slot?.release();
    },
    tap: () => {
      slot?.press();
      slot?.release();
    },
    setSection: next => {
      section = next;
    },
    play: sound => {
      if (sound === 'impact') impact?.play(nextStep());
      if (sound === 'blast') blast?.play(nextStep());
      if (sound === 'score') {
        combo = (combo % MAX_MULTIPLIER) + 1;
        const time = nextStep();
        impact?.play(time);
        score?.play(time, combo);
      }
      if (sound === 'reload' || sound === 'recharge') {
        const time = nextStep();
        const fill = sound === 'reload' ? reload : recharge;
        fill?.click(time);
        fill?.rumble(time + beatSeconds / 2, beatSeconds * 3);
      }
      if (sound === 'riser') arrangement?.riser(nextBar());
      if (sound === 'drop') arrangement?.drop(nextBar());
    },
    level: () => {
      const value = meter.getValue();
      return typeof value === 'number' ? value : Math.max(...value);
    },
    dispose: () => {
      clock.dispose();
      [
        drums,
        arrangement,
        impact,
        reload,
        recharge,
        score,
        blast,
        voice,
      ].forEach(node => node?.dispose());
      meter.dispose();
      musicBus.dispose();
    },
  };
};
