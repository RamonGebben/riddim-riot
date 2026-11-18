import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { Health } from './components/Health';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { RunOver } from './components/RunOver';
import { Surface } from './components/Surface';

export interface RunProps {
  status: 'playing' | 'dead';
  hp: number;
  maxHp: number;
  kills: number;
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
  /** Play the same level again. */
  onRetry: () => void;
  /** Start over on a fresh seed. */
  onNewRun: () => void;
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
}: GameScreenProps) => {
  return (
    <>
      <Surface ref={surfaceRef} aria-label="Play area">
        <Hint>
          WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · R reroll
        </Hint>
      </Surface>
      <Loadout {...loadout} />
      <Hud>
        <span>
          seed {seed} · {musicalKey} · {bpm} BPM halftime
        </span>
        <span>
          <Health hp={run.hp} maxHp={run.maxHp} /> · {run.kills} kills
        </span>
        <Button onClick={onStop}>Stop</Button>
      </Hud>
      {run.status === 'dead' && (
        <RunOver kills={run.kills} onRetry={onRetry} onNewRun={onNewRun} />
      )}
    </>
  );
};
