import { useEffect, useRef, useState } from 'react';
import { describeLevel, startGame, type Game, type LoadoutView } from '~/game';
import { GameScreen } from '~/templates/GameScreen';
import { StartScreen } from '~/templates/StartScreen';
import { getSeed } from '~/utils/getSeed';

type SessionStatus = 'idle' | 'starting' | 'playing';

export const App = () => {
  const [seed] = useState(() => getSeed(window.location.search));
  // `?stress` fills the level with enemies, for checking performance.
  const [stress] = useState(() =>
    new URLSearchParams(window.location.search).has('stress'),
  );
  const [level] = useState(() => describeLevel(seed));
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [loadout, setLoadout] = useState<LoadoutView>({ slots: [], active: 0 });
  const game = useRef<Game | null>(null);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => () => game.current?.stop(), []);

  useEffect(() => {
    if (status !== 'playing' || !surface.current || !game.current) return;
    const detach = game.current.attach(surface.current);
    const unsubscribe = game.current.onLoadout(setLoadout);
    return () => {
      unsubscribe();
      detach();
    };
  }, [status]);

  // startGame() has to run inside the click handler: browsers only let an
  // AudioContext start from a user gesture.
  const handleStart = async () => {
    setStatus('starting');
    game.current = await startGame({ seed, stress });
    setLoadout(game.current.loadout());
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
        musicalKey={level.key}
        bpm={level.bpm}
        loadout={loadout}
        surfaceRef={surface}
        onStop={handleStop}
      />
    );
  }

  return (
    <StartScreen
      seed={seed}
      musicalKey={level.key}
      bpm={level.bpm}
      isStarting={status === 'starting'}
      onStart={handleStart}
    />
  );
};
