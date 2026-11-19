import { PLAYER_MAX_HP, type World, type WorldStatus } from '../sim/world';
import { comboActive } from '../sim/combo';
import {
  songPosition,
  type SongPart,
  type SurvivalPhase,
} from '../sim/survival';
import { nearestPickup } from '../sim/loot';
import type { WeaponRecipe } from '../weapons';

/** What the screen around the stage shows; React renders it, not the loop. */
export interface HudView {
  status: WorldStatus;
  level: number;
  hp: number;
  maxHp: number;
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
  /** The boss is up. */
  boss: boolean;
  /** The weapon the player is standing on, if any. */
  pickup: string | null;
}

/** Before the stage is up: a fresh level. */
export const initialHud = (
  carry: Pick<HudView, 'level' | 'hp' | 'kills' | 'score'>,
): HudView => ({
  status: 'playing',
  maxHp: PLAYER_MAX_HP,
  combo: 0,
  phase: 'waiting',
  part: null,
  secondsLeft: null,
  boss: false,
  pickup: null,
  ...carry,
});

export const hudOf = (
  world: World,
  /** Names a recipe in the level's key. */
  nameOf: (recipe: WeaponRecipe) => string,
  /** The beat being heard, to tell a live combo from a lapsed one. */
  beat = 0,
  /** For turning the beats left in the part into a countdown. */
  beatSeconds = 0,
): HudView => {
  const at = songPosition(world.survival, {
    bar: Math.floor(beat / 4),
    song: world.rules.song,
  });
  // Counted in beats so it ticks down steadily, not a bar at a time.
  const beatsLeft = at ? (at.bars - at.bar) * 4 - (beat % 4) : null;
  const underfoot = nearestPickup(world.pickups, world.player.position);
  return {
    status: world.status,
    level: world.rules.level,
    hp: world.hp,
    maxHp: world.maxHp,
    kills: world.kills,
    score: world.score,
    combo: comboActive(world.combo, beat) ? world.combo.count : 0,
    phase: world.survival.phase,
    part: at?.part ?? null,
    secondsLeft: beatsLeft === null ? null : Math.ceil(beatsLeft * beatSeconds),
    boss: world.enemies.some(enemy => enemy.kind === 'boss'),
    pickup: underfoot ? nameOf(underfoot.recipe) : null,
  };
};

/** Shallow, so the loop only hands React a new view when something changed. */
export const sameHud = (a: HudView, b: HudView): boolean =>
  (Object.keys(a) as Array<keyof HudView>).every(key => a[key] === b[key]);
