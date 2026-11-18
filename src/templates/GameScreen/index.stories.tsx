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
      wavesCleared: 1,
      wavesToClear: 3,
      exitOpen: false,
      pickup: null,
    },
    onStop: fn(),
    onRetry: fn(),
    onNewRun: fn(),
    onNextLevel: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/mouse aim and fire/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
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
      wavesCleared: 1,
      wavesToClear: 4,
      exitOpen: false,
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
      wavesCleared: 3,
      wavesToClear: 3,
      exitOpen: true,
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
      wavesCleared: 1,
      wavesToClear: 3,
      exitOpen: false,
      pickup: 'Vandal Laser 1/8 Echo',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'F take Vandal Laser 1/8 Echo',
    );
  },
};
