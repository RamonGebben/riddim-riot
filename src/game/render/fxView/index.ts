import { Graphics } from 'pixi.js';
import { PROJECTILE_RADIUS, type Projectile } from '../../sim/projectile';
import type { Vec } from '../../vec';
import { PALETTE } from '../palette';

/** A kill flash, shown from the moment its impact sounds. */
export interface Burst {
  position: Vec;
  time: number;
}

export const BURST_SECONDS = 0.35;

/** Projectiles and kill bursts: few and short-lived, so redrawn every frame. */
export const createFxView = () => {
  const view = new Graphics();

  return {
    view,
    update: ({
      projectiles,
      bursts,
      now,
    }: {
      projectiles: Array<Projectile>;
      bursts: Array<Burst>;
      now: number;
    }) => {
      view.clear();
      projectiles.forEach(({ position }) =>
        view
          .circle(position.x, position.y, PROJECTILE_RADIUS * 1.8)
          .fill({ color: PALETTE.player, alpha: 0.25 })
          .circle(position.x, position.y, PROJECTILE_RADIUS)
          .fill(0xffffff),
      );
      bursts
        .filter(burst => now >= burst.time)
        .forEach(burst => {
          const t = (now - burst.time) / BURST_SECONDS;
          view
            .circle(burst.position.x, burst.position.y, 12 + t * 60)
            .stroke({ width: 6 * (1 - t), color: PALETTE.accent, alpha: 1 - t })
            .circle(burst.position.x, burst.position.y, 14 * (1 - t))
            .fill({ color: 0xffffff, alpha: 1 - t });
        });
    },
  };
};
