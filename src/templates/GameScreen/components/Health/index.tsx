import { Pips } from './components/Pips';

export interface HealthProps {
  hp: number;
  maxHp: number;
}

/** Hit points as pips: filled for each one left, hollow for each lost. */
export const Health = ({ hp, maxHp }: HealthProps) => {
  return (
    <Pips role="img" aria-label={`Health ${hp} of ${maxHp}`}>
      {'♥'.repeat(Math.max(hp, 0))}
      {'♡'.repeat(Math.max(maxHp - hp, 0))}
    </Pips>
  );
};
