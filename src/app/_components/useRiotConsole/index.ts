import { useEffect, useRef, useState } from 'react';
import {
  BAG_SIZE,
  cleanRig,
  describeRig,
  isRigged,
  MAX_TIER,
  RIG_BPM,
  RIG_SUBGENRES,
  rigLoot,
  tierOf,
  type Game,
  type Rig,
} from '~/game';
import { readRig, saveRig } from '~/utils/devRig';

const HELP = `riot: rig a run for play-testing. A rigged run stays off the board.
Set before pressing Drop in (the rig is kept on this device):
  riot.level(4)          start on level 1-${MAX_TIER}
  riot.subgenre('liquid') every level plays it: ${RIG_SUBGENRES.join(', ')}
  riot.bpm(174)          every level at this tempo (${RIG_BPM[0]}-${RIG_BPM[1]})
  riot.god()             take no hits; riot.god(false) to stop
  riot.stress()          the level full of enemies from the first bar
  riot.skipCircle()      no circle: the song plays from the first bar
  riot.seed(1234)        the run's seed
  riot.rig({ level: 5, god: true })  several at once
  riot.reset()           back to a normal run
In a rigged level:
  riot.skip()            clear the level now
  riot.loot(5)           fill the bag with loot of a tier (the level's by default)
riot.rig()               what's rigged`;

/** Each setter called bare turns its switch on, or clears its value. */
export interface RiotConsole {
  help: () => void;
  rig: (rig?: Rig) => Rig;
  level: (level?: number) => Rig;
  subgenre: (subgenre?: string) => Rig;
  bpm: (bpm?: number) => Rig;
  god: (on?: boolean) => Rig;
  stress: (on?: boolean) => Rig;
  skipCircle: (on?: boolean) => Rig;
  seed: (seed?: number) => Rig;
  reset: () => Rig;
  skip: () => void;
  loot: (tier?: number) => void;
}

declare global {
  interface Window {
    riot?: RiotConsole;
  }
}

/**
 * The dev console's `riot`: a rig for the next run, kept on this device,
 * and a hand in the level under way. Returns the rig for the App to start
 * runs with.
 */
export const useRiotConsole = ({
  game,
  level,
  rigged,
}: {
  /** The game under way, if any. */
  game: { current: Game | null };
  /** The level being played, for loot of its tier. */
  level: number;
  /** Whether the run under way is rigged: only then can it be skipped or looted. */
  rigged: boolean;
}): Rig => {
  const [rig, setRig] = useState(() => readRig());
  const latest = useRef({ rig, level, rigged });
  useEffect(() => {
    latest.current = { rig, level, rigged };
  }, [rig, level, rigged]);

  useEffect(() => {
    const apply = (next: Rig) => {
      const clean = cleanRig(next);
      // Cleared values and off switches are dropped, not rejected.
      const rejected = Object.entries(next).filter(
        ([key, value]) =>
          value !== undefined && value !== false && !(key in clean),
      );
      if (rejected.length > 0)
        console.warn(
          'riot: ignored',
          Object.fromEntries(rejected),
          '- see riot.help()',
        );
      latest.current.rig = clean;
      saveRig(clean);
      setRig(clean);
      console.info(
        `riot: ${describeRig(clean) || 'not rigged'}. Applies from the next Drop in or retry.`,
      );
      return clean;
    };
    const change = (patch: Partial<Record<keyof Rig, unknown>>) =>
      apply({ ...latest.current.rig, ...patch } as Rig);
    const inLevel = (run: (current: Game) => void) => {
      const current = game.current;
      if (!current || current.hud().status !== 'playing') {
        console.warn('riot: no level under way');
        return;
      }
      // A skip or loot in a normal run would carry it onto the board.
      if (!latest.current.rigged) {
        console.warn(
          'riot: this run is not rigged - rig one and Drop in (riot.help())',
        );
        return;
      }
      run(current);
    };
    const riot: RiotConsole = {
      help: () => console.info(HELP),
      rig: next => (next ? apply(next) : latest.current.rig),
      level: next => change({ level: next }),
      subgenre: next => change({ subgenre: next }),
      bpm: next => change({ bpm: next }),
      god: (on = true) => change({ god: on }),
      stress: (on = true) => change({ stress: on }),
      skipCircle: (on = true) => change({ skipCircle: on }),
      seed: next => change({ seed: next }),
      reset: () => apply({}),
      skip: () => inLevel(current => current.skipLevel()),
      loot: tier =>
        inLevel(current => {
          const loot = rigLoot(Date.now() >>> 0, {
            tier: tier ?? tierOf(latest.current.level),
            count: BAG_SIZE,
          });
          current.stockBag(loot);
          console.info(`riot: ${loot.length} weapons in the bag`);
        }),
    };
    window.riot = riot;
    const { rig: saved } = latest.current;
    if (isRigged(saved))
      console.info(
        `riot: rigged, ${describeRig(saved)}. riot.reset() to stop.`,
      );
    return () => {
      if (window.riot === riot) delete window.riot;
    };
  }, [game]);

  return rig;
};
