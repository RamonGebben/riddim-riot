import { getDestination, immediate, Meter, now } from 'tone';
import {
  createArrangement,
  createBacking,
  createBlastSound,
  createChordSound,
  createDrums,
  createImpactSound,
  createMusicBus,
  createRechargeSound,
  createReloadSound,
  createScoreSound,
  createWeaponVoice,
  measureWeaponLoudness,
  type Arrangement,
  type Backing,
  type BlastSound,
  type ChordSound,
  type Drums,
  type ImpactSound,
  type ReloadSound,
  type ScoreSound,
  type WeaponVoice,
  heardTime,
  startAudio,
} from '../../audio';
import { createBus } from '../../bus';
import { createClock, type Tick } from '../../clock';
import type { GameEvents } from '../../events';
import {
  nextGridTime,
  secondsPerStep,
  STEPS_PER_BAR,
  STEPS_PER_BEAT,
} from '../../grid';
import {
  chordAt,
  progressionFor,
  shiftFor,
  transposeInKey,
} from '../../harmony';
import { degreeToMidi, midiToHz, type Key } from '../../music';
import { createRng } from '../../rng';
import { MAX_MULTIPLIER } from '../../sim/combo';
import { createWeaponSlot, type WeaponSlot } from '../../sim';
import type { Pulses } from '../../play';
import { createPulse } from '../../render/pulse';
import type { Section, SongPart } from '../../sim/survival';
import type { SoundDesign } from '../../sound';
import { spreadAngle, type Weapon } from '../../weapons';
import { startRange } from '../field';

/** How the playground fires the weapon while you turn knobs. */
export type FireMode = 'off' | 'hold' | 'mash';

export type OneShot =
  | 'impact'
  | 'score'
  | 'blast'
  | 'reload'
  | 'recharge'
  | 'chord'
  | 'riser'
  | 'drop';

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
  /**
   * Mount the firing range on `element`: the player and dummies, fired at
   * with the weapon as in a level. Returns detach.
   */
  attachRange: (element: HTMLElement) => () => void;
  /**
   * Which riff note is sounding: the shot's index in the magazine, as
   * heard, or null while nothing has fired. For drawing, once a frame.
   */
  riffNote: () => number | null;
  /** The arrangement section the track plays, from the next bar. */
  setSection: (section: Section) => void;
  play: (sound: OneShot) => void;
  /** Output level in dB, for a meter. */
  level: () => number;
  dispose: () => void;
}

export const BPM = 140;
/** The playground's harmony and backing patterns come from this seed. */
const PLAYGROUND_SEED = 1;

/** A song part for each section, so the backing layers play as in a level. */
const SECTION_PARTS = {
  calm: 'breakdown',
  groove: 'bridge',
  build: 'buildup',
  drop: 'drop3',
} satisfies Record<Section, SongPart>;

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
  const audio = await startAudio();
  /** The audio time of what the speakers are playing right now. */
  const heardNow = () =>
    heardTime(audio.outputTimestamp(), performance.now(), immediate());

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
  let backing: Backing | null = null;
  let progression = progressionFor(PLAYGROUND_SEED, key);
  let impact: ImpactSound | null = null;
  let reload: ReloadSound | null = null;
  let recharge: ReloadSound | null = null;
  let score: ScoreSound | null = null;
  let blast: BlastSound | null = null;
  let chord: ChordSound | null = null;
  /** Each score press is the next kill in a combo, wrapping at the top. */
  let combo = 0;
  let voice: WeaponVoice | null = null;
  let slot: WeaponSlot | null = null;
  /** The shots fired, newest last, as the riff view reads them. */
  let fired: Array<{ time: number; shot: number }> = [];
  const pulses: Pulses = {
    kick: createPulse({ decay: 0.14 }),
    beat: createPulse({ decay: 0.1 }),
    shot: createPulse({ decay: 0.08 }),
    kill: createPulse({ decay: 0.12 }),
    hit: createPulse({ decay: 0.18 }),
    drop: createPulse({ decay: 0.5 }),
  };
  const bus = createBus<GameEvents>();

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
    backing?.dispose();
    impact?.dispose();
    reload?.dispose();
    recharge?.dispose();
    score?.dispose();
    blast?.dispose();
    chord?.dispose();
    drums = createDrums({
      seed: 1,
      output: musicBus.input,
      kickHz: rootHz(),
      patch: design.drums,
      onHit: hit => {
        if (hit.voice === 'kick') {
          musicBus.pump(hit.time, hit.velocity, design.mix);
          pulses.kick.hit(hit.time, hit.velocity);
        }
      },
    });
    progression = progressionFor(PLAYGROUND_SEED, key);
    arrangement = createArrangement({
      musicBus,
      output: musicBus.input,
      barSeconds: beatSeconds * 4,
      rootHz: rootHz(),
      key,
      progression,
      patch: design.arrangement,
    });
    backing = createBacking({
      output: musicBus.bed,
      key,
      seed: PLAYGROUND_SEED,
      progression,
      stepSeconds: beatSeconds / 4,
      patch: design.backing,
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
    chord = createChordSound({
      output: musicBus.direct,
      key,
      patch: design.chord,
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
        fire: (time, duration, shot) => {
          const { projectile, echo } = armed;
          const angle = spreadAngle(shot, projectile.spread);
          bus.emit('shot', { time, spec: projectile, angle });
          if (echo) {
            bus.emit('shot', {
              time: time + echo.delayBeats * beatSeconds,
              spec: { ...projectile, damage: echo.damage },
              angle: -angle,
            });
          }
          pulses.shot.hit(time);
          fired = [...fired.slice(-15), { time, shot }];
          live.fire(time, duration, shot, note =>
            lastTick
              ? transposeInKey(
                  key,
                  note,
                  shiftFor(chordAt(progression, lastTick.bar).degree),
                )
              : note,
          );
          backing?.duck(time);
        },
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

  bus.on('tick', tick => {
    lastTick = tick;
    if (tick.sixteenth === 0) pulses.beat.hit(tick.time);
    if (drumsOn) drums?.onTick(tick);
    if (tick.stepInBar === 0) {
      const at = { time: tick.time, bar: tick.bar };
      arrangement?.onBar(section, { ...at, chordBar: tick.bar });
      backing?.onBar({ ...at, part: SECTION_PARTS[section] });
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
    attachRange: element => {
      // The stage mounts asynchronously; a detach before it's ready still
      // has to tear it down once it arrives.
      const range = startRange({
        element,
        key,
        bus,
        trigger: {
          press: () => slot?.press(),
          // A held latch keeps firing after the click lets go.
          release: () => {
            if (fire !== 'hold') slot?.release();
          },
        },
        pulses,
        sounds: {
          impact: time => impact?.play(time),
          score: (time, count) =>
            score?.play(time, Math.min(Math.max(count, 1), MAX_MULTIPLIER)),
          blast: time => blast?.play(time),
        },
        stepSeconds,
        audioNow: immediate,
        heardNow,
      });
      return () => void range.then(started => started.detach());
    },
    riffNote: () => {
      const heard = heardNow();
      return fired.findLast(entry => entry.time <= heard)?.shot ?? null;
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
      if (sound === 'chord') chord?.play(nextStep(), 0);
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
        backing,
        impact,
        reload,
        recharge,
        score,
        blast,
        chord,
        voice,
      ].forEach(node => node?.dispose());
      meter.dispose();
      musicBus.dispose();
    },
  };
};
