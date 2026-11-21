import { useState, type ReactNode, type Ref } from 'react';
import { formatNumber } from '~/utils/formatNumber';
import { Icon } from '~/atoms/Icon';
import { PAUSE_ICON } from '~/game/icons';
import { LEVEL_CLEAR_BONUS } from '~/game/sim';
import { BagButton } from './components/BagButton';
import { Combo } from './components/Combo';
import { DashButton } from './components/DashButton';
import { Health } from './components/Health';
import { Hint } from './components/Hint';
import { Hud } from './components/Hud';
import { HudActions } from './components/HudActions';
import { HudPanel } from './components/HudPanel';
import { IconButton } from './components/IconButton';
import { LevelBadge } from './components/LevelBadge';
import { LoadoutMenu, type LoadoutMenuProps } from './components/LoadoutMenu';
import { Loadout, type LoadoutProps } from './components/Loadout';
import { LockPage } from './components/LockPage';
import { Overlay, type OverlayAction } from './components/Overlay';
import { PointerOnly } from './components/PointerOnly';
import { Prompt } from './components/Prompt';
import { RotateNotice } from './components/RotateNotice';
import { Score } from './components/Score';
import { SongTrack } from './components/SongTrack';
import { Surface } from './components/Surface';
import type { LevelPhase, SongPart } from './types';

export type { LevelPhase, SongPart, WeaponFace } from './types';
export type { LoadoutProps, SlotProps } from './components/Loadout';
export type {
  Choice,
  LoadoutMenuProps,
  MenuWeapon,
  WeaponStats,
} from './components/LoadoutMenu';

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
  /** Weapons in the run's bag, out of `bagSize`. */
  bag: number;
  bagSize: number;
  /** Seconds until the dash is back; null when ready. */
  dashCooldown: number | null;
  /** Changes with every dash. */
  dashKey: number;
}

