import { useEffect, useMemo, useRef, useState } from 'react';
import {
  describeLevel,
  newRun,
  startGame,
  type Game,
  type HudView,
  type LoadoutView,
  type RunState,
  type StartStep,
} from '~/game';
import { GameScreen } from '~/templates/GameScreen';
import { StartScreen } from '~/templates/StartScreen';
import { getLatencyHint } from '~/utils/getLatencyHint';
import { getSeed } from '~/utils/getSeed';
import { goLandscape, TOUCH_SCREEN } from '~/utils/landscape';

type SessionStatus = 'idle' | 'starting' | 'playing';

const randomSeed = () => getSeed('');

/** Far longer than a phone takes to build a level; past it, say where. */
const START_TIMEOUT_MS = 20_000;

/**
 * Rejects if `starting` hasn't settled in time, naming the step it's on.
 * A game that turns up after that is stopped, not left playing unseen.
 */
const withTimeout = (starting: Promise<Game>, step: () => StartStep | null) =>
  new Promise<Game>((resolve, reject) => {
    let late = false;
    const timer = setTimeout(() => {
      late = true;
      reject(
        new Error(
          `stuck at "${step() ?? 'start'}" after ${START_TIMEOUT_MS / 1000} s`,
        ),
      );
    }, START_TIMEOUT_MS);
    starting.then(
      started => {
        clearTimeout(timer);
        if (late) started.stop();
        else resolve(started);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const App = () => {
  const [run, setRun] = useState(() => newRun(getSeed(window.location.search)));
  // `?stress` fills the level with enemies, for checking performance.
  const [stress] = useState(() =>
    new URLSearchParams(window.location.search).has('stress'),
  );
  const [latencyHint] = useState(() =>
    getLatencyHint(window.location.search, {
      touch: window.matchMedia(TOUCH_SCREEN).matches,
    }),
  );
  const level = useMemo(() => describeLevel(run), [run]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [loadout, setLoadout] = useState<LoadoutView>({ slots: [], active: 0 });
  const [hud, setHud] = useState<HudView | null>(null);
  const [paused, setPaused] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [startStep, setStartStep] = useState<StartStep | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  // Bumped on every (re)start, so the stage re-attaches to the new game.
  const [session, setSession] = useState(0);
  const game = useRef<Game | null>(null);
  // The watchdog reads the step outside React's render.
  const step = useRef<StartStep | null>(null);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => () => game.current?.stop(), []);

  useEffect(() => {
    if (status !== 'playing' || !surface.current || !game.current) return;
    const detach = game.current.attach(surface.current);
    const unsubscribe = [
      game.current.onLoadout(setLoadout),
      game.current.onHud(setHud),
      game.current.onSound(setSoundBlocked),
    ];
    setSoundBlocked(game.current.soundBlocked());
    return () => {
      unsubscribe.forEach(off => off());
      detach();
    };
  }, [status, session]);

  const fighting = status === 'playing' && hud?.status === 'playing';
  const pause = () => {
    game.current?.pause();
    setPaused(true);
  };
  const resume = () => {
    game.current?.resume();
    setPaused(false);
  };

  // Esc or P toggles; leaving the tab or turning the phone upright pauses,
  // and only a press resumes (an AudioContext needs a gesture to restart).
  useEffect(() => {
    if (!fighting) return;
    const portrait = window.matchMedia(
      `${TOUCH_SCREEN} and (orientation: portrait)`,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' && event.code !== 'KeyP') return;
      if (paused) resume();
      else pause();
    };
    const onHidden = () => {
      if (document.hidden) pause();
    };
    const onTurn = () => {
      if (portrait.matches) pause();
    };
    // Only a turn pauses, not being upright when the level mounts: the
    // landscape lock may still be rotating then, and nothing happens
    // before the player steps into the circle anyway.
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onHidden);
    portrait.addEventListener('change', onTurn);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onHidden);
      portrait.removeEventListener('change', onTurn);
    };
  });

  // startGame() has to run inside a click handler: browsers only let an
  // AudioContext start from a user gesture.
  const play = async (next: RunState) => {
    game.current?.stop();
    setPaused(false);
    setStatus('starting');
    setStartError(null);
    setRun(next);
    try {
      // Audio starts first: a fullscreen request uses up the click, and an
      // AudioContext started after it stays silent.
      const starting = startGame({
        run: next,
        stress,
        latencyHint,
        onStep: current => {
          step.current = current;
          setStartStep(current);
        },
      });
      void goLandscape();
      game.current = await withTimeout(starting, () => step.current);
    } catch (error) {
      // Without this a failed start leaves the button pressed for good.
      console.error(error);
      game.current = null;
      setStartError(error instanceof Error ? error.message : String(error));
      setStartStep(null);
      setStatus('idle');
      return;
    }
    setStartStep(null);
    setLoadout(game.current.loadout());
    setHud(game.current.hud());
    setSession(current => current + 1);
    setStatus('playing');
  };

  const handleStop = () => {
    game.current?.stop();
    game.current = null;
    setPaused(false);
    setStatus('idle');
  };

  const handleNextLevel = () => {
    if (game.current) void play(game.current.nextRun());
  };

  if (status === 'playing' && hud) {
    return (
      <GameScreen
        seed={run.seed}
        musicalKey={level.key}
        bpm={level.bpm}
        run={hud}
        loadout={loadout}
        paused={paused}
        surfaceRef={surface}
        onStop={handleStop}
        onPause={pause}
        onResume={resume}
        soundBlocked={soundBlocked}
        onRetrySound={() => game.current?.retrySound()}
        onRetry={() => play(newRun(run.seed))}
        onNewRun={() => play(newRun(randomSeed()))}
        onNextLevel={handleNextLevel}
        onTakeWeapon={() => game.current?.takeWeapon()}
      />
    );
  }

  return (
    <StartScreen
      seed={run.seed}
      musicalKey={level.key}
      bpm={level.bpm}
      isStarting={status === 'starting'}
      step={startStep}
      error={startError}
      onStart={() => play(run)}
    />
  );
};
