import { useEffect, useRef, useState } from 'react';
import { BPM, startGame, type Game } from '~/game';
import { GameScreen } from '~/templates/GameScreen';
import { StartScreen } from '~/templates/StartScreen';
import { getSeed } from '~/utils/getSeed';

type SessionStatus = 'idle' | 'starting' | 'playing';

export const App = () => {
  const [seed] = useState(() => getSeed(window.location.search));
  const [status, setStatus] = useState<SessionStatus>('idle');
  const game = useRef<Game | null>(null);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => () => game.current?.stop(), []);

  useEffect(() => {
    if (status !== 'playing' || !surface.current) return;
    return game.current?.attach(surface.current);
  }, [status]);

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

  if (status === 'playing') {
    return (
      <GameScreen
        seed={seed}
        bpm={BPM}
        surfaceRef={surface}
        onStop={handleStop}
      />
    );
  }

  return (
    <StartScreen
      seed={seed}
      bpm={BPM}
      isStarting={status === 'starting'}
      onStart={handleStart}
    />
  );
};
