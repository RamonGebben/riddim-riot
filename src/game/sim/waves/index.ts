import { MAX_ENEMIES } from '../enemy';

/**
 * A level plays as a song: a quiet intro, then waves. A wave is fought until
 * a bar line finds no enemies left - that's the drop - then the next one
 * comes in a phrase later.
 */
export type WavePhase = 'intro' | 'fight' | 'cleared';

export interface Waves {
  phase: WavePhase;
  /** Waves sent so far. */
  sent: number;
  cleared: number;
  /** The bar the current phase began on. */
  since: number;
}

export const INITIAL_WAVES: Waves = {
  phase: 'intro',
  sent: 0,
  cleared: 0,
  since: 0,
};

/** A fight this long gets more enemies, so a hiding player can't stall. */
const REINFORCE_BARS = 8;
/** The drop after a cleared wave: one phrase of breathing room. */
const CLEARED_BARS = 4;

export type WaveSpawn = 'wave' | 'reinforcement' | null;

/** One bar line: where the waves go next, and whether to spawn. */
export const advanceWaves = (
  waves: Waves,
  { bar, alive, quietBars }: { bar: number; alive: number; quietBars: number },
): { waves: Waves; spawn: WaveSpawn } => {
  const send = (): { waves: Waves; spawn: WaveSpawn } => ({
    waves: { ...waves, phase: 'fight', sent: waves.sent + 1, since: bar },
    spawn: 'wave',
  });

  if (waves.phase === 'intro') {
    return bar >= quietBars ? send() : { waves, spawn: null };
  }
  if (waves.phase === 'cleared') {
    return bar - waves.since >= CLEARED_BARS ? send() : { waves, spawn: null };
  }
  if (alive === 0) {
    return {
      waves: {
        ...waves,
        phase: 'cleared',
        cleared: waves.cleared + 1,
        since: bar,
      },
      spawn: null,
    };
  }
  if (bar - waves.since >= REINFORCE_BARS) {
    return { waves: { ...waves, since: bar }, spawn: 'reinforcement' };
  }
  return { waves, spawn: null };
};

/** Waves grow with each one sent and each level, never past the cap. */
export const waveSize = ({
  sent,
  level,
  alive,
}: {
  /** Waves sent before this one. */
  sent: number;
  level: number;
  alive: number;
}): number =>
  Math.max(
    0,
    Math.min(3 + 2 * sent + 2 * (level - 1), 14, MAX_ENEMIES - alive),
  );
