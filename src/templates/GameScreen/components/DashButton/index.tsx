import { PointerOnly } from '../PointerOnly';
import { Cooldown } from './components/Cooldown';
import { Round } from './components/Round';

export interface DashButtonProps {
  /** Seconds until the dash is back, null when it's ready. */
  cooldown: number | null;
  /** Changes with every dash, restarting the cooldown sweep. */
  dashKey: number;
  paused: boolean;
  onDash: () => void;
}

/**
 * The dash: Space with a mouse, this button under the right thumb on a
 * touch screen. Either way it shows the cooldown sweeping back to ready.
 */
export const DashButton = ({
  cooldown,
  dashKey,
  paused,
  onDash,
}: DashButtonProps) => {
  return (
    <Round
      type="button"
      $ready={cooldown === null}
      aria-label={cooldown === null ? 'Dash' : 'Dash, cooling down'}
      onPointerDown={event => {
        event.preventDefault();
        onDash();
      }}
    >
      {cooldown !== null && (
        <Cooldown key={dashKey} $seconds={cooldown} $paused={paused} />
      )}
      <PointerOnly $pointer="mouse">
        <kbd>Space</kbd>
      </PointerOnly>
      <span>Dash</span>
    </Round>
  );
};
