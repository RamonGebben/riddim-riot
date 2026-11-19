import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { GameScreen, type SongPart } from '.';

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
      pickup: null,
    },
    onStop: fn(),
    onRetry: fn(),
    onNewRun: fn(),
    onNextLevel: fn(),
    onTakeWeapon: fn(),
    onFireSlot: fn(),
    onReleaseSlot: fn(),
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
      pickup: null,
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('31 kills', { selector: 'p' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalled();
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
      pickup: null,
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next level' }));
    await expect(args.onNextLevel).toHaveBeenCalled();
  },
};

export const OnAWeapon: Story = {
  args: {
    run: {
      status: 'playing',
      level: 1,
      levels: 5,
      hp: 5,
      maxHp: 5,
      kills: 9,
      score: 1350,
      combo: 0,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      song: SONG,
      songBar: 30,
      boss: null,
      pickup: {
        name: 'Vandal Laser 1/8 Echo',
        oscillator: 'laser',
        lfo: '1/8',
        fx: 'echo',
        blasts: false,
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'F take Laser 1/8Echo for your Laser 1/16Crush',
    );
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
      pickup: null,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Step into the circle to start',
    );
    await expect(canvas.getByText(/mouse aim and fire/)).toBeVisible();
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
      pickup: null,
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'Health 5 of 5, plus 2 bonus' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('meter', { name: 'Boss health' }),
    ).toHaveAttribute('aria-valuenow', '40');
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
      pickup: null,
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
      pickup: null,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/exit open/)).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Step into the circle to leave',
    );
  },
};
