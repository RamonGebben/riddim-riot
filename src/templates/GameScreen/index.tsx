import type { Ref } from 'react';
import { Icon } from '~/atoms/Icon';
import { PAUSE_ICON } from '~/game/icons';
import { Combo } from './components/Combo';
import { Health } from './components/Health';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { HudActions } from './components/HudActions';
import { HudPanel } from './components/HudPanel';
import { IconButton } from './components/IconButton';
import { LevelBadge } from './components/LevelBadge';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { LockPage } from './components/LockPage';
import { Overlay } from './components/Overlay';
import { PointerOnly } from './components/PointerOnly';
import { Prompt } from './components/Prompt';
import { RotateNotice } from './components/RotateNotice';
import { Score } from './components/Score';
import { SongTrack } from './components/SongTrack';
import { Surface } from './components/Surface';
import { TakeButton } from './components/TakeButton';
import { WeaponTag } from './components/WeaponTag';
import type { LevelPhase, SongPart, WeaponFace } from './types';

export type { LevelPhase, SongPart, WeaponFace } from './types';
export type { LoadoutProps, SlotProps } from './components/Loadout';

export interface RunProps {
  status: 'playing' | 'dead' | 'cleared';
  level: number;
  /** Levels in a run; clearing the last wins it. */
  levels: number;
  hp: number;
  /** Health a run starts with; anything past it is bonus hearts. */
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
  song: Array<{ part: SongPart; bars: number }>;
  /** Bars into the song, once it's started. */
  songBar: number | null;
  /** The boss's health, 0-1, while it's up. */
  boss: number | null;
  /** The weapon the player is standing on, if any. */
  pickup: WeaponFace | null;
}

export interface GameScreenProps {
  seed: number;
  /** The level's key, e.g. "F minor". */
  musicalKey: string;
  run: RunProps;
  loadout: LoadoutProps;
  /** The best score on this device, before this run. */
  best: number;
  /** Frozen mid-level, waiting for Resume. */
  paused: boolean;
  /** The browser is holding the sound back, so the game waits for it. */
  soundBlocked: boolean;
  /** The element the game attaches its input and canvas to. */
  surfaceRef?: Ref<HTMLElement>;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  /** Try to start the sound again; it's a press, which browsers require. */
  onRetrySound: () => void;
  /** Start the same run over. */
  onRetry: () => void;
  /** Start over on a fresh seed. */
  onNewRun: () => void;
  onNextLevel: () => void;
  /** Take the weapon underfoot: the touch screen's button for F. */
  onTakeWeapon: () => void;
  /** A slot button held: switch to it and fire; let go to stop. */
  onFireSlot: (slot: number) => void;
  onReleaseSlot: (slot: number) => void;
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
  return boss === null ? label : `${label} · boss`;
};

const points = (score: number) => `${score.toLocaleString('en')} points`;

/** The score, and whether it beat the device's best. */
const scoreLines = (score: number, best: number) =>
  score > best && score > 0
    ? [points(score), 'New best!']
    : [points(score), `Best ${best.toLocaleString('en')}`];

export const GameScreen = ({
  seed,
  musicalKey,
  run,
  loadout,
  best,
  paused,
  soundBlocked,
  surfaceRef,
  onStop,
  onPause,
  onResume,
  onRetrySound,
  onRetry,
  onNewRun,
  onNextLevel,
  onTakeWeapon,
  onFireSlot,
  onReleaseSlot,
}: GameScreenProps) => {
  const holding = loadout.slots[loadout.active];
  const prompt = run.pickup ? (
    <PointerOnly $pointer="mouse">
      <kbd>F</kbd> take <WeaponTag {...run.pickup} />
      {holding && (
        <>
          {' '}
          for your <WeaponTag {...holding} />
        </>
      )}
    </PointerOnly>
  ) : (
    CIRCLE_PROMPTS[run.phase]
  );
  const playing = run.status === 'playing' && !paused;
  const won = run.status === 'cleared' && run.level >= run.levels;
  return (
    <>
      <LockPage />
      <Surface ref={surfaceRef} aria-label="Play area">
        {run.phase === 'waiting' && (
          <Hint>
            <PointerOnly $pointer="mouse">
              WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · F take
              weapon
            </PointerOnly>
            <PointerOnly $pointer="touch">
              left: aim, push further to move · right: tap or hold to fire ·
              hold a weapon to fire it
            </PointerOnly>
          </Hint>
        )}
      </Surface>
      {prompt && playing && <Prompt>{prompt}</Prompt>}
      {run.pickup && playing && (
        <TakeButton onClick={onTakeWeapon}>
          Take <WeaponTag {...run.pickup} />
        </TakeButton>
      )}
      <Loadout
        {...loadout}
        paused={!playing}
        onFire={onFireSlot}
        onRelease={onReleaseSlot}
      />
      <Hud>
        <HudPanel>
          <Health hp={run.hp} maxHp={run.maxHp} />
          <LevelBadge>
            {run.level}/{run.levels}
          </LevelBadge>
        </HudPanel>
        <SongTrack
          label={phaseLabel(run)}
          song={run.song}
          songBar={run.songBar}
          boss={run.boss}
        />
        <HudActions>
          <HudPanel>
            {run.combo >= 2 && <Combo key={run.combo}>×{run.combo}</Combo>}
            <Score aria-label="Score">{run.score.toLocaleString('en')}</Score>
          </HudPanel>
          {playing && (
            <IconButton aria-label="Pause" onClick={onPause}>
              <Icon icon={PAUSE_ICON} />
            </IconButton>
          )}
        </HudActions>
      </Hud>
      {soundBlocked && !paused && run.status === 'playing' && (
        <Overlay
          heading="Sound couldn't start"
          stats={[
            'The game runs on the music, so it waits for it.',
            'Check that sound can play on this device, then try again.',
          ]}
          actions={[
            { label: 'Start sound', onClick: onRetrySound },
            { label: 'Quit', onClick: onStop },
          ]}
        />
      )}
      {paused && run.status === 'playing' && (
        <Overlay
          heading="Paused"
          stats={[
            `Level ${run.level} of ${run.levels} · ${musicalKey}`,
            `${run.kills} kills`,
            points(run.score),
          ]}
          note={`seed ${seed}`}
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
            `Level ${run.level} of ${run.levels}`,
            `${run.kills} kills`,
            ...scoreLines(run.score, best),
          ]}
          note={`seed ${seed}`}
          actions={[
            { label: 'Try again', onClick: onRetry },
            { label: 'New run', onClick: onNewRun },
          ]}
        />
      )}
      <RotateNotice>Turn your phone sideways to play</RotateNotice>
      {run.status === 'cleared' && !won && (
        <Overlay
          heading={`Level ${run.level} cleared`}
          stats={[`${run.kills} kills`, points(run.score)]}
          note={`Level ${run.level + 1} of ${run.levels} is coming up`}
          actions={[{ label: 'Next level', onClick: onNextLevel }]}
        />
      )}
      {won && (
        <Overlay
          heading="Run complete"
          stats={[
            `All ${run.levels} levels`,
            `${run.kills} kills`,
            ...scoreLines(run.score, best),
          ]}
          note={`seed ${seed}`}
          actions={[
            { label: 'New run', onClick: onNewRun },
            { label: 'Play this seed again', onClick: onRetry },
          ]}
        />
      )}
    </>
  );
};
