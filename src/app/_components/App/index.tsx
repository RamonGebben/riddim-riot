import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  attachBackdrop,
  BAG_SIZE,
  BPM,
  describeLevel,
  describeLoadout,
  describeWeapons,
  newRun,
  readFlashing,
  reducesFlashing,
  RUN_LEVELS,
  sameRecipe,
  saveFlashing,
  setFlashingReduced,
  startGame,
  type Game,
  type HudView,
  type Inventory,
  type LoadoutView,
  type RunState,
  type StartStep,
  type WeaponRecipe,
} from '~/game';
import {
  GameScreen,
  type LoadoutMenuProps,
  type Choice,
} from '~/templates/GameScreen';
import { LevelCard } from '~/templates/LevelCard';
import { useTRPC } from '~/providers/TrpcProvider';
import { StartScreen, type StartAccount } from '~/templates/StartScreen';
import { readBest, saveBest } from '~/utils/bestScore';
import { getLatencyHint } from '~/utils/getLatencyHint';
import { getSeed } from '~/utils/getSeed';
import { goLandscape, TOUCH_SCREEN } from '~/utils/landscape';
import { readTutorialSeen, saveTutorialSeen } from '~/utils/tutorialSeen';
import type { PendingRun } from '~/utils/pendingRun';
import { RunBoard } from '../RunBoard';
import { SavePendingRun } from '../SavePendingRun';
import { useAccount } from '../useAccount';
import { useKeptLoadout, type KeptStatus } from '../useKeptLoadout';

type SessionStatus = 'idle' | 'starting' | 'playing';

const randomSeed = () => getSeed('');

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

/** What the loadout menu is auditioning (see `LoadoutMenuProps.preview`). */
type Audition = NonNullable<LoadoutMenuProps['preview']>;

/** Under the loadout menu: where the loadout is kept, and the bag's fate. */
const KEPT_NOTES = {
  guest:
    'Your loadout is kept on this device. Sign in to take it to any device.',
  saving: 'Saving your loadout to your account…',
  saved: 'Your loadout is kept on your account.',
  failed:
    "Couldn't save your loadout to your account; it's kept on this device.",
} satisfies Record<KeptStatus, string>;

/**
 * Bag weapons not among `seen` - picked up since the menu last closed.
 * Matched one for one: the same recipe can drop twice.
 */
const freshIn = (bag: Array<WeaponRecipe>, seen: Array<WeaponRecipe>) => {
  const left = [...seen];
  return bag.map(recipe => {
    const at = left.findIndex(other => sameRecipe(other, recipe));
    if (at < 0) return true;
    left.splice(at, 1);
    return false;
  });
};

