import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Combo } from './components/Combo';
import { Health } from './components/Health';
import { HudActions } from './components/HudActions';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { Overlay } from './components/Overlay';
import { PointerOnly } from './components/PointerOnly';
import { Prompt } from './components/Prompt';
import { RotateNotice } from './components/RotateNotice';
import { Surface } from './components/Surface';
import { TakeButton } from './components/TakeButton';

/** Where a level is, from waiting at the circle to its exit open. */
export type LevelPhase = 'waiting' | 'charging' | 'song' | 'clear';

export type SongPart =
  | 'intro'
  | 'breakdown'
  | 'buildup'
  | 'drop1'
  | 'drop2'
  | 'bridge'
  | 'drop3'
  | 'outro';

export interface RunProps {
  status: 'playing' | 'dead' | 'cleared';
  level: number;
  hp: number;
  maxHp: number;
  kills: number;
  score: number;
  /** The live combo; shown from 2 up. */
  combo: number;
  phase: LevelPhase;
  /** The song part playing, once the song has started. */
  part: SongPart | null;
  /** Seconds left in the part. */
  secondsLeft: number | null;
  /** The boss is up. */
  boss: boolean;
  /** The weapon the player is standing on, if any. */
  pickup: string | null;
}

export interface GameScreenProps {
  seed: number;
  /** The level's key, e.g. "F minor". */
  musicalKey: string;
  bpm: number;
  run: RunProps;
  loadout: LoadoutProps;
  /** Frozen mid-level, waiting for Resume. */
  paused: boolean;
  /** The element the game attaches its input and canvas to. */
  surfaceRef?: Ref<HTMLElement>;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  /** Start the same run over. */
  onRetry: () => void;
  /** Start over on a fresh seed. */
  onNewRun: () => void;
  onNextLevel: () => void;
  /** Take the weapon underfoot: the touch screen's button for F. */
  onTakeWeapon: () => void;
}

const CIRCLE_PROMPTS = {
  waiting: 'Step into the circle to start',
  charging: null,
  song: null,
  clear: 'Step into the circle to leave',
} satisfies Record<LevelPhase, string | null>;

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const PART_NAMES = {
  intro: 'intro',
  breakdown: 'breakdown',
  buildup: 'build-up',
  drop1: 'drop 1',
  drop2: 'drop 2',
  bridge: 'bridge',
  drop3: 'drop 3',
  outro: 'outro',
} satisfies Record<SongPart, string>;

const phaseLabel = ({ phase, part, secondsLeft, boss }: RunProps) => {
  if (phase === 'waiting') return 'ready';
  if (phase === 'charging') return 'charging';
  if (phase === 'clear') return 'exit open';
  const label = `${part ? PART_NAMES[part] : ''} ${clock(secondsLeft ?? 0)}`;
  return boss ? `${label} · boss` : label;
};

export const GameScreen = ({
  seed,
  musicalKey,
  bpm,
  run,
  loadout,
  paused,
  surfaceRef,
  onStop,
  onPause,
  onResume,
  onRetry,
  onNewRun,
  onNextLevel,
  onTakeWeapon,
}: GameScreenProps) => {
  const prompt = run.pickup ? (
    <PointerOnly $pointer="mouse">
      <kbd>F</kbd> take {run.pickup}
    </PointerOnly>
  ) : (
    CIRCLE_PROMPTS[run.phase]
  );
  const playing = run.status === 'playing' && !paused;
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>
          <PointerOnly $pointer="mouse">
            WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · F take
            weapon
          </PointerOnly>
          <PointerOnly $pointer="touch">
            left: aim, push further to move · right: tap or hold to fire, swipe
            to switch
          </PointerOnly>
        </Hint>
      </Surface>
      {prompt && playing && <Prompt>{prompt}</Prompt>}
      {run.pickup && playing && (
        <TakeButton onClick={onTakeWeapon}>Take {run.pickup}</TakeButton>
      )}
      <Loadout {...loadout} />
      <Hud>
        <span>
          seed {seed} · level {run.level} · {musicalKey} · {bpm} BPM
        </span>
        <span>
          <Health hp={run.hp} maxHp={run.maxHp} /> · {run.kills} kills ·{' '}
          {run.score.toLocaleString('en')} pts ·{' '}
          {run.combo >= 2 && (
            <>
              <Combo>×{run.combo}</Combo> ·{' '}
            </>
          )}
          {phaseLabel(run)}
        </span>
        <HudActions>
          {playing && <Button onClick={onPause}>Pause</Button>}
          <Button onClick={onStop}>Stop</Button>
        </HudActions>
      </Hud>
      {paused && run.status === 'playing' && (
        <Overlay
          heading="Paused"
          stats={[
            `Level ${run.level}`,
            `${run.kills} kills`,
            `${run.score.toLocaleString('en')} points`,
          ]}
          actions={[
            { label: 'Resume', onClick: onResume },
            { label: 'Quit', onClick: onStop },
          ]}
        />
      )}
      {run.status === 'dead' && (
        <Overlay
          heading="Run over"
          stats={[
            `Level ${run.level}`,
            `${run.kills} kills`,
            `${run.score.toLocaleString('en')} points`,
          ]}
          actions={[
            { label: 'Try again', onClick: onRetry },
            { label: 'New run', onClick: onNewRun },
          ]}
        />
      )}
      <RotateNotice>Turn your phone sideways to play</RotateNotice>
      {run.status === 'cleared' && (
        <Overlay
          heading={`Level ${run.level} cleared`}
          stats={[
            `${run.kills} kills`,
            `${run.score.toLocaleString('en')} points`,
          ]}
          actions={[{ label: 'Next level', onClick: onNextLevel }]}
        />
      )}
    </>
  );
};
