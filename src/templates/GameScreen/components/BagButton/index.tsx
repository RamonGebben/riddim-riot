import { Icon } from '~/atoms/Icon';
import { BAG_ICON } from '~/game/icons';
import { Count } from './components/Count';
import { Pill } from './components/Pill';

export interface BagButtonProps {
  count: number;
  size: number;
  onOpen: () => void;
}

/**
 * Opens the loadout menu: the bag's icon and how many weapons it holds,
 * popping when one drifts in. Tab or B does the same with a keyboard.
 */
export const BagButton = ({ count, size, onOpen }: BagButtonProps) => {
  const full = count >= size;
  return (
    <Pill
      type="button"
      aria-label={`Loadout and bag, ${count} of ${size}${full ? ', full' : ''}`}
      onClick={onOpen}
    >
      <Icon icon={BAG_ICON} />
      {/* Keyed by the count, so each change replays the pop. */}
      <Count key={count} $pops={count > 0}>
        {full ? 'full' : count}
      </Count>
    </Pill>
  );
};
