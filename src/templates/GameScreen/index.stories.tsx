import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { RunStanding } from '~/organisms/RunStanding';
import { GameScreen, type MenuWeapon, type SongPart } from '.';

const SONG = [
  { part: 'intro', bars: 16 },
  { part: 'breakdown', bars: 8 },
  { part: 'buildup', bars: 8 },
  { part: 'drop1', bars: 16 },
  { part: 'drop2', bars: 16 },
  { part: 'bridge', bars: 16 },
  { part: 'drop3', bars: 32 },
  { part: 'outro', bars: 16 },
] satisfies Array<{ part: SongPart; bars: number }>;

const meta = {
  component: GameScreen,
  args: {
    seed: 42,
    musicalKey: 'F minor',
    best: 5000,
    loadout: {
      slots: [
        {
          name: 'Vandal Wobble 1/8 Echo',
          oscillator: 'wobble',
          lfo: '1/8',
          fx: 'echo',
          blasts: false,
          ammo: 5,
          magazine: 8,
          reload: null,
        },
        {
          name: 'Lumen Laser 1/16 Crush',
          oscillator: 'laser',
          lfo: '1/16',
          fx: 'distortion',
          blasts: false,
          ammo: 0,
          magazine: 16,
          reload: { id: 3, seconds: 0.86 },
        },
        {
          name: 'Vandal Wobble 1/4',
          oscillator: 'wobble',
          lfo: '1/4',
          fx: null,
          blasts: true,
          ammo: 4,
          magazine: 4,
          reload: null,
        },
      ],
      active: 1,
    },
    run: {
      status: 'playing',
      level: 1,
      levels: 5,
      hp: 4,
      maxHp: 5,
      kills: 12,
      score: 1800,
      combo: 3,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      song: SONG,
      songBar: 30,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 3,
      bagSize: 24,
    },
    onStop: fn(),
    onRetry: fn(),
    onNewRun: fn(),
    onCopySeed: fn(() => Promise.resolve(true)),
    onNextLevel: fn(),
    onOpenMenu: fn(),
    onFireSlot: fn(),
    onReleaseSlot: fn(),
    onDash: fn(),
    paused: false,
    onPause: fn(),
    onResume: fn(),
    soundBlocked: false,
    onRetrySound: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/drop 1 0:42/)).toBeVisible();
    await expect(
      canvas.getByRole('img', { name: 'Health 4 of 5' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Pause' }));
    await expect(args.onPause).toHaveBeenCalled();
  },
};

export const SoundBlocked: Story = {
  args: { soundBlocked: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: "Sound couldn't start" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Start sound' }));
    await expect(args.onRetrySound).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Quit' }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};

export const Paused: Story = {
  args: { paused: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('heading', { name: 'Paused' })).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Pause' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Resume' }));
    await expect(args.onResume).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Quit' }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};

export const RunEnded: Story = {
  args: {
    run: {
      status: 'dead',
      level: 2,
      levels: 5,
      hp: 0,
      maxHp: 5,
      kills: 31,
      score: 4650,
      combo: 0,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      song: SONG,
      songBar: 30,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByText('Kills').nextElementSibling,
    ).toHaveTextContent('31');
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalled();
    const copy = canvas.getByRole('button', { name: 'Copy seed link' });
    await userEvent.click(copy);
    await expect(args.onCopySeed).toHaveBeenCalled();
    // Relabelled in place: the same button, still focused.
    await expect(copy).toHaveTextContent('Link copied');
    await expect(copy).toHaveFocus();
  },
};

export const RunEndedSignedOut: Story = {
  args: {
    ...RunEnded.args,
    board: (
      <RunStanding
        boardHref="/leaderboard"
        standing={{
          kind: 'signedOut',
          score: 4650,
          isSubmitting: false,
          error: null,
          onEnter: fn(),
          onSkip: fn(),
        }}
      />
    ),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Save 4,650 points to the high scores?'),
    ).toBeVisible();
  },
};

