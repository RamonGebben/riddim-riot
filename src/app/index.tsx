import { useEffect, useRef, useState } from 'react';
import { BPM, startGame, type Game } from '~/game';
import { StartScreen, type SessionStatus } from '~/templates/StartScreen';
import { getSeed } from '~/utils/getSeed';

export const App = () => {
  const [seed] = useState(() => getSeed(window.location.search));
  const [status, setStatus] = useState<SessionStatus>('idle');
  const game = useRef<Game | null>(null);

  useEffect(() => () => game.current?.stop(), []);

  // startGame() has to run inside the click handler: browsers only let an
  // AudioContext start from a user gesture.
  const handleStart = async () => {
    setStatus('starting');
    game.current = await startGame({ seed });
    setStatus('playing');
  };

  const handleStop = () => {
    game.current?.stop();
    game.current = null;
    setStatus('idle');
  };

  return (
    <StartScreen
      status={status}
      seed={seed}
      bpm={BPM}
      onStart={handleStart}
      onStop={handleStop}
    />
  );
};
