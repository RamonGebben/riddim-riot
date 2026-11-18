import {
  isExitOpen,
  PLAYER_MAX_HP,
  type World,
  type WorldStatus,
} from '../sim/world';
import { comboActive } from '../sim/combo';
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
  wavesCleared: number;
  wavesToClear: number;
  exitOpen: boolean;
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
  wavesCleared: 0,
  wavesToClear: 0,
  exitOpen: false,
  pickup: null,
  ...carry,
});

export const hudOf = (
  world: World,
  /** Names a recipe in the level's key. */
  nameOf: (recipe: WeaponRecipe) => string,
  /** The beat being heard, to tell a live combo from a lapsed one. */
  beat = 0,
): HudView => {
  const underfoot = nearestPickup(world.pickups, world.player.position);
  return {
    status: world.status,
    level: world.rules.level,
    hp: world.hp,
    maxHp: world.maxHp,
    kills: world.kills,
    score: world.score,
    combo: comboActive(world.combo, beat) ? world.combo.count : 0,
    wavesCleared: world.waves.cleared,
    wavesToClear: world.rules.wavesToClear,
    exitOpen: isExitOpen(world),
    pickup: underfoot ? nameOf(underfoot.recipe) : null,
  };
};

/** Shallow, so the loop only hands React a new view when something changed. */
export const sameHud = (a: HudView, b: HudView): boolean =>
  (Object.keys(a) as Array<keyof HudView>).every(key => a[key] === b[key]);
