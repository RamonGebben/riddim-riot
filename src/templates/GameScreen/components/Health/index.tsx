import { Icon } from '~/atoms/Icon';
import { HEART_ICON } from '~/game/icons';
import { Heart } from './components/Heart';
import { Hearts } from './components/Hearts';

export interface HealthProps {
  hp: number;
  /** Health a run starts with; anything past it is bonus hearts. */
  maxHp: number;
}

/**
 * A heart per hit point: filled for each one left, dim for each lost, and
 * bonus hearts past full health in gold, on the end - they go first.
 */
export const Health = ({ hp, maxHp }: HealthProps) => {
  const bonus = Math.max(hp - maxHp, 0);
  const kinds = [
    ...Array.from({ length: maxHp }, (_, i) =>
      i < hp ? ('full' as const) : ('lost' as const),
    ),
    ...Array.from({ length: bonus }, () => 'bonus' as const),
  ];
  const label = bonus
    ? `Health ${maxHp} of ${maxHp}, plus ${bonus} bonus`
    : `Health ${Math.max(hp, 0)} of ${maxHp}`;
  return (
    <Hearts role="img" aria-label={label}>
      {kinds.map((kind, i) => (
        <Heart key={i} $kind={kind}>
          <Icon icon={HEART_ICON} />
        </Heart>
      ))}
    </Hearts>
  );
};
