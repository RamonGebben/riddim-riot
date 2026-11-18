import { Key } from './components/Key';
import { List } from './components/List';
import { Slot } from './components/Slot';

export interface LoadoutProps {
  slots: Array<{ name: string }>;
  active: number;
}

export const Loadout = ({ slots, active }: LoadoutProps) => {
  return (
    <List aria-label="Weapons">
      {slots.map((slot, index) => (
        <Slot
          key={index}
          $active={index === active}
          aria-current={index === active ? 'true' : undefined}
        >
          <Key>{index + 1}</Key>
          {slot.name}
        </Slot>
      ))}
    </List>
  );
};
