import { Graphics } from 'pixi.js';
import type { Projectile } from '../../sim/projectile';
import { normalize, scale, type Vec } from '../../vec';
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
      projectiles.forEach(projectile => {
        const { position, radius } = projectile;
        if (projectile.kind === 'beam') {
          // A streak trailing back along its flight.
          const tail = scale(normalize(projectile.velocity), -radius * 7);
          view
            .moveTo(position.x, position.y)
            .lineTo(position.x + tail.x, position.y + tail.y)
            .stroke({
              width: radius * 1.4,
              color: PALETTE.accent,
              cap: 'round',
            })
            .circle(position.x, position.y, radius * 0.8)
            .fill(0xffffff);
          return;
        }
        view
          .circle(position.x, position.y, radius * 1.8)
          .fill({ color: PALETTE.player, alpha: 0.25 })
          .circle(position.x, position.y, radius)
          .fill(0xffffff);
      });
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