export const RunEndedOnTheBoard: Story = {
  args: {
    ...RunEnded.args,
    board: (
      <RunStanding
        boardHref="/leaderboard"
        standing={{
          kind: 'saved',
          name: 'RIDDIMRAT',
          score: 4650,
          before: { rank: 4, total: 583_470 },
          after: { rank: 3, total: 588_120 },
          rows: [
            {
              rank: 1,
              name: 'WOBBLEKING',
              totalPoints: 1_204_880,
              runsCount: 212,
            },
            { rank: 2, name: 'SUBLO', totalPoints: 740_005, runsCount: 98 },
            { rank: 3, name: 'RIDDIMRAT', totalPoints: 588_120, runsCount: 75 },
            {
              rank: 4,
              name: 'K_HALFTIME',
              totalPoints: 587_300,
              runsCount: 121,
            },
          ],
          share: 'idle',
          onShare: fn(),
        }}
      />
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Up 1 place')).toBeVisible();
  },
};

export const LevelCleared: Story = {
  args: {
    run: {
      status: 'cleared',
      level: 1,
      levels: 5,
      hp: 3,
      maxHp: 5,
      kills: 24,
      score: 3600,
      combo: 0,
      phase: 'clear',
      part: 'outro',
      secondsLeft: null,
      song: SONG,
      songBar: 30,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByText('Bonus').nextElementSibling,
    ).toHaveTextContent('+10,000');
    await userEvent.click(canvas.getByRole('button', { name: 'Next level' }));
    await expect(args.onNextLevel).toHaveBeenCalled();
  },
};

const weapon = (
  id: string,
  face: Omit<MenuWeapon, 'id' | 'stats' | 'bossLoot'> &
    Partial<Pick<MenuWeapon, 'bossLoot'>>,
  stats: MenuWeapon['stats'],
): MenuWeapon => ({ id, bossLoot: false, stats, ...face });

const MENU_WEAPONS = [
  weapon(
    's0',
    {
      name: 'Vandal Wobble 1/8 Echo',
      maker: 'Vandal',
      oscillator: 'wobble',
      lfo: '1/8',
      fx: 'echo',
      blasts: false,
    },
    { perBar: 144, hit: 12, shots: 8, reach: 7.6, area: 0 },
  ),
  weapon(
    's1',
    {
      name: 'Lumen Laser 1/16 Crush',
      maker: 'Lumen',
      oscillator: 'laser',
      lfo: '1/16',
      fx: 'distortion',
      blasts: false,
    },
    { perBar: 64, hit: 4, shots: 16, reach: 12.8, area: 1.5 },
  ),
  weapon(
    's2',
    {
      name: 'Vandal Wobble 1/4',
      maker: 'Vandal',
      oscillator: 'wobble',
      lfo: '1/4',
      fx: null,
      blasts: true,
    },
    { perBar: 96, hit: 24, shots: 4, reach: 7.6, area: 1.5 },
  ),
  weapon(
    'b0',
    {
      name: 'Lumen Beam 1/8',
      maker: 'Lumen',
      oscillator: 'beam',
      lfo: '1/8',
      fx: null,
      blasts: false,
    },
    { perBar: 48, hit: 3, shots: 16, reach: 9, area: 0 },
  ),
  weapon(
    'b1',
    {
      name: 'Vandal Laser 1/8 Echo',
      maker: 'Vandal',
      oscillator: 'laser',
      lfo: '1/8',
      fx: 'echo',
      blasts: false,
      fresh: true,
      bossLoot: true,
    },
    { perBar: 84, hit: 7, shots: 8, reach: 9.1, area: 0 },
  ),
  weapon(
    'b2',
    {
      name: 'Vandal Wobble 1/2 Crush',
      maker: 'Vandal',
      oscillator: 'wobble',
      lfo: '1/2',
      fx: 'distortion',
      blasts: true,
      fresh: true,
    },
    { perBar: 106, hit: 53, shots: 2, reach: 7.6, area: 3.1 },
  ),
];

const menu = () => ({
  heading: 'Loadout',
  slots: MENU_WEAPONS.slice(0, 3),
  bag: MENU_WEAPONS.slice(3),
  bagSize: 24,
  note: 'Your loadout is kept on your account.',
  doneLabel: 'Back to the fight',
  onPreview: fn(),
  onPreviewAB: fn(),
  onStopPreview: fn(),
  onDone: fn(),
});

export const RetryAsksForTheLoot: Story = {
  args: {
    run: { ...meta.args.run, status: 'dead', hp: 0 },
  },
  play: async ({ args, canvas, userEvent }) => {
    // A reflex retry with unseen loot asks once instead of losing it.
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).not.toHaveBeenCalled();
    await expect(
      canvas.getByText(/3 weapons in your bag will be lost/),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Lose them: try again' }),
    );
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

export const OpeningTheBag: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const bag = canvas.getByRole('button', {
      name: /Loadout and bag, 3 of 24/,
    });
    await userEvent.click(bag);
    await expect(args.onOpenMenu).toHaveBeenCalled();
  },
};

