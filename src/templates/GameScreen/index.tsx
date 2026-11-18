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

export interface RunProps {
  status: 'playing' | 'dead' | 'cleared';
  level: number;
  hp: number;
  maxHp: number;
  kills: number;
  score: number;
  /** The live combo; shown from 2 up. */
  combo: number;
  wavesCleared: number;
  wavesToClear: number;
  exitOpen: boolean;
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
  const waves = Math.min(run.wavesCleared, run.wavesToClear);
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>
          WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · F take
          weapon
        </Hint>
      </Surface>
      {run.pickup && (
        <Prompt>
          <kbd>F</kbd> take {run.pickup}
        </Prompt>
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
          {run.exitOpen ? 'exit open' : `waves ${waves}/${run.wavesToClear}`}
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
            `${run.wavesCleared} waves`,
            `${run.kills} kills`,
            `${run.score.toLocaleString('en')} points`,
          ]}
          actions={[{ label: 'Next level', onClick: onNextLevel }]}
        />
      )}
    </>
  );
};
