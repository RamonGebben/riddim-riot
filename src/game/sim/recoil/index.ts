import { createRng, deriveSeed } from '../../rng';

/** How hot the barrel is from recent shots, as of audio time `at`. */
export interface Recoil {
  heat: number;
  at: number;
  /** Shots kicked so far, so each draws its own scatter. */
  shots: number;
}

export const NO_RECOIL: Recoil = { heat: 0, at: 0, shots: 0 };

export const RECOIL = {
  /** Heat each shot adds; heat tops out at 1. */
  kick: 0.25,
  /** Heat halves in this many seconds: 1/16 notes at 140 keep it high. */
  halfLife: 0.15,
  /** Radians either side of the aim at full heat. */
  scatter: 0.15,
};

const RECOIL_STREAM = 0x7ec011;

const heatAt = ({ heat, at }: Recoil, time: number) =>
  heat * 0.5 ** (Math.max(0, time - at) / RECOIL.halfLife);

/**
 * A shot at `time`: it scatters by the heat earlier shots left, so a lone
 * shot flies true and fast fire spreads, then it heats the barrel itself.
 */
export const kickRecoil = (
  recoil: Recoil,
  { time, seed }: { time: number; seed: number },
): { recoil: Recoil; angle: number } => {
  const heat = heatAt(recoil, time);
  const roll = createRng(deriveSeed(seed, RECOIL_STREAM, recoil.shots)).next();
  return {
    angle: (roll * 2 - 1) * heat * RECOIL.scatter,
    recoil: {
      heat: Math.min(1, heat + RECOIL.kick),
      at: Math.max(time, recoil.at),
      shots: recoil.shots + 1,
    },
  };
};
