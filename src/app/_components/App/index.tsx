import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  attachBackdrop,
  describeLevel,
  describeLoadout,
  newRun,
  readFlashing,
  reducesFlashing,
  RUN_LEVELS,
  saveFlashing,
  setFlashingReduced,
  startGame,
  type Game,
  type HudView,
  type LoadoutView,
  type RunState,
  type StartStep,
} from '~/game';
import { GameScreen } from '~/templates/GameScreen';
import { LevelCard } from '~/templates/LevelCard';
import { useTRPC } from '~/providers/TrpcProvider';
import { StartScreen } from '~/templates/StartScreen';
import { readBest, saveBest } from '~/utils/bestScore';
import { getLatencyHint } from '~/utils/getLatencyHint';
import { getSeed } from '~/utils/getSeed';
import { goLandscape, TOUCH_SCREEN } from '~/utils/landscape';
import type { PendingRun } from '~/utils/pendingRun';
import { RunBoard } from '../RunBoard';
import { SavePendingRun } from '../SavePendingRun';

type SessionStatus = 'idle' | 'starting' | 'playing';

const randomSeed = () => getSeed('');

/** How long a cleared level's stats show before the next one starts. */
const NEXT_LEVEL_MS = 3500;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

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

const HIGH_SCORES_HREF = '/leaderboard';

