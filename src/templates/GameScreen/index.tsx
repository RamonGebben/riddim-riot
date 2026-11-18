import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { Surface } from './components/Surface';

export interface GameScreenProps {
  seed: number;
  bpm: number;
  loadout: LoadoutProps;
  /** The element the game attaches its input (and later its canvas) to. */
  surfaceRef?: Ref<HTMLElement>;
  onStop: () => void;
}

export const GameScreen = ({
  seed,
  bpm,
  loadout,
  surfaceRef,
  onStop,
}: GameScreenProps) => {
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>
          WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · R reroll
        </Hint>
      </Surface>
      <Loadout {...loadout} />
      <Hud>
        <span>
          seed {seed} · {bpm} BPM halftime
        </span>
        <Button onClick={onStop}>Stop</Button>
      </Hud>
    </>
  );
};
