import { Bar } from './components/Bar';
import { Cell } from './components/Cell';
import { Refill } from './components/Refill';

export interface MagazineProps {
  ammo: number;
  magazine: number;
  reload: { id: number; seconds: number } | null;
  paused: boolean;
}

/**
 * A cell per shot, lit while loaded. Refilling, a bar sweeps across over
 * the refill's length, run by CSS so the loop doesn't have to drive it.
 */
export const Magazine = ({ ammo, magazine, reload, paused }: MagazineProps) => {
  return (
    <Bar aria-hidden>
      {Array.from({ length: magazine }, (_, i) => (
        <Cell key={i} $loaded={i < ammo} />
      ))}
      {reload && (
        <Refill key={reload.id} $seconds={reload.seconds} $paused={paused} />
      )}
    </Bar>
  );
};