export const ComparingLoot: Story = {
  args: { menu: menu() },
  play: async ({ args, canvas, userEvent }) => {
    const sheet = canvas.getByRole('dialog', { name: 'Loadout' });
    await expect(sheet).toBeVisible();
    // The level waits behind it: no pause button, no prompt.
    await expect(
      canvas.queryByRole('button', { name: 'Pause' }),
    ).not.toBeInTheDocument();
    await expect(canvas.getByText('Bag 3/24')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'New · 2' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Vandal Laser 1/8 Echo, boss loot, new, stronger than slot 2',
      }),
    );
    // Laid against the slot with the same engine, with what changes.
    const compare = canvas.getByRole('region', { name: 'Compare' });
    await expect(compare).toHaveTextContent('Replaces slot 2');
    await expect(compare).toHaveTextContent('every shot echoes');
    // A verdict on damage a bar, its echoes counted, before the details.
    await expect(compare).toHaveTextContent('Stronger');
    await expect(
      canvas.getByRole('definition', { name: 'better by 20' }),
    ).toHaveTextContent('+20');
    await expect(
      canvas.getByRole('definition', { name: 'better by 3' }),
    ).toHaveTextContent('+3');
    // One toggle hears the pick, then what it would replace, a bar each.
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'A/B: hear the pick, then slot 2, a bar each',
      }),
    );
    await expect(args.menu?.onPreviewAB).toHaveBeenCalledWith('b1', 's1');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Equip in slot 2' }),
    );
    await expect(
      canvas.getByRole('button', { name: /^Slot 2: Vandal Laser 1\/8 Echo/ }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the fight' }),
    );
    await expect(args.menu?.onDone).toHaveBeenCalledWith({
      slots: ['s0', 'b1', 's2'],
      bag: ['b0', 's1', 'b2'],
    });
  },
};

export const PreviewPlaying: Story = {
  args: {
    menu: { ...menu(), preview: { ids: ['s1'], sounding: 's1', turn: 1 } },
  },
  play: async ({ args, canvas, userEvent }) => {
    const stop = canvas.getByRole('button', {
      name: 'Stop Lumen Laser 1/16 Crush',
    });
    await userEvent.click(stop);
    await expect(args.menu?.onStopPreview).toHaveBeenCalledTimes(1);
    // Picking a weapon stops what's being heard: it was about the last pick.
    await userEvent.click(canvas.getByRole('button', { name: /^Slot 1:/ }));
    await expect(args.menu?.onStopPreview).toHaveBeenCalledTimes(2);
  },
};

export const DiscardingLoot: Story = {
  args: { menu: menu() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Lumen Beam 1/8' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Discard' }));
    await expect(canvas.getByText('Bag 2/24')).toBeVisible();
    // Marked, not gone: it can be kept again until the menu closes.
    await expect(
      canvas.getByRole('button', {
        name: 'Lumen Beam 1/8, marked to discard',
      }),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Keep it' })).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Back to the fight · discard 1' }),
    ).toBeVisible();
    // Esc asks once before it throws anything away, then closes.
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Press Esc again to throw away 1 weapon',
    );
    await expect(args.menu?.onDone).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    await expect(args.menu?.onDone).toHaveBeenCalledWith({
      slots: ['s0', 's1', 's2'],
      bag: ['b1', 'b2'],
    });
  },
};

