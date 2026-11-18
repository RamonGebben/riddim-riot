import { useEffect, useMemo, useRef, useState } from 'react';
import {
  describeLevel,
  startGame,
  type Game,
  type HudView,
  type LoadoutView,
} from '~/game';
import { GameScreen } from '~/templates/GameScreen';
import { StartScreen } from '~/templates/StartScreen';
import { getSeed } from '~/utils/getSeed';

type SessionStatus = 'idle' | 'starting' | 'playing';

const randomSeed = () => getSeed('');

export const App = () => {
  const [seed, setSeed] = useState(() => getSeed(window.location.search));
  // `?stress` fills the level with enemies, for checking performance.
  const [stress] = useState(() =>
    new URLSearchParams(window.location.search).has('stress'),
  );
  const level = useMemo(() => describeLevel(seed), [seed]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [loadout, setLoadout] = useState<LoadoutView>({ slots: [], active: 0 });
  const [hud, setHud] = useState<HudView | null>(null);
  // Bumped on every (re)start, so the stage re-attaches to the new game.
  const [session, setSession] = useState(0);
  const game = useRef<Game | null>(null);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => () => game.current?.stop(), []);

  useEffect(() => {
    if (status !== 'playing' || !surface.current || !game.current) return;
    const detach = game.current.attach(surface.current);
    const unsubscribe = [
      game.current.onLoadout(setLoadout),
      game.current.onHud(setHud),
    ];
    return () => {
      unsubscribe.forEach(off => off());
      detach();
    };
  }, [status, session]);

  // startGame() has to run inside a click handler: browsers only let an
  // AudioContext start from a user gesture.
  const play = async (runSeed: number) => {
    game.current?.stop();
    setStatus('starting');
    setSeed(runSeed);
    game.current = await startGame({ seed: runSeed, stress });
    setLoadout(game.current.loadout());
    setHud(game.current.hud());
    setSession(current => current + 1);
    setStatus('playing');
  };

  const handleStop = () => {
    game.current?.stop();
    game.current = null;
    setStatus('idle');
  };

  if (status === 'playing' && hud) {
    return (
      <GameScreen
        seed={seed}
        musicalKey={level.key}
        bpm={level.bpm}
        run={hud}
        loadout={loadout}
        surfaceRef={surface}
        onStop={handleStop}
        onRetry={() => play(seed)}
        onNewRun={() => play(randomSeed())}
      />
    );
  }

  return (
    <StartScreen
      seed={seed}
      musicalKey={level.key}
      bpm={level.bpm}
      isStarting={status === 'starting'}
      onStart={() => play(seed)}
    />
  );
};
