import { describe, expect, it } from 'vitest';
import {
  advanceSurvival,
  chargeCircle,
  exitTaken,
  INITIAL_SURVIVAL,
  partAt,
  sectionFor,
  songFor,
  songFrom,
  waveSize,
  type Survival,
} from '.';

const SONG = songFor(1);
const at = (
  survival: Survival,
  bar: number,
  { alive = 0, bossAlive = false } = {},
) =>
  advanceSurvival(survival, {
    bar,
    time: bar * 2,
    alive,
    bossAlive,
    song: SONG,
  });

/** Bars into the song where each part starts, for level 1. */
const START = {
  intro: 0,
  breakdown: 16,
  buildup: 24,
  drop1: 32,
  drop2: 48,
  bridge: 64,
  drop3: 80,
  outro: 112,
};

describe('songFor', () => {
  it('runs intro, breakdown, build-up, three drops with a bridge, and an outro', () => {
    expect(SONG.map(section => [section.part, section.bars])).toEqual([
      ['intro', 16],
      ['breakdown', 8],
      ['buildup', 8],
      ['drop1', 16],
      ['drop2', 16],
      ['bridge', 16],
      ['drop3', 32],
      ['outro', 16],
    ]);
  });

  it('stretches the last drop from 32 to 48 bars over the levels', () => {
    const drop3 = (level: number) =>
      songFor(level).find(section => section.part === 'drop3')?.bars;
    expect([1, 2, 3, 4].map(drop3)).toEqual([32, 40, 48, 48]);
  });
});

describe('partAt', () => {
  it('finds the part and how far into it a bar is', () => {
    expect(partAt(SONG, 0)).toEqual({ part: 'intro', bar: 0, bars: 16 });
    expect(partAt(SONG, 33)).toEqual({ part: 'drop1', bar: 1, bars: 16 });
    expect(partAt(SONG, 300)).toMatchObject({ part: 'outro' });
  });
});

describe('advanceSurvival', () => {
  it('waits for the player, however long they take', () => {
    expect(at(INITIAL_SURVIVAL, 40)).toEqual({
      survival: INITIAL_SURVIVAL,
      spawn: null,
    });
  });

  it('holds a circle that is still filling', () => {
    const filling = {
      ...INITIAL_SURVIVAL,
      phase: 'charging' as const,
      charge: 0.9,
    };
    expect(at(filling, 5).survival).toBe(filling);
  });

  it('slams a full circle on the next bar line, which starts the song', () => {
    const full = { ...INITIAL_SURVIVAL, phase: 'charging' as const, charge: 1 };
    const slam = at(full, 6);
    expect(slam.survival).toMatchObject({
      phase: 'song',
      charge: 0,
      startBar: 6,
      sent: 1,
    });
    expect(slam.spawn).toEqual({
      wave: { extra: 0, chargers: false },
      boss: false,
    });
  });

  it('sends waves at each part’s pace: sparse in the intro, every 2 bars in the build-up', () => {
    const song = songFrom(0);
    const sent = (from: number, to: number) =>
      Array.from({ length: to - from }, (_, i) => from + i).reduce(
        (acc, bar) => {
          const next = at(acc.survival, bar, { alive: 5 });
          return {
            survival: next.survival,
            waves: acc.waves + (next.spawn?.wave ? 1 : 0),
          };
        },
        { survival: song, waves: 0 },
      ).waves;
    expect(sent(0, START.breakdown)).toBe(2);
    expect(sent(START.buildup, START.drop1)).toBe(4);
  });

  it('sends the next wave sooner once the floor is clear', () => {
    expect(at(songFrom(0), 3, { alive: 0 }).spawn?.wave).not.toBeNull();
  });

  it('brings the boss on the last drop, once', () => {
    const playing = { ...songFrom(0), lastWaveBar: START.drop3 - 1 };
    const drop = at(playing, START.drop3, { alive: 5 });
    expect(drop.spawn?.boss).toBe(true);
    expect(drop.survival.bossSent).toBe(true);
    expect(at(drop.survival, START.drop3 + 1, { alive: 5 }).spawn).toBeNull();
  });

  it('opens the exit in the outro once the boss is down', () => {
    const outro = { ...songFrom(0), bossSent: true, lastWaveBar: START.outro };
    expect(at(outro, START.outro, { bossAlive: true }).survival.phase).toBe(
      'song',
    );
    expect(at(outro, START.outro, { bossAlive: false }).survival.phase).toBe(
      'clear',
    );
    expect(at(outro, START.outro + 1, { alive: 0 }).spawn).toBeNull();
  });
});

