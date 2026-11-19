import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { GameScreen } from '.';

const meta = {
  component: GameScreen,
  args: {
    seed: 42,
    musicalKey: 'F minor',
    bpm: 140,
    loadout: {
      slots: [
        { name: 'Vandal Wobble 1/8 Echo' },
        { name: 'Lumen Laser 1/16 Crush' },
        { name: 'Vandal Wobble 1/4' },
      ],
      active: 1,
    },
    run: {
      status: 'playing',
      level: 1,
      hp: 4,
      maxHp: 5,
      kills: 12,
      score: 1800,
      combo: 3,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      boss: false,
      pickup: null,
    },
    onStop: fn(),
    onRetry: fn(),
    onNewRun: fn(),
    onNextLevel: fn(),
    onTakeWeapon: fn(),
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
    await expect(canvas.getByText(/mouse aim and fire/)).toBeVisible();
    await expect(canvas.getByText(/drop 1 0:42/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalled();
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
      hp: 0,
      maxHp: 5,
      kills: 31,
      score: 4650,
      combo: 0,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      boss: false,
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
      hp: 3,
      maxHp: 5,
      kills: 24,
      score: 3600,
      combo: 0,
      phase: 'clear',
      part: 'outro',
      secondsLeft: null,
      boss: false,
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
      hp: 5,
      maxHp: 5,
      kills: 9,
      score: 1350,
      combo: 0,
      phase: 'song',
      part: 'drop1',
      secondsLeft: 42,
      boss: false,
      pickup: 'Vandal Laser 1/8 Echo',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'F take Vandal Laser 1/8 Echo',
    );
  },
};

export const AtTheCircle: Story = {
  args: {
    run: {
      status: 'playing',
      level: 1,
      hp: 5,
      maxHp: 5,
      kills: 0,
      score: 0,
      combo: 0,
      phase: 'waiting',
      part: null,
      secondsLeft: null,
      boss: false,
      pickup: null,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Step into the circle to start',
    );
  },
};

export const ExitOpen: Story = {
  args: {
    run: {
      status: 'playing',
      level: 2,
      hp: 2,
      maxHp: 5,
      kills: 60,
      score: 9100,
      combo: 0,
      phase: 'clear',
      part: 'outro',
      secondsLeft: null,
      boss: false,
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
