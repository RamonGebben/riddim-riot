import {
  hpCap,
  PLAYER_MAX_HP,
  RUN_LEVELS,
  type World,
  type WorldStatus,
} from '../sim/world';
import { comboActive } from '../sim/combo';
import {
  songFor,
  songPosition,
  type SongPart,
  type SongSection,
  type SurvivalPhase,
} from '../sim/survival';
import { nearestPickup } from '../sim/loot';
import { DASH } from '../sim/player';
import type { FxPart, LfoPart, OscillatorPart, WeaponRecipe } from '../weapons';

/** A weapon on the ground, as the prompt to take it describes it. */
export interface PickupView {
  name: string;
  oscillator: OscillatorPart;
  lfo: LfoPart;
  fx: FxPart | null;
  /** A slow weapon whose shots burst. */
  blasts: boolean;
}

/** What the screen around the stage shows; React renders it, not the loop. */
export interface HudView {
  status: WorldStatus;
  level: number;
  /** Levels in a run: clearing the last one wins it. */
  levels: number;
  hp: number;
  /** Health a run starts with; hp past it is bonus hearts. */
  maxHp: number;
  /** The most hp can stack to, bonus hearts included. */
  hpCap: number;
  kills: number;
  score: number;
  /** The live combo, or 0 once it has lapsed. */
  combo: number;
  /** Where the level is: waiting at the circle through to its exit open. */
  phase: SurvivalPhase;
  /** The song part playing, once the slam has started the song. */
  part: SongPart | null;
  /** Seconds left in the part. */
  secondsLeft: number | null;
  /** The level's song, part by part. */
  song: Array<SongSection>;
  /** Bars into the song, once it's started. */
  songBar: number | null;
  /** The boss's health, 0-1, while it's up. */
  boss: number | null;
  /** The weapon the player is standing on, if any. */
  pickup: PickupView | null;
  /**
   * The dash's cooldown in seconds while it's coming back, null when
   * ready; `dashKey` changes with every dash, to restart its animation.
   */
  dashCooldown: number | null;
  dashKey: number;
}

/** Before the stage is up: a fresh level. */
export const initialHud = (
  carry: Pick<HudView, 'level' | 'hp' | 'kills' | 'score'>,
): HudView => ({
  status: 'playing',
  levels: RUN_LEVELS,
  maxHp: PLAYER_MAX_HP,
  hpCap: hpCap({ maxHp: PLAYER_MAX_HP }),
  combo: 0,
  phase: 'waiting',
  part: null,
  secondsLeft: null,
  song: songFor(carry.level),
  songBar: null,
  boss: null,
  pickup: null,
  dashCooldown: null,
  dashKey: 0,
  ...carry,
});

export const hudOf = (
  world: World,
  /**
   * Describes a recipe in the level's key - the same object for the same
   * recipe, so an unchanged pickup doesn't count as a change.
   */
  describe: (recipe: WeaponRecipe) => PickupView,
  /** The beat being heard, to tell a live combo from a lapsed one. */
  beat = 0,
  /** For turning the beats left in the part into a countdown. */
  beatSeconds = 0,
  /** The heard time, to tell a cooling dash from a ready one. */
  now = 0,
): HudView => {
  const at = songPosition(world.survival, {
    bar: Math.floor(beat / 4),
    song: world.rules.song,
  });
  // Counted in beats so it ticks down steadily, not a bar at a time.
  const beatsLeft = at ? (at.bars - at.bar) * 4 - (beat % 4) : null;
  const underfoot = nearestPickup(world.pickups, world.player.position);
  const boss = world.enemies.find(enemy => enemy.kind === 'boss');
  return {
    status: world.status,
    level: world.rules.level,
    levels: RUN_LEVELS,
    hp: world.hp,
    maxHp: world.maxHp,
    hpCap: hpCap(world),
    kills: world.kills,
    score: world.score,
    combo: comboActive(world.combo, beat) ? world.combo.count : 0,
    phase: world.survival.phase,
    part: at?.part ?? null,
    secondsLeft: beatsLeft === null ? null : Math.ceil(beatsLeft * beatSeconds),
    song: world.rules.song,
    songBar: at ? Math.floor(beat / 4) - world.survival.startBar : null,
    // In hundredths, so a scratch doesn't re-render the HUD.
    boss: boss
      ? Math.max(Math.round((boss.hp / world.rules.bossHp) * 100) / 100, 0)
      : null,
    pickup: underfoot ? describe(underfoot.recipe) : null,
    dashCooldown:
      now < world.dash.readyAt
        ? world.dash.readyAt - (world.dash.until - DASH.seconds)
        : null,
    dashKey: world.dash.readyAt,
  };
};

/** Shallow, so the loop only hands React a new view when something changed. */
export const sameHud = (a: HudView, b: HudView): boolean =>
  (Object.keys(a) as Array<keyof HudView>).every(key => a[key] === b[key]);