export const App = () => {
  const trpc = useTRPC();
  const startRun = useMutation(trpc.runs.start.mutationOptions());
  /** The board's ticket for the run under way; null until it arrives. */
  const [ticket, setTicket] = useState<string | null>(null);
  const runCount = useRef(0);
  const [run, setRun] = useState(() => newRun(getSeed(window.location.search)));
  const kept = useKeptLoadout();
  const { me, signIn, signOut } = useAccount();
  /** A fresh run on `seed`, opening with the kept loadout if there is one. */
  const freshRun = (seed: number) => newRun(seed, kept.recipes ?? undefined);
  // A level-1 run hasn't started yet (later levels are a run under way,
  // left by quitting): it opens with the kept loadout as it is now.
  const ready = useMemo(
    () =>
      run.level === 1 && kept.recipes
        ? { ...run, recipes: kept.recipes, active: 0 }
        : run,
    [run, kept.recipes],
  );
  /** The loadout menu's inventory while it's open, with ids for each weapon. */
  const [menu, setMenu] = useState<Inventory | null>(null);
  const [arranging, setArranging] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  /** What the menu is auditioning, and which weapon is sounding now. */
  const [previewing, setPreviewing] = useState<Audition | null>(null);
  /** What the menu last closed on, so new loot can be marked. */
  const seen = useRef<Array<WeaponRecipe>>([]);
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
  const weapons = useMemo(() => describeLoadout(ready), [ready]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [loadout, setLoadout] = useState<LoadoutView>({ slots: [], active: 0 });
  const [hud, setHud] = useState<HudView | null>(null);
  const [paused, setPaused] = useState(false);
  /** The player quit: the run ends here, frozen, and goes on the board. */
  const [quit, setQuit] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [startStep, setStartStep] = useState<StartStep | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  /** The best score before this run, so the end can say if it beat it. */
  const [best, setBest] = useState(() => readBest());
  const [tutorialSeen, setTutorialSeen] = useState(() => readTutorialSeen());
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

  const fighting = status === 'playing' && hud?.status === 'playing' && !quit;

  // The walkthrough is for a first play only: once the circle has started
  // a run, it's done with, however far through it the player got.
  // Stepping in and back out doesn't count: only the slam does.
  const started =
    hud !== null && hud.phase !== 'waiting' && hud.phase !== 'charging';
  useEffect(() => {
    if (!started || tutorialSeen) return;
    saveTutorialSeen();
    setTutorialSeen(true);
  }, [started, tutorialSeen]);
  const won =
    status === 'playing' &&
    hud?.status === 'cleared' &&
    hud.level >= hud.levels;
  const advancing = status === 'playing' && hud?.status === 'cleared' && !won;

  // A run that ends - dead, quit or won - keeps its score if it's the best.
  const ended = status === 'playing' && (hud?.status === 'dead' || won || quit);
  useEffect(() => {
    if (ended && hud) saveBest(hud.score);
  }, [ended, hud]);

  // Every ending goes on the board, quitting too. Keyed on the
  // run's numbers, not the HUD: it keeps changing after the end (the song
  // clock, the combo lapsing), and a new object would keep the run on the
  // device again after it was saved or skipped.
  const endScore = ended ? hud?.score : undefined;
  const endLevel = ended ? hud?.level : undefined;
  const endKills = ended ? hud?.kills : undefined;
  const finished = useMemo((): PendingRun | null => {
    if (
      !ticket ||
      endScore === undefined ||
      endLevel === undefined ||
      endKills === undefined
    )
      return null;
    return {
      ticket,
      score: endScore,
      level: endLevel,
      kills: endKills,
      seed: run.seed,
      outcome: won ? 'won' : quit ? 'quit' : 'died',
    };
  }, [ticket, endScore, endLevel, endKills, run.seed, won, quit]);

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
    // The menu keeps the game frozen and takes its own keys.
    if (!fighting || menu) return;
    const portrait = window.matchMedia(
      `${TOUCH_SCREEN} and (orientation: portrait)`,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      // Paused, only B opens the bag (it closes back to the pause): Tab
      // moves between the pause's buttons.
      if (event.code === 'KeyB' || (event.code === 'Tab' && !paused)) {
        event.preventDefault();
        if (!event.repeat) openMenu();
        return;
      }
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
    setQuit(false);
    setMenu(null);
    if (fresh) seen.current = [];
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
    setQuit(false);
    setMenu(null);
    setStatus('idle');
  };

  /**
   * Quitting ends the run with what it has scored, on the run-over
   * screen. A run with nothing to show yet - the first level, no points -
   * just goes back to the start.
   */
  const handleQuit = () => {
    const current = game.current;
    if (!current) return;
    const { level: at, score } = current.hud();
    if (at === 1 && score === 0) {
      handleStop();
      return;
    }
    current.pause();
    setQuit(true);
  };

  /** From a quit run's end: the start screen, on a fresh run of its seed. */
  const handleLeave = () => {
    handleStop();
    setRun(freshRun(run.seed));
  };

  /**
   * Mid-level the game freezes behind the menu, its bar looping under a
   * low-pass; after a run, it's over and the track plays on.
   */
  const openMenu = () => {
    const current = game.current;
    if (!current) return;
    if (current.hud().status === 'playing') current.openMenu();
    setMenuError(null);
    setMenu(current.inventory());
  };

  /** The menu's weapons, described once per opening, with ids for each. */
  const menuWeapons = useMemo(() => {
    if (!menu) return null;
    const fresh = freshIn(menu.bag, seen.current);
    return {
      slots: describeWeapons(menu.recipes, run).map((face, i) => ({
        ...face,
        id: `slot-${i}`,
      })),
      bag: describeWeapons(menu.bag, run).map((face, i) => ({
        ...face,
        id: `bag-${i}`,
        fresh: fresh[i],
      })),
      recipes: new Map<string, WeaponRecipe>([
        ...menu.recipes.map((recipe, i) => [`slot-${i}`, recipe] as const),
        ...menu.bag.map((recipe, i) => [`bag-${i}`, recipe] as const),
      ]),
    };
  }, [menu, run]);

  const closeMenu = async ({ slots, bag }: Choice) => {
    const current = game.current;
    if (!menuWeapons || !current) return;
    const pick = (ids: Array<string>) =>
      ids.flatMap(id => {
        const recipe = menuWeapons.recipes.get(id);
        return recipe ? [recipe] : [];
      });
    // Leaving a cleared level scraps whatever isn't in a slot.
    const chosen = { recipes: pick(slots), bag: advancing ? [] : pick(bag) };
    setArranging(true);
    try {
      // Armed while still frozen, so the level resumes with the new weapons.
      await current.arrange(chosen);
    } catch (error) {
      console.error(error);
      setMenuError(
        "Couldn't arm the new weapons. Try again, or undo the changes to fight on.",
      );
      return;
    } finally {
      setArranging(false);
    }
    seen.current = [...chosen.recipes, ...chosen.bag];
    kept.keep(chosen.recipes);
    setMenu(null);
    setPreviewing(null);
    if (advancing) {
      handleNextLevel();
      return;
    }
    if (current.hud().status === 'playing') current.closeMenu();
  };

  /**
   * Hear `ids` - one weapon, or two as an A/B. The menu learns which one
   * sounds as each bar starts, and it clears when they stop, unless
   * another audition has taken over since.
   */
  const audition = (ids: Array<string>) => {
    const recipes = ids.flatMap(id => {
      const recipe = menuWeapons?.recipes.get(id);
      return recipe ? [recipe] : [];
    });
    const current = game.current;
    if (!current || recipes.length !== ids.length) return;
    setPreviewing({ ids, sounding: null, turn: 0 });
    const heard = (id: string) =>
      setPreviewing(playing =>
        playing?.ids === ids
          ? { ids, sounding: id, turn: playing.turn + 1 }
          : playing,
      );
    const failed = (error: unknown) => {
      console.error(error);
      setPreviewing(now => (now?.ids === ids ? null : now));
      setMenuError("Couldn't play the preview. Press it again to retry.");
    };
    const [a, b] = recipes;
    setMenuError(null);
    // Called right here, inside the press: the preview's sound can only
    // start from a gesture, and a deferred call would have spent it.
    try {
      const playing = b
        ? current.previewAB(a, b, which => heard(ids[which]))
        : current.preview(a, () => heard(ids[0]));
      void playing.then(
        () => setPreviewing(now => (now?.ids === ids ? null : now)),
        failed,
      );
    } catch (error) {
      failed(error);
    }
  };

  const menuProps = ((): LoadoutMenuProps | null => {
    if (!menuWeapons) return null;
    const shared = {
      slots: menuWeapons.slots,
      bag: menuWeapons.bag,
      bagSize: BAG_SIZE,
      isApplying: arranging,
      error: menuError,
      preview: previewing,
      barSeconds: (60 / BPM) * 4,
      onPreview: (id: string) => audition([id]),
      onPreviewAB: (a: string, b: string) => audition([a, b]),
      onStopPreview: () => {
        game.current?.stopPreview();
        setPreviewing(null);
      },
      onDone: (choice: Choice) => void closeMenu(choice),
    };
    // Between levels: keep three, and the rest goes when the next starts.
    if (advancing && hud) {
      const next = hud.level + 1;
      return {
        ...shared,
        heading: 'Sort your loot',
        note: `Equip the three weapons to take into level ${next}. Everything left in the bag is scrapped when it starts.`,
        doneLabel: `Start level ${next}`,
        scrapsBag: true,
      };
    }
    const over = hud?.status !== 'playing' || quit;
    return {
      ...shared,
      heading: over ? 'Your loadout' : 'Loadout',
      note: over
        ? `${KEPT_NOTES[kept.status]} The bag empties when the next run starts.`
        : KEPT_NOTES[kept.status],
      doneLabel: over ? 'Done' : 'Back',
    };
  })();

  const handleNextLevel = () => {
    if (game.current) void play(game.current.nextRun(), { fresh: false });
  };

  if (status === 'playing' && hud) {
    return (
      <GameScreen
        seed={run.seed}
        musicalKey={level.key}
        run={quit ? { ...hud, status: 'quit' } : hud}
        loadout={loadout}
        best={best}
        board={
          ended ? <RunBoard key={ticket ?? 'none'} run={finished} /> : undefined
        }
        paused={paused}
        menu={menuProps}
        surfaceRef={surface}
        onStop={handleQuit}
        onLeave={handleLeave}
        onPause={pause}
        onResume={resume}
        soundBlocked={soundBlocked}
        tutorial={!tutorialSeen && run.level === 1}
        onRetrySound={() => game.current?.retrySound()}
        onRetry={() => play(freshRun(run.seed))}
        onNewRun={() => play(freshRun(randomSeed()))}
        onCopySeed={copySeed}
        onNextLevel={handleNextLevel}
        onOpenMenu={openMenu}
        onFireSlot={slot => game.current?.fireSlot(slot)}
        onReleaseSlot={slot => game.current?.releaseSlot(slot)}
        onDash={() => game.current?.dash()}
      />
    );
  }

  const account = ((): StartAccount => {
    if (me.isPending) return { kind: 'loading' };
    if (me.data) return { kind: 'signedIn', name: me.data.name, ...signOut };
    return { kind: 'signedOut', ...signIn };
  })();

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
        account={account}
        onStart={() => play(ready)}
      />
    </>
  );
};
