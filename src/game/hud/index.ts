import { PLAYER_MAX_HP, type World, type WorldStatus } from '../sim/world';

/** What the screen around the stage shows; React renders it, not the loop. */
export interface HudView {
  status: WorldStatus;
  hp: number;
  maxHp: number;
  kills: number;
}

/** Before the stage is up: a fresh run. */
export const INITIAL_HUD: HudView = {
  status: 'playing',
  hp: PLAYER_MAX_HP,
  maxHp: PLAYER_MAX_HP,
  kills: 0,
};

export const hudOf = (world: World): HudView => ({
  status: world.status,
  hp: world.hp,
  maxHp: world.maxHp,
  kills: world.kills,
});

/** Shallow, so the loop only hands React a new view when something changed. */
export const sameHud = (a: HudView, b: HudView): boolean =>
  (Object.keys(a) as Array<keyof HudView>).every(key => a[key] === b[key]);