export const App = () => {
  const trpc = useTRPC();
  const startRun = useMutation(trpc.runs.start.mutationOptions());
  /** The board's ticket for the run under way; null until it arrives. */
  const [ticket, setTicket] = useState<string | null>(null);
  const runCount = useRef(0);
  const [run, setRun] = useState(() => newRun(getSeed(window.location.search)));
  const backdrop = useRef<HTMLDivElement>(null);
  /** Shake and flashes turned down: the player's choice, else the system's. */
  const [flashingReduced, setReduced] = useState(() =>
    reducesFlashing(readFlashing(), window.matchMedia(REDUCED_MOTION).matches),
  );
  // `?stress` fills the level with enemies, for checking performance.
  const [stress] = useState(() =>
    new URLSearchParams(window.location.search).has('stress'),
  );
  const [latencyHint] = useState(() =>
    getLatencyHint(window.location.search, {
      touch: window.matchMedia(TOUCH_SCREEN).matches,
      firefox: navigator.userAgent.includes('Firefox'),
    }),
  );
  const level = useMemo(() => describeLevel(run), [run]);
  const weapons = useMemo(() => describeLoadout(run), [run]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [loadout, setLoadout] = useState<LoadoutView>({ slots: [], active: 0 });
  const [hud, setHud] = useState<HudView | null>(null);
  const [paused, setPaused] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [startStep, setStartStep] = useState<StartStep | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  /** The best score before this run, so the end can say if it beat it. */
  const [best, setBest] = useState(() => readBest());
  /** Starting the next level of a run, not a fresh one: show its card. */
  const [between, setBetween] = useState(false);
  // Bumped on every (re)start, so the stage re-attaches to the new game.
  const [session, setSession] = useState(0);
  const game = useRef<Game | null>(null);
  // The watchdog reads the step outside React's render.
  const step = useRef<StartStep | null>(null);
  const surface = useRef<HTMLElement>(null);

  useEffect(() => () => game.current?.stop(), []);

  // The stage reads it every frame; the page's own animations, off the root.
  useEffect(() => {
    setFlashingReduced(flashingReduced);
    document.documentElement.dataset.flashing = flashingReduced
      ? 'reduced'
      : 'full';
  }, [flashingReduced]);

  // Until the player chooses, follow the system's setting as it changes.
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = () => {
      if (readFlashing() === null) setReduced(query.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const chooseFlashing = (reduced: boolean) => {
    saveFlashing(reduced ? 'reduced' : 'full');
    setReduced(reduced);
  };

  // The start screen's live level, redrawn when the seed changes.
  const onStart = status !== 'playing' && !between;
  useEffect(() => {
    if (!onStart || !backdrop.current) return;
    return attachBackdrop(backdrop.current, run);
  }, [onStart, run]);

  /** A link that plays this run's seed; resolves whether it was copied. */
  const copySeed = async () => {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set('seed', String(run.seed));
    try {
      await navigator.clipboard.writeText(url.href);
      return true;
    } catch {
      // No clipboard here (an insecure page) or the browser refused.
      return false;
    }
  };

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
  const won =
    status === 'playing' &&
    hud?.status === 'cleared' &&
    hud.level >= hud.levels;
  const advancing = status === 'playing' && hud?.status === 'cleared' && !won;

  // A run that ends - dead or won - keeps its score if it's the best yet.
  const ended = status === 'playing' && (hud?.status === 'dead' || won);
  useEffect(() => {
    if (ended && hud) saveBest(hud.score);
  }, [ended, hud]);

  // Dying or winning goes on the board; quitting doesn't.
  const finished = useMemo((): PendingRun | null => {
    if (!ended || !hud || !ticket) return null;
    return {
      ticket,
      score: hud.score,
      level: hud.level,
      kills: hud.kills,
      seed: run.seed,
      outcome: won ? 'won' : 'died',
    };
  }, [ended, hud, ticket, run.seed, won]);

  // A cleared level shows its stats a moment, then the next one starts by
  // itself: the run flows on without a click.
  useEffect(() => {
    if (!advancing) return;
    const timer = setTimeout(handleNextLevel, NEXT_LEVEL_MS);
    return () => clearTimeout(timer);
    // Timed from the clear alone: a re-render mustn't restart the wait.
  }, [advancing]);
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
  const play = async (next: RunState, { fresh = true } = {}) => {
    game.current?.stop();
    game.current = null;
    setPaused(false);
    setBetween(!fresh);
    if (fresh) setBest(readBest());
    setStatus('starting');
    setStartError(null);
    setRun(next);
    if (fresh) setTicket(null);
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
      // Only a press can go fullscreen; the next level starts by itself.
      if (fresh) void goLandscape();
      // The board's ticket starts the run's clock. Without one (offline)
      // the run plays the same, it just can't be saved.
      if (fresh) {
        const count = ++runCount.current;
        startRun.mutateAsync().then(
          started => {
            if (count === runCount.current) setTicket(started.ticket);
          },
          () => {},
        );
      }
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
    if (game.current) void play(game.current.nextRun(), { fresh: false });
  };

  if (status === 'playing' && hud) {
    return (
      <GameScreen
        seed={run.seed}
        musicalKey={level.key}
        run={hud}
        loadout={loadout}
        best={best}
        board={
          ended ? <RunBoard key={ticket ?? 'none'} run={finished} /> : undefined
        }
        paused={paused}
        surfaceRef={surface}
        onStop={handleStop}
        onPause={pause}
        onResume={resume}
        soundBlocked={soundBlocked}
        onRetrySound={() => game.current?.retrySound()}
        onRetry={() => play(newRun(run.seed))}
        onNewRun={() => play(newRun(randomSeed()))}
        onCopySeed={copySeed}
        onNextLevel={handleNextLevel}
        onTakeWeapon={() => game.current?.takeWeapon()}
        onFireSlot={slot => game.current?.fireSlot(slot)}
        onReleaseSlot={slot => game.current?.releaseSlot(slot)}
        onDash={() => game.current?.dash()}
      />
    );
  }

  if (status === 'starting' && between) {
    return (
      <LevelCard level={run.level} levels={RUN_LEVELS} musicalKey={level.key} />
    );
  }

  return (
    <>
      <SavePendingRun />
      <StartScreen
        musicalKey={level.key}
        bpm={level.bpm}
        levels={RUN_LEVELS}
        best={best}
        weapons={weapons}
        backdropRef={backdrop}
        flashingReduced={flashingReduced}
        onFlashingReduced={chooseFlashing}
        isStarting={status === 'starting'}
        step={startStep}
        error={startError}
        highScoresHref={HIGH_SCORES_HREF}
        onStart={() => play(run)}
      />
    </>
  );
};
