import { Graphics } from 'pixi.js';
import type { Beam } from '../../sim/beam';
import { hostilePosition, type Hostile } from '../../sim/boss';
import { PLAYER_RADIUS, type Player } from '../../sim/player';
import type { Projectile } from '../../sim/projectile';
import { add, normalize, scale, type Vec } from '../../vec';
import type { Palette } from '../../palette';

/** A kill flash, shown from the moment its impact sounds. */
export interface Burst {
  position: Vec;
  time: number;
  /** A crush blast's reach: drawn as a wide shockwave, not a kill flash. */
  radius?: number;
}

export const BURST_SECONDS = 0.35;
/** The boss's orbs, the same warm red on every palette. */
const HOSTILE_COLOR = 0xff5a36;
/** The barrel, out from the player's centre - where a beam starts. */
const BEAM_OFFSET = PLAYER_RADIUS * 1.9;

/**
 * Projectiles, beams and kill bursts: few and short-lived, so redrawn every
 * frame. A beam is drawn from where the player is now, so it swings with
 * the aim between ticks; its length is the one its tick hit with.
 */
export const createFxView = (palette: Palette) => {
  const view = new Graphics();

  return {
    view,
    update: ({
      projectiles,
      beams,
      hostiles,
      player,
      bursts,
      now,
      shot,
      beat,
    }: {
      projectiles: Array<Projectile>;
      beams: Array<Beam>;
      /** The boss's orbs. */
      hostiles: Array<Hostile>;
      player: Player;
      bursts: Array<Burst>;
      now: number;
      /** The shot pulse, 0-1: the beam swells on each tick. */
      shot: number;
      /** The beat pulse, 0-1: orbs throb with it. */
      beat: number;
    }) => {
      view.clear();
      // Hot, ringed and throbbing, so they read as danger on any palette.
      hostiles
        .filter(hostile => now >= hostile.firedAt)
        .forEach(hostile => {
          const { x, y } = hostilePosition(hostile, now);
          const r = hostile.radius * (1 + beat * 0.25);
          view
            .circle(x, y, r * 1.9)
            .fill({ color: HOSTILE_COLOR, alpha: 0.22 })
            .circle(x, y, r)
            .fill(HOSTILE_COLOR)
            .stroke({ width: 2, color: 0xffffff })
            .circle(x, y, r * 0.4)
            .fill(0xffffff);
        });
      // Only the latest tick: older ones are the same beam a moment ago.
      beams.slice(-1).forEach(beam => {
        const heading = player.aim + beam.angle;
        const direction = { x: Math.cos(heading), y: Math.sin(heading) };
        const start = add(player.position, scale(direction, BEAM_OFFSET));
        const end = add(start, scale(direction, beam.length));
        const width = beam.radius * (1.4 + shot * 0.8);
        const line = () => view.moveTo(start.x, start.y).lineTo(end.x, end.y);
        line().stroke({
          width: width * 2.4,
          color: palette.accent,
          alpha: 0.3,
          cap: 'round',
        });
        line().stroke({ width, color: palette.accent, cap: 'round' });
        line().stroke({ width: width * 0.35, color: 0xffffff, cap: 'round' });
        view.circle(end.x, end.y, width * 0.9).fill(0xffffff);
      });
      projectiles.forEach(projectile => {
        const { position, radius } = projectile;
        if (projectile.kind === 'bolt') {
          // A streak trailing back along its flight.
          const tail = scale(normalize(projectile.velocity), -radius * 7);
          view
            .moveTo(position.x, position.y)
            .lineTo(position.x + tail.x, position.y + tail.y)
            .stroke({
              width: radius * 1.4,
              color: palette.accent,
              cap: 'round',
            })
            .circle(position.x, position.y, radius * 0.8)
            .fill(0xffffff);
          return;
        }
        view
          .circle(position.x, position.y, radius * 1.8)
          .fill({ color: palette.player, alpha: 0.25 })
          .circle(position.x, position.y, radius)
          .fill(0xffffff);
        // A slow shot's fuse: a ring spinning round its core.
        if (projectile.detonates) {
          const spin = now * 12;
          const ring = radius * 1.5;
          // An arc goes on from the path's last point: start it on the ring,
          // or it draws a line in from the world's origin.
          view
            .moveTo(
              position.x + Math.cos(spin) * ring,
              position.y + Math.sin(spin) * ring,
            )
            .arc(position.x, position.y, ring, spin, spin + Math.PI)
            .stroke({ width: 3, color: palette.accent });
        }
      });
      bursts
        .filter(burst => now >= burst.time)
        .forEach(burst => {
          const t = (now - burst.time) / BURST_SECONDS;
          if (burst.radius) {
            view
              .circle(
                burst.position.x,
                burst.position.y,
                burst.radius * (0.35 + 0.65 * Math.sqrt(t)),
              )
              .stroke({
                width: 10 * (1 - t),
                color: palette.player,
                alpha: 0.8 * (1 - t),
              })
              .circle(burst.position.x, burst.position.y, burst.radius * t)
              .fill({ color: palette.accent, alpha: 0.15 * (1 - t) });
            return;
          }
          view
            .circle(burst.position.x, burst.position.y, 12 + t * 60)
            .stroke({ width: 6 * (1 - t), color: palette.accent, alpha: 1 - t })
            .circle(burst.position.x, burst.position.y, 14 * (1 - t))
            .fill({ color: 0xffffff, alpha: 1 - t });
        });
    },
  };
};