describe('chargeCircle', () => {
  const BAR = 2;
  const frame = (survival: Survival, inside: boolean, dt = 0.5) =>
    chargeCircle(survival, { inside, dt, barSeconds: BAR });

  it('fills while the player stands in, over a bar', () => {
    const half = frame(frame(INITIAL_SURVIVAL, true), true);
    expect(half).toMatchObject({ phase: 'charging', charge: 0.5 });
    expect(frame(half, true, BAR)).toMatchObject({
      phase: 'charging',
      charge: 1,
    });
  });

  it('drains once the player steps out, back to waiting', () => {
    const half = frame(INITIAL_SURVIVAL, true, 1);
    const draining = frame(half, false);
    expect(draining).toMatchObject({ phase: 'waiting', charge: 0.25 });
    expect(frame(draining, false, BAR)).toMatchObject({ charge: 0 });
  });

  it('picks the fill up where it drained to', () => {
    const back = frame(frame(frame(INITIAL_SURVIVAL, true, 1), false), true);
    expect(back).toMatchObject({ phase: 'charging', charge: 0.5 });
  });

  it('keeps a full start full: it is committed to the slam', () => {
    const full = frame(INITIAL_SURVIVAL, true, BAR);
    expect(frame(full, false)).toBe(full);
  });

  it('leaves an empty circle nobody is in alone', () => {
    expect(frame(INITIAL_SURVIVAL, false)).toBe(INITIAL_SURVIVAL);
  });

  it('leaves the circle alone during the fight', () => {
    const playing = songFrom(0);
    expect(frame(playing, true)).toBe(playing);
  });

  it('fills the open exit the same way, until it is taken', () => {
    const open = { ...songFrom(0), phase: 'clear' as const };
    const half = frame(open, true, 1);
    expect(half).toMatchObject({ phase: 'clear', charge: 0.5 });
    expect(exitTaken(half)).toBe(false);
    expect(frame(half, false)).toMatchObject({ phase: 'clear', charge: 0.25 });
    expect(exitTaken(frame(half, true, 1))).toBe(true);
  });
});

describe('waveSize', () => {
  it('grows with the waves sent, the level and the part, never past the cap', () => {
    expect(waveSize({ sent: 0, level: 1, alive: 0 })).toBe(2);
    expect(waveSize({ sent: 8, level: 1, alive: 0, extra: 3 })).toBe(9);
    expect(waveSize({ sent: 0, level: 3, alive: 0 })).toBe(6);
    expect(waveSize({ sent: 40, level: 5, alive: 0 })).toBe(14);
    expect(waveSize({ sent: 40, level: 5, alive: 25 })).toBe(5);
  });
});

describe('sectionFor', () => {
  it('plays each part as its arrangement section', () => {
    const section = (survival: Survival, bar: number) =>
      sectionFor(survival, { bar, song: SONG });
    expect(section(INITIAL_SURVIVAL, 0)).toBe('calm');
    const playing = songFrom(0);
    expect(section(playing, START.intro)).toBe('groove');
    expect(section(playing, START.breakdown)).toBe('calm');
    expect(section(playing, START.buildup)).toBe('build');
    expect(section(playing, START.drop2 + 3)).toBe('drop');
    expect(section(playing, START.bridge)).toBe('groove');
    expect(section(playing, START.outro)).toBe('calm');
  });
});
