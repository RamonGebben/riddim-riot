import { add, length, scale, subtract, type Vec } from '../../vec';

/**
 * The boss fights in three phases, by how much health it has left. Each
 * phase plays on the beat: it winds up on the beat before and fires a ring
 * of orbs on the snare (beat 3), so the rhythm says when to weave; later
 * phases fire more often, call in hoppers and walk every beat.
 */
export type BossPhase = 1 | 2 | 3;

export const bossPhase = (hp: number, maxHp: number): BossPhase =>
  hp > (maxHp * 2) / 3 ? 1 : hp > maxHp / 3 ? 2 : 3;

/** What the boss does on one beat. */
export interface BossMove {
  /** Fire a ring of orbs. */
  volley: boolean;
  /** Swell up: a volley comes on the next beat. */
  windup: boolean;
  /** Hoppers to call in around it. */
  summon: number;
  /** Take a step towards the player. */
  steps: boolean;
}

const volleyBeats = (phase: BossPhase, bar: number): Array<number> => {
  if (phase === 3) return [0, 2];
  if (phase === 2) return [2];
  return bar % 2 === 0 ? [2] : [];
};

const SUMMONS = { 1: 0, 2: 2, 3: 3 } satisfies Record<BossPhase, number>;

export const bossMove = (
  phase: BossPhase,
  { bar, beat }: { bar: number; beat: number },
): BossMove => {
  const volleys = volleyBeats(phase, bar);
  // The beat before a volley, which may be in the bar before.
  const nextBeat = (beat + 1) % 4;
  const nextBar = nextBeat === 0 ? bar + 1 : bar;
  return {
    volley: volleys.includes(beat),
    windup: volleyBeats(phase, nextBar).includes(nextBeat),
    summon: beat === 0 && bar % 4 === 0 ? SUMMONS[phase] : 0,
    steps: phase === 3 || beat % 2 === 1,
  };
};

/** An orb the boss fired: it flies straight, and its position is pure in time. */
export interface Hostile {
  id: number;
  from: Vec;
  velocity: Vec;
  firedAt: number;
  expiresAt: number;
  radius: number;
}

export const HOSTILE_RADIUS = 11;
const HOSTILE_SECONDS = 2.6;
/** Orbs per ring, and px/s, by phase. */
const VOLLEYS = {
  1: { count: 10, speed: 230 },
  2: { count: 12, speed: 260 },
  3: { count: 14, speed: 290 },
} satisfies Record<BossPhase, { count: number; speed: number }>;

export const hostilePosition = (hostile: Hostile, now: number): Vec =>
  add(
    hostile.from,
    scale(hostile.velocity, Math.max(now - hostile.firedAt, 0)),
  );

/**
 * A ring of orbs out from `center`. Each ring turns half a gap from the
 * last (by `turn`), so standing in one gap doesn't dodge every ring.
 */
export const volley = ({
  phase,
  center,
  time,
  firstId,
  turn,
}: {
  phase: BossPhase;
  center: Vec;
  time: number;
  firstId: number;
  turn: number;
}): Array<Hostile> => {
  const { count, speed } = VOLLEYS[phase];
  const gap = (Math.PI * 2) / count;
  return Array.from({ length: count }, (_, i) => {
    const angle = gap * (i + (turn % 2) / 2);
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    return {
      id: firstId + i,
      from: center,
      velocity: scale(direction, speed),
      firedAt: time,
      expiresAt: time + HOSTILE_SECONDS,
      radius: HOSTILE_RADIUS,
    };
  });
};

/** Orbs touching a circle at `position` with `radius`, at `now`. */
export const hostilesTouching = (
  hostiles: Array<Hostile>,
  { position, radius, now }: { position: Vec; radius: number; now: number },
): Array<Hostile> =>
  hostiles.filter(
    hostile =>
      now >= hostile.firedAt &&
      length(subtract(hostilePosition(hostile, now), position)) <=
        hostile.radius + radius,
  );
