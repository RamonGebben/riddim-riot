import { Icon } from '~/atoms/Icon';
import { BLAST_ICON, FX_ICONS, WEAPON_ICONS } from '~/game/icons';
import type { WeaponFace } from '../../types';
import { PointerOnly } from '../PointerOnly';
import { Badges } from './components/Badges';
import { Engine } from './components/Engine';
import { Key } from './components/Key';
import { List } from './components/List';
import { Magazine } from './components/Magazine';
import { Rate } from './components/Rate';
import { Slot } from './components/Slot';

export interface SlotProps extends WeaponFace {
  ammo: number;
  magazine: number;
  /** Refilling: a new `id` each time, back in `seconds`. */
  reload: { id: number; seconds: number } | null;
}

export interface LoadoutProps {
  slots: Array<SlotProps>;
  active: number;
  /** Frozen: a refill's animation holds still too. */
  paused?: boolean;
  /** A slot pressed: switch to it and fire - every weapon a press away. */
  onFire?: (slot: number) => void;
  onRelease?: (slot: number) => void;
}

/**
 * The three weapons: each its engine's icon, its beat and FX, and its
 * magazine. Each is a button - held, it switches to the weapon and fires
 * it, which on a touch screen makes every weapon one thumb away.
 */
export const Loadout = ({
  slots,
  active,
  paused = false,
  onFire,
  onRelease,
}: LoadoutProps) => {
  return (
    <List aria-label="Weapons">
      {slots.map((slot, index) => {
        const release = () => onRelease?.(index);
        return (
          <li key={index}>
            <Slot
              type="button"
              $active={index === active}
              aria-pressed={index === active}
              aria-label={`${slot.name}, ${slot.ammo} of ${slot.magazine}`}
              onPointerDown={event => {
                // Holding the button, not the page: no long-press menu.
                event.preventDefault();
                // Held past the button's edge, the release still lands here.
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                  // A synthetic pointer (Firefox in tests) can't be captured.
                }
                onFire?.(index);
              }}
              onPointerUp={release}
              onPointerCancel={release}
              onContextMenu={event => event.preventDefault()}
            >
              <PointerOnly $pointer="mouse">
                <Key>{index + 1}</Key>
              </PointerOnly>
              <Engine>
                <Icon icon={WEAPON_ICONS[slot.oscillator]} />
              </Engine>
              <Rate>{slot.lfo}</Rate>
              <Badges>
                {slot.fx && <Icon icon={FX_ICONS[slot.fx]} />}
                {slot.blasts && <Icon icon={BLAST_ICON} />}
              </Badges>
              <Magazine
                ammo={slot.ammo}
                magazine={slot.magazine}
                reload={slot.reload}
                paused={paused}
              />
            </Slot>
          </li>
        );
      })}
    </List>
  );
};