export interface GameScreenProps {
  seed: number;
  /** The level's key, e.g. "F minor". */
  musicalKey: string;
  run: RunProps;
  loadout: LoadoutProps;
  /** The best score on this device, before this run. */
  best: number;
  /** Where a finished run puts the player on the board. */
  board?: ReactNode;
  /** Frozen mid-level, waiting for Resume. */
  paused: boolean;
  /**
   * The loadout menu, open over a frozen level or a finished run; null
   * when closed.
   */
  menu?: LoadoutMenuProps | null;
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
  /** Copy a link that plays this seed; resolves whether it worked. */
  onCopySeed: () => Promise<boolean>;
  onNextLevel: () => void;
  /** Open the loadout menu: the bag button, Tab or B. */
  onOpenMenu: () => void;
  /** A slot button held: switch to it and fire; let go to stop. */
  onFireSlot: (slot: number) => void;
  onReleaseSlot: (slot: number) => void;
  /** The touch screen's dash button (Space with a keyboard). */
  onDash: () => void;
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

const COPY_LABELS = {
  idle: 'Copy seed link',
  copied: 'Link copied',
  failed: "Couldn't copy the link",
};

const kills = (count: number) => ({
  label: 'Kills',
  value: formatNumber(count),
});
const points = (score: number) => ({
  label: 'Points',
  value: formatNumber(score),
});

/** Beat the device's best: worth a badge instead of a Best tile. */
const isNewBest = (score: number, best: number) => score > best && score > 0;

/** The score, next to the best to beat unless this run is it. */
const scoreStats = (score: number, best: number) =>
  isNewBest(score, best)
    ? [points(score)]
    : [points(score), { label: 'Best', value: formatNumber(best) }];

export const GameScreen = ({
  seed,
  musicalKey,
  run,
  loadout,
  best,
  board,
  paused,
  menu = null,
  soundBlocked,
  surfaceRef,
  onStop,
  onPause,
  onResume,
  onRetrySound,
  onRetry,
  onNewRun,
  onCopySeed,
  onNextLevel,
  onOpenMenu,
  onFireSlot,
  onReleaseSlot,
  onDash,
}: GameScreenProps) => {
  const [copy, setCopy] = useState<keyof typeof COPY_LABELS>('idle');
  /** The menu was opened since the run ended: its loot has been seen. */
  const [looked, setLooked] = useState(false);
  const [losing, setLosing] = useState<{
    label: string;
    start: () => void;
  } | null>(null);
  const copySeed = {
    label: COPY_LABELS[copy],
    onClick: () =>
      void onCopySeed().then(copied => setCopy(copied ? 'copied' : 'failed')),
  };
  const prompt = CIRCLE_PROMPTS[run.phase];
  const playing = run.status === 'playing' && !paused && !menu;
  const won = run.status === 'cleared' && run.level >= run.levels;
  const weapons = `${run.bag} ${run.bag === 1 ? 'weapon' : 'weapons'}`;
  /** The end of a run: keep the best loot before the next run empties the bag. */
  const keepLoot = {
    label: run.bag > 0 ? `Keep loot (${run.bag})` : 'Loadout',
    onClick: () => {
      setLooked(true);
      setLosing(null);
      onOpenMenu();
    },
    variant: 'secondary' as const,
  };
  const copyLink = { ...copySeed, variant: 'secondary' as const };
  /**
   * A press that starts the next run, held for one confirm while the bag
   * still holds loot nobody has looked at: a reflex retry mustn't lose it.
   */
  const guard = (label: string, start: () => void) => () => {
    if (run.bag > 0 && !looked) setLosing({ label, start });
    else start();
  };
  /** Said on the end panel, so the bag's fate isn't news in the menu. */
  const bagWarning = losing
    ? [`${weapons} in your bag will be lost when the next run starts.`]
    : run.bag > 0
      ? [
          `${weapons} in your bag. Keep the best before your next run: the bag empties when it starts.`,
        ]
      : undefined;
  /** The end panel's ways on; asking first while a press is held. */
  const endActions = (
    main: OverlayAction,
    others: Array<OverlayAction>,
  ): Array<OverlayAction> =>
    losing
      ? [
          { ...keepLoot, variant: undefined },
          {
            label: `Lose them: ${losing.label.toLowerCase()}`,
            onClick: losing.start,
            variant: 'secondary',
          },
        ]
      : [main, keepLoot, ...others, copyLink];
  return (
    <>
      <LockPage />
      <Surface ref={surfaceRef} aria-label="Play area">
        {run.phase === 'waiting' && (
          <Hint>
            <PointerOnly $pointer="mouse">
              WASD move · mouse aim and fire · Space dash · 1-3, Q/E or wheel
              switch · Tab or B loadout
            </PointerOnly>
            <PointerOnly $pointer="touch">
              left: aim, push further to move · right: tap or hold to fire ·
              hold a weapon to fire it · Dash button to dash
            </PointerOnly>
          </Hint>
        )}
      </Surface>
      {prompt && playing && <Prompt>{prompt}</Prompt>}
      <Loadout
        {...loadout}
        paused={!playing}
        onFire={onFireSlot}
        onRelease={onReleaseSlot}
      />
      {run.status === 'playing' && (
        <DashButton
          cooldown={run.dashCooldown}
          dashKey={run.dashKey}
          paused={!playing}
          onDash={onDash}
        />
      )}
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
            <>
              <BagButton
                count={run.bag}
                size={run.bagSize}
                onOpen={onOpenMenu}
              />
              <IconButton aria-label="Pause" onClick={onPause}>
                <Icon icon={PAUSE_ICON} />
              </IconButton>
            </>
          )}
        </HudActions>
      </Hud>
      {soundBlocked && !paused && run.status === 'playing' && (
        <Overlay
          heading="Sound couldn't start"
          message={[
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
            { label: 'Level', value: `${run.level}/${run.levels}` },
            { label: 'Key', value: musicalKey },
            kills(run.kills),
            points(run.score),
          ]}
          note={`seed ${seed}`}
          actions={[
            { label: 'Resume', onClick: onResume },
            { label: 'Quit', onClick: onStop },
          ]}
        />
      )}
      {/* Hidden, not gone, under the menu: the board's form keeps its state. */}
      {run.status === 'dead' && (
        <div hidden={Boolean(menu)}>
          <Overlay
            heading="Run over"
            badge={isNewBest(run.score, best) ? 'New best!' : undefined}
            stats={[
              { label: 'Level', value: `${run.level}/${run.levels}` },
              kills(run.kills),
              ...scoreStats(run.score, best),
            ]}
            message={bagWarning}
            note={`seed ${seed}`}
            actions={endActions(
              { label: 'Try again', onClick: guard('Try again', onRetry) },
              [
                {
                  label: 'New run',
                  onClick: guard('New run', onNewRun),
                  variant: 'secondary',
                },
              ],
            )}
          >
            {board}
          </Overlay>
        </div>
      )}
      <RotateNotice />
      {run.status === 'cleared' && !won && (
        <Overlay
          heading={`Level ${run.level} cleared`}
          stats={[
            kills(run.kills),
            { label: 'Bonus', value: `+${formatNumber(LEVEL_CLEAR_BONUS)}` },
            points(run.score),
          ]}
          note={`Level ${run.level + 1} of ${run.levels} is coming up`}
          actions={[{ label: 'Next level', onClick: onNextLevel }]}
        />
      )}
      {won && (
        <div hidden={Boolean(menu)}>
          <Overlay
            heading="Run complete"
            badge={isNewBest(run.score, best) ? 'New best!' : undefined}
            stats={[
              { label: 'Levels', value: formatNumber(run.levels) },
              kills(run.kills),
              ...scoreStats(run.score, best),
            ]}
            message={bagWarning}
            note={`seed ${seed}`}
            actions={endActions(
              { label: 'New run', onClick: guard('New run', onNewRun) },
              [
                {
                  label: 'Play this seed again',
                  onClick: guard('Play this seed again', onRetry),
                  variant: 'secondary',
                },
              ],
            )}
          >
            {board}
          </Overlay>
        </div>
      )}
      {menu && <LoadoutMenu {...menu} />}
    </>
  );
};
