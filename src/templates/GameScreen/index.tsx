import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Combo } from './components/Combo';
import { Health } from './components/Health';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { Overlay } from './components/Overlay';
import { Prompt } from './components/Prompt';
import { Surface } from './components/Surface';

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
  /** The element the game attaches its input and canvas to. */
  surfaceRef?: Ref<HTMLElement>;
  onStop: () => void;
  /** Start the same run over. */
  onRetry: () => void;
  /** Start over on a fresh seed. */
  onNewRun: () => void;
  onNextLevel: () => void;
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
  surfaceRef,
  onStop,
  onRetry,
  onNewRun,
  onNextLevel,
}: GameScreenProps) => {
  const prompt = run.pickup ? (
    <>
      <kbd>F</kbd> take {run.pickup}
    </>
  ) : (
    CIRCLE_PROMPTS[run.phase]
  );
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>
          WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · F take
          weapon
        </Hint>
      </Surface>
      {prompt && run.status === 'playing' && <Prompt>{prompt}</Prompt>}
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
        <Button onClick={onStop}>Stop</Button>
      </Hud>
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