export const DiscardingWeakerLoot: Story = {
  args: {
    menu: {
      ...menu(),
      bag: [
        ...MENU_WEAPONS.slice(3),
        weapon(
          'b3',
          {
            name: 'Lumen Laser 1/8',
            maker: 'Lumen',
            oscillator: 'laser',
            lfo: '1/8',
            fx: null,
            blasts: false,
          },
          { perBar: 40, hit: 5, shots: 8, reach: 9.1, area: 0 },
        ),
      ],
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    // Upgrades are marked on the card itself, no pick needed. Asked of the
    // card, not its looks: new loot rises in from transparent, and a busy
    // runner can stall that animation well past any wait.
    await expect(
      canvas.getByRole('button', { name: /stronger than slot 2$/ }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Discard weaker (1)' }),
    );
    await expect(
      canvas.getByRole('button', {
        name: 'Lumen Laser 1/8, marked to discard',
      }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the fight · discard 1' }),
    );
    await expect(args.menu?.onDone).toHaveBeenCalledWith({
      slots: ['s0', 's1', 's2'],
      bag: ['b0', 'b1', 'b2'],
    });
  },
};

export const EmptyBag: Story = {
  args: { menu: { ...menu(), bag: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Bag 0/24')).toBeVisible();
    await expect(canvas.getByText(/Nothing in the bag yet/)).toBeVisible();
  },
};

const ENGINES = ['wobble', 'laser', 'beam'] as const;
const RATES = ['1/2', '1/4', '1/8', '1/16'] as const;

export const FullBag: Story = {
  args: {
    menu: {
      ...menu(),
      bag: Array.from({ length: 24 }, (_, i) =>
        weapon(
          `f${i}`,
          {
            name: `Lumen ${ENGINES[i % 3]} ${RATES[i % 4]}`,
            maker: i % 2 ? 'Lumen' : 'Vandal',
            oscillator: ENGINES[i % 3],
            lfo: RATES[i % 4],
            fx: i % 5 === 0 ? 'echo' : i % 7 === 0 ? 'distortion' : null,
            blasts: RATES[i % 4] === '1/2' || RATES[i % 4] === '1/4',
            fresh: i > 20,
          },
          {
            perBar: 40 + ((i * 37) % 90),
            hit: 4 + (i % 9),
            shots: 16 / 2 ** (3 - (i % 4)),
            reach: 8 + (i % 5),
            area: i % 4 < 2 ? 1.5 : 0,
          },
        ),
      ),
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Bag 24/24')).toBeVisible();
    await expect(canvas.getByText(/Bag full: new drops wait/)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Best' })).toBeVisible();
  },
};

export const PlacingWithNumberKeys: Story = {
  args: { menu: menu() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Vandal Wobble 1/2 Crush, new' }),
    );
    await userEvent.keyboard('1');
    await expect(
      canvas.getByRole('button', { name: /^Slot 1: Vandal Wobble 1\/2 Crush/ }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to the fight' }),
    );
    await expect(args.menu?.onDone).toHaveBeenCalledWith({
      slots: ['b2', 's1', 's2'],
      bag: ['b0', 'b1', 's0'],
    });
  },
};

export const UndoingChanges: Story = {
  args: { menu: menu() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /^Slot 1:/ }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Move to slot 3' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Undo changes' }));
    await expect(
      canvas.queryByRole('button', { name: 'Undo changes' }),
    ).not.toBeInTheDocument();
    await userEvent.keyboard('b');
    await expect(args.menu?.onDone).toHaveBeenCalledWith({
      slots: ['s0', 's1', 's2'],
      bag: ['b0', 'b1', 'b2'],
    });
  },
};

export const SortingLootAtTheEnd: Story = {
  args: {
    run: { ...meta.args.run, status: 'dead', hp: 0 },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Keep loot (3)' }),
    );
    await expect(args.onOpenMenu).toHaveBeenCalled();
  },
};

export const AtTheCircle: Story = {
  args: {
    run: {
      status: 'playing',
      level: 1,
      levels: 5,
      hp: 5,
      maxHp: 5,
      kills: 0,
      score: 0,
      combo: 0,
      phase: 'waiting',
      part: null,
      secondsLeft: null,
      song: SONG,
      songBar: 30,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Step into the circle to start',
    );
    await expect(canvas.getByText(/mouse aim and fire/)).toBeVisible();
  },
};

export const WalkedThroughTheControls: Story = {
  args: {
    ...AtTheCircle.args,
    tutorial: true,
    onTutorialDone: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    const card = canvas.getByRole('region', { name: 'Move' });
    await expect(card).toHaveTextContent('1/7');
    await expect(card).toHaveTextContent(/WASD/);
    // The walkthrough ends on the circle's prompt, so it stands in for it.
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    const next = canvas.getByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await userEvent.click(next);
    await expect(
      canvas.getByRole('region', { name: 'Dash' }),
    ).toHaveTextContent(/Space/);
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(
      canvas.getByRole('region', { name: 'Aim and fire' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(
      canvas.getByRole('region', { name: 'Switch weapons' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(
      canvas.getByRole('region', { name: 'Loot and your bag' }),
    ).toHaveTextContent(/Tab or B opens your loadout/);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    const ready = canvas.getByRole('region', { name: 'Ready' });
    await expect(ready).toHaveTextContent(
      'Now step into the circle to start your run.',
    );
    await expect(
      canvas.queryByRole('button', { name: 'Skip' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Got it' }));
    await expect(args.onTutorialDone).toHaveBeenCalled();
  },
};

export const SkippedTheControls: Story = {
  args: {
    ...AtTheCircle.args,
    tutorial: true,
    onTutorialDone: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(args.onTutorialDone).toHaveBeenCalled();
  },
};

export const FiringASlot: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const slot = canvas.getByRole('button', { name: /Vandal Wobble 1\/4/ });
    await userEvent.pointer({ keys: '[MouseLeft>]', target: slot });
    await expect(args.onFireSlot).toHaveBeenCalledWith(2);
    await userEvent.pointer({ keys: '[/MouseLeft]', target: slot });
    await expect(args.onReleaseSlot).toHaveBeenCalledWith(2);
  },
};

export const Dashing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.pointer({
      keys: '[MouseLeft]',
      target: canvas.getByRole('button', { name: 'Dash' }),
    });
    await expect(args.onDash).toHaveBeenCalled();
  },
};

export const BonusHeartsAndBoss: Story = {
  args: {
    run: {
      status: 'playing',
      level: 5,
      levels: 5,
      hp: 7,
      maxHp: 5,
      kills: 140,
      score: 31_000,
      combo: 4,
      phase: 'song',
      part: 'drop3',
      secondsLeft: 50,
      song: SONG,
      songBar: 90,
      boss: 0.4,
      dashCooldown: 0.86,
      dashKey: 12,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'Health 5 of 5, plus 2 bonus' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('meter', { name: 'Boss health' }),
    ).toHaveAttribute('aria-valuenow', '40');
    await expect(
      canvas.getByRole('button', { name: 'Dash, cooling down' }),
    ).toBeVisible();
  },
};

export const RunWon: Story = {
  args: {
    run: {
      status: 'cleared',
      level: 5,
      levels: 5,
      hp: 2,
      maxHp: 5,
      kills: 300,
      score: 64_000,
      combo: 0,
      phase: 'clear',
      part: 'outro',
      secondsLeft: null,
      song: SONG,
      songBar: 150,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Run complete' }),
    ).toBeVisible();
    await expect(canvas.getByText('New best!')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'New run' }));
    await expect(args.onNewRun).toHaveBeenCalled();
  },
};

export const ExitOpen: Story = {
  args: {
    run: {
      status: 'playing',
      level: 2,
      levels: 5,
      hp: 2,
      maxHp: 5,
      kills: 60,
      score: 9100,
      combo: 0,
      phase: 'clear',
      part: 'outro',
      secondsLeft: null,
      song: SONG,
      songBar: 30,
      boss: null,
      dashCooldown: null,
      dashKey: 0,
      bag: 0,
      bagSize: 24,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/exit open/)).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Step into the circle to leave',
    );
  },
};
