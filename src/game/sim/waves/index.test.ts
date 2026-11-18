import { describe, expect, it } from 'vitest';
import {
  advanceWaves,
  INITIAL_WAVES,
  sectionFor,
  waveSize,
  type Waves,
} from '.';

const at = (waves: Waves, bar: number, alive: number) =>
  advanceWaves(waves, { bar, alive, quietBars: 2 });

describe('advanceWaves', () => {
  it('waits out the intro, then sends the first wave', () => {
    expect(at(INITIAL_WAVES, 1, 0).spawn).toBeNull();
    const first = at(INITIAL_WAVES, 2, 0);
    expect(first.spawn).toBe('wave');
    expect(first.waves).toMatchObject({ phase: 'fight', sent: 1, since: 2 });
  });

  it('keeps fighting while enemies are alive', () => {
    const fight = at(INITIAL_WAVES, 2, 0).waves;
    expect(at(fight, 5, 3)).toEqual({ waves: fight, spawn: null });
  });

  it('clears on the first bar line with nobody left', () => {
    const fight = at(INITIAL_WAVES, 2, 0).waves;
    const cleared = at(fight, 6, 0);
    expect(cleared.waves).toMatchObject({
      phase: 'cleared',
      cleared: 1,
      since: 6,
    });
    expect(cleared.spawn).toBeNull();
  });

  it('sends the next wave a phrase after clearing', () => {
    const cleared = {
      phase: 'cleared' as const,
      sent: 1,
      cleared: 1,
      since: 6,
    };
    expect(at(cleared, 9, 0).spawn).toBeNull();
    const next = at(cleared, 10, 0);
    expect(next.spawn).toBe('wave');
    expect(next.waves).toMatchObject({ phase: 'fight', sent: 2, since: 10 });
  });

  it('reinforces a fight that drags on', () => {
    const fight = at(INITIAL_WAVES, 2, 0).waves;
    const later = at(fight, 10, 2);
    expect(later.spawn).toBe('reinforcement');
    expect(later.waves).toMatchObject({ phase: 'fight', sent: 1, since: 10 });
  });
});

describe('waveSize', () => {
  it('grows per wave and per level', () => {
    expect(waveSize({ sent: 0, level: 1, alive: 0 })).toBe(3);
    expect(waveSize({ sent: 2, level: 1, alive: 0 })).toBe(7);
    expect(waveSize({ sent: 0, level: 3, alive: 0 })).toBe(7);
  });

  it('caps a wave, and the level at 30 alive', () => {
    expect(waveSize({ sent: 20, level: 9, alive: 0 })).toBe(14);
    expect(waveSize({ sent: 20, level: 9, alive: 25 })).toBe(5);
  });
});

describe('sectionFor', () => {
  const fight: Waves = { phase: 'fight', sent: 1, cleared: 0, since: 2 };

  it('stays calm through the intro', () => {
    expect(sectionFor(INITIAL_WAVES, 0)).toBe('calm');
  });

  it('grooves through a light fight and builds as enemies pile up', () => {
    expect(sectionFor(fight, 3)).toBe('groove');
    expect(sectionFor(fight, 8)).toBe('build');
  });

  it('drops when a wave is cleared', () => {
    expect(sectionFor({ ...fight, phase: 'cleared' }, 0)).toBe('drop');
  });
});
