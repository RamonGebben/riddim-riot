import { describe, expect, it } from 'vitest';
import {
  attractPowerups,
  isPowered,
  NOT_POWERED,
  POWERUP_KINDS,
  powerUp,
  powerupFor,
  powerupsInReach,
} from '.';

describe('powerUp', () => {
  it('runs for its bars from the pickup', () => {
    const powered = powerUp(NOT_POWERED, 'pellet', { now: 10, barSeconds: 2 });
    expect(isPowered(powered, 'pellet', 17.9)).toBe(true);
    expect(isPowered(powered, 'pellet', 18)).toBe(false);
    expect(isPowered(powered, 'chord', 10)).toBe(false);
  });

  it('starts over from a second pickup, never cutting one short', () => {
    const once = powerUp(NOT_POWERED, 'chord', { now: 0, barSeconds: 2 });
    expect(powerUp(once, 'chord', { now: 4, barSeconds: 2 }).chord).toBe(12);
    expect(powerUp(once, 'chord', { now: 0, barSeconds: 1 }).chord).toBe(8);
  });
});

describe('powerupFor', () => {
  it('is reproducible, and drops every kind', () => {
    expect(powerupFor(42, 7)).toBe(powerupFor(42, 7));
    const kinds = new Set(
      Array.from({ length: 60 }, (_, id) => powerupFor(42, id)),
    );
    expect([...kinds].toSorted()).toEqual([...POWERUP_KINDS].toSorted());
  });
});

describe('powerups on the floor', () => {
  const powerups = [
    { id: 1, position: { x: 30, y: 0 }, kind: 'pellet' as const },
    { id: 2, position: { x: 150, y: 0 }, kind: 'chord' as const },
  ];

  it('are picked up within reach', () => {
    expect(powerupsInReach(powerups, { x: 0, y: 0 })).toEqual([powerups[0]]);
  });

  it('drift in towards the player', () => {
    const [, drifting] = attractPowerups(powerups, {
      player: { x: 0, y: 0 },
      dt: 0.1,
    });
    expect(drifting.position.x).toBeLessThan(150);
  });
});
