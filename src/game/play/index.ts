import type { Bus } from '../bus';
import type { Tick } from '../clock';
import type { GameEvents } from '../events';
import { hudOf, sameHud, type HudView } from '../hud';
import { nextGridTime, STEPS_PER_BEAT } from '../grid';
import {
  attachControls,
  attachTrigger,
  attachWeaponKeys,
  type TriggerHandlers,
  type WeaponAction,
} from '../input';
import {
  BURST_SECONDS,
  clampCamera,
  createStage,
  followCamera,
  screenToWorld,
  shakeOffset,
  type Burst,
  type Pulse,
} from '../render';
import { createRng, deriveSeed } from '../rng';
import type { Level } from '../level';
import { sectionFor, type Section } from '../sim/waves';
import { nearestPickup } from '../sim/loot';
import { weaponFrom, type WeaponRecipe } from '../weapons';
import {
  createWorld,
  onBar,
  onBeat,
  placePickup,
  queueShot,
  stepWorld,
  takePickup,
  type WaveRules,
} from '../sim/world';

export interface Pulses {
  kick: Pulse;
  beat: Pulse;
  shot: Pulse;
  kill: Pulse;
  hit: Pulse;
  /** A cleared wave's drop. */
  drop: Pulse;
}

export interface PlaySounds {
  /** A kill's impact, at an audio time on the grid. */
  impact: (time: number) => void;
  /** Points landing, at the combo the latest kill made. */
  score: (time: number, combo: number) => void;
  /** The player got hit: duck the music right away. */
  duck: (time: number) => void;
  /** The run is over: muffle the music for good. */
  dead: (time: number) => void;
  /** Every bar line: the section the track should play. */
  section: (section: Section, at: { time: number; bar: number }) => void;
}

const SHAKE_PIXELS = 7;
const KILL_SHAKE_PIXELS = 5;
const DROP_SHAKE_PIXELS = 14;
/** A dropped frame or a background tab shouldn't teleport the player. */
const MAX_FRAME_SECONDS = 1 / 20;
/** Keeps enemy spawns their own random stream, apart from the drums'. */
const SPAWN_STREAM = 1;

/**
 * The frame loop: input → world sim → camera → render. Movement runs on
 * frames, but everything musical is read off the clock of what's being
 * heard (`heardNow`):
 * enemies hop on beat ticks, waves spawn on bar ticks, and each kill's
 * impact is scheduled on the next 1/16 slot.
 */
