import { describe, expect, it } from 'vitest';
import { bossMove, bossPhase, hostilePosition, volley } from '.';

describe('bossPhase', () => {
  it('moves through three phases as its health drops', () => {
    expect(bossPhase(30, 30)).toBe(1);
    expect(bossPhase(15, 30)).toBe(2);
    expect(bossPhase(5, 30)).toBe(3);
  });
});

describe('bossMove', () => {
  it('winds up on the beat before each volley, on the snare', () => {
    expect(bossMove(1, { bar: 0, beat: 1 })).toMatchObject({ windup: true });
    expect(bossMove(1, { bar: 0, beat: 2 })).toMatchObject({ volley: true });
    // Phase 1 only fires every other bar.
    expect(bossMove(1, { bar: 1, beat: 2 })).toMatchObject({ volley: false });
    expect(bossMove(2, { bar: 1, beat: 2 })).toMatchObject({ volley: true });
  });

  it('winds up across the bar line for a downbeat volley', () => {
    expect(bossMove(3, { bar: 3, beat: 3 })).toMatchObject({ windup: true });
    expect(bossMove(3, { bar: 4, beat: 0 })).toMatchObject({ volley: true });
  });

  it('calls in hoppers from phase 2, and walks every beat in phase 3', () => {
    expect(bossMove(1, { bar: 4, beat: 0 }).summon).toBe(0);
    expect(bossMove(2, { bar: 4, beat: 0 }).summon).toBeGreaterThan(0);
    expect(bossMove(2, { bar: 4, beat: 0 }).steps).toBe(false);
    expect(bossMove(3, { bar: 4, beat: 0 }).steps).toBe(true);
  });
});

describe('volley', () => {
  const center = { x: 100, y: 100 };

  it('fires a ring out from the boss, each orb pure in time', () => {
    const ring = volley({ phase: 1, center, time: 2, firstId: 1, turn: 0 });
    expect(new Set(ring.map(orb => orb.id)).size).toBe(ring.length);
    ring.forEach(orb => {
      expect(hostilePosition(orb, 2)).toEqual(center);
      expect(hostilePosition(orb, 1)).toEqual(center);
    });
    const moved = hostilePosition(ring[0], 3);
    expect(Math.hypot(moved.x - 100, moved.y - 100)).toBeGreaterThan(100);
  });

  it('turns half a gap between rings', () => {
    const angleOf = (turn: number) => {
      const [orb] = volley({ phase: 1, center, time: 0, firstId: 1, turn });
      return Math.atan2(orb.velocity.y, orb.velocity.x);
    };
    expect(angleOf(1)).not.toBeCloseTo(angleOf(0));
    expect(angleOf(2)).toBeCloseTo(angleOf(0));
  });
});
