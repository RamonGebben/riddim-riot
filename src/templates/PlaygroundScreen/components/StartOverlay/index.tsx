import { Button } from '~/atoms/Button';
import { Note } from './components/Note';
import { Backdrop } from './components/Backdrop';

/** Browsers only start audio from a click, so listening starts here. */
export const StartOverlay = ({
  isStarting,
  onStart,
}: {
  isStarting: boolean;
  onStart: () => void;
}) => {
  return (
    <Backdrop>
      <Button type="button" onClick={onStart} disabled={isStarting}>
        Start audio
      </Button>
      <Note>
        Drums, a weapon, the firing range and every sound in the game, on the
        game's clock.
      </Note>
    </Backdrop>
  );
};