export const startPlay = async ({
  element,
  level,
  rules,
  carry,
  seed,
  bus,
  trigger,
  onHud,
  onWeaponAction,
  swapWeapon,
  pulses,
  sounds,
  stepSeconds,
  audioNow,
  heardNow,
}: {
  element: HTMLElement;
  level: Level;
  rules: WaveRules;
  /** Health, kills and score carried in from the run. */
  carry: { hp: number; kills: number; score: number };
  seed: number;
  bus: Bus<GameEvents>;
  trigger: TriggerHandlers;
  /** Called with the HUD whenever it changes. */
  onHud: (hud: HudView) => void;
  onWeaponAction: (action: WeaponAction) => void;
  /** Swap a weapon into the active slot; resolves with the one it replaced. */
  swapWeapon: (recipe: WeaponRecipe) => Promise<WeaponRecipe>;
  pulses: Pulses;
  sounds: PlaySounds;
  stepSeconds: number;
  /** Where the audio thread is: schedule new sounds from here. */
  audioNow: () => number;
  /** What's coming out of the speakers: draw and simulate at this. */
  heardNow: () => number;
}): Promise<() => void> => {
  const stage = await createStage(element, level);
  const controls = attachControls(element);
  const detachTrigger = attachTrigger(element, trigger);
  const takeWeapon = () => {
    const underfoot = nearestPickup(world.pickups, world.player.position);
    if (!underfoot || world.status !== 'playing') return;
    world = takePickup(world, underfoot.id);
    void swapWeapon(underfoot.recipe).then(old => {
      world = placePickup(world, old, underfoot.position);
    });
  };
  const detachWeaponKeys = attachWeaponKeys(element, action =>
    action.type === 'pickup' ? takeWeapon() : onWeaponAction(action),
  );

  let world = createWorld(level, rules, carry);
  let camera = world.player.position;
  let bursts: Array<Burst> = [];
  let lastTick: Tick | null = null;
  let lastSection: Section = 'calm';
  const names = new Map<number, string>();
  const nameOf = (recipe: WeaponRecipe) => {
    const known = names.get(recipe.seed);
    if (known) return known;
    const name = weaponFrom(recipe, level.key).name;
    names.set(recipe.seed, name);
    return name;
  };
  let hud = hudOf(world, nameOf);
  onHud(hud);

  const onTick = (tick: Tick) => {
    lastTick = tick;
    if (tick.sixteenth === 0) {
      world = onBeat(world, { time: tick.time, beat: tick.beat });
    }
    if (tick.stepInBar !== 0) return;
    const rng = createRng(deriveSeed(seed, tick.bar, SPAWN_STREAM));
    world = onBar(world, { bar: tick.bar, time: tick.time, rng });
    if (world.status !== 'playing') return;
    const section = sectionFor(world.waves, world.enemies.length);
    if (section === 'drop' && lastSection !== 'drop')
      pulses.drop.hit(tick.time);
    sounds.section(section, { time: tick.time, bar: tick.bar });
    lastSection = section;
  };

  const unsubscribe = [
    bus.on('tick', onTick),
    bus.on('shot', shot => {
      world = queueShot(world, shot);
    }),
  ];

  const nextSlot = (now: number) =>
    lastTick
      ? nextGridTime({ now, anchor: lastTick.time, stepSeconds })
      : now + stepSeconds;

  stage.onFrame(elapsed => {
    const dt = Math.min(elapsed, MAX_FRAME_SECONDS);
    const now = heardNow();
    // The beat being heard, from the last tick (which runs ahead of it).
    const beat = lastTick
      ? Math.floor(
          (lastTick.step + Math.floor((now - lastTick.time) / stepSeconds)) /
            STEPS_PER_BEAT,
        )
      : 0;
    const aimAt = screenToWorld(controls.pointer(), camera, stage.viewport());
    const result = stepWorld(world, {
      input: { move: controls.move(), aimAt },
      dt,
      now,
      beat,
    });
    world = result.world;
    camera = clampCamera(
      followCamera(camera, world.player.position, dt),
      stage.viewport(),
      level,
    );

    const killed = result.kills.map(position => ({
      position,
      time: nextSlot(audioNow()),
    }));
    killed.forEach(({ time }) => {
      sounds.impact(time);
      pulses.kill.hit(time);
    });
    // Kills in one frame share a slot: one note for where the combo got to.
    if (killed.length > 0) sounds.score(killed[0].time, world.combo.count);
    if (result.playerHit) {
      sounds.duck(audioNow());
      pulses.hit.hit(now);
    }
    const ended = world.status !== 'playing' && hud.status === 'playing';
    if (ended) trigger.release();
    if (ended && world.status === 'dead') sounds.dead(audioNow());
    const nextHud = hudOf(world, nameOf, beat);
    if (!sameHud(hud, nextHud)) {
      hud = nextHud;
      onHud(hud);
    }
    bursts = [...bursts, ...killed].filter(
      burst => now - burst.time < BURST_SECONDS,
    );

    const kick = pulses.kick.valueAt(now);
    const drop = pulses.drop.valueAt(now);
    const shake =
      kick * SHAKE_PIXELS +
      pulses.kill.valueAt(now) * KILL_SHAKE_PIXELS +
      drop * DROP_SHAKE_PIXELS;
    stage.render({
      world,
      bursts,
      now,
      camera,
      shake: shakeOffset(now, shake),
      kick,
      beat: pulses.beat.valueAt(now),
      shot: pulses.shot.valueAt(now),
      hit: pulses.hit.valueAt(now),
      drop,
    });
  });

  return () => {
    unsubscribe.forEach(off => off());
    detachTrigger();
    detachWeaponKeys();
    controls.detach();
    stage.destroy();
  };
};
