import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { Surface } from './components/Surface';

export interface GameScreenProps {
  seed: number;
  bpm: number;
  /** The element the game attaches its input (and later its canvas) to. */
  surfaceRef?: Ref<HTMLElement>;
  onStop: () => void;
}

export const GameScreen = ({
  seed,
  bpm,
  surfaceRef,
  onStop,
}: GameScreenProps) => {
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>Click or hold to fire</Hint>
      </Surface>
      <Hud>
        <span>
          seed {seed} · {bpm} BPM halftime
        </span>
        <Button onClick={onStop}>Stop</Button>
      </Hud>
    </>
  );
};
